import { Controller, Get } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @MessagePattern({ cmd: 'upload_transactions' })
  uploadTransactions(payload: unknown) {
    return this.appService.uploadTransactions(payload);
  }

  @MessagePattern({ cmd: 'transactions_summary' })
  getTransactionsSummary(payload: unknown) {
    return this.appService.getTransactionsSummary(payload);
  }

  @MessagePattern({ cmd: 'transactions_trend' })
  getTransactionsTrend(payload: unknown) {
    return this.appService.getTransactionsTrend(payload);
  }

  @MessagePattern({ cmd: 'transactions_analytics' })
  getTransactionsAnalytics(payload: unknown) {
    return this.appService.getTransactionsAnalytics(payload);
  }

  @MessagePattern({ cmd: 'transactions_list' })
  getTransactions(payload: unknown) {
    return this.appService.getTransactions(payload);
  }

  @MessagePattern({ cmd: 'transaction_create' })
  createTransaction(payload: unknown) {
    return this.appService.createTransaction(payload);
  }

  @MessagePattern({ cmd: 'transaction_update' })
  updateTransaction(payload: unknown) {
    return this.appService.updateTransaction(payload);
  }

  @MessagePattern({ cmd: 'transaction_delete' })
  deleteTransaction(payload: unknown) {
    return this.appService.deleteTransaction(payload);
  }

  @MessagePattern({ cmd: 'goals_list' })
  getGoals(payload: unknown) {
    return this.appService.getGoals(payload);
  }

  @MessagePattern({ cmd: 'goal_create' })
  createGoal(payload: unknown) {
    return this.appService.createGoal(payload);
  }

  @MessagePattern({ cmd: 'goal_update' })
  updateGoal(payload: unknown) {
    return this.appService.updateGoal(payload);
  }

  @MessagePattern({ cmd: 'goal_delete' })
  deleteGoal(payload: unknown) {
    return this.appService.deleteGoal(payload);
  }
}
