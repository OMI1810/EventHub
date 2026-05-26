import { RegisterDto } from "@/auth/dto/auth.dto";
import { Injectable } from "@nestjs/common";
import { Role, type User } from "@prisma/client";
import { hash } from "argon2";

import { PrismaService } from "src/prisma.service";

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getUsers() {
    return this.prisma.user.findMany({
      select: {
        idUser: true,
        email: true,
        name: true,
        surname: true,
        patronymic: true,
        phone: true,
        role: true,
        password: false,
      },
    });
  }

  async getById(id: string) {
    return this.prisma.user.findUnique({
      where: {
        idUser: id,
      },
    });
  }

  async getByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: {
        email,
      },
    });
  }

  async create(dto: RegisterDto) {
    const password = await hash(dto.password);
    const phone = this.optionalString(dto.phone);
    const contact = this.optionalString(dto.contact);

    if (dto.role === Role.ORGANIZATOR) {
      return this.prisma.$transaction(async (prisma) => {
        const user = await prisma.user.create({
          data: {
            email: dto.email,
            phone,
            contact,
            password,
            role: dto.role,
          },
        });

        const organization = await prisma.organization.create({
          data: {
            name: dto.organizationName!.trim(),
            description: this.optionalString(dto.organizationDescription),
            address: dto.organizationAddress!.trim(),
            ownerUserId: user.idUser,
          },
        });

        await prisma.userOrganization.create({
          data: {
            userId: user.idUser,
            organizationId: organization.idOrganization,
          },
        });

        return user;
      });
    }

    return this.prisma.user.create({
      data: {
        email: dto.email,
        phone,
        contact,
        surname: this.optionalString(dto.surname),
        name: this.optionalString(dto.name),
        patronymic: this.optionalString(dto.patronymic),
        password,
        role: dto.role ?? Role.USER,
      },
    });
  }

  async update(id: string, data: Partial<User>) {
    return this.prisma.user.update({
      where: {
        idUser: id,
      },
      data,
    });
  }

  private optionalString(value?: string) {
    const normalized = value?.trim();
    return normalized ? normalized : undefined;
  }
}
