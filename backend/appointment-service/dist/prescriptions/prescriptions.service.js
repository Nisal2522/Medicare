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
const prescription_schema_1 = require("./prescription.schema");
let PrescriptionsService = class PrescriptionsService {
    prescriptionModel;
    appointments;
    notifications;
    constructor(prescriptionModel, appointments, notifications) {
        this.prescriptionModel = prescriptionModel;
        this.appointments = appointments;
        this.notifications = notifications;
    }
    async issue(user, dto) {
        const appt = await this.appointments.findByIdForPrescription(dto.appointmentId, user.sub);
        const created = await this.prescriptionModel.create({
            patientId: appt.patientId,
            patientEmail: appt.patientEmail,
            doctorId: appt.doctorId,
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
};
exports.PrescriptionsService = PrescriptionsService;
exports.PrescriptionsService = PrescriptionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(prescription_schema_1.Prescription.name)),
    __param(2, (0, common_2.Inject)('NOTIFICATIONS_CLIENT')),
    __metadata("design:paramtypes", [mongoose_2.Model,
        appointments_service_1.AppointmentsService,
        microservices_1.ClientProxy])
], PrescriptionsService);
//# sourceMappingURL=prescriptions.service.js.map