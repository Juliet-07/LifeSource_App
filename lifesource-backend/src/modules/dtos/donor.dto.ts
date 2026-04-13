import {
  IsEnum,
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsDateString,
  IsMongoId,
  Min,
  IsArray,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BloodType, DonationType, UrgencyLevel } from '../../common/enums';

export class UpdateDonorProfileDto {
  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '+2348012345678' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'Lagos' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'Lagos State' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ example: 'Nigeria' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ example: 72, description: 'Weight in kg' })
  @IsOptional()
  @IsNumber()
  weight?: number;

  @ApiPropertyOptional({ example: 28 })
  @IsOptional()
  @IsNumber()
  age?: number;

  @ApiPropertyOptional({ enum: DonationType })
  @IsOptional()
  @IsEnum(DonationType)
  preferredDonationType?: DonationType;

  @ApiPropertyOptional({ description: 'Set donor availability for requests' })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  notificationsEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  consentGiven?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  consentForAnonymousDonation?: boolean;
}

export class LogDonationDto {
  @ApiProperty({
    description:
      'ID of the approved hospital where donation was made. Use GET /donor/hospitals to get the list.',
  })
  @IsMongoId()
  hospitalId: string;

  @ApiPropertyOptional({
    description:
      'ID of an accepted blood request tied to this donation. Use GET /donor/accepted-requests to get the list.',
  })
  @IsOptional()
  @IsMongoId()
  requestId?: string;

  @ApiProperty({ enum: DonationType, default: DonationType.WHOLE_BLOOD })
  @IsEnum(DonationType)
  donationType: DonationType;

  @ApiProperty({ description: 'Volume donated in ml', example: 450 })
  @IsNumber()
  @Min(50)
  quantity: number;

  @ApiProperty({
    description: 'Date of donation (ISO string)',
    example: '2026-02-25',
  })
  @IsDateString()
  donationDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class RespondToRequestDto {
  @ApiProperty({ description: 'Blood request ID to respond to' })
  @IsMongoId()
  requestId: string;

  @ApiProperty({ enum: ['accept', 'decline'], example: 'accept' })
  @IsIn(['accept', 'decline'])
  response: 'accept' | 'decline';

  @ApiPropertyOptional({ description: 'Reason (useful when declining)' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class CreateDonorBloodRequestDto {
  @ApiProperty({
    enum: BloodType,
    example: 'O+',
    description: 'Blood type needed',
  })
  @IsOptional() // ← add
  @IsEnum(BloodType)
  bloodType?: BloodType; // ← make optional

  @ApiPropertyOptional({
    enum: DonationType,
    default: DonationType.WHOLE_BLOOD,
  })
  @IsOptional()
  @IsEnum(DonationType)
  donationType?: DonationType;

  @ApiPropertyOptional({ description: 'Number of units needed', example: 2 }) // ← ApiPropertyOptional
  @IsOptional() // ← add
  @IsNumber()
  @Min(1)
  unitsNeeded?: number; // ← make optional

  @ApiPropertyOptional({ enum: UrgencyLevel, example: UrgencyLevel.HIGH }) // ← ApiPropertyOptional
  @IsOptional() // ← add
  @IsEnum(UrgencyLevel)
  urgency?: UrgencyLevel; // ← make optional

  @ApiProperty({
    description: 'Hospital ID. Use GET /donor/hospitals to get the list.',
  })
  @IsMongoId()
  hospitalId: string; // stays required

  @ApiPropertyOptional()
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

  @ApiPropertyOptional({ description: 'Required by date (ISO string)' })
  @IsOptional()
  @IsDateString()
  requiredBy?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class DonorRequestQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ enum: BloodType })
  @IsOptional()
  @IsEnum(BloodType)
  bloodType?: BloodType;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @IsNumber()
  limit?: number;
}

// ─── Appointment Scheduling ───────────────────────────────────────────────────

export class ScheduleAppointmentDto {
  @ApiProperty({
    description:
      'ID of the approved hospital to schedule at. Use GET /hospitals to find one.',
    example: '507f1f77bcf86cd799439011',
  })
  @IsMongoId()
  hospitalId: string;

  @ApiProperty({
    description: 'Preferred date and time for the appointment (ISO 8601)',
    example: '2026-04-15T09:00:00.000Z',
  })
  @IsDateString()
  scheduledAt: string;

  @ApiPropertyOptional({
    enum: DonationType,
    default: DonationType.WHOLE_BLOOD,
    description: 'Type of donation. Defaults to whole blood.',
  })
  @IsOptional()
  @IsEnum(DonationType)
  donationType?: DonationType;

  @ApiProperty({ enum: BloodType, example: BloodType.O_POSITIVE })
  @IsEnum(BloodType)
  bloodType: BloodType;

  @ApiPropertyOptional({
    description:
      'Optional ID of an accepted blood request this appointment is linked to.',
  })
  @IsOptional()
  @IsMongoId()
  requestId?: string;

  @ApiPropertyOptional({ description: 'Any notes for the hospital' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CancelAppointmentDto {
  @ApiPropertyOptional({ description: 'Reason for cancellation' })
  @IsOptional()
  @IsString()
  reason?: string;
}

// export class AppointmentQueryDto {
//   @ApiPropertyOptional({
//     description: 'Filter by status',
//     enum: ['scheduled', 'confirmed', 'rescheduled', 'cancelled', 'completed'],
//   })
//   @IsOptional()
//   @IsString()
//   status?: string;

//   @ApiPropertyOptional({ default: 1 })
//   @IsOptional()
//   @IsNumber()
//   page?: number;

//   @ApiPropertyOptional({ default: 20 })
//   @IsOptional()
//   @IsNumber()
//   limit?: number;
// }
