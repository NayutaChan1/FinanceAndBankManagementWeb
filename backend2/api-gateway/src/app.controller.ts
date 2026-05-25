import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Inject,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
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
    @Body()
    body:
      | {
          transactions?: unknown[];
          year?: number | string;
          dateFormat?: string;
        }
      | unknown[],
  ) {
    const transactions = Array.isArray(body)
      ? body
      : body?.transactions ?? body;
    const year = Array.isArray(body) ? undefined : body?.year;
    const dateFormat = Array.isArray(body) ? undefined : body?.dateFormat;

    return this.transactionClient.send({ cmd: 'upload_transactions' }, {
      authorization,
      transactions,
      year,
      dateFormat,
    });
  }

  @Get('transactions/summary')
  getTransactionsSummary(
    @Headers('authorization') authorization: string | undefined,
  ) {
    return this.transactionClient.send({ cmd: 'transactions_summary' }, {
      authorization,
    });
  }

  @Get('transactions/trend')
  getTransactionsTrend(
    @Headers('authorization') authorization: string | undefined,
    @Query('months') months: string | undefined,
  ) {
    return this.transactionClient.send({ cmd: 'transactions_trend' }, {
      authorization,
      months,
    });
  }

  @Get('transactions/analytics')
  getTransactionsAnalytics(
    @Headers('authorization') authorization: string | undefined,
    @Query('months') months: string | undefined,
  ) {
    return this.transactionClient.send({ cmd: 'transactions_analytics' }, {
      authorization,
      months,
    });
  }

  @Get('transactions')
  getTransactions(
    @Headers('authorization') authorization: string | undefined,
    @Query() query: Record<string, unknown>,
  ) {
    return this.transactionClient.send({ cmd: 'transactions_list' }, {
      authorization,
      ...query,
    });
  }

  @Post('transactions')
  createTransaction(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    return this.transactionClient.send({ cmd: 'transaction_create' }, {
      authorization,
      transaction: body,
    });
  }

  @Put('transactions/:id')
  updateTransaction(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.transactionClient.send({ cmd: 'transaction_update' }, {
      authorization,
      id,
      transaction: body,
    });
  }

  @Delete('transactions/:id')
  deleteTransaction(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
  ) {
    return this.transactionClient.send({ cmd: 'transaction_delete' }, {
      authorization,
      id,
    });
  }

  @Get('goals')
  getGoals(@Headers('authorization') authorization: string | undefined) {
    return this.transactionClient.send({ cmd: 'goals_list' }, {
      authorization,
    });
  }

  @Post('goals')
  createGoal(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    return this.transactionClient.send({ cmd: 'goal_create' }, {
      authorization,
      goal: body,
    });
  }

  @Put('goals/:id')
  updateGoal(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.transactionClient.send({ cmd: 'goal_update' }, {
      authorization,
      id,
      goal: body,
    });
  }

  @Delete('goals/:id')
  deleteGoal(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
  ) {
    return this.transactionClient.send({ cmd: 'goal_delete' }, {
      authorization,
      id,
    });
  }
}
