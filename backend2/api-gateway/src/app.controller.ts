import { Body, Controller, Get, Headers, Inject, Post } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Controller()
export class AppController {
  constructor(
    @Inject('USER_CLIENT') private readonly userClient: ClientProxy,
    @Inject('AUTH_CLIENT') private readonly authClient: ClientProxy,
    @Inject('TRANSACTION_CLIENT')
    private readonly transactionClient: ClientProxy,
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

  @Post('transactions/upload')
  uploadTransactions(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: { transactions?: unknown[] } | unknown[],
  ) {
    const transactions = Array.isArray(body)
      ? body
      : body?.transactions ?? body;

    return this.transactionClient.send({ cmd: 'upload_transactions' }, {
      authorization,
      transactions,
    });
  }
}
