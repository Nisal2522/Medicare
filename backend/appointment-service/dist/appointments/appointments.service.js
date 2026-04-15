"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AppointmentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentsService = void 0;
const axios_1 = require("@nestjs/axios");
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const mongoose_1 = require("@nestjs/mongoose");
const microservices_1 = require("@nestjs/microservices");
const rxjs_1 = require("rxjs");
const mongoose_2 = require("mongoose");
const moment = __importStar(require("moment-timezone"));
const appointment_schema_1 = require("./appointment.schema");
const COLOMBO = 'Asia/Colombo';
let AppointmentsService = AppointmentsService_1 = class AppointmentsService {
    appointmentModel;
    http;
    jwt;
    notifications;
    logger = new common_1.Logger(AppointmentsService_1.name);
    constructor(appointmentModel, http, jwt, notifications) {
        this.appointmentModel = appointmentModel;
        this.http = http;
        this.jwt = jwt;
        this.notifications = notifications;
    }
    async onModuleInit() {
        await this.ensureSlotIndexes();
    }
    async ensureSlotIndexes() {
        try {
            const collection = this.appointmentModel.collection;
            const indexes = await collection.indexes();
            const legacyUnique = indexes.find((i) => i.name === 'doctorId_1_appointmentDateKey_1_slotKey_1' &&
                i.unique === true);
            const legacyName = legacyUnique?.name;
            if (legacyName) {
                await collection.dropIndex(legacyName);
                this.logger.warn('Dropped legacy unique index for slotKey capacity migration');
            }
            await collection.createIndex({ doctorId: 1, appointmentDateKey: 1, slotKey: 1 });
            await collection.createIndex({ doctorId: 1, appointmentDateKey: 1, slotKey: 1, slotSeat: 1 }, {
                unique: true,
                partialFilterExpression: { slotSeat: { $type: 'number' } },
            });
        }
        catch (e) {
            this.logger.warn(`Index migration skipped: ${String(e)}`);
        }
    }
    effectiveDoctorApproval(o) {
        const raw = o.doctorApprovalStatus;
        if (raw === appointment_schema_1.DoctorApprovalStatus.APPROVED ||
            raw === appointment_schema_1.DoctorApprovalStatus.REJECTED ||
            raw === appointment_schema_1.DoctorApprovalStatus.PENDING) {
            return raw;
        }
        const st = o.status;
        if (st === appointment_schema_1.AppointmentStatus.CONFIRMED || st === appointment_schema_1.AppointmentStatus.COMPLETED) {
            return appointment_schema_1.DoctorApprovalStatus.APPROVED;
        }
        return appointment_schema_1.DoctorApprovalStatus.PENDING;
    }
    mapRow(doc) {
        const raw = typeof doc.toObject === 'function'
            ? doc.toObject()
            : doc;
        const o = raw;
        const created = o.createdAt;
        return {
            id: String(o._id),
            doctorId: String(o.doctorId),
            doctorName: o.doctorName,
            doctorSpecialty: o.doctorSpecialty,
            patientId: o.patientId ? String(o.patientId) : undefined,
            patientEmail: o.patientEmail,
            patientName: o.patientName,
            patientPhone: o.patientPhone,
            doctorPhone: o.doctorPhone,
            doctorEmail: o.doctorEmail,
            appointmentDateKey: o.appointmentDateKey,
            day: o.day,
            startTime: o.startTime,
            endTime: o.endTime,
            consultationFee: o.consultationFee ?? 0,
            status: o.status,
            paymentStatus: o.paymentStatus,
            doctorApprovalStatus: this.effectiveDoctorApproval(o),
            createdAt: created ? new Date(created).toISOString() : undefined,
        };
    }
    parseDateKey(raw) {
        const s = raw.trim();
        const iso = /^(\d{4}-\d{2}-\d{2})/.exec(s);
        if (!iso) {
            throw new common_1.BadRequestException('appointmentDate must be YYYY-MM-DD');
        }
        return iso[1];
    }
    async fetchDoctor(id) {
        const base = process.env.DOCTOR_SERVICE_URL ?? 'http://localhost:3000';
        const url = `${base.replace(/\/$/, '')}/doctors/${id}`;
        try {
            const res = await (0, rxjs_1.firstValueFrom)(this.http.get(url, { timeout: 10_000 }));
            return res.data;
        }
        catch (e) {
            const err = e;
            if (err.response?.status === 404) {
                throw new common_1.BadRequestException('Doctor not found');
            }
            if (e instanceof common_1.BadRequestException)
                throw e;
            throw new common_1.BadRequestException('Could not validate doctor');
        }
    }
    resolveSlot(doctor, dto) {
        const match = doctor.availability.find((a) => a.day === dto.day &&
            a.startTime === dto.startTime &&
            a.endTime === dto.endTime &&
            a.isAvailable === true);
        if (!match) {
            throw new common_1.BadRequestException('Selected slot is not available for this doctor');
        }
        return match;
    }
    weekdayFromYmd(dateKey) {
        return moment.tz(dateKey, 'YYYY-MM-DD', COLOMBO).format('dddd');
    }
    extractBearer(auth) {
        if (!auth?.startsWith('Bearer '))
            return undefined;
        return auth.slice(7).trim();
    }
    validatePatientIdentity(authHeader, expectedEmail, suppliedEmail) {
        const expected = expectedEmail.trim().toLowerCase();
        const supplied = suppliedEmail.trim().toLowerCase();
        if (supplied !== expected) {
            throw new common_1.ForbiddenException('Email does not match this appointment');
        }
        const raw = this.extractBearer(authHeader);
        if (!raw)
            return;
        try {
            const payload = this.jwt.verify(raw);
            if (payload.role !== 'PATIENT') {
                throw new common_1.ForbiddenException('Patients only');
            }
            if (payload.email.toLowerCase() !== expected) {
                throw new common_1.ForbiddenException('Token does not belong to this patient');
            }
        }
        catch (e) {
            if (e instanceof common_1.ForbiddenException)
                throw e;
            throw new common_1.UnauthorizedException('Invalid or expired token');
        }
    }
    tryLinkPatientId(authHeader, patientEmail) {
        const raw = this.extractBearer(authHeader);
        if (!raw)
            return undefined;
        try {
            const payload = this.jwt.verify(raw);
            if (payload.role !== 'PATIENT')
                return undefined;
            if (payload.email.toLowerCase() !== patientEmail.trim().toLowerCase()) {
                throw new common_1.ForbiddenException('Email must match the signed-in account');
            }
            return new mongoose_2.Types.ObjectId(payload.sub);
        }
        catch (e) {
            if (e instanceof common_1.ForbiddenException)
                throw e;
            throw new common_1.UnauthorizedException('Invalid or expired token');
        }
    }
    async book(dto, authHeader) {
        const appointmentDateKey = this.parseDateKey(dto.appointmentDate);
        const weekday = this.weekdayFromYmd(appointmentDateKey);
        const selectedDay = dto.day.trim();
        const selectedStartTime = dto.startTime.trim();
        const selectedEndTime = dto.endTime.trim();
        if (weekday !== selectedDay) {
            throw new common_1.BadRequestException(`appointmentDate falls on ${weekday}, not ${selectedDay} (${COLOMBO})`);
        }
        const doctor = await this.fetchDoctor(dto.doctorId);
        const slot = this.resolveSlot(doctor, dto);
        let patientId;
        if (authHeader) {
            patientId = this.tryLinkPatientId(authHeader, dto.patientEmail);
        }
        const fee = dto.consultationFee != null && !Number.isNaN(Number(dto.consultationFee))
            ? Number(dto.consultationFee)
            : 0;
        const slotKey = `${selectedDay}|${selectedStartTime}|${selectedEndTime}`;
        const doctorObjectId = new mongoose_2.Types.ObjectId(dto.doctorId);
        const normalizedEmail = dto.patientEmail.trim().toLowerCase();
        const existingForPatient = await this.appointmentModel
            .findOne({
            doctorId: doctorObjectId,
            appointmentDateKey,
            day: selectedDay,
            startTime: selectedStartTime,
            endTime: selectedEndTime,
            patientEmail: normalizedEmail,
            status: { $ne: appointment_schema_1.AppointmentStatus.CANCELLED },
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
            status: { $ne: appointment_schema_1.AppointmentStatus.CANCELLED },
        });
        if (activeCount >= slotCapacity) {
            throw new common_1.ConflictException(`This slot is full (${slotCapacity} patients). Please choose another slot`);
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
                    status: appointment_schema_1.AppointmentStatus.PENDING_PAYMENT,
                    doctorApprovalStatus: appointment_schema_1.DoctorApprovalStatus.PENDING,
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
            }
            catch (e) {
                const err = e;
                if (err.code === 11000) {
                    continue;
                }
                throw e;
            }
        }
        throw new common_1.ConflictException(`This slot is full (${slotCapacity} patients). Please choose another slot`);
    }
    async listByPatientEmail(patientEmail) {
        const email = patientEmail.trim().toLowerCase();
        const rows = await this.appointmentModel
            .find({ patientEmail: email })
            .sort({ appointmentDateKey: -1 })
            .lean()
            .exec();
        return rows.map((r) => this.mapRow(r));
    }
    async listForPatient(patientId, jwtSub, patientEmail) {
        if (patientId !== jwtSub) {
            throw new common_1.ForbiddenException('Cannot access another patient’s appointments');
        }
        const pid = new mongoose_2.Types.ObjectId(patientId);
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
    async listForDoctor(doctorSub, opts) {
        const filter = {
            doctorId: new mongoose_2.Types.ObjectId(doctorSub),
        };
        if (opts?.date?.trim()) {
            filter.appointmentDateKey = opts.date.trim();
        }
        else if (opts?.fromDate?.trim()) {
            filter.appointmentDateKey = { $gte: opts.fromDate.trim() };
            filter.status = { $ne: appointment_schema_1.AppointmentStatus.CANCELLED };
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
    async getDoctorStats(doctorSub, month) {
        const did = new mongoose_2.Types.ObjectId(doctorSub);
        const dateKey = moment.tz(COLOMBO).format('YYYY-MM-DD');
        const monthKey = month?.trim() || moment.tz(COLOMBO).format('YYYY-MM');
        const [pendingAppointmentCount, confirmedAppointmentCount, completedAppointmentCount, totalActiveAppointmentCount,] = await Promise.all([
            this.appointmentModel.countDocuments({
                doctorId: did,
                status: {
                    $in: [
                        appointment_schema_1.AppointmentStatus.PENDING,
                        appointment_schema_1.AppointmentStatus.PENDING_PAYMENT,
                    ],
                },
            }),
            this.appointmentModel.countDocuments({
                doctorId: did,
                status: appointment_schema_1.AppointmentStatus.CONFIRMED,
            }),
            this.appointmentModel.countDocuments({
                doctorId: did,
                status: appointment_schema_1.AppointmentStatus.COMPLETED,
            }),
            this.appointmentModel.countDocuments({
                doctorId: did,
                status: { $ne: appointment_schema_1.AppointmentStatus.CANCELLED },
            }),
        ]);
        const todayAppointmentCount = await this.appointmentModel.countDocuments({
            doctorId: did,
            appointmentDateKey: dateKey,
        });
        const monthPrefix = monthKey;
        const monthCompletedCount = await this.appointmentModel.countDocuments({
            doctorId: did,
            status: appointment_schema_1.AppointmentStatus.COMPLETED,
            appointmentDateKey: { $regex: new RegExp(`^${monthPrefix}`) },
        });
        const earnings = await this.appointmentModel.aggregate([
            {
                $match: {
                    doctorId: did,
                    appointmentDateKey: { $regex: new RegExp(`^${monthPrefix}`) },
                    status: {
                        $in: [appointment_schema_1.AppointmentStatus.CONFIRMED, appointment_schema_1.AppointmentStatus.COMPLETED],
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
    async getPublicStats() {
        const dateKey = moment.tz(COLOMBO).format('YYYY-MM-DD');
        const [consultationsToday, totalBookings] = await Promise.all([
            this.appointmentModel.countDocuments({
                appointmentDateKey: dateKey,
                status: { $ne: appointment_schema_1.AppointmentStatus.CANCELLED },
            }),
            this.appointmentModel.countDocuments(),
        ]);
        return { consultationsToday, totalBookings, dateKey };
    }
    async getPlatformSummary() {
        const totalAppointments = await this.appointmentModel.countDocuments();
        const paid = await this.appointmentModel.aggregate([
            { $match: { paymentStatus: 'Paid' } },
            { $group: { _id: null, t: { $sum: '$consultationFee' } } },
        ]);
        const totalRevenue = paid[0]?.t ?? 0;
        const byMonth = await this.appointmentModel.aggregate([
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
    async getPaymentPreviewForCheckout(id) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.BadRequestException('Invalid appointment id');
        }
        const appt = await this.appointmentModel.findById(id).lean().exec();
        if (!appt) {
            throw new common_1.NotFoundException('Appointment not found');
        }
        if (appt.status !== appointment_schema_1.AppointmentStatus.PENDING_PAYMENT) {
            throw new common_1.BadRequestException('Appointment is not awaiting payment');
        }
        const currency = (process.env.PAYMENT_CURRENCY ?? 'lkr').toLowerCase();
        const amount = Number(appt.consultationFee ?? 0);
        let amountMinor = Math.max(0, Math.round(amount * 100));
        if (amountMinor < 1) {
            const fallbackMajor = Number(process.env.DEFAULT_CONSULTATION_FEE_LKR ?? '3500');
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
    async getTelecomSnapshot(id) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.BadRequestException('Invalid appointment id');
        }
        const appt = await this.appointmentModel.findById(id).lean().exec();
        if (!appt) {
            throw new common_1.NotFoundException('Appointment not found');
        }
        const o = appt;
        return {
            doctorId: String(appt.doctorId),
            patientId: appt.patientId ? String(appt.patientId) : undefined,
            patientEmail: appt.patientEmail,
            status: appt.status,
            doctorApprovalStatus: this.effectiveDoctorApproval(o),
        };
    }
    async setDoctorApproval(appointmentId, doctorSub, decision) {
        if (!mongoose_2.Types.ObjectId.isValid(appointmentId)) {
            throw new common_1.BadRequestException('Invalid appointment id');
        }
        const appt = await this.appointmentModel.findById(appointmentId).exec();
        if (!appt) {
            throw new common_1.NotFoundException('Appointment not found');
        }
        if (appt.doctorId.toString() !== doctorSub) {
            throw new common_1.ForbiddenException('Not your appointment');
        }
        if (appt.status === appointment_schema_1.AppointmentStatus.CANCELLED) {
            throw new common_1.BadRequestException('Appointment is already cancelled');
        }
        const current = this.effectiveDoctorApproval(appt.toObject());
        if (current === appointment_schema_1.DoctorApprovalStatus.REJECTED) {
            throw new common_1.BadRequestException('This booking was already rejected');
        }
        if (decision === 'approve') {
            appt.doctorApprovalStatus = appointment_schema_1.DoctorApprovalStatus.APPROVED;
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
        appt.doctorApprovalStatus = appointment_schema_1.DoctorApprovalStatus.REJECTED;
        appt.status = appointment_schema_1.AppointmentStatus.CANCELLED;
        appt.paymentStatus =
            appt.paymentStatus === 'Paid'
                ? 'Cancelled (refund pending)'
                : 'Cancelled';
        await appt.save();
        const row = this.mapRow(appt);
        return { message: 'Appointment declined and cancelled.', appointment: row };
    }
    async confirmPaymentSuccess(appointmentId) {
        if (!mongoose_2.Types.ObjectId.isValid(appointmentId)) {
            return;
        }
        const appt = await this.appointmentModel
            .findOneAndUpdate({
            _id: new mongoose_2.Types.ObjectId(appointmentId),
            status: appointment_schema_1.AppointmentStatus.PENDING_PAYMENT,
        }, {
            $set: {
                status: appointment_schema_1.AppointmentStatus.CONFIRMED,
                paymentStatus: 'Paid',
            },
        }, { new: true })
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
    async cancelByPatient(appointmentId, patientEmail, authHeader) {
        if (!mongoose_2.Types.ObjectId.isValid(appointmentId)) {
            throw new common_1.BadRequestException('Invalid appointment id');
        }
        const appt = await this.appointmentModel.findById(appointmentId).exec();
        if (!appt) {
            throw new common_1.NotFoundException('Appointment not found');
        }
        this.validatePatientIdentity(authHeader, appt.patientEmail, patientEmail);
        if (appt.status === appointment_schema_1.AppointmentStatus.CANCELLED) {
            throw new common_1.BadRequestException('Appointment already cancelled');
        }
        if (appt.status === appointment_schema_1.AppointmentStatus.COMPLETED) {
            throw new common_1.BadRequestException('Completed appointment cannot be cancelled');
        }
        const cancellable = new Set([
            appointment_schema_1.AppointmentStatus.PENDING_PAYMENT,
            appointment_schema_1.AppointmentStatus.PENDING,
            appointment_schema_1.AppointmentStatus.CONFIRMED,
        ]);
        if (!cancellable.has(appt.status)) {
            throw new common_1.BadRequestException('Appointment cannot be cancelled at this stage');
        }
        const nextPaymentStatus = appt.paymentStatus === 'Paid' ? 'Cancelled (refund pending)' : 'Cancelled';
        await this.appointmentModel.updateOne({ _id: appt._id }, {
            $set: {
                status: appointment_schema_1.AppointmentStatus.CANCELLED,
                paymentStatus: nextPaymentStatus,
            },
        });
        return { message: 'Appointment cancelled successfully' };
    }
    async findByIdForPrescription(appointmentId, doctorSub) {
        if (!mongoose_2.Types.ObjectId.isValid(appointmentId)) {
            throw new common_1.BadRequestException('Invalid appointment id');
        }
        const appt = await this.appointmentModel.findById(appointmentId).exec();
        if (!appt) {
            throw new common_1.NotFoundException('Appointment not found');
        }
        if (appt.doctorId.toString() !== doctorSub) {
            throw new common_1.ForbiddenException('Not your appointment');
        }
        if (appt.status === appointment_schema_1.AppointmentStatus.PENDING_PAYMENT) {
            throw new common_1.BadRequestException('Cannot prescribe until payment is completed');
        }
        return appt;
    }
    async completeAfterPrescription(appointmentId, doctorSub) {
        const appt = await this.findByIdForPrescription(appointmentId, doctorSub);
        if (appt.status === appointment_schema_1.AppointmentStatus.COMPLETED) {
            return;
        }
        await this.appointmentModel.updateOne({ _id: appt._id }, {
            $set: {
                status: appointment_schema_1.AppointmentStatus.COMPLETED,
                paymentStatus: appt.paymentStatus === 'Paid' ? 'Paid' : appt.paymentStatus,
            },
        });
    }
};
exports.AppointmentsService = AppointmentsService;
exports.AppointmentsService = AppointmentsService = AppointmentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(appointment_schema_1.Appointment.name)),
    __param(3, (0, common_1.Inject)('NOTIFICATIONS_CLIENT')),
    __metadata("design:paramtypes", [mongoose_2.Model,
        axios_1.HttpService,
        jwt_1.JwtService,
        microservices_1.ClientProxy])
], AppointmentsService);
//# sourceMappingURL=appointments.service.js.map