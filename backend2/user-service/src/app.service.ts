import { Injectable } from '@nestjs/common';
import { Prisma, Users } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private db: PrismaService) {}

  async findAll(): Promise<Users[]> {
    return this.db.users.findMany();
  }

  async findOne(id: number): Promise<Users | null> {
    return this.db.users.findUnique({
      where: { userid: id },
    });
  }

  async findByEmail(email: string): Promise<Users | null> {
    return this.db.users.findUnique({
      where: { email },
    });
  }

  async insertUser(data: Prisma.UsersCreateInput): Promise<Users> {
    return this.db.users.create({ data });
  }
}
