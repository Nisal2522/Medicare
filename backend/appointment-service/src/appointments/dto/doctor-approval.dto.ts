import { IsIn } from 'class-validator';

// DTO for doctor approval of an appointment. It contains the decision made by the doctor, which can be either 'approve' or 'reject'.
export class DoctorApprovalDto {
  @IsIn(['approve', 'reject'])
  decision!: 'approve' | 'reject';
}
