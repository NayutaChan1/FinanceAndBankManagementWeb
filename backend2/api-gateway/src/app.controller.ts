import { Body, Controller, Get, Inject, Post } from '@nestjs/common';
import { AppService } from './app.service';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';
import { ClientProxy, MessagePattern } from '@nestjs/microservices';

@Controller()
export class AppController {
  constructor(
    @Inject('USER_CLIENT') private readonly userClient: ClientProxy,
    @Inject('AUTH_CLIENT') private readonly authClient: ClientProxy,
  ) {}

  @Get('users')
  getUsers() {
    return this.userClient.send({ cmd: 'get_users' }, {});
  }

  @Post('login')
  login(@Body() loginDto: any) {
    return this.authClient.send({ cmd: 'auth_login' }, loginDto);
  }

  @Post('register')
  register(@Body() loginDto: any) {
    return this.authClient.send({ cmd: 'auth_register' }, loginDto);
  }
}
