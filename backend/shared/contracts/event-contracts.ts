export const DomainEventPattern = {
  UserRegisteredV1: 'UserRegistered.v1',
  PaymentSucceededV1: 'PaymentSucceeded.v1',
  PaymentFailedV1: 'PaymentFailed.v1',
  AppointmentPaymentStatusChangedV1: 'AppointmentPaymentStatusChanged.v1',
} as const;

export type DomainEventPatternValue =
  (typeof DomainEventPattern)[keyof typeof DomainEventPattern];

export type UserRole = 'PATIENT' | 'DOCTOR' | 'ADMIN';

export type UserRegisteredV1Event = {
  userId: string;
  email: string;
  fullName: string;
  role: UserRole;
  occurredAt: string;
  traceId: string;
};

export type PaymentSucceededV1Event = {
  appointmentId: string;
  paymentIntentId?: string;
  occurredAt: string;
  traceId: string;
};

export type PaymentFailedV1Event = {
  appointmentId: string;
  reason: string;
  paymentIntentId?: string;
  occurredAt: string;
  traceId: string;
};

export type AppointmentPaymentStatusChangedV1Event = {
  appointmentId: string;
  status: 'PAID' | 'FAILED' | 'CANCELLED';
  occurredAt: string;
  traceId: string;
};

