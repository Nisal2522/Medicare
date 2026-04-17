import { IsIn } from 'class-validator';

//
export class DoctorApprovalDto {
  @IsIn(['approve', 'reject'])
  decision!: 'approve' | 'reject';
}
