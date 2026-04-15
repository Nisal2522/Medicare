export type BookingSummaryDto = {
  appointmentId: string;
  appointmentDateKey: string;
  day: string;
  startTime: string;
  endTime: string;
  appointmentStatus: string;
  paymentStatus: string;
  doctor: {
    id: string;
    name: string;
    specialty: string;
    profilePicture?: string;
  };
};

export type AppointmentSummarySnapshot = {
  appointmentId: string;
  doctorId: string;
  appointmentDateKey: string;
  day: string;
  startTime: string;
  endTime: string;
  status: string;
  paymentStatus: string;
};

export type DoctorBasicSnapshot = {
  id: string;
  name: string;
  specialty: string;
  profilePicture?: string;
};

