const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5555';

export type TransactionType = 'DEBIT' | 'CREDIT';

export interface TransactionRecord {
  id: string;
  userId: number;
  transactionDate: string;
  description: string;
  type: TransactionType;
  amount: number;
  category: string | null;
  isIgnored: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GoalRecord {
  id: string;
  userId: number;
  name: string;
  targetAmount: number;
  currentAmount: number;
  completionRate: number;
  createdAt: string;
  updatedAt: string;
}

export interface TrendPoint {
  year: number;
  month: number;
  label: string;
  income: number;
  expense: number;
}

export interface TrendResponse {
  data: TrendPoint[];
}

export interface AnalyticsMonthly {
  year: number;
  month: number;
  label: string;
  income: number;
  expense: number;
  net: number;
}

export interface AnalyticsCategory {
  label: string;
  value: number;
  percentage: number;
}

export interface AnalyticsMerchant {
  name: string;
  total: number;
  count: number;
  averageTicket: number;
}

export interface AnalyticsDay {
  day: string;
  income: number;
  expense: number;
}

export interface AnalyticsLargestExpense {
  id: string;
  transactionDate: string;
  description: string;
  amount: number;
  category: string | null;
}

export interface AnalyticsResponse {
  months: number;
  monthly: AnalyticsMonthly[];
  categories: AnalyticsCategory[];
  merchants: AnalyticsMerchant[];
  dayOfWeek: AnalyticsDay[];
  largestExpenses: AnalyticsLargestExpense[];
  totals: {
    income: number;
    expenses: number;
    net: number;
    savingsRate: number;
    avgDailySpend: number;
    transactionCount: number;
    expenseCount: number;
  };
}

export interface SummaryResponse {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsOverview: {
    savingsAmount: number;
    savingsRate: number;
    totalGoalTarget: number;
    totalGoalCurrent: number;
    goalCompletionRate: number;
  };
}

export interface TransactionListResponse {
  data: TransactionRecord[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface GoalListResponse {
  data: GoalRecord[];
  summary: {
    totalTargetAmount: number;
    totalCurrentAmount: number;
    completionRate: number;
  };
}

export interface TransactionPayload {
  transactionDate: string;
  description: string;
  type: TransactionType;
  amount: number;
  category?: string;
  isIgnored?: boolean;
}

export interface GoalPayload {
  name: string;
  targetAmount: number;
  currentAmount?: number;
}

export interface TransactionQuery {
  search?: string;
  category?: string;
  type?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

async function requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const headers = new Headers(init.headers ?? {});
  const hasBody = init.body !== undefined && init.body !== null;

  if (hasBody && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/';
    throw new Error('Session expired');
  }

  if (!response.ok) {
    const errorMessage = await readErrorMessage(response);
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

async function readErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as { message?: string | string[] };
    if (Array.isArray(payload.message)) {
      return payload.message.join(', ');
    }
    if (payload.message) {
      return payload.message;
    }
  } catch {
    // Fallback to plain text below.
  }

  return response.statusText || 'Request failed';
}

function buildQueryString(query: TransactionQuery = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

export const financeApi = {
  getSummary() {
    return requestJson<SummaryResponse>('/transactions/summary');
  },
  getTrend(months = 6) {
    return requestJson<TrendResponse>(`/transactions/trend?months=${months}`);
  },
  getAnalytics(months = 6) {
    return requestJson<AnalyticsResponse>(`/transactions/analytics?months=${months}`);
  },
  getTransactions(query?: TransactionQuery) {
    return requestJson<TransactionListResponse>(`/transactions${buildQueryString(query)}`);
  },
  createTransaction(payload: TransactionPayload) {
    return requestJson<TransactionRecord>('/transactions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  updateTransaction(id: string, payload: Partial<TransactionPayload>) {
    return requestJson<TransactionRecord>(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  deleteTransaction(id: string) {
    return requestJson<{ deleted: boolean }>(`/transactions/${id}`, {
      method: 'DELETE',
    });
  },
  getGoals() {
    return requestJson<GoalListResponse>('/goals');
  },
  createGoal(payload: GoalPayload) {
    return requestJson<GoalRecord>('/goals', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  updateGoal(id: string, payload: Partial<GoalPayload>) {
    return requestJson<GoalRecord>(`/goals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  deleteGoal(id: string) {
    return requestJson<{ deleted: boolean }>(`/goals/${id}`, {
      method: 'DELETE',
    });
  },
};

export function formatMoney(value: number) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}