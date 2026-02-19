import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument, Donor, DonorDocument } from '../schemas';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  ChangePasswordDto,
  UpdateFcmTokenDto,
} from '../dtos';
import { UserRole } from '../../common/enums';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Donor.name) private donorModel: Model<DonorDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    // Check unique email
    const existing = await this.userModel.findOne({ email: dto.email });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 12);

    // Build location if coordinates provided
    const location =
      dto.longitude && dto.latitude
        ? { type: 'Point', coordinates: [dto.longitude, dto.latitude] }
        : undefined;

    const user = await this.userModel.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      password: hashedPassword,
      role: dto.role,
      bloodType: dto.bloodType,
      phone: dto.phone,
      city: dto.city,
      state: dto.state,
      country: dto.country,
      location,
    });

    // Create role-specific profile
    if (dto.role === UserRole.DONOR) {
      await this.donorModel.create({
        userId: user._id,
        bloodType: dto.bloodType,
        consentGiven: dto.consentGiven ?? false,
        preferredDonationType: dto.preferredDonationType,
        weight: dto.weight,
        age: dto.age,
      });
    }

    // const tokens = await this.generateTokens(user);

    return {
      message: 'Registration successful',
      data: {
        user: this.sanitizeUser(user),
        // ...tokens,
      },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.userModel
      .findOne({ email: dto.email })
      .select('+password');

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.userModel.findByIdAndUpdate(user._id, {
      lastLoginAt: new Date(),
    });

    const tokens = await this.generateTokens(user);

    return {
      message: 'Login successful',
      data: {
        user: this.sanitizeUser(user),
        ...tokens,
      },
    };
  }

  async refreshToken(dto: RefreshTokenDto) {
    try {
      const payload = this.jwtService.verify(dto.refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.userModel
        .findById(payload.sub)
        .select('+refreshToken');

      if (!user || !user.refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const isValid = await bcrypt.compare(dto.refreshToken, user.refreshToken);
      if (!isValid) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const tokens = await this.generateTokens(user);
      return { data: tokens };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  // async logout(userId: string) {
  //   await this.userModel.findByIdAndUpdate(userId, { refreshToken: null });
  //   return { message: 'Logged out successfully' };
  // }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.userModel.findById(userId).select('+password');
    if (!user) throw new NotFoundException('User not found');

    const isValid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isValid)
      throw new BadRequestException('Current password is incorrect');

    const hashed = await bcrypt.hash(dto.newPassword, 12);
    await this.userModel.findByIdAndUpdate(userId, {
      password: hashed,
      refreshToken: null,
    });

    return { message: 'Password changed successfully' };
  }

  async updateFcmToken(userId: string, dto: UpdateFcmTokenDto) {
    await this.userModel.findByIdAndUpdate(userId, { fcmToken: dto.fcmToken });
    return { message: 'FCM token updated' };
  }

  async getProfile(userId: string) {
    const user = await this.userModel.findById(userId).lean();
    if (!user) throw new NotFoundException('User not found');

    let profile = null;
    if (user.role === UserRole.DONOR) {
      profile = await this.donorModel.findOne({ userId }).lean();
    }

    return { data: { user: this.sanitizeUser(user), profile } };
  }

  // ─── Private ───

  private async generateTokens(user: UserDocument) {
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET')!,
      expiresIn: Number(this.configService.get('JWT_EXPIRES_IN', 604800)),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET')!,
      expiresIn: Number(
        this.configService.get('JWT_REFRESH_EXPIRES_IN', 2592000),
      ),
    });

    const hashedRefresh = await bcrypt.hash(refreshToken, 10);
    await this.userModel.findByIdAndUpdate(user._id, {
      refreshToken: hashedRefresh,
    });

    return { accessToken, refreshToken };
  }

  private sanitizeUser(user: any) {
    const { password, refreshToken, ...sanitized } = user.toObject
      ? user.toObject()
      : user;
    return sanitized;
  }
}
