import { AppointmentsService } from './appointments.service';
type PaymentSucceededV1Event = {
    appointmentId: string;
};
type PaymentFailedV1Event = {
    appointmentId: string;
    reason: string;
    traceId: string;
};
export declare class PaymentSuccessListener {
    private readonly appointments;
    private readonly logger;
    private static readonly PAYMENT_SUCCEEDED_V1;
    private static readonly PAYMENT_FAILED_V1;
    constructor(appointments: AppointmentsService);
    onPaid(data: {
        appointmentId: string;
    }): Promise<void>;
    onPaidV1(event: PaymentSucceededV1Event): Promise<void>;
    onFailedV1(event: PaymentFailedV1Event): Promise<void>;
}
export {};
