import { Body, ConflictException, Controller, Get, Param, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

interface LoginDto {
    email: string;
    password: string;
}

interface RegisterDto {
    email: string;
    username: string;
    password: string;
}

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post('login')
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto.email, loginDto.password);
    }

    @Post('register')
    async register(@Body() registerDto: RegisterDto) {
        console.log('Received body:', registerDto);
        return this.authService.register(registerDto.email, registerDto.username, registerDto.password);
    }

}