import {
  IsIn,
  IsInt,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class AnalyzeSymptomsDto {
  @IsString()
  @MinLength(4, { message: 'Please describe your symptoms in a bit more detail.' })
  @MaxLength(4000)
  symptoms!: string;

  @IsInt()
  @Min(1)
  @Max(120)
  age!: number;

  @IsString()
  @IsIn(['Male', 'Female'])
  gender!: 'Male' | 'Female';
}
