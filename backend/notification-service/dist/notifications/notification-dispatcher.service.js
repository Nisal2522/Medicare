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
var NotificationDispatcherService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationDispatcherService = void 0;
const common_1 = require("@nestjs/common");
const mail_service_1 = require("./mail.service");
const sms_service_1 = require("./sms.service");
let NotificationDispatcherService = NotificationDispatcherService_1 = class NotificationDispatcherService {
    mail;
    sms;
    logger = new common_1.Logger(NotificationDispatcherService_1.name);
    constructor(mail, sms) {
        this.mail = mail;
        this.sms = sms;
    }
    async onBookingConfirmation(payload) {
        const a = payload.appointment;
        const summary = this.formatSlot(a);
        const subject = `MediSmart — Booking confirmed (${a.id ?? '—'})`;
        const patientHtml = this.wrapHtml('Booking confirmed', `<p>Hi <strong>${this.esc(a.patientName)}</strong>,</p>
      <p>Your appointment is confirmed.</p>
      <ul>
        <li><strong>Appointment ID:</strong> ${this.esc(a.id)}</li>
        <li><strong>Doctor:</strong> ${this.esc(a.doctorName)}</li>
        <li><strong>When:</strong> ${this.esc(summary)}</li>
      </ul>
      <p style="color:#64748b;font-size:13px">This is an automated message. For emergencies, contact your clinic directly.</p>`);
        await this.mail.sendHtml(payload.patientEmail, subject, patientHtml);
        await this.sms.send(payload.patientPhone, `MediSmart: Appointment ${a.id ?? ''} with ${a.doctorName ?? 'doctor'} on ${summary}.`);
        if (payload.doctorEmail?.trim()) {
            const doctorHtml = this.wrapHtml('New booking', `<p>Hello <strong>${this.esc(a.doctorName)}</strong>,</p>
        <p>You have a new appointment.</p>
        <ul>
          <li><strong>Appointment ID:</strong> ${this.esc(a.id)}</li>
          <li><strong>Patient:</strong> ${this.esc(a.patientName)}</li>
          <li><strong>When:</strong> ${this.esc(summary)}</li>
        </ul>`);
            await this.mail.sendHtml(payload.doctorEmail.trim(), `MediSmart — New patient booking (${a.id ?? '—'})`, doctorHtml);
        }
        else {
            this.logger.debug('No doctorEmail on booking — doctor email skipped');
        }
        await this.sms.send(payload.doctorPhone, `MediSmart: New booking ${a.id ?? ''} — ${a.patientName ?? 'Patient'} @ ${summary}.`);
    }
    async onVideoReminder(payload) {
        const a = payload.appointment;
        const summary = this.formatSlot(a);
        const subject = `MediSmart — Video visit in ~10 minutes (${a.id ?? '—'})`;
        const html = this.wrapHtml('Reminder', `<p>Hi <strong>${this.esc(a.patientName)}</strong>,</p>
      <p>Your video consultation starts in about <strong>10 minutes</strong>.</p>
      <ul>
        <li><strong>Appointment ID:</strong> ${this.esc(a.id)}</li>
        <li><strong>Doctor:</strong> ${this.esc(a.doctorName)}</li>
        <li><strong>Scheduled:</strong> ${this.esc(summary)}</li>
      </ul>
      <p>Open the app and join from your dashboard when ready.</p>`);
        await this.mail.sendHtml(payload.patientEmail, subject, html);
        await this.sms.send(payload.patientPhone, `MediSmart REMINDER: Video visit with ${a.doctorName ?? 'doctor'} @ ${summary} (ID ${a.id ?? ''}).`);
        if (payload.doctorEmail?.trim()) {
            await this.mail.sendHtml(payload.doctorEmail.trim(), `MediSmart — Upcoming video visit (${a.id ?? '—'})`, this.wrapHtml('Reminder', `<p>Your consultation with <strong>${this.esc(a.patientName)}</strong> is in ~10 minutes.</p>
          <p><strong>ID:</strong> ${this.esc(a.id)} · <strong>Time:</strong> ${this.esc(summary)}</p>`));
        }
        await this.sms.send(payload.doctorPhone, `MediSmart REMINDER: Consult ${a.patientName ?? 'patient'} @ ${summary} (ID ${a.id ?? ''}).`);
    }
    async onPrescriptionReady(payload) {
        const rx = payload.prescription;
        const summary = typeof rx.medicinesSummary === 'string'
            ? rx.medicinesSummary
            : JSON.stringify(rx.medicines ?? []);
        const subject = `MediSmart — Prescription ready (${payload.appointmentId})`;
        const html = this.wrapHtml('Prescription issued', `<p>Hi,</p>
      <p>Your doctor <strong>${this.esc(payload.doctorName)}</strong> has issued a prescription for your visit.</p>
      <ul>
        <li><strong>Appointment ID:</strong> ${this.esc(payload.appointmentId)}</li>
        <li><strong>Medicines:</strong> ${this.esc(summary)}</li>
      </ul>
      <p>View the full details in your MediSmart medical reports.</p>`);
        await this.mail.sendHtml(payload.patientEmail, subject, html);
        await this.sms.send(payload.patientPhone, `MediSmart: Prescription ready for appointment ${payload.appointmentId}. ${summary.slice(0, 80)}`);
    }
    async onDoctorApproval(payload) {
        const a = payload.appointment;
        const summary = this.formatSlot(a);
        const subject = `MediSmart — Appointment approved (${a.id ?? '—'})`;
        const html = this.wrapHtml('Doctor approved your appointment', `<p>Hi <strong>${this.esc(a.patientName)}</strong>,</p>
      <p>Your appointment has been approved by <strong>${this.esc(payload.doctorName ?? a.doctorName)}</strong>.</p>
      <ul>
        <li><strong>Appointment ID:</strong> ${this.esc(a.id)}</li>
        <li><strong>Doctor:</strong> ${this.esc(a.doctorName)}</li>
        <li><strong>Scheduled:</strong> ${this.esc(summary)}</li>
      </ul>
      <p>You can now join consultation at the scheduled time from your dashboard.</p>`);
        await this.mail.sendHtml(payload.patientEmail, subject, html);
        await this.sms.send(payload.patientPhone, `MediSmart: Appointment ${a.id ?? ''} approved by ${a.doctorName ?? 'doctor'}. Time: ${summary}.`);
    }
    formatSlot(a) {
        const parts = [a.appointmentDateKey, a.day, a.startTime, a.endTime].filter(Boolean);
        return parts.join(' · ') || '—';
    }
    esc(s) {
        if (!s)
            return '';
        return s
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }
    wrapHtml(title, inner) {
        return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${this.esc(title)}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;color:#0f172a;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f1f5f9;padding:20px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:620px;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(90deg,#0ea5e9,#14b8a6);padding:18px 22px;">
              <table role="presentation" width="100%">
                <tr>
                  <td style="font-size:22px;font-weight:800;color:#ffffff;">MediSmart AI</td>
                  <td align="right" style="color:#e0f2fe;font-size:12px;">[ LOGO ]</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 22px 8px;">
              <h1 style="margin:0 0 8px;font-size:24px;line-height:1.25;color:#0f172a;">${this.esc(title)}</h1>
              <p style="margin:0;color:#334155;font-size:14px;">Healthcare update from your MediSmart team.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 22px 8px;">
              <div style="border:1px solid #bfdbfe;background:#f8fbff;border-radius:12px;padding:16px;">
                ${inner}
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 22px 6px;">
              <a href="http://localhost:5173/dashboard/patient" style="display:inline-block;background:#0ea5e9;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:11px 18px;border-radius:10px;">View Dashboard</a>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 22px 24px;color:#64748b;font-size:12px;border-top:1px solid #e2e8f0;">
              <p style="margin:0 0 8px;">MediSmart Hospital Network, Colombo, Sri Lanka</p>
              <p style="margin:0;">
                You are receiving this because you have an active MediSmart account.
                <a href="#" style="color:#0284c7;text-decoration:underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
    }
};
exports.NotificationDispatcherService = NotificationDispatcherService;
exports.NotificationDispatcherService = NotificationDispatcherService = NotificationDispatcherService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [mail_service_1.MailService,
        sms_service_1.SmsService])
], NotificationDispatcherService);
//# sourceMappingURL=notification-dispatcher.service.js.map