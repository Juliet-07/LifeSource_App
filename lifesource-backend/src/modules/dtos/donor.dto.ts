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
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { BloodType, DonationType } from '../../common/enums';

export class UpdateDonorProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  weight?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  age?: number;

  @ApiPropertyOptional({ enum: DonationType })
  @IsOptional()
  @IsEnum(DonationType)
  preferredDonationType?: DonationType;

  @ApiPropertyOptional()
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

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  preferredHospitals?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  latitude?: number;
}

export class LogDonationDto {
  @ApiProperty({ description: 'Hospital where donation was made' })
  @IsMongoId()
  hospitalId: string;

  @ApiPropertyOptional({ description: 'Related blood request ID' })
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

  @ApiProperty({ description: 'Date of donation' })
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

  @ApiProperty({ enum: ['accept', 'decline'] })
  @IsString()
  response: 'accept' | 'decline';

  @ApiPropertyOptional({ description: 'Optional note for decline reason' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class DonorQueryDto {
  @ApiPropertyOptional({ enum: BloodType })
  @IsOptional()
  @IsEnum(BloodType)
  bloodType?: BloodType;

  @ApiPropertyOptional({ description: 'Filter by eligibility' })
  @IsOptional()
  @IsBoolean()
  isEligible?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;
}
