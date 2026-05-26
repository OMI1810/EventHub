import { AuthDto } from "@/auth/dto/auth.dto";
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

  async create(dto: AuthDto) {
    return this.prisma.user.create({
      data: {
        email: dto.email,
        password: await hash(dto.password),
        role: Role.USER,
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
}
