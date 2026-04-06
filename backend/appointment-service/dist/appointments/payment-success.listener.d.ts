import { AppointmentsService } from './appointments.service';
export declare class PaymentSuccessListener {
    private readonly appointments;
    private readonly logger;
    constructor(appointments: AppointmentsService);
    onPaid(data: {
        appointmentId: string;
    }): Promise<void>;
}
