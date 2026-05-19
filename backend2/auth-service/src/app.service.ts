import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ClientProxy } from '@nestjs/microservices';
import * as bcrypt from 'bcrypt';
// 1. Import firstValueFrom
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AppService {
  constructor(
    // 2. Removed 'private readonly users: AppService' to prevent crash
    private readonly jwtService: JwtService,
    @Inject('USER_CLIENT') private readonly userClient: ClientProxy,
  ) {}

  async validateUser(email: string, password: string) {
    // 3. Wrap the client send call with firstValueFrom
    const user = await firstValueFrom(
      this.userClient.send({ cmd: 'get_by_email_user' }, email),
    );

    if (!user) return null;

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return null;
    }

    const { password: _, ...result } = user;
    return result;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid Credentials');
    }

    const payload = {
      sub: user.userid,
      email: user.email,
      username: user.username,
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: user,
    };
  }

  async register(email: string, username: string, password: string) {
    if (!email) {
      console.log('Is Empty');
      throw new ConflictException('Email is Empty');
    }

    // 4. Wrap the client send call with firstValueFrom
    const ExistUser = await firstValueFrom(
      this.userClient.send({ cmd: 'get_by_email_user' }, email),
    );

    if (ExistUser) {
      throw new ConflictException('Email already exist');
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // 5. Wrap the client send call with firstValueFrom
    const user = await firstValueFrom(
      this.userClient.send(
        { cmd: 'insert_user' },
        {
          email: email,
          password: hashedPassword,
          username: username,
        },
      ),
    );

    const { password: _, ...result } = user;
    const payload = {
      sub: result.userid,
      email: result.email,
      username: result.username,
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: result,
    };
  }

  getHello(): string {
    return 'Hello World!';
  }
}
