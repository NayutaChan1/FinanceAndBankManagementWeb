import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma, TransType } from '@prisma/client';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service';

type UploadTransactionRow = Record<string, unknown>;

type UploadTransactionPayload = {
  authorization?: string;
  token?: string;
  transactions?: UploadTransactionRow[];
};

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  getHello(): string {
    return 'Hello World!';
  }

  async uploadTransactions(payload: unknown) {
    const { authorization, token, transactions } = this.normalizePayload(payload);
    const userId = this.resolveUserId(authorization ?? token);
    const normalizedTransactions = this.normalizeTransactions(transactions, userId);

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

  private normalizePayload(payload: unknown): UploadTransactionPayload {
    if (Array.isArray(payload)) {
      return { transactions: payload as UploadTransactionRow[] };
    }

    if (!payload || typeof payload !== 'object') {
      throw new BadRequestException('Invalid upload payload');
    }

    return payload as UploadTransactionPayload;
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

  private normalizeTransactions(
    transactions: UploadTransactionRow[] | undefined,
    userId: number,
  ): Prisma.TransactionCreateManyInput[] {
    if (!Array.isArray(transactions)) {
      throw new BadRequestException('transactions must be an array');
    }

    return transactions
      .map((transaction) => this.normalizeTransaction(transaction, userId))
      .filter((transaction): transaction is Prisma.TransactionCreateManyInput =>
        Boolean(transaction),
      );
  }

  private normalizeTransaction(
    transaction: UploadTransactionRow,
    userId: number,
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

    const transactionDate = this.parseTransactionDate(transactionDateValue);

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

  private parseTransactionDate(value: unknown): Date | null {
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
