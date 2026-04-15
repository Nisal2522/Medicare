import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { Model, Types } from 'mongoose';
import * as moment from 'moment-timezone';
import type { JwtPayload } from '../auth/jwt.strategy';
import {
  Appointment,
  AppointmentDocument,
  AppointmentStatus,
  DoctorApprovalStatus,
} from './appointment.schema';
import { BookAppointmentDto } from './dto/book-appointment.dto';

const COLOMBO = 'Asia/Colombo';

type DoctorApiResponse = {
  id: string;
  name: string;
  specialty: string;
  isVerified: boolean;
  availability: {
    day: string;
    startTime: string;
    endTime: string;
    maxPatients: number;
    isAvailable: boolean;
  }[];
};

@Injectable()
export class AppointmentsService implements OnModuleInit {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    @InjectModel(Appointment.name)
    private readonly appointmentModel: Model<AppointmentDocument>,
    private readonly http: HttpService,
    private readonly jwt: JwtService,
    @Inject('NOTIFICATIONS_CLIENT') private readonly notifications: ClientProxy,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.ensureSlotIndexes();
  }

  private async ensureSlotIndexes(): Promise<void> {
    try {
      const collection = this.appointmentModel.collection;
      const indexes = await collection.indexes();
      const legacyUnique = indexes.find(
        (i) =>
          i.name === 'doctorId_1_appointmentDateKey_1_slotKey_1' &&
          i.unique === true,
      );
      const legacyName = legacyUnique?.name;
      if (legacyName) {
        await collection.dropIndex(legacyName);
        this.logger.warn('Dropped legacy unique index for slotKey capacity migration');
      }

      await collection.createIndex({ doctorId: 1, appointmentDateKey: 1, slotKey: 1 });
      await collection.createIndex(
        { doctorId: 1, appointmentDateKey: 1, slotKey: 1, slotSeat: 1 },
        {
          unique: true,
          partialFilterExpression: { slotSeat: { $type: 'number' } },
        },
      );
    } catch (e) {
      this.logger.warn(`Index migration skipped: ${String(e)}`);
    }
  }

  /** Stored value or legacy fallback: old DB rows without field stay joinable if already paid/confirmed. */
  effectiveDoctorApproval(o: Record<string, unknown>): DoctorApprovalStatus {
    const raw = o.doctorApprovalStatus as string | undefined;
    if (
      raw === DoctorApprovalStatus.APPROVED ||
      raw === DoctorApprovalStatus.REJECTED ||
      raw === DoctorApprovalStatus.PENDING
    ) {
      return raw as DoctorApprovalStatus;
    }
    const st = o.status as string;
    if (st === AppointmentStatus.CONFIRMED || st === AppointmentStatus.COMPLETED) {
      return DoctorApprovalStatus.APPROVED;
    }
    return DoctorApprovalStatus.PENDING;
  }

  private mapRow(
    doc: AppointmentDocument | (Record<string, unknown> & { _id: unknown }),
  ) {
    const raw =
      typeof (doc as AppointmentDocument).toObject === 'function'
        ? (doc as AppointmentDocument).toObject()
        : (doc as Record<string, unknown>);
    const o = raw as Record<string, unknown>;
    const created = o.createdAt as Date | undefined;
    return {
      id: String(o._id),
      doctorId: String(o.doctorId),
      doctorName: o.doctorName as string,
      doctorSpecialty: o.doctorSpecialty as string | undefined,
      patientId: o.patientId ? String(o.patientId) : undefined,
      patientEmail: o.patientEmail as string,
      patientName: o.patientName as string,
      patientPhone: o.patientPhone as string | undefined,
      doctorPhone: o.doctorPhone as string | undefined,
      doctorEmail: o.doctorEmail as string | undefined,
      appointmentDateKey: o.appointmentDateKey as string,
      day: o.day as string,
      startTime: o.startTime as string,
      endTime: o.endTime as string,
      consultationFee: (o.consultationFee as number) ?? 0,
      status: o.status as string,
      paymentStatus: o.paymentStatus as string,
      doctorApprovalStatus: this.effectiveDoctorApproval(o),
      createdAt: created ? new Date(created).toISOString() : undefined,
    };
  }

  private parseDateKey(raw: string): string {
    const s = raw.trim();
    const iso = /^(\d{4}-\d{2}-\d{2})/.exec(s);
    if (!iso) {
      throw new BadRequestException('appointmentDate must be YYYY-MM-DD');
    }
    return iso[1]!;
  }

  private async fetchDoctor(id: string): Promise<DoctorApiResponse> {
    const base =
      process.env.DOCTOR_SERVICE_URL ?? 'http://localhost:3000';
    const url = `${base.replace(/\/$/, '')}/doctors/${id}`;
    try {
      const res = await firstValueFrom(
        this.http.get<DoctorApiResponse>(url, { timeout: 10_000 }),
      );
      return res.data;
    } catch (e: unknown) {
      const err = e as { response?: { status?: number } };
      if (err.response?.status === 404) {
        throw new BadRequestException('Doctor not found');
      }
      if (e instanceof BadRequestException) throw e;
      throw new BadRequestException('Could not validate doctor');
    }
  }

  private resolveSlot(
    doctor: DoctorApiResponse,
    dto: BookAppointmentDto,
  ): DoctorApiResponse['availability'][number] {
    const match = doctor.availability.find(
      (a) =>
        a.day === dto.day &&
        a.startTime === dto.startTime &&
        a.endTime === dto.endTime &&
        a.isAvailable === true,
    );
    if (!match) {
      throw new BadRequestException(
        'Selected slot is not available for this doctor',
      );
    }
    return match;
  }

  private weekdayFromYmd(dateKey: string): string {
    return moment.tz(dateKey, 'YYYY-MM-DD', COLOMBO).format('dddd');
  }

  private extractBearer(auth?: string): string | undefined {
    if (!auth?.startsWith('Bearer ')) return undefined;
    return auth.slice(7).trim();
  }

  private validatePatientIdentity(
    authHeader: string | undefined,
    expectedEmail: string,
    suppliedEmail: string,
  ): void {
    const expected = expectedEmail.trim().toLowerCase();
    const supplied = suppliedEmail.trim().toLowerCase();
    if (supplied !== expected) {
      throw new ForbiddenException('Email does not match this appointment');
    }

    const raw = this.extractBearer(authHeader);
    if (!raw) return;
    try {
      const payload = this.jwt.verify<JwtPayload>(raw);
      if (payload.role !== 'PATIENT') {
        throw new ForbiddenException('Patients only');
      }
      if (payload.email.toLowerCase() !== expected) {
        throw new ForbiddenException('Token does not belong to this patient');
      }
    } catch (e) {
      if (e instanceof ForbiddenException) throw e;
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private tryLinkPatientId(
    authHeader: string | undefined,
    patientEmail: string,
  ): Types.ObjectId | undefined {
    const raw = this.extractBearer(authHeader);
    if (!raw) return undefined;
    try {
      const payload = this.jwt.verify<JwtPayload>(raw);
      if (payload.role !== 'PATIENT') return undefined;
      if (payload.email.toLowerCase() !== patientEmail.trim().toLowerCase()) {
        throw new ForbiddenException('Email must match the signed-in account');
      }
      return new Types.ObjectId(payload.sub);
    } catch (e) {
      if (e instanceof ForbiddenException) throw e;
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  async book(
    dto: BookAppointmentDto,
    authHeader?: string,
  ): Promise<{ message: string; appointment: ReturnType<AppointmentsService['mapRow']> }> {
    const appointmentDateKey = this.parseDateKey(dto.appointmentDate);
    const weekday = this.weekdayFromYmd(appointmentDateKey);
    const selectedDay = dto.day.trim();
    const selectedStartTime = dto.startTime.trim();
    const selectedEndTime = dto.endTime.trim();
    if (weekday !== selectedDay) {
      throw new BadRequestException(
        `appointmentDate falls on ${weekday}, not ${selectedDay} (${COLOMBO})`,
      );
    }

    const doctor = await this.fetchDoctor(dto.doctorId);
    const slot = this.resolveSlot(doctor, dto);

    let patientId: Types.ObjectId | undefined;
    if (authHeader) {
      patientId = this.tryLinkPatientId(authHeader, dto.patientEmail);
    }

    const fee =
      dto.consultationFee != null && !Number.isNaN(Number(dto.consultationFee))
        ? Number(dto.consultationFee)
        : 0;
    const slotKey = `${selectedDay}|${selectedStartTime}|${selectedEndTime}`;

    const doctorObjectId = new Types.ObjectId(dto.doctorId);
    const normalizedEmail = dto.patientEmail.trim().toLowerCase();

    // Allow multiple bookings on the same day; block only exact same slot duplicates.
    const existingForPatient = await this.appointmentModel
      .findOne({
        doctorId: doctorObjectId,
        appointmentDateKey,
        day: selectedDay,
        startTime: selectedStartTime,
        endTime: selectedEndTime,
        patientEmail: normalizedEmail,
        status: { $ne: AppointmentStatus.CANCELLED },
      })
      .exec();
    if (existingForPatient) {
      return {
        message: 'Appointment already exists for this slot.',
        appointment: this.mapRow(existingForPatient),
      };
    }

    const slotCapacity = Math.max(1, Number(slot.maxPatients || 1));
    const activeCount = await this.appointmentModel.countDocuments({
      doctorId: doctorObjectId,
      appointmentDateKey,
      slotKey,
      status: { $ne: AppointmentStatus.CANCELLED },
    });
    if (activeCount >= slotCapacity) {
      throw new ConflictException(
        `This slot is full (${slotCapacity} patients). Please choose another slot`,
      );
    }

    for (let seat = 1; seat <= slotCapacity; seat += 1) {
      try {
        const created = await this.appointmentModel.create({
          doctorId: doctorObjectId,
          doctorName: doctor.name,
          doctorSpecialty: doctor.specialty,
          patientId,
          patientEmail: normalizedEmail,
          patientName: dto.patientName.trim(),
          patientPhone: dto.patientPhone?.trim(),
          doctorPhone: dto.doctorPhone?.trim(),
          doctorEmail: dto.doctorEmail?.trim().toLowerCase(),
          appointmentDateKey,
          day: selectedDay,
          startTime: selectedStartTime,
          endTime: selectedEndTime,
          consultationFee: fee,
          status: AppointmentStatus.PENDING_PAYMENT,
          doctorApprovalStatus: DoctorApprovalStatus.PENDING,
          paymentStatus: 'Pending payment',
          slotKey,
          slotSeat: seat,
        });

        const row = this.mapRow(created);
        this.notifications.emit('appointment_created', {
          patientEmail: row.patientEmail,
          patientPhone: row.patientPhone,
          doctorPhone: row.doctorPhone,
          doctorEmail: row.doctorEmail,
          appointment: row,
        });

        return {
          message: 'Appointment booked — complete payment to confirm.',
          appointment: row,
        };
      } catch (e: unknown) {
        const err = e as { code?: number };
        if (err.code === 11000) {
          continue;
        }
        throw e;
      }
    }

    throw new ConflictException(
      `This slot is full (${slotCapacity} patients). Please choose another slot`,
    );
  }

  async listByPatientEmail(patientEmail: string) {
    const email = patientEmail.trim().toLowerCase();
    const rows = await this.appointmentModel
      .find({ patientEmail: email })
      .sort({ appointmentDateKey: -1 })
      .lean()
      .exec();
    return rows.map((r) => this.mapRow(r));
  }

  async listForPatient(
    patientId: string,
    jwtSub: string,
    patientEmail: string,
  ) {
    if (patientId !== jwtSub) {
      throw new ForbiddenException('Cannot access another patient’s appointments');
    }
    const pid = new Types.ObjectId(patientId);
    const email = patientEmail.trim().toLowerCase();
    const rows = await this.appointmentModel
      .find({
        $or: [{ patientId: pid }, { patientEmail: email }],
      })
      .sort({ appointmentDateKey: -1 })
      .lean()
      .exec();
    return rows.map((r) => this.mapRow(r));
  }

  async listForDoctor(
    doctorSub: string,
    opts?: { date?: string; fromDate?: string; limit?: number },
  ) {
    const filter: Record<string, unknown> = {
      doctorId: new Types.ObjectId(doctorSub),
    };
    if (opts?.date?.trim()) {
      filter.appointmentDateKey = opts.date.trim();
    } else if (opts?.fromDate?.trim()) {
      filter.appointmentDateKey = { $gte: opts.fromDate.trim() };
      filter.status = { $ne: AppointmentStatus.CANCELLED };
    }
    let q = this.appointmentModel
      .find(filter)
      .sort({ appointmentDateKey: 1, startTime: 1 });
    if (opts?.limit != null && opts.limit > 0) {
      q = q.limit(Math.min(opts.limit, 200));
    }
    const rows = await q.lean().exec();
    return rows.map((r) => this.mapRow(r));
  }

  async getDoctorStats(doctorSub: string, month?: string) {
    const did = new Types.ObjectId(doctorSub);
    const dateKey = moment.tz(COLOMBO).format('YYYY-MM-DD');
    const monthKey =
      month?.trim() || moment.tz(COLOMBO).format('YYYY-MM');

    const [
      pendingAppointmentCount,
      confirmedAppointmentCount,
      completedAppointmentCount,
      totalActiveAppointmentCount,
    ] = await Promise.all([
      this.appointmentModel.countDocuments({
        doctorId: did,
        status: {
          $in: [
            AppointmentStatus.PENDING,
            AppointmentStatus.PENDING_PAYMENT,
          ],
        },
      }),
      this.appointmentModel.countDocuments({
        doctorId: did,
        status: AppointmentStatus.CONFIRMED,
      }),
      this.appointmentModel.countDocuments({
        doctorId: did,
        status: AppointmentStatus.COMPLETED,
      }),
      this.appointmentModel.countDocuments({
        doctorId: did,
        status: { $ne: AppointmentStatus.CANCELLED },
      }),
    ]);

    const todayAppointmentCount = await this.appointmentModel.countDocuments({
      doctorId: did,
      appointmentDateKey: dateKey,
    });

    const monthPrefix = monthKey;
    const monthCompletedCount = await this.appointmentModel.countDocuments({
      doctorId: did,
      status: AppointmentStatus.COMPLETED,
      appointmentDateKey: { $regex: new RegExp(`^${monthPrefix}`) },
    });

    const earnings = await this.appointmentModel.aggregate<{
      total: number;
    }>([
      {
        $match: {
          doctorId: did,
          appointmentDateKey: { $regex: new RegExp(`^${monthPrefix}`) },
          status: {
            $in: [AppointmentStatus.CONFIRMED, AppointmentStatus.COMPLETED],
          },
        },
      },
      { $group: { _id: null, total: { $sum: '$consultationFee' } } },
    ]);
    const monthEarningsTotal = earnings[0]?.total ?? 0;

    return {
      dateKey,
      monthKey,
      todayAppointmentCount,
      monthCompletedCount,
      monthEarningsTotal,
      pendingAppointmentCount,
      confirmedAppointmentCount,
      completedAppointmentCount,
      totalActiveAppointmentCount,
    };
  }

  /** Colombo “today” schedule count + all-time bookings (public landing). */
  async getPublicStats(): Promise<{
    consultationsToday: number;
    totalBookings: number;
    dateKey: string;
  }> {
    const dateKey = moment.tz(COLOMBO).format('YYYY-MM-DD');
    const [consultationsToday, totalBookings] = await Promise.all([
      this.appointmentModel.countDocuments({
        appointmentDateKey: dateKey,
        status: { $ne: AppointmentStatus.CANCELLED },
      }),
      this.appointmentModel.countDocuments(),
    ]);
    return { consultationsToday, totalBookings, dateKey };
  }

  async getPlatformSummary(): Promise<{
    totalAppointments: number;
    totalRevenue: number;
    monthlyRevenue: { month: string; revenue: number }[];
  }> {
    const totalAppointments = await this.appointmentModel.countDocuments();
    const paid = await this.appointmentModel.aggregate<{ t: number }>([
      { $match: { paymentStatus: 'Paid' } },
      { $group: { _id: null, t: { $sum: '$consultationFee' } } },
    ]);
    const totalRevenue = paid[0]?.t ?? 0;

    const byMonth = await this.appointmentModel.aggregate<{
      _id: string;
      revenue: number;
    }>([
      {
        $match: {
          paymentStatus: 'Paid',
          appointmentDateKey: { $exists: true },
        },
      },
      {
        $project: {
          month: { $substrBytes: ['$appointmentDateKey', 0, 7] },
          consultationFee: 1,
        },
      },
      {
        $group: {
          _id: '$month',
          revenue: { $sum: '$consultationFee' },
        },
      },
      { $sort: { _id: -1 } },
      { $limit: 12 },
    ]);

    const monthlyRevenue = byMonth.map((b) => ({
      month: b._id,
      revenue: b.revenue,
    }));

    return { totalAppointments, totalRevenue, monthlyRevenue };
  }

  async getPaymentPreviewForCheckout(id: string): Promise<{
    appointmentId: string;
    amountMinor: number;
    currency: string;
    patientEmail: string;
    status: string;
  }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid appointment id');
    }
    const appt = await this.appointmentModel.findById(id).lean().exec();
    if (!appt) {
      throw new NotFoundException('Appointment not found');
    }
    if (appt.status !== AppointmentStatus.PENDING_PAYMENT) {
      throw new BadRequestException('Appointment is not awaiting payment');
    }
    const currency = (process.env.PAYMENT_CURRENCY ?? 'lkr').toLowerCase();
    const amount = Number(appt.consultationFee ?? 0);
    let amountMinor = Math.max(0, Math.round(amount * 100));
    if (amountMinor < 1) {
      const fallbackMajor = Number(
        process.env.DEFAULT_CONSULTATION_FEE_LKR ?? '3500',
      );
      if (!Number.isNaN(fallbackMajor) && fallbackMajor > 0) {
        amountMinor = Math.round(fallbackMajor * 100);
      }
    }
    return {
      appointmentId: String(appt._id),
      amountMinor,
      currency,
      patientEmail: appt.patientEmail,
      status: appt.status,
    };
  }

  /** Minimal fields for telemedicine-service (video token) when it does not share MongoDB. */
  async getTelecomSnapshot(id: string): Promise<{
    doctorId: string;
    patientId?: string;
    patientEmail: string;
    status: string;
    doctorApprovalStatus: DoctorApprovalStatus;
  }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid appointment id');
    }
    const appt = await this.appointmentModel.findById(id).lean().exec();
    if (!appt) {
      throw new NotFoundException('Appointment not found');
    }
    const o = appt as unknown as Record<string, unknown>;
    return {
      doctorId: String(appt.doctorId),
      patientId: appt.patientId ? String(appt.patientId) : undefined,
      patientEmail: appt.patientEmail,
      status: appt.status,
      doctorApprovalStatus: this.effectiveDoctorApproval(o),
    };
  }

  async setDoctorApproval(
    appointmentId: string,
    doctorSub: string,
    decision: 'approve' | 'reject',
  ): Promise<{ message: string; appointment: ReturnType<AppointmentsService['mapRow']> }> {
    if (!Types.ObjectId.isValid(appointmentId)) {
      throw new BadRequestException('Invalid appointment id');
    }
    const appt = await this.appointmentModel.findById(appointmentId).exec();
    if (!appt) {
      throw new NotFoundException('Appointment not found');
    }
    if (appt.doctorId.toString() !== doctorSub) {
      throw new ForbiddenException('Not your appointment');
    }
    if (appt.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('Appointment is already cancelled');
    }
    const current = this.effectiveDoctorApproval(
      appt.toObject() as unknown as Record<string, unknown>,
    );
    if (current === DoctorApprovalStatus.REJECTED) {
      throw new BadRequestException('This booking was already rejected');
    }

    if (decision === 'approve') {
      appt.doctorApprovalStatus = DoctorApprovalStatus.APPROVED;
      await appt.save();
      const row = this.mapRow(appt);
      this.notifications.emit('appointment_doctor_approved', {
        patientEmail: row.patientEmail,
        patientPhone: row.patientPhone,
        doctorName: row.doctorName,
        appointment: row,
      });
      return { message: 'Appointment approved for the patient.', appointment: row };
    }

    appt.doctorApprovalStatus = DoctorApprovalStatus.REJECTED;
    appt.status = AppointmentStatus.CANCELLED;
    appt.paymentStatus =
      appt.paymentStatus === 'Paid'
        ? 'Cancelled (refund pending)'
        : 'Cancelled';
    await appt.save();
    const row = this.mapRow(appt);
    return { message: 'Appointment declined and cancelled.', appointment: row };
  }

  async confirmPaymentSuccess(appointmentId: string): Promise<void> {
    if (!Types.ObjectId.isValid(appointmentId)) {
      return;
    }
    const appt = await this.appointmentModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(appointmentId),
          status: AppointmentStatus.PENDING_PAYMENT,
        },
        {
          $set: {
            status: AppointmentStatus.CONFIRMED,
            paymentStatus: 'Paid',
          },
        },
        { new: true },
      )
      .exec();
    if (!appt) {
      return;
    }
    const row = this.mapRow(appt);
    this.notifications.emit('appointment_payment_success', {
      patientEmail: row.patientEmail,
      appointment: row,
    });
  }

  async cancelByPatient(
    appointmentId: string,
    patientEmail: string,
    authHeader?: string,
  ): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(appointmentId)) {
      throw new BadRequestException('Invalid appointment id');
    }

    const appt = await this.appointmentModel.findById(appointmentId).exec();
    if (!appt) {
      throw new NotFoundException('Appointment not found');
    }

    this.validatePatientIdentity(authHeader, appt.patientEmail, patientEmail);

    if (appt.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('Appointment already cancelled');
    }
    if (appt.status === AppointmentStatus.COMPLETED) {
      throw new BadRequestException('Completed appointment cannot be cancelled');
    }

    const cancellable = new Set<AppointmentStatus>([
      AppointmentStatus.PENDING_PAYMENT,
      AppointmentStatus.PENDING,
      AppointmentStatus.CONFIRMED,
    ]);
    if (!cancellable.has(appt.status)) {
      throw new BadRequestException('Appointment cannot be cancelled at this stage');
    }

    const nextPaymentStatus =
      appt.paymentStatus === 'Paid' ? 'Cancelled (refund pending)' : 'Cancelled';

    await this.appointmentModel.updateOne(
      { _id: appt._id },
      {
        $set: {
          status: AppointmentStatus.CANCELLED,
          paymentStatus: nextPaymentStatus,
        },
      },
    );

    return { message: 'Appointment cancelled successfully' };
  }

  async findByIdForPrescription(
    appointmentId: string,
    doctorSub: string,
  ): Promise<AppointmentDocument> {
    if (!Types.ObjectId.isValid(appointmentId)) {
      throw new BadRequestException('Invalid appointment id');
    }
    const appt = await this.appointmentModel.findById(appointmentId).exec();
    if (!appt) {
      throw new NotFoundException('Appointment not found');
    }
    if (appt.doctorId.toString() !== doctorSub) {
      throw new ForbiddenException('Not your appointment');
    }
    if (appt.status === AppointmentStatus.PENDING_PAYMENT) {
      throw new BadRequestException(
        'Cannot prescribe until payment is completed',
      );
    }
    return appt;
  }

  async completeAfterPrescription(
    appointmentId: string,
    doctorSub: string,
  ): Promise<void> {
    const appt = await this.findByIdForPrescription(appointmentId, doctorSub);
    if (appt.status === AppointmentStatus.COMPLETED) {
      return;
    }
    await this.appointmentModel.updateOne(
      { _id: appt._id },
      {
        $set: {
          status: AppointmentStatus.COMPLETED,
          paymentStatus: appt.paymentStatus === 'Paid' ? 'Paid' : appt.paymentStatus,
        },
      },
    );
  }
}
