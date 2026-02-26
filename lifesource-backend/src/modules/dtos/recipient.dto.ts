import {
  IsEnum,
  IsOptional,
  IsString,
  IsNumber,
  IsDateString,
  IsMongoId,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BloodType, DonationType, UrgencyLevel } from '../../common/enums';

export class CreateBloodRequestDto {
  @ApiProperty({ enum: BloodType, example: BloodType.O_POSITIVE })
  @IsEnum(BloodType)
  bloodType: BloodType;

  @ApiPropertyOptional({
    enum: DonationType,
    default: DonationType.WHOLE_BLOOD,
  })
  @IsOptional()
  @IsEnum(DonationType)
  donationType?: DonationType;

  @ApiProperty({ description: 'Number of units required', example: 2 })
  @IsNumber()
  @Min(1)
  unitsNeeded: number;

  @ApiProperty({ enum: UrgencyLevel, example: UrgencyLevel.HIGH })
  @IsEnum(UrgencyLevel)
  urgency: UrgencyLevel;

  @ApiPropertyOptional({ description: 'Patient name' })
  @IsOptional()
  @IsString()
  patientName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  patientAge?: number;

  @ApiPropertyOptional({ description: 'Medical condition or reason' })
  @IsOptional()
  @IsString()
  medicalCondition?: string;

  @ApiPropertyOptional({
    description: 'Required by date (ISO string)',
    example: '2026-03-01',
  })
  @IsOptional()
  @IsDateString()
  requiredBy?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    description:
      'Hospital ID where blood is needed. Use GET /recipient/hospitals to get the list.',
  })
  @IsMongoId()
  hospitalId: string;
}

export class UpdateRecipientProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ enum: BloodType })
  @IsOptional()
  @IsEnum(BloodType)
  bloodType?: BloodType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;
}

export class RequestQueryDto {
  @ApiPropertyOptional({ enum: BloodType })
  @IsOptional()
  @IsEnum(BloodType)
  bloodType?: BloodType;

  @ApiPropertyOptional({ enum: UrgencyLevel })
  @IsOptional()
  @IsEnum(UrgencyLevel)
  urgency?: UrgencyLevel;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @IsNumber()
  limit?: number;
}

export class HospitalListQueryDto {
  @ApiPropertyOptional({ description: 'Search by institution name or city' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 'Lagos' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @IsNumber()
  limit?: number;
}
