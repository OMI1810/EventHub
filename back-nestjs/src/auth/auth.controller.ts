import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { Auth } from "./decorators/auth.decorator";
import { CurrentUser } from "./decorators/user.decorator";
import {
  AuthDto,
  RegisterDto,
  ResendTwoFactorDto,
  VerifyTwoFactorDto,
} from "./dto/auth.dto";
import { RefreshTokenService } from "./refresh-token.service";
import { TurniketLoginDto } from "./dto/turniket-login.dto";

@Controller()
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  @UsePipes(new ValidationPipe())
  @HttpCode(200)
  @Post("auth/login")
  async login(@Body() dto: AuthDto, @Res({ passthrough: true }) res: Response) {
    const response = await this.authService.login(dto);

    if ("requiresTwoFactor" in response) {
      return response;
    }

    const { refreshToken, ...responseWithoutRefreshToken } = response as {
      refreshToken: string;
      accessToken: string;
      user: unknown;
    };

    this.refreshTokenService.addRefreshTokenToResponse(res, refreshToken);

    return responseWithoutRefreshToken;
  }

  @UsePipes(new ValidationPipe())
  @HttpCode(200)
  @Post("auth/login/verify-2fa")
  async verifyTwoFactor(
    @Body() dto: VerifyTwoFactorDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { refreshToken, ...response } =
      await this.authService.verifyTwoFactor(dto);

    this.refreshTokenService.addRefreshTokenToResponse(res, refreshToken);

    return response;
  }

  @UsePipes(new ValidationPipe())
  @HttpCode(200)
  @Post("auth/login/resend-2fa")
  async resendTwoFactor(@Body() dto: ResendTwoFactorDto) {
    return this.authService.resendTwoFactor(dto);
    
  @Post("auth/turniket/login")
  async loginTurniket(
    @Body() dto: TurniketLoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { refreshToken, ...response } =
      await this.authService.loginTurniket(dto);

    this.refreshTokenService.addRefreshTokenToResponse(res, refreshToken);

    return response;
  }

  @UsePipes(new ValidationPipe())
  @HttpCode(200)
  @Post("auth/register")
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { refreshToken, ...response } = await this.authService.register(dto);
    this.refreshTokenService.addRefreshTokenToResponse(res, refreshToken);
    return response;
  }

  @HttpCode(200)
  @Get("verify-email")
  async verifyEmail(@Query("token") token?: string) {
    if (!token) {
      throw new UnauthorizedException("Token not passed");
    }

    return this.authService.verifyEmail(token);
  }

  @Auth()
  @HttpCode(200)
  @Post("auth/resend-verification-email")
  async resendVerificationEmail(@CurrentUser("idUser") userId: string) {
    return this.authService.resendVerificationEmail(userId);
  }

  @HttpCode(200)
  @Post("auth/access-token")
  async getNewTokens(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshTokenFromCookies =
      req.cookies[this.refreshTokenService.REFRESH_TOKEN_NAME];

    if (!refreshTokenFromCookies) {
      this.refreshTokenService.removeRefreshTokenFromResponse(res);
      throw new UnauthorizedException("Refresh token not passed");
    }

    const { refreshToken, ...response } = await this.authService.getNewTokens(
      refreshTokenFromCookies,
    );

    this.refreshTokenService.addRefreshTokenToResponse(res, refreshToken);

    return response;
  }

  @HttpCode(200)
  @Post("auth/logout")
  async logout(@Res({ passthrough: true }) res: Response) {
    this.refreshTokenService.removeRefreshTokenFromResponse(res);

    return true;
  }
}
