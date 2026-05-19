import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { MessagePattern } from '@nestjs/microservices';
import { Prisma } from '@prisma/client';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @MessagePattern({ cmd: 'get_all_users' })
  async findAll() {
    return this.appService.findAll();
  }

  @MessagePattern({ cmd: 'get_one_user' })
  async findOne(id: number) {
    return this.appService.findOne(id);
  }

  @MessagePattern({ cmd: 'get_by_email_user' })
  async findByEmail(email: string) {
    return this.appService.findByEmail(email);
  }

  @MessagePattern({ cmd: 'insert_user' })
  async insertUser(data: Prisma.UsersCreateInput) {
    return this.appService.insertUser(data);
  }
}
