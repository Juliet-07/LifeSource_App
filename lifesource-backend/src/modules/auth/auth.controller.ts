import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Patch,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  ChangePasswordDto,
  UpdateFcmTokenDto,
} from '../dtos';
import { JwtAuthGuard } from './guard';
import { CurrentUser, Public } from '../../common/decorators';

@ApiTags('Auth')
@UseGuards(JwtAuthGuard)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({
    summary: 'Register a new user',
    description:
      'Register as a donor, recipient, hospital-admin, or super-admin.',
  })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({
    status: 200,
    description: 'Login successful, returns JWT tokens',
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // @Public()
  // @Post('refresh')
  // @HttpCode(HttpStatus.OK)
  // @ApiOperation({ summary: 'Refresh access token using refresh token' })
  // @ApiResponse({ status: 200, description: 'New tokens issued' })
  // refreshToken(@Body() dto: RefreshTokenDto) {
  //   return this.authService.refreshToken(dto);
  // }

  // @Post('logout')
  // @HttpCode(HttpStatus.OK)
  // @ApiBearerAuth('JWT-auth')
  // @ApiOperation({ summary: 'Logout and invalidate refresh token' })
  // logout(@CurrentUser('_id') userId: string) {
  //   return this.authService.logout(userId);
  // }

  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  getProfile(@CurrentUser('_id') userId: string) {
    return this.authService.getProfile(userId);
  }

  @Patch('change-password')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Change authenticated user password' })
  changePassword(
    @CurrentUser('_id') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(userId, dto);
  }

  @Patch('fcm-token')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update Firebase FCM token for push notifications',
  })
  updateFcmToken(
    @CurrentUser('_id') userId: string,
    @Body() dto: UpdateFcmTokenDto,
  ) {
    return this.authService.updateFcmToken(userId, dto);
  }
}
