import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma, TransType } from '@prisma/client';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service';

type UploadTransactionRow = Record<string, unknown>;

type TransactionPayload = Record<string, unknown> & {
  authorization?: string;
  id?: string;
  transaction?: Record<string, unknown>;
};

type TransactionListPayload = Record<string, unknown> & {
  authorization?: string;
  page?: unknown;
  limit?: unknown;
  search?: unknown;
  category?: unknown;
  type?: unknown;
  from?: unknown;
  to?: unknown;
};

type DateFormat = 'DMY' | 'MDY';

type UploadTransactionPayload = {
  authorization?: string;
  token?: string;
  transactions?: UploadTransactionRow[];
  year?: number | string;
  dateFormat?: string;
};

type DecimalLike = Prisma.Decimal | { toString(): string } | number | string | null;

type TransactionResponse = {
  id: string;
  userId: number;
  transactionDate: string;
  description: string;
  type: TransType;
  amount: number;
  category: string | null;
  isIgnored: boolean;
  createdAt: string;
  updatedAt: string;
};

type GoalResponse = {
  id: string;
  userId: number;
  name: string;
  targetAmount: number;
  currentAmount: number;
  completionRate: number;
  createdAt: string;
  updatedAt: string;
};

type TransactionMutationData = {
  transactionDate?: Date;
  description?: string;
  type?: TransType;
  amount?: Prisma.Decimal;
  category?: string | null;
  isIgnored?: boolean;
};

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  getHello(): string {
    return 'Hello World!';
  }

  async uploadTransactions(payload: unknown) {
    const { authorization, token, transactions, year, dateFormat } =
      this.normalizePayload(payload);
    const userId = this.resolveUserId(authorization ?? token);
    const yearOverride = this.parseYearOverride(year);
    const dateFormatOverride = this.parseDateFormat(dateFormat);
    const normalizedTransactions = this.normalizeTransactions(
      transactions,
      userId,
      yearOverride,
      dateFormatOverride,
    );

    if (normalizedTransactions.length === 0) {
      throw new BadRequestException('No valid transactions were provided');
    }

    const result = await this.prisma.transaction.createMany({
      data: normalizedTransactions,
      skipDuplicates: true,
    });

    return {
      insertedCount: result.count,
    };
  }

  async getTransactionsTrend(payload: unknown) {
    const record =
      !payload || typeof payload !== 'object' || Array.isArray(payload)
        ? ({} as Record<string, unknown>)
        : (payload as Record<string, unknown>);
    const userId = this.resolveUserId(this.readAuthorization(payload));

    const monthsRaw = Number(record.months ?? 6);
    const months = Math.min(
      Math.max(Number.isFinite(monthsRaw) ? Math.floor(monthsRaw) : 6, 1),
      24,
    );

    const now = new Date();
    const rangeStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1),
    );
    const rangeEnd = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
    );

    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        isIgnored: false,
        transactionDate: {
          gte: rangeStart,
          lt: rangeEnd,
        },
      },
      select: {
        transactionDate: true,
        type: true,
        amount: true,
      },
    });

    const monthLabels = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    const buckets = new Map<
      string,
      { year: number; month: number; label: string; income: number; expense: number }
    >();

    for (let offset = months - 1; offset >= 0; offset -= 1) {
      const bucketDate = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1),
      );
      const year = bucketDate.getUTCFullYear();
      const month = bucketDate.getUTCMonth();
      buckets.set(`${year}-${month}`, {
        year,
        month,
        label: monthLabels[month],
        income: 0,
        expense: 0,
      });
    }

    transactions.forEach((transaction) => {
      const date = new Date(transaction.transactionDate);
      const key = `${date.getUTCFullYear()}-${date.getUTCMonth()}`;
      const bucket = buckets.get(key);
      if (!bucket) {
        return;
      }
      const amount = this.amountToNumber(transaction.amount);
      if (transaction.type === TransType.CREDIT) {
        bucket.income += amount;
      } else {
        bucket.expense += amount;
      }
    });

    return {
      data: Array.from(buckets.values()).map((bucket) => ({
        year: bucket.year,
        month: bucket.month + 1,
        label: bucket.label,
        income: bucket.income,
        expense: bucket.expense,
      })),
    };
  }

  async getTransactionsAnalytics(payload: unknown) {
    const record =
      !payload || typeof payload !== 'object' || Array.isArray(payload)
        ? ({} as Record<string, unknown>)
        : (payload as Record<string, unknown>);
    const userId = this.resolveUserId(this.readAuthorization(payload));

    const monthsRaw = Number(record.months ?? 6);
    const months = Math.min(
      Math.max(Number.isFinite(monthsRaw) ? Math.floor(monthsRaw) : 6, 1),
      24,
    );

    const now = new Date();
    const rangeStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1),
    );
    const rangeEnd = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
    );

    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        isIgnored: false,
        transactionDate: {
          gte: rangeStart,
          lt: rangeEnd,
        },
      },
      select: {
        id: true,
        transactionDate: true,
        description: true,
        type: true,
        amount: true,
        category: true,
      },
      orderBy: { transactionDate: 'desc' },
    });

    const monthLabels = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const monthly = new Map<
      string,
      { year: number; month: number; label: string; income: number; expense: number }
    >();
    for (let offset = months - 1; offset >= 0; offset -= 1) {
      const date = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1),
      );
      const year = date.getUTCFullYear();
      const month = date.getUTCMonth();
      monthly.set(`${year}-${month}`, {
        year,
        month,
        label: monthLabels[month],
        income: 0,
        expense: 0,
      });
    }

    const categoryTotals = new Map<string, number>();
    const merchantTotals = new Map<string, { total: number; count: number }>();
    const dayOfWeek = dayLabels.map((label) => ({ day: label, income: 0, expense: 0 }));

    let totalIncome = 0;
    let totalExpense = 0;
    let expenseCount = 0;
    const expenseList: Array<{
      id: string;
      transactionDate: string;
      description: string;
      amount: number;
      category: string | null;
    }> = [];

    transactions.forEach((transaction) => {
      const amount = this.amountToNumber(transaction.amount);
      const date = new Date(transaction.transactionDate);
      const key = `${date.getUTCFullYear()}-${date.getUTCMonth()}`;
      const bucket = monthly.get(key);
      const dow = dayOfWeek[date.getUTCDay()];

      if (transaction.type === TransType.CREDIT) {
        totalIncome += amount;
        if (bucket) bucket.income += amount;
        if (dow) dow.income += amount;
      } else {
        totalExpense += amount;
        expenseCount += 1;
        if (bucket) bucket.expense += amount;
        if (dow) dow.expense += amount;

        const categoryKey = (transaction.category?.trim() || 'Uncategorized');
        categoryTotals.set(
          categoryKey,
          (categoryTotals.get(categoryKey) ?? 0) + amount,
        );

        const merchant = this.extractMerchant(transaction.description);
        const existing = merchantTotals.get(merchant) ?? { total: 0, count: 0 };
        existing.total += amount;
        existing.count += 1;
        merchantTotals.set(merchant, existing);

        expenseList.push({
          id: transaction.id,
          transactionDate: date.toISOString(),
          description: transaction.description,
          amount,
          category: transaction.category,
        });
      }
    });

    const monthlyArray = Array.from(monthly.values()).map((bucket) => ({
      year: bucket.year,
      month: bucket.month + 1,
      label: bucket.label,
      income: bucket.income,
      expense: bucket.expense,
      net: bucket.income - bucket.expense,
    }));

    const totalCategoryAmount = Array.from(categoryTotals.values()).reduce(
      (sum, value) => sum + value,
      0,
    );
    const categories = Array.from(categoryTotals.entries())
      .map(([label, value]) => ({
        label,
        value,
        percentage: totalCategoryAmount > 0 ? value / totalCategoryAmount : 0,
      }))
      .sort((left, right) => right.value - left.value)
      .slice(0, 8);

    const merchants = Array.from(merchantTotals.entries())
      .map(([name, info]) => ({
        name,
        total: info.total,
        count: info.count,
        averageTicket: info.count > 0 ? info.total / info.count : 0,
      }))
      .sort((left, right) => right.total - left.total)
      .slice(0, 8);

    const largestExpenses = [...expenseList]
      .sort((left, right) => right.amount - left.amount)
      .slice(0, 5);

    const daysInRange = Math.max(
      1,
      Math.round((rangeEnd.getTime() - rangeStart.getTime()) / (24 * 60 * 60 * 1000)),
    );
    const avgDailySpend = totalExpense / daysInRange;
    const savingsRate = totalIncome > 0 ? (totalIncome - totalExpense) / totalIncome : 0;

    return {
      months,
      monthly: monthlyArray,
      categories,
      merchants,
      dayOfWeek,
      largestExpenses,
      totals: {
        income: totalIncome,
        expenses: totalExpense,
        net: totalIncome - totalExpense,
        savingsRate,
        avgDailySpend,
        transactionCount: transactions.length,
        expenseCount,
      },
    };
  }

  private extractMerchant(description: string): string {
    if (!description) {
      return 'Unknown';
    }

    const trimmed = description.trim();

    const ezMutasiMatch = trimmed.match(
      /TGL:\s*\d{1,2}\/\d{1,2}\s+QR\s+\d+\s+[\d.,]+([A-Za-z0-9][A-Za-z0-9 .,&'\-]*?)$/i,
    );
    if (ezMutasiMatch && ezMutasiMatch[1]) {
      return ezMutasiMatch[1].trim().toUpperCase().slice(0, 40);
    }

    const transferMatch = trimmed.match(
      /TRSF\s+[A-Z\- ]+?\s+(?:DB|CR)\s+[\d/A-Z]+\s+[A-Z0-9]+\s+(.+)$/i,
    );
    if (transferMatch && transferMatch[1]) {
      return transferMatch[1].trim().toUpperCase().slice(0, 40);
    }

    const tail = trimmed.split(/[\s,]+/).filter(Boolean);
    const meaningful = [...tail].reverse().filter((token) => /[A-Za-z]/.test(token));
    if (meaningful.length > 0) {
      return meaningful.slice(0, 3).reverse().join(' ').toUpperCase().slice(0, 40);
    }

    return trimmed.slice(0, 40).toUpperCase();
  }

  async getTransactionsSummary(payload: unknown) {
    const userId = this.resolveUserId(this.readAuthorization(payload));
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [balanceCredits, balanceDebits, monthlyCredits, monthlyDebits] =
      await Promise.all([
        this.prisma.transaction.aggregate({
          where: { userId, isIgnored: false, type: TransType.CREDIT },
          _sum: { amount: true },
        }),
        this.prisma.transaction.aggregate({
          where: { userId, isIgnored: false, type: TransType.DEBIT },
          _sum: { amount: true },
        }),
        this.prisma.transaction.aggregate({
          where: {
            userId,
            isIgnored: false,
            type: TransType.CREDIT,
            transactionDate: {
              gte: monthStart,
              lt: nextMonthStart,
            },
          },
          _sum: { amount: true },
        }),
        this.prisma.transaction.aggregate({
          where: {
            userId,
            isIgnored: false,
            type: TransType.DEBIT,
            transactionDate: {
              gte: monthStart,
              lt: nextMonthStart,
            },
          },
          _sum: { amount: true },
        }),
      ]);

    const goals = await this.getGoalsByUserId(userId);

    const totalBalance =
      this.amountToNumber(balanceCredits._sum.amount) -
      this.amountToNumber(balanceDebits._sum.amount);
    const monthlyIncome = this.amountToNumber(monthlyCredits._sum.amount);
    const monthlyExpenses = this.amountToNumber(monthlyDebits._sum.amount);
    const savingsAmount = monthlyIncome - monthlyExpenses;
    const totalGoalTarget = goals.reduce(
      (sum, goal) => sum + this.amountToNumber(goal.targetAmount),
      0,
    );
    const totalGoalCurrent = goals.reduce(
      (sum, goal) => sum + this.amountToNumber(goal.currentAmount),
      0,
    );

    return {
      totalBalance,
      monthlyIncome,
      monthlyExpenses,
      savingsOverview: {
        savingsAmount,
        savingsRate: monthlyIncome > 0 ? savingsAmount / monthlyIncome : 0,
        totalGoalTarget,
        totalGoalCurrent,
        goalCompletionRate:
          totalGoalTarget > 0 ? totalGoalCurrent / totalGoalTarget : 0,
      },
    };
  }

  async getTransactions(payload: unknown) {
    const { authorization, ...query } = this.normalizeQueryPayload(payload);
    const userId = this.resolveUserId(authorization);
    const page = this.toPositiveInteger(query.page, 1);
    const limit = Math.min(this.toPositiveInteger(query.limit, 10), 100);
    const where = this.buildTransactionWhere(userId, query);

    const [total, items] = await Promise.all([
      this.prisma.transaction.count({ where }),
      this.prisma.transaction.findMany({
        where,
        orderBy: { transactionDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: items.map((transaction) => this.mapTransaction(transaction)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async createTransaction(payload: unknown) {
    const parsedPayload = this.normalizeTransactionPayload(payload);
    const userId = this.resolveUserId(parsedPayload.authorization);
    const data = this.buildTransactionMutationData(parsedPayload, true);

    if (!data.transactionDate || !data.description || !data.type || !data.amount) {
      throw new BadRequestException('Missing required transaction fields');
    }

    const createData: Prisma.TransactionUncheckedCreateInput = {
      userId,
      transactionDate: data.transactionDate,
      description: data.description,
      type: data.type,
      amount: data.amount,
      category: data.category ?? null,
      isIgnored: data.isIgnored ?? false,
    };

    const transaction = await this.prisma.transaction.create({
      data: createData,
    });

    return this.mapTransaction(transaction);
  }

  async updateTransaction(payload: unknown) {
    const parsedPayload = this.normalizeTransactionPayload(payload);
    const userId = this.resolveUserId(parsedPayload.authorization);
    const id = this.toRequiredString(parsedPayload.id, 'Transaction id is required');
    const data = this.buildTransactionMutationData(parsedPayload, false);

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('No transaction fields were provided');
    }

    const updated = await this.prisma.transaction.updateMany({
      where: { id, userId },
      data,
    });

    if (updated.count === 0) {
      throw new NotFoundException('Transaction not found');
    }

    const transaction = await this.prisma.transaction.findFirst({
      where: { id, userId },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return this.mapTransaction(transaction);
  }

  async deleteTransaction(payload: unknown) {
    const parsedPayload = this.normalizeTransactionPayload(payload);
    const userId = this.resolveUserId(parsedPayload.authorization);
    const id = this.toRequiredString(parsedPayload.id, 'Transaction id is required');

    const deleted = await this.prisma.transaction.deleteMany({
      where: { id, userId },
    });

    if (deleted.count === 0) {
      throw new NotFoundException('Transaction not found');
    }

    return {
      deleted: true,
    };
  }

  async getGoals(payload: unknown) {
    const userId = this.resolveUserId(this.readAuthorization(payload));
    const goals = await this.getGoalsByUserId(userId);

    const mappedGoals = goals.map((goal) => this.mapGoal(goal));
    const totalTargetAmount = mappedGoals.reduce(
      (sum, goal) => sum + goal.targetAmount,
      0,
    );
    const totalCurrentAmount = mappedGoals.reduce(
      (sum, goal) => sum + goal.currentAmount,
      0,
    );

    return {
      data: mappedGoals,
      summary: {
        totalTargetAmount,
        totalCurrentAmount,
        completionRate:
          totalTargetAmount > 0 ? totalCurrentAmount / totalTargetAmount : 0,
      },
    };
  }

  async createGoal(payload: unknown) {
    const parsedPayload = this.normalizeGoalPayload(payload);
    const userId = this.resolveUserId(parsedPayload.authorization);
    const source = parsedPayload.goal ?? parsedPayload;

    const name = this.toRequiredString(
      source.name ?? (source as Record<string, unknown>).title,
      'Goal name is required',
    );
    const targetAmount = this.parseAmount(
      (source as Record<string, unknown>).targetAmount ??
        (source as Record<string, unknown>).target,
    );
    const currentAmountRaw =
      (source as Record<string, unknown>).currentAmount ??
      (source as Record<string, unknown>).current;
    const currentAmount =
      currentAmountRaw === undefined ? 0 : this.parseAmount(currentAmountRaw);

    if (targetAmount <= 0) {
      throw new BadRequestException('targetAmount must be greater than 0');
    }

    if (currentAmount < 0) {
      throw new BadRequestException('currentAmount must be zero or greater');
    }

    const delegate = this.getGoalDelegate();
    if (!delegate || typeof delegate.create !== 'function') {
      throw new BadRequestException('Goal storage is unavailable');
    }

    const goal = await delegate.create({
      data: {
        userId,
        name,
        targetAmount: new Prisma.Decimal(String(targetAmount)),
        currentAmount: new Prisma.Decimal(String(currentAmount)),
      },
    });

    return this.mapGoal(goal);
  }

  async updateGoal(payload: unknown) {
    const parsedPayload = this.normalizeGoalPayload(payload);
    const userId = this.resolveUserId(parsedPayload.authorization);
    const id = this.toRequiredString(parsedPayload.id, 'Goal id is required');
    const source = parsedPayload.goal ?? parsedPayload;

    const data: Record<string, unknown> = {};

    const nameValue =
      (source as Record<string, unknown>).name ??
      (source as Record<string, unknown>).title;
    if (nameValue !== undefined) {
      const name = String(nameValue).trim();
      if (!name) {
        throw new BadRequestException('Goal name cannot be empty');
      }
      data.name = name;
    }

    const targetValue =
      (source as Record<string, unknown>).targetAmount ??
      (source as Record<string, unknown>).target;
    if (targetValue !== undefined) {
      const targetAmount = this.parseAmount(targetValue);
      if (targetAmount <= 0) {
        throw new BadRequestException('targetAmount must be greater than 0');
      }
      data.targetAmount = new Prisma.Decimal(String(targetAmount));
    }

    const currentValue =
      (source as Record<string, unknown>).currentAmount ??
      (source as Record<string, unknown>).current;
    if (currentValue !== undefined) {
      const currentAmount = this.parseAmount(currentValue);
      if (currentAmount < 0) {
        throw new BadRequestException('currentAmount must be zero or greater');
      }
      data.currentAmount = new Prisma.Decimal(String(currentAmount));
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('No goal fields were provided');
    }

    const delegate = this.getGoalDelegate();
    if (!delegate || typeof delegate.updateMany !== 'function') {
      throw new BadRequestException('Goal storage is unavailable');
    }

    const updated = await delegate.updateMany({
      where: { id, userId },
      data,
    });

    if (updated.count === 0) {
      throw new NotFoundException('Goal not found');
    }

    const goal = await delegate.findFirst({ where: { id, userId } });
    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    return this.mapGoal(goal);
  }

  async deleteGoal(payload: unknown) {
    const parsedPayload = this.normalizeGoalPayload(payload);
    const userId = this.resolveUserId(parsedPayload.authorization);
    const id = this.toRequiredString(parsedPayload.id, 'Goal id is required');

    const delegate = this.getGoalDelegate();
    if (!delegate || typeof delegate.deleteMany !== 'function') {
      throw new BadRequestException('Goal storage is unavailable');
    }

    const deleted = await delegate.deleteMany({ where: { id, userId } });
    if (deleted.count === 0) {
      throw new NotFoundException('Goal not found');
    }

    return { deleted: true };
  }

  private normalizeGoalPayload(payload: unknown): {
    authorization?: string;
    id?: string;
    goal?: Record<string, unknown>;
    [key: string]: unknown;
  } {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new BadRequestException('Invalid goal payload');
    }

    return payload as {
      authorization?: string;
      id?: string;
      goal?: Record<string, unknown>;
    };
  }

  private normalizePayload(payload: unknown): UploadTransactionPayload {
    if (Array.isArray(payload)) {
      return { transactions: payload as UploadTransactionRow[] };
    }

    if (!payload || typeof payload !== 'object') {
      throw new BadRequestException('Invalid upload payload');
    }

    return payload as UploadTransactionPayload;
  }

  private normalizeQueryPayload(payload: unknown): TransactionListPayload {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new BadRequestException('Invalid transaction query payload');
    }

    return payload as TransactionListPayload;
  }

  private normalizeTransactionPayload(payload: unknown): TransactionPayload {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new BadRequestException('Invalid transaction payload');
    }

    return payload as TransactionPayload;
  }

  private readAuthorization(payload: unknown): string | undefined {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return undefined;
    }

    const record = payload as Record<string, unknown>;
    return this.toOptionalString(record.authorization ?? record.token);
  }

  private resolveUserId(token?: string): number {
    if (!token) {
      throw new UnauthorizedException('Missing authorization token');
    }

    const normalizedToken = token.startsWith('Bearer ')
      ? token.slice(7)
      : token;
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new UnauthorizedException('JWT secret is not configured');
    }

    const decoded = jwt.verify(normalizedToken, secret) as jwt.JwtPayload;
    const userId = Number(decoded.sub ?? decoded.userId ?? decoded.userid);

    if (!Number.isFinite(userId)) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return userId;
  }

  private buildTransactionWhere(userId: number, query: TransactionListPayload) {
    const where: Prisma.TransactionWhereInput = {
      userId,
    };

    const search = this.toOptionalString(query.search);
    const category = this.toOptionalString(query.category);
    const type = this.normalizeType(query.type);
    const from = this.parseDate(query.from);
    const to = this.parseDate(query.to);

    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = { contains: category, mode: 'insensitive' };
    }

    if (type) {
      where.type = type;
    }

    if (from || to) {
      where.transactionDate = {} as Prisma.DateTimeFilter;

      if (from) {
        where.transactionDate.gte = from;
      }

      if (to) {
        const inclusiveTo = new Date(to);
        inclusiveTo.setHours(23, 59, 59, 999);
        where.transactionDate.lte = inclusiveTo;
      }
    }

    return where;
  }

  private buildTransactionMutationData(
    payload: TransactionPayload,
    requireAllFields: boolean,
  ): TransactionMutationData {
    const source = payload.transaction ?? payload;
    const data: TransactionMutationData = {};

    const transactionDateValue =
      source.transactionDate ?? source.date ?? source.transaction_date;
    if (transactionDateValue !== undefined) {
      const transactionDate = this.parseTransactionDate(transactionDateValue);
      if (!transactionDate) {
        throw new BadRequestException('Invalid transaction date');
      }
      data.transactionDate = transactionDate;
    } else if (requireAllFields) {
      throw new BadRequestException('transactionDate is required');
    }

    const descriptionValue =
      source.description ?? source.Description ?? source.keterangan ?? source.remark;
    if (descriptionValue !== undefined) {
      const description = String(descriptionValue).trim();
      if (!description) {
        throw new BadRequestException('description is required');
      }
      data.description = description;
    } else if (requireAllFields) {
      throw new BadRequestException('description is required');
    }

    const typeValue = source.type ?? source.Type ?? source.transType;
    if (typeValue !== undefined) {
      data.type = this.normalizeRequiredType(typeValue);
    } else if (requireAllFields) {
      throw new BadRequestException('type is required');
    }

    const amountValue = source.amount ?? source.Amount ?? source.nominal;
    if (amountValue !== undefined) {
      const amount = this.parseAmount(amountValue);
      if (amount <= 0) {
        throw new BadRequestException('amount must be greater than 0');
      }
      data.amount = new Prisma.Decimal(String(amount));
    } else if (requireAllFields) {
      throw new BadRequestException('amount is required');
    }

    const categoryValue =
      source.category ?? source.Category ?? source.kategori ?? source.group;
    if (categoryValue !== undefined) {
      data.category = this.toOptionalString(categoryValue) ?? null;
    }

    const isIgnoredValue =
      source.isIgnored ?? source.ignored ?? source.IsIgnored ?? source.is_ignored;
    if (isIgnoredValue !== undefined) {
      data.isIgnored = this.toBoolean(isIgnoredValue);
    }

    return data;
  }

  private normalizeRequiredType(value: unknown): TransType {
    if (typeof value === 'string') {
      const normalized = value.trim().toUpperCase();
      if (normalized === 'DEBIT' || normalized === 'CREDIT') {
        return normalized as TransType;
      }
    }

    throw new BadRequestException('type must be DEBIT or CREDIT');
  }

  private normalizeType(value: unknown): TransType | undefined {
    if (typeof value === 'string') {
      const normalized = value.trim().toUpperCase();
      if (normalized === 'DEBIT' || normalized === 'CREDIT') {
        return normalized as TransType;
      }
    }

    return undefined;
  }

  private parseAmount(value: unknown): number {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : 0;
    }

    if (typeof value === 'string') {
      const normalized = value.replace(/[^0-9.-]/g, '');
      const parsed = Number(normalized);
      return Number.isFinite(parsed) ? parsed : 0;
    }

    return 0;
  }

  private parseDate(value: unknown): Date | undefined {
    const parsedDate = this.parseTransactionDate(value);
    return parsedDate ?? undefined;
  }

  private toPositiveInteger(value: unknown, fallback: number): number {
    const parsed = Number(value);

    if (!Number.isFinite(parsed) || parsed < 1) {
      return fallback;
    }

    return Math.floor(parsed);
  }

  private toRequiredString(value: unknown, message: string): string {
    const parsed = this.toOptionalString(value);
    if (!parsed) {
      throw new BadRequestException(message);
    }

    return parsed;
  }

  private mapTransaction(transaction: {
    id: string;
    userId: number;
    transactionDate: Date;
    description: string;
    type: TransType;
    amount: DecimalLike;
    category: string | null;
    isIgnored: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): TransactionResponse {
    return {
      id: transaction.id,
      userId: transaction.userId,
      transactionDate: transaction.transactionDate.toISOString(),
      description: transaction.description,
      type: transaction.type,
      amount: this.amountToNumber(transaction.amount),
      category: transaction.category,
      isIgnored: transaction.isIgnored,
      createdAt: transaction.createdAt.toISOString(),
      updatedAt: transaction.updatedAt.toISOString(),
    };
  }

  private mapGoal(goal: {
    id: string;
    userId: number;
    name: string;
    targetAmount: DecimalLike;
    currentAmount: DecimalLike;
    createdAt: Date;
    updatedAt: Date;
  }): GoalResponse {
    const targetAmount = this.amountToNumber(goal.targetAmount);
    const currentAmount = this.amountToNumber(goal.currentAmount);

    return {
      id: goal.id,
      userId: goal.userId,
      name: goal.name,
      targetAmount,
      currentAmount,
      completionRate: targetAmount > 0 ? currentAmount / targetAmount : 0,
      createdAt: goal.createdAt.toISOString(),
      updatedAt: goal.updatedAt.toISOString(),
    };
  }

  private amountToNumber(value: DecimalLike): number {
    if (value === null || value === undefined) {
      return 0;
    }

    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : 0;
    }

    const parsed = Number(value.toString());
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private getGoalDelegate() {
    return (this.prisma as unknown as { goal: any }).goal;
  }

  private async getGoalsByUserId(userId: number) {
    const delegate = this.getGoalDelegate();

    if (delegate && typeof delegate.findMany === 'function') {
      return delegate.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
    }

    return this.prisma.$queryRaw<
      Array<{
        id: string;
        userId: number;
        name: string;
        targetAmount: Prisma.Decimal;
        currentAmount: Prisma.Decimal;
        createdAt: Date;
        updatedAt: Date;
      }>
    >`
      SELECT
        "id",
        "userId",
        "name",
        "targetAmount",
        "currentAmount",
        "createdAt",
        "updatedAt"
      FROM "Goal"
      WHERE "userId" = ${userId}
      ORDER BY "createdAt" DESC
    `;
  }

  private normalizeTransactions(
    transactions: UploadTransactionRow[] | undefined,
    userId: number,
    yearOverride?: number,
    dateFormat?: DateFormat,
  ): Prisma.TransactionCreateManyInput[] {
    if (!Array.isArray(transactions)) {
      throw new BadRequestException('transactions must be an array');
    }

    return transactions
      .map((transaction) =>
        this.normalizeTransaction(transaction, userId, yearOverride, dateFormat),
      )
      .filter((transaction): transaction is Prisma.TransactionCreateManyInput =>
        Boolean(transaction),
      );
  }

  private normalizeTransaction(
    transaction: UploadTransactionRow,
    userId: number,
    yearOverride?: number,
    dateFormat?: DateFormat,
  ): Prisma.TransactionCreateManyInput | null {
    const transactionDateValue =
      transaction.transactionDate ??
      transaction.date ??
      transaction.transaction_date ??
      transaction.tanggal;
    const descriptionValue =
      transaction.description ??
      transaction.Description ??
      transaction.keterangan ??
      transaction.remark;
    const typeValue = transaction.type ?? transaction.Type ?? transaction.transType;
    const amountValue = this.resolveAmount(transaction);

    if (!transactionDateValue || !descriptionValue || !amountValue) {
      return null;
    }

    const description = String(descriptionValue).trim();

    if (!description) {
      return null;
    }

    const transactionDate = this.parseTransactionDate(
      transactionDateValue,
      yearOverride,
      dateFormat,
    );

    if (!transactionDate) {
      return null;
    }

    return {
      userId,
      transactionDate,
      description,
      type: this.resolveType(transaction, typeValue, amountValue),
      amount: new Prisma.Decimal(String(amountValue)),
      category:
        this.toOptionalString(
          transaction.category ?? transaction.Category ?? transaction.kategori,
        ) ?? null,
      isIgnored: this.toBoolean(
        transaction.isIgnored ?? transaction.ignored ?? transaction.IsIgnored,
      ),
    };
  }

  private resolveType(
    transaction: UploadTransactionRow,
    typeValue: unknown,
    amountValue: number,
  ): TransType {
    if (typeof typeValue === 'string') {
      const normalizedType = typeValue.trim().toUpperCase();

      if (normalizedType === 'DEBIT' || normalizedType === 'CREDIT') {
        return normalizedType as TransType;
      }
    }

    const debitAmount = this.toNumber(
      transaction.debit ?? transaction.Debit ?? transaction.debitAmount,
    );
    const creditAmount = this.toNumber(
      transaction.credit ?? transaction.Credit ?? transaction.creditAmount,
    );

    if (creditAmount > 0 && debitAmount <= 0) {
      return TransType.CREDIT;
    }

    if (debitAmount > 0 || amountValue < 0) {
      return TransType.DEBIT;
    }

    return TransType.CREDIT;
  }

  private resolveAmount(transaction: UploadTransactionRow): number | null {
    const amountValue = this.toNumber(
      transaction.amount ?? transaction.Amount ?? transaction.nominal,
    );

    if (amountValue > 0) {
      return amountValue;
    }

    const debitAmount = this.toNumber(
      transaction.debit ?? transaction.Debit ?? transaction.debitAmount,
    );

    if (debitAmount > 0) {
      return debitAmount;
    }

    const creditAmount = this.toNumber(
      transaction.credit ?? transaction.Credit ?? transaction.creditAmount,
    );

    if (creditAmount > 0) {
      return creditAmount;
    }

    return null;
  }

  private parseTransactionDate(
    value: unknown,
    yearOverride?: number,
    dateFormat?: DateFormat,
  ): Date | null {
    if (
      yearOverride !== undefined &&
      typeof value === 'string' &&
      /^\d{1,2}[\/\-.]\d{1,2}$/.test(value.trim())
    ) {
      const monthDay = this.parseMonthDayWithYear(value, yearOverride, dateFormat);
      if (monthDay) {
        return monthDay;
      }
    }

    const parsed = this.parseDateValue(value);

    if (!parsed) {
      if (yearOverride !== undefined && typeof value === 'string') {
        return this.parseMonthDayWithYear(value, yearOverride, dateFormat);
      }
      return null;
    }

    if (yearOverride !== undefined) {
      return new Date(
        Date.UTC(
          yearOverride,
          parsed.getUTCMonth(),
          parsed.getUTCDate(),
          parsed.getUTCHours(),
          parsed.getUTCMinutes(),
          parsed.getUTCSeconds(),
        ),
      );
    }

    return parsed;
  }

  private parseDateValue(value: unknown): Date | null {
    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value;
    }

    if (typeof value === 'number') {
      return this.parseExcelSerialDate(value);
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();

      if (!trimmed) {
        return null;
      }

      const numericValue = Number(trimmed);
      if (Number.isFinite(numericValue) && /^\d+(\.\d+)?$/.test(trimmed)) {
        const excelDate = this.parseExcelSerialDate(numericValue);
        if (excelDate) {
          return excelDate;
        }
      }

      const parsedDate = new Date(trimmed);
      return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
    }

    return null;
  }

  private parseMonthDayWithYear(
    value: string,
    year: number,
    dateFormat?: DateFormat,
  ): Date | null {
    const match = value.trim().match(/^(\d{1,2})[\/\-.](\d{1,2})$/);
    if (!match) {
      return null;
    }

    const first = Number(match[1]);
    const second = Number(match[2]);

    let day: number;
    let month: number;

    if (dateFormat === 'DMY') {
      day = first;
      month = second;
    } else if (dateFormat === 'MDY') {
      month = first;
      day = second;
    } else if (first > 12) {
      day = first;
      month = second;
    } else if (second > 12) {
      month = first;
      day = second;
    } else {
      day = first;
      month = second;
    }

    if (
      !Number.isFinite(day) ||
      !Number.isFinite(month) ||
      month < 1 ||
      month > 12 ||
      day < 1 ||
      day > 31
    ) {
      return null;
    }

    const parsed = new Date(Date.UTC(year, month - 1, day));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private parseDateFormat(value: unknown): DateFormat | undefined {
    if (typeof value !== 'string') {
      return undefined;
    }

    const normalized = value.trim().toUpperCase();
    if (normalized === 'DMY' || normalized === 'DD/MM' || normalized === 'DDMM') {
      return 'DMY';
    }
    if (normalized === 'MDY' || normalized === 'MM/DD' || normalized === 'MMDD') {
      return 'MDY';
    }

    return undefined;
  }

  private parseYearOverride(value: unknown): number | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 1900 || parsed > 2999) {
      return undefined;
    }

    return Math.floor(parsed);
  }

  private parseExcelSerialDate(serial: number): Date | null {
    if (!Number.isFinite(serial)) {
      return null;
    }

    const excelEpoch = Date.UTC(1899, 11, 30);
    const parsedDate = new Date(excelEpoch + serial * 24 * 60 * 60 * 1000);

    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  }

  private toNumber(value: unknown): number {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : 0;
    }

    if (typeof value === 'string') {
      const normalized = value.replace(/[^0-9.-]/g, '');
      const parsed = Number(normalized);

      return Number.isFinite(parsed) ? parsed : 0;
    }

    return 0;
  }

  private toBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'string') {
      return ['true', '1', 'yes', 'y'].includes(value.trim().toLowerCase());
    }

    if (typeof value === 'number') {
      return value !== 0;
    }

    return false;
  }

  private toOptionalString(value: unknown): string | undefined {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }

    return undefined;
  }
}
