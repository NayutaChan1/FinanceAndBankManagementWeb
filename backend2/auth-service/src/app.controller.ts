import { Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { MessagePattern } from '@nestjs/microservices';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @MessagePattern({ cmd : 'auth_login'})
  async login(loginDto: LoginDto) {
      return this.appService.login(loginDto.email, loginDto.password);
  }

  @MessagePattern({ cmd : 'auth_register'})
  async register(registerDto: RegisterDto) {
      console.log('Received body:', registerDto);
      return this.appService.register(registerDto.email, registerDto.username, registerDto.password);
  }
}
