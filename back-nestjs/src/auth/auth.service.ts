import { VERIFY_EMAIL_URL } from "@/constants";
import { EmailService } from "@/email/email.service";
import { PrismaService } from "@/prisma.service";
import { UserService } from "@/user/user.service";
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Prisma, Role, type User } from "@prisma/client";
import { hash, verify } from "argon2";
import { omit } from "lodash";
import {
  AuthDto,
  RegisterDto,
  ResendTwoFactorDto,
  VerifyTwoFactorDto,
} from "./dto/auth.dto";
import { TurniketLoginDto } from "./dto/turniket-login.dto";


@Injectable()
export class AuthService {
  constructor(
    private jwt: JwtService,
    private userService: UserService,
    private emailService: EmailService,
    private prisma: PrismaService,
  ) {}

  private readonly TOKEN_EXPIRATION_ACCESS = "1h";
  private readonly TOKEN_EXPIRATION_REFRESH = "7d";
  private readonly TOKEN_EXPIRATION_TWO_FACTOR = "5m";
  private readonly TWO_FACTOR_CODE_TTL_MS = 5 * 60 * 1000;

  async login(dto: AuthDto) {
    const user = await this.validateUser(dto);

    if (
      user.role === Role.TURNIKET ||
      !this.canUseTwoFactor(user.role) ||
      !user.isTwoFactorEnabled
    ) {
      return this.buildResponseObject(user);
    }

    return this.startTwoFactorLogin(user);
  }

  async verifyTwoFactor(dto: VerifyTwoFactorDto) {
    const payload = await this.verifyTwoFactorToken(dto.twoFactorToken);
    const user = await this.prisma.user.findUnique({
      where: {
        idUser: payload.id,
      },
    });

    if (!user || !user.otpCode || !user.otpExpiresAt) {
      throw new UnauthorizedException("Код подтверждения недействителен");
    }

    if (user.otpExpiresAt.getTime() < Date.now()) {
      await this.clearTwoFactorCode(user.idUser);
      throw new UnauthorizedException("Код подтверждения истек");
    }

    const isValidCode = await verify(user.otpCode, dto.code.trim());

    if (!isValidCode) {
      throw new UnauthorizedException("Неверный код подтверждения");
    }

    await this.clearTwoFactorCode(user.idUser);

    return this.buildResponseObject(user);
  }

  async resendTwoFactor(dto: ResendTwoFactorDto) {
    const payload = await this.verifyTwoFactorToken(dto.twoFactorToken);
    const user = await this.prisma.user.findUnique({
      where: {
        idUser: payload.id,
      },
    });

    if (!user) {
      throw new UnauthorizedException("Код подтверждения недействителен");
    }

    await this.createAndSendTwoFactorCode(user);

    return {
      success: true,
      twoFactorToken: this.createTwoFactorToken(user),
    };
  }

  async loginTurniket(dto: TurniketLoginDto) {
    const user = await this.validateTurniketUser(dto);
    return this.buildResponseObject(user);
  }

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: dto.email },
          ...(dto.phone?.trim() ? [{ phone: dto.phone.trim() }] : []),
          ...(dto.contact?.trim() ? [{ contact: dto.contact.trim() }] : []),
        ],
      },
      select: {
        email: true,
        phone: true,
        contact: true,
      },
    });

    if (existingUser) {
      if (existingUser.email === dto.email) {
        throw new BadRequestException(
          "Пользователь с таким email уже существует",
        );
      }

      if (dto.phone?.trim() && existingUser.phone === dto.phone.trim()) {
        throw new BadRequestException(
          "Пользователь с таким телефоном уже существует",
        );
      }

      if (dto.contact?.trim() && existingUser.contact === dto.contact.trim()) {
        throw new BadRequestException(
          "Пользователь с таким дополнительным контактом уже существует",
        );
      }
    }

    let user: User;

    try {
      user = await this.userService.create(dto);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new BadRequestException(
          "Пользователь с такими регистрационными данными уже существует",
        );
      }

      throw error;
    }

    await this.emailService.sendVerification(
      user.email,
      `${VERIFY_EMAIL_URL}${user.verificationToken}`,
    );

    return this.buildResponseObject(user);
  }

  async getNewTokens(refreshToken: string) {
    const result = await this.jwt.verifyAsync(refreshToken);
    if (!result) {
      throw new UnauthorizedException("Invalid refresh token");
    }
    const user = await this.userService.getById(result.id);
    if (!user) {
      throw new UnauthorizedException("User not found");
    }
    return this.buildResponseObject(user);
  }

  async verifyEmail(token: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        verificationToken: token,
      },
    });

    if (!user) throw new NotFoundException("Token not exists!");

    await this.prisma.user.update({
      where: { idUser: user.idUser },
      data: { verificationToken: null },
    });

    return "Email verified!";
  }

  async resendVerificationEmail(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { idUser: userId },
      select: {
        email: true,
        verificationToken: true,
      },
    });

    if (!user) {
      throw new NotFoundException("Пользователь не найден");
    }

    if (!user.verificationToken) {
      throw new BadRequestException("Почта уже подтверждена");
    }

    await this.emailService.sendVerification(
      user.email,
      `${VERIFY_EMAIL_URL}${user.verificationToken}`,
    );

    return { success: true };
  }

  async updateTwoFactorSetting(userId: string, enabled: boolean) {
    const user = await this.prisma.user.findUnique({
      where: {
        idUser: userId,
      },
      select: {
        idUser: true,
        role: true,
      },
    });

    if (!user) {
      throw new NotFoundException("Пользователь не найден");
    }

    if (!this.canUseTwoFactor(user.role)) {
      throw new ForbiddenException(
        "Двухфакторная авторизация доступна только пользователям, администраторам и организаторам",
      );
    }

    const updatedUser = await this.prisma.user.update({
      where: {
        idUser: userId,
      },
      data: {
        isTwoFactorEnabled: enabled,
        ...(enabled
          ? {}
          : {
              otpCode: null,
              otpExpiresAt: null,
            }),
      },
      select: {
        isTwoFactorEnabled: true,
      },
    });

    return updatedUser;
  }

  async buildResponseObject(user: User) {
    const tokens = await this.issueTokens(user.idUser, user.role);
    return { user: this.omitPassword(user), ...tokens };
  }

  private async issueTokens(userId: string, role: Role) {
    const payload = { id: userId, role };
    const accessToken = this.jwt.sign(payload, {
      expiresIn: this.TOKEN_EXPIRATION_ACCESS,
    });
    const refreshToken = this.jwt.sign(payload, {
      expiresIn: this.TOKEN_EXPIRATION_REFRESH,
    });
    return { accessToken, refreshToken };
  }

  private async startTwoFactorLogin(user: User) {
    await this.createAndSendTwoFactorCode(user);

    return {
      requiresTwoFactor: true,
      twoFactorToken: this.createTwoFactorToken(user),
      email: user.email,
    };
  }

  private createTwoFactorToken(user: Pick<User, "idUser" | "role">) {
    return this.jwt.sign(
      {
        id: user.idUser,
        role: user.role,
        purpose: "two-factor",
      },
      {
        expiresIn: this.TOKEN_EXPIRATION_TWO_FACTOR,
      },
    );
  }

  private async createAndSendTwoFactorCode(user: User) {
    const code = this.createTwoFactorCode();
    const codeHash = await hash(code);

    await this.prisma.user.update({
      where: {
        idUser: user.idUser,
      },
      data: {
        otpCode: codeHash,
        otpExpiresAt: new Date(Date.now() + this.TWO_FACTOR_CODE_TTL_MS),
      },
    });

    await this.emailService.sendTwoFactorCode(user.email, code);
  }

  private createTwoFactorCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async verifyTwoFactorToken(twoFactorToken: string) {
    if (!twoFactorToken?.trim()) {
      throw new UnauthorizedException("Код подтверждения недействителен");
    }

    try {
      const payload = await this.jwt.verifyAsync<{
        id: string;
        role: Role;
        purpose?: string;
      }>(twoFactorToken);

      if (payload.purpose !== "two-factor") {
        throw new UnauthorizedException("Код подтверждения недействителен");
      }

      return payload;
    } catch {
      throw new UnauthorizedException("Код подтверждения недействителен");
    }
  }

  private async clearTwoFactorCode(userId: string) {
    await this.prisma.user.update({
      where: {
        idUser: userId,
      },
      data: {
        otpCode: null,
        otpExpiresAt: null,
      },
    });
  }

  private async validateUser(dto: AuthDto) {
    const user = await this.userService.getByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException("Email or password invalid");
    }
    const isValid = await verify(user.password, dto.password);
    if (!isValid) {
      throw new UnauthorizedException("Email or password invalid");
    }
    return user;
  }

  private async validateTurniketUser(dto: TurniketLoginDto) {
    const user = await this.userService.getByEmail(dto.login);
    if (!user || user.role !== Role.TURNIKET) {
      throw new UnauthorizedException("Login or password invalid");
    }

    const isValid = await verify(user.password, dto.password);
    if (!isValid) {
      throw new UnauthorizedException("Login or password invalid");
    }

    return user;
  }

  private canUseTwoFactor(role: Role) {
    const allowedRoles: Role[] = [Role.USER, Role.ADMIN, Role.ORGANIZATOR];

    return allowedRoles.includes(role);
  }

  private omitPassword(user: User) {
    return omit(user, ["password"]);
  }
}
