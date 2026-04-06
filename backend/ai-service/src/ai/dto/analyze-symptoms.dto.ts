import { IsString, MaxLength, MinLength } from 'class-validator';

export class AnalyzeSymptomsDto {
  @IsString()
  @MinLength(4, { message: 'Please describe your symptoms in a bit more detail.' })
  @MaxLength(4000)
  symptoms!: string;
}
