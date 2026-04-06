"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentsModule = void 0;
const axios_1 = require("@nestjs/axios");
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
const jwt_1 = require("@nestjs/jwt");
const mongoose_1 = require("@nestjs/mongoose");
const passport_1 = require("@nestjs/passport");
const jwt_strategy_1 = require("../auth/jwt.strategy");
const internal_appointments_controller_1 = require("../internal/internal-appointments.controller");
const internal_key_guard_1 = require("../internal/internal-key.guard");
const prescriptions_controller_1 = require("../prescriptions/prescriptions.controller");
const prescriptions_service_1 = require("../prescriptions/prescriptions.service");
const prescription_schema_1 = require("../prescriptions/prescription.schema");
const appointment_schema_1 = require("./appointment.schema");
const appointments_controller_1 = require("./appointments.controller");
const appointments_service_1 = require("./appointments.service");
const payment_success_listener_1 = require("./payment-success.listener");
let AppointmentsModule = class AppointmentsModule {
};
exports.AppointmentsModule = AppointmentsModule;
exports.AppointmentsModule = AppointmentsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: appointment_schema_1.Appointment.name, schema: appointment_schema_1.AppointmentSchema },
                { name: prescription_schema_1.Prescription.name, schema: prescription_schema_1.PrescriptionSchema },
            ]),
            passport_1.PassportModule.register({ defaultStrategy: 'jwt' }),
            jwt_1.JwtModule.register({
                secret: process.env.JWT_SECRET ?? 'change-me-secret',
            }),
            axios_1.HttpModule.register({ timeout: 12_000, maxRedirects: 3 }),
            microservices_1.ClientsModule.register([
                {
                    name: 'NOTIFICATIONS_CLIENT',
                    transport: microservices_1.Transport.RMQ,
                    options: {
                        urls: [process.env.RABBITMQ_URL ?? 'amqp://localhost:5672'],
                        queue: 'notifications_queue',
                        queueOptions: { durable: true },
                    },
                },
            ]),
        ],
        controllers: [
            appointments_controller_1.AppointmentsController,
            internal_appointments_controller_1.InternalAppointmentsController,
            prescriptions_controller_1.PrescriptionsController,
        ],
        providers: [
            appointments_service_1.AppointmentsService,
            prescriptions_service_1.PrescriptionsService,
            jwt_strategy_1.JwtStrategy,
            payment_success_listener_1.PaymentSuccessListener,
            internal_key_guard_1.InternalKeyGuard,
        ],
        exports: [appointments_service_1.AppointmentsService],
    })
], AppointmentsModule);
//# sourceMappingURL=appointments.module.js.map