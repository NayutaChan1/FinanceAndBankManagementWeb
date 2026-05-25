import { useEffect, useState } from 'react';
import Sidebar from '../Component/Sidebar';
import '../Css/FinancialDashboard.css';
import {
  financeApi,
  formatDate,
  formatMoney,
  type AnalyticsResponse,
} from '../services/financeApi';

const CATEGORY_PALETTE = ['#5bd6ff', '#7cda7b', '#f97316', '#a78bfa', '#f43f5e', '#fbbf24', '#34d399', '#60a5fa'];

const RANGE_OPTIONS = [3, 6, 12];

function AnalyticsPage() {
  const [months, setMonths] = useState(6);
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isActive = true;

    const loadAnalytics = async () => {
      setIsLoading(true);
      setError('');
      try {
        const response = await financeApi.getAnalytics(months);
        if (!isActive) return;
        setAnalytics(response);
      } catch (loadError) {
        if (!isActive) return;
        const message = loadError instanceof Error ? loadError.message : 'Failed to load analytics';
        setError(message);
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    void loadAnalytics();
    return () => {
      isActive = false;
    };
  }, [months]);

  const hasData = !!analytics && analytics.totals.transactionCount > 0;

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <Sidebar activeMenu="analytics" />

        <main className="main-content">
          <header className="page-header">
            <div className="page-heading">
              <h1 className="page-title">Analytics</h1>
              <p className="page-subtitle">
                Spending patterns, top merchants, and cash-flow rhythm across your transactions.
              </p>
            </div>
            <div className="toolbar">
              <div className="range-toggle">
                {RANGE_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`range-toggle-option ${option === months ? 'active' : ''}`}
                    onClick={() => setMonths(option)}
                  >
                    {option}M
                  </button>
                ))}
              </div>
            </div>
          </header>

          {error ? <div className="empty-state">{error}</div> : null}

          {isLoading ? (
            <div className="loading-state">Loading analytics...</div>
          ) : !hasData || !analytics ? (
            <div className="empty-state">No transactions in the last {months} months yet. Upload a statement to generate charts.</div>
          ) : (
            <>
              <section className="kpi-grid">
                <KpiCard label="Total Income" value={formatMoney(analytics.totals.income)} tone="positive" detail={`${analytics.totals.transactionCount} transactions`} />
                <KpiCard label="Total Expenses" value={formatMoney(analytics.totals.expenses)} tone="negative" detail={`${analytics.totals.expenseCount} debits`} />
                <KpiCard label="Net Movement" value={formatMoney(analytics.totals.net)} tone={analytics.totals.net >= 0 ? 'positive' : 'negative'} detail="Income minus expenses" />
                <KpiCard label="Savings Rate" value={`${Math.round(analytics.totals.savingsRate * 100)}%`} tone={analytics.totals.savingsRate >= 0 ? 'neutral' : 'negative'} detail="Share of income kept" />
                <KpiCard label="Avg Daily Spend" value={formatMoney(analytics.totals.avgDailySpend)} tone="neutral" detail={`Over ~${months * 30} days`} />
              </section>

              <section className="analytics-grid">
                <article className="analytics-card chart-panel">
                  <div className="section-header">
                    <div>
                      <h2 className="section-title">Monthly Cash Flow</h2>
                      <p className="section-subtitle">Income, expenses, and net movement across the range.</p>
                    </div>
                    <div className="chart-legend-inline">
                      <span className="legend-dot legend-income" />
                      <span>Income</span>
                      <span className="legend-dot legend-expense" />
                      <span>Expense</span>
                    </div>
                  </div>
                  <MonthlyBarsChart monthly={analytics.monthly} />
                </article>

                <article className="analytics-card">
                  <div className="section-header">
                    <div>
                      <h2 className="section-title">Spending by Category</h2>
                      <p className="section-subtitle">Where your money goes when categories are set.</p>
                    </div>
                  </div>
                  <CategoryBreakdown categories={analytics.categories} />
                </article>
              </section>

              <section className="analytics-grid">
                <article className="analytics-card">
                  <div className="section-header">
                    <div>
                      <h2 className="section-title">Top Merchants</h2>
                      <p className="section-subtitle">Inferred from transaction descriptions.</p>
                    </div>
                  </div>
                  {analytics.merchants.length === 0 ? (
                    <div className="empty-state">No expenses to rank yet.</div>
                  ) : (
                    <div className="merchant-list">
                      {analytics.merchants.map((merchant, index) => (
                        <div className="merchant-row" key={`${merchant.name}-${index}`}>
                          <div className="merchant-rank">#{index + 1}</div>
                          <div className="merchant-info">
                            <strong title={merchant.name}>{merchant.name}</strong>
                            <span>
                              {merchant.count} {merchant.count === 1 ? 'visit' : 'visits'} · avg {formatMoney(merchant.averageTicket)}
                            </span>
                          </div>
                          <div className="merchant-total">{formatMoney(merchant.total)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </article>

                <article className="analytics-card">
                  <div className="section-header">
                    <div>
                      <h2 className="section-title">Spend by Day of Week</h2>
                      <p className="section-subtitle">When you tend to spend the most.</p>
                    </div>
                  </div>
                  <DayOfWeekChart days={analytics.dayOfWeek} />
                </article>
              </section>

              <section>
                <article className="analytics-card">
                  <div className="section-header">
                    <div>
                      <h2 className="section-title">Largest Expenses</h2>
                      <p className="section-subtitle">The biggest debits in this range.</p>
                    </div>
                  </div>
                  {analytics.largestExpenses.length === 0 ? (
                    <div className="empty-state">No expenses to highlight.</div>
                  ) : (
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Description</th>
                            <th>Category</th>
                            <th style={{ textAlign: 'right' }}>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analytics.largestExpenses.map((expense) => (
                            <tr key={expense.id}>
                              <td>{formatDate(expense.transactionDate)}</td>
                              <td title={expense.description}>
                                {expense.description.length > 80
                                  ? `${expense.description.slice(0, 80)}…`
                                  : expense.description}
                              </td>
                              <td>{expense.category ?? '—'}</td>
                              <td className="amount-negative" style={{ textAlign: 'right' }}>
                                -{formatMoney(expense.amount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </article>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail?: string;
  tone: 'positive' | 'negative' | 'neutral';
}) {
  const toneClass = tone === 'positive' ? 'amount-positive' : tone === 'negative' ? 'amount-negative' : '';
  return (
    <article className="summary-card stat-card">
      <span className="summary-label">{label}</span>
      <strong className={`summary-value ${toneClass}`}>{value}</strong>
      <span className="summary-detail">{detail}</span>
    </article>
  );
}

function MonthlyBarsChart({ monthly }: { monthly: AnalyticsResponse['monthly'] }) {
  const width = 860;
  const height = 320;
  const padding = { left: 60, right: 24, top: 24, bottom: 40 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const maxValue = Math.max(
    1,
    ...monthly.flatMap((point) => [point.income, point.expense]),
  );
  const groupWidth = innerWidth / Math.max(1, monthly.length);
  const barWidth = Math.min(28, groupWidth * 0.35);
  const barGap = 4;

  const scaleY = (value: number) => padding.top + innerHeight - (value / maxValue) * innerHeight;

  const linePath = monthly
    .map((point, index) => {
      const x = padding.left + groupWidth * index + groupWidth / 2;
      const y = scaleY(point.net >= 0 ? point.net : 0);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  return (
    <svg className="trend-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Monthly cash flow chart">
      <defs>
        <linearGradient id="analyticsIncomeBar" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#7cda7b" />
          <stop offset="100%" stopColor="rgba(124, 218, 123, 0.3)" />
        </linearGradient>
        <linearGradient id="analyticsExpenseBar" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="rgba(239, 68, 68, 0.3)" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width={width} height={height} rx="22" fill="rgba(8,15,31,0.45)" />

      {[0.25, 0.5, 0.75, 1].map((ratio) => (
        <line
          key={ratio}
          x1={padding.left}
          x2={width - padding.right}
          y1={padding.top + innerHeight * ratio}
          y2={padding.top + innerHeight * ratio}
          stroke="rgba(148,163,184,0.12)"
        />
      ))}

      {monthly.map((point, index) => {
        const groupX = padding.left + groupWidth * index;
        const centerX = groupX + groupWidth / 2;
        const incomeHeight = (point.income / maxValue) * innerHeight;
        const expenseHeight = (point.expense / maxValue) * innerHeight;
        return (
          <g key={`${point.year}-${point.month}`}>
            <rect
              x={centerX - barWidth - barGap / 2}
              y={padding.top + innerHeight - incomeHeight}
              width={barWidth}
              height={Math.max(0, incomeHeight)}
              rx="6"
              fill="url(#analyticsIncomeBar)"
            />
            <rect
              x={centerX + barGap / 2}
              y={padding.top + innerHeight - expenseHeight}
              width={barWidth}
              height={Math.max(0, expenseHeight)}
              rx="6"
              fill="url(#analyticsExpenseBar)"
            />
            <text x={centerX} y={height - 14} textAnchor="middle" fill="#8ea0b6" fontSize="13">
              {point.label}
            </text>
          </g>
        );
      })}

      <path d={linePath} fill="none" stroke="rgba(165,180,252,0.7)" strokeWidth="2" strokeDasharray="6 4" />
    </svg>
  );
}

function CategoryBreakdown({ categories }: { categories: AnalyticsResponse['categories'] }) {
  if (categories.length === 0) {
    return <div className="empty-state">No expense categories yet — categorize transactions to populate this chart.</div>;
  }

  const total = categories.reduce((sum, item) => sum + item.value, 0) || 1;
  const gradient = `conic-gradient(${categories
    .map((slice, index) => {
      const start = categories.slice(0, index).reduce((sum, item) => sum + item.value, 0);
      const startPercent = (start / total) * 100;
      const endPercent = ((start + slice.value) / total) * 100;
      const color = CATEGORY_PALETTE[index % CATEGORY_PALETTE.length];
      return `${color} ${startPercent}% ${endPercent}%`;
    })
    .join(', ')})`;

  return (
    <>
      <div className="pie-chart-wrap">
        <div className="pie-chart" style={{ background: gradient }}>
          <div className="pie-chart-center">
            <strong>{formatMoney(total)}</strong>
            <span>Spent</span>
          </div>
        </div>
      </div>
      <div className="stacked-list">
        {categories.map((slice, index) => (
          <div key={slice.label} className="stacked-item">
            <div className="merchant-info">
              <strong>{slice.label}</strong>
              <span>{formatMoney(slice.value)}</span>
            </div>
            <span className="pill" style={{ color: CATEGORY_PALETTE[index % CATEGORY_PALETTE.length] }}>
              {Math.round(slice.percentage * 100)}%
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

function DayOfWeekChart({ days }: { days: AnalyticsResponse['dayOfWeek'] }) {
  const maxValue = Math.max(1, ...days.map((day) => day.expense));

  return (
    <div className="day-of-week-grid">
      {days.map((day) => {
        const ratio = day.expense / maxValue;
        return (
          <div key={day.day} className="day-of-week-cell">
            <div className="day-of-week-bar-wrap">
              <div
                className="day-of-week-bar"
                style={{ height: `${Math.max(4, ratio * 100)}%` }}
                title={`${formatMoney(day.expense)} spent`}
              />
            </div>
            <span className="day-of-week-label">{day.day}</span>
            <span className="day-of-week-value">{formatMoney(day.expense)}</span>
          </div>
        );
      })}
    </div>
  );
}

export default AnalyticsPage;
