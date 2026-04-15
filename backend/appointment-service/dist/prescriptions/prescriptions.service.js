"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrescriptionsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const common_2 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
const mongoose_2 = require("mongoose");
const appointments_service_1 = require("../appointments/appointments.service");
const appointment_schema_1 = require("../appointments/appointment.schema");
const prescription_schema_1 = require("./prescription.schema");
let PrescriptionsService = class PrescriptionsService {
    prescriptionModel;
    appointmentModel;
    appointments;
    notifications;
    constructor(prescriptionModel, appointmentModel, appointments, notifications) {
        this.prescriptionModel = prescriptionModel;
        this.appointmentModel = appointmentModel;
        this.appointments = appointments;
        this.notifications = notifications;
    }
    async issue(user, dto) {
        const appt = await this.appointments.findByIdForPrescription(dto.appointmentId, user.sub);
        const created = await this.prescriptionModel.create({
            patientId: appt.patientId,
            patientEmail: appt.patientEmail,
            doctorId: appt.doctorId,
            doctorName: appt.doctorName,
            appointmentId: appt._id,
            diagnosis: dto.diagnosis.trim(),
            symptoms: dto.symptoms?.trim() || undefined,
            clinicalNotes: dto.clinicalNotes?.trim() || undefined,
            specialAdvice: dto.specialAdvice?.trim() || undefined,
            labTests: dto.labTests?.trim() || undefined,
            followUpDate: dto.followUpDate ? new Date(dto.followUpDate) : undefined,
            patientName: dto.patientName?.trim() || appt.patientName,
            patientAge: dto.patientAge?.trim() || undefined,
            patientGender: dto.patientGender?.trim() || undefined,
            medicines: dto.medicines.map((m) => ({
                name: m.name.trim(),
                dosage: m.dosage.trim(),
                frequency: m.frequency?.trim() || undefined,
                duration: m.duration.trim(),
                instructions: m.instructions?.trim() || undefined,
            })),
        });
        await this.appointments.completeAfterPrescription(dto.appointmentId, user.sub);
        const o = created.toObject();
        const medicinesSummary = o.medicines
            .map((m) => [m.name, m.dosage, m.frequency, m.duration].filter(Boolean).join(' · '))
            .join(', ');
        const prescription = {
            id: String(o._id),
            patientId: o.patientId ? String(o.patientId) : undefined,
            patientEmail: o.patientEmail,
            doctorId: String(o.doctorId),
            doctorName: o.doctorName,
            appointmentId: String(o.appointmentId),
            diagnosis: o.diagnosis,
            symptoms: o.symptoms,
            clinicalNotes: o.clinicalNotes,
            specialAdvice: o.specialAdvice,
            labTests: o.labTests,
            followUpDate: o.followUpDate
                ? new Date(o.followUpDate).toISOString()
                : undefined,
            patientName: o.patientName,
            patientAge: o.patientAge,
            patientGender: o.patientGender,
            medicines: o.medicines,
            medicinesSummary,
            createdAt: o.createdAt
                ? new Date(o.createdAt).toISOString()
                : undefined,
        };
        this.notifications.emit('prescription_ready', {
            patientEmail: appt.patientEmail,
            patientPhone: appt.patientPhone,
            doctorName: appt.doctorName,
            appointmentId: String(appt._id),
            prescription,
        });
        return {
            message: 'Prescription issued',
            prescription,
        };
    }
    async listForDoctor(doctorSub, opts) {
        const did = new mongoose_2.Types.ObjectId(doctorSub);
        const q = opts?.q?.trim();
        const cap = Math.max(1, Math.min(100, Number(opts?.limit ?? 25)));
        const query = { doctorId: did };
        if (q) {
            const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
            query.$or = [
                { patientName: rx },
                { patientEmail: rx },
                { diagnosis: rx },
                { 'medicines.name': rx },
            ];
        }
        const rows = await this.prescriptionModel
            .find(query)
            .sort({ createdAt: -1 })
            .limit(cap)
            .lean()
            .exec();
        return rows.map((o) => {
            const row = o;
            return {
                id: String(o._id),
                appointmentId: String(o.appointmentId),
                patientName: o.patientName,
                patientEmail: o.patientEmail,
                diagnosis: o.diagnosis,
                medicinesSummary: (o.medicines ?? [])
                    .map((m) => [m.name, m.dosage, m.frequency, m.duration].filter(Boolean).join(' · '))
                    .join(', '),
                followUpDate: o.followUpDate
                    ? new Date(o.followUpDate).toISOString()
                    : undefined,
                createdAt: row.createdAt
                    ? new Date(row.createdAt).toISOString()
                    : undefined,
            };
        });
    }
    async listForPatient(patientSub, opts) {
        const pid = new mongoose_2.Types.ObjectId(patientSub);
        const q = opts?.q?.trim();
        const cap = Math.max(1, Math.min(100, Number(opts?.limit ?? 25)));
        const query = { patientId: pid };
        if (q) {
            const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
            query.$or = [
                { diagnosis: rx },
                { symptoms: rx },
                { clinicalNotes: rx },
                { specialAdvice: rx },
                { 'medicines.name': rx },
            ];
        }
        const rows = await this.prescriptionModel
            .find(query)
            .sort({ createdAt: -1 })
            .limit(cap)
            .lean()
            .exec();
        const fallbackDoctorNames = await this.resolveDoctorNamesByAppointmentIds(rows
            .filter((r) => !r.doctorName)
            .map((r) => String(r.appointmentId)));
        return rows.map((o) => {
            const row = o;
            return {
                id: String(o._id),
                appointmentId: String(o.appointmentId),
                doctorName: o.doctorName ?? fallbackDoctorNames.get(String(o.appointmentId)),
                diagnosis: o.diagnosis,
                medicinesSummary: (o.medicines ?? [])
                    .map((m) => [m.name, m.dosage, m.frequency, m.duration].filter(Boolean).join(' · '))
                    .join(', '),
                followUpDate: o.followUpDate
                    ? new Date(o.followUpDate).toISOString()
                    : undefined,
                createdAt: row.createdAt
                    ? new Date(row.createdAt).toISOString()
                    : undefined,
            };
        });
    }
    async getForPatient(patientSub, prescriptionId) {
        if (!mongoose_2.Types.ObjectId.isValid(prescriptionId)) {
            throw new common_1.NotFoundException('Prescription not found');
        }
        const pid = new mongoose_2.Types.ObjectId(patientSub);
        const rid = new mongoose_2.Types.ObjectId(prescriptionId);
        const row = await this.prescriptionModel
            .findOne({ _id: rid, patientId: pid })
            .lean()
            .exec();
        if (!row) {
            throw new common_1.NotFoundException('Prescription not found');
        }
        const createdAtRow = row;
        const fallbackDoctorName = row.doctorName
            ? undefined
            : await this.resolveDoctorName(String(row.appointmentId));
        return {
            id: String(row._id),
            appointmentId: String(row.appointmentId),
            doctorName: row.doctorName ?? fallbackDoctorName,
            diagnosis: row.diagnosis,
            symptoms: row.symptoms,
            clinicalNotes: row.clinicalNotes,
            specialAdvice: row.specialAdvice,
            labTests: row.labTests,
            followUpDate: row.followUpDate
                ? new Date(row.followUpDate).toISOString()
                : undefined,
            patientName: row.patientName,
            patientAge: row.patientAge,
            patientGender: row.patientGender,
            medicines: (row.medicines ?? []).map((m) => ({
                name: m.name,
                dosage: m.dosage,
                frequency: m.frequency,
                duration: m.duration,
                instructions: m.instructions,
            })),
            medicinesSummary: (row.medicines ?? [])
                .map((m) => [m.name, m.dosage, m.frequency, m.duration].filter(Boolean).join(' · '))
                .join(', '),
            createdAt: createdAtRow.createdAt
                ? new Date(createdAtRow.createdAt).toISOString()
                : undefined,
        };
    }
    async resolveDoctorName(appointmentId) {
        if (!mongoose_2.Types.ObjectId.isValid(appointmentId)) {
            return undefined;
        }
        const row = await this.appointmentModel
            .findById(new mongoose_2.Types.ObjectId(appointmentId), { doctorName: 1 })
            .lean()
            .exec();
        return row?.doctorName;
    }
    async resolveDoctorNamesByAppointmentIds(appointmentIds) {
        const validIds = appointmentIds
            .filter((id, index, arr) => arr.indexOf(id) === index)
            .filter((id) => mongoose_2.Types.ObjectId.isValid(id))
            .map((id) => new mongoose_2.Types.ObjectId(id));
        if (validIds.length === 0) {
            return new Map();
        }
        const rows = await this.appointmentModel
            .find({ _id: { $in: validIds } }, { doctorName: 1 })
            .lean()
            .exec();
        const map = new Map();
        for (const row of rows) {
            if (row.doctorName) {
                map.set(String(row._id), row.doctorName);
            }
        }
        return map;
    }
    async getForDoctor(doctorSub, prescriptionId) {
        if (!mongoose_2.Types.ObjectId.isValid(prescriptionId)) {
            throw new common_1.NotFoundException('Prescription not found');
        }
        const did = new mongoose_2.Types.ObjectId(doctorSub);
        const rid = new mongoose_2.Types.ObjectId(prescriptionId);
        const row = await this.prescriptionModel
            .findOne({ _id: rid, doctorId: did })
            .lean()
            .exec();
        if (!row) {
            throw new common_1.NotFoundException('Prescription not found');
        }
        const createdAtRow = row;
        return {
            id: String(row._id),
            patientId: row.patientId ? String(row.patientId) : undefined,
            appointmentId: String(row.appointmentId),
            diagnosis: row.diagnosis,
            symptoms: row.symptoms,
            clinicalNotes: row.clinicalNotes,
            specialAdvice: row.specialAdvice,
            labTests: row.labTests,
            followUpDate: row.followUpDate
                ? new Date(row.followUpDate).toISOString()
                : undefined,
            patientName: row.patientName,
            patientAge: row.patientAge,
            patientGender: row.patientGender,
            patientEmail: row.patientEmail,
            medicines: (row.medicines ?? []).map((m) => ({
                name: m.name,
                dosage: m.dosage,
                frequency: m.frequency,
                duration: m.duration,
                instructions: m.instructions,
            })),
            medicinesSummary: (row.medicines ?? [])
                .map((m) => [m.name, m.dosage, m.frequency, m.duration].filter(Boolean).join(' · '))
                .join(', '),
            createdAt: createdAtRow.createdAt
                ? new Date(createdAtRow.createdAt).toISOString()
                : undefined,
        };
    }
};
exports.PrescriptionsService = PrescriptionsService;
exports.PrescriptionsService = PrescriptionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(prescription_schema_1.Prescription.name)),
    __param(1, (0, mongoose_1.InjectModel)(appointment_schema_1.Appointment.name)),
    __param(3, (0, common_2.Inject)('NOTIFICATIONS_CLIENT')),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        appointments_service_1.AppointmentsService,
        microservices_1.ClientProxy])
], PrescriptionsService);
//# sourceMappingURL=prescriptions.service.js.map