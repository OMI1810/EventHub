import { VERIFY_EMAIL_URL } from "@/constants";
import { EmailService } from "@/email/email.service";
import { PrismaService } from "@/prisma.service";
import { UserService } from "@/user/user.service";
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Prisma, Role, type User } from "@prisma/client";
import { verify } from "argon2";
import { omit } from "lodash";
import { AuthDto, RegisterDto } from "./dto/auth.dto";

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

  async login(dto: AuthDto) {
    const user = await this.validateUser(dto);
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
        throw new BadRequestException("Пользователь с таким email уже существует");
      }

      if (dto.phone?.trim() && existingUser.phone === dto.phone.trim()) {
        throw new BadRequestException("Пользователь с таким телефоном уже существует");
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

  private omitPassword(user: User) {
    return omit(user, ["password"]);
  }
}
