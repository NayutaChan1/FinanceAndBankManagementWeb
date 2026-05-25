import { useEffect, useMemo, useState } from "react";
import Sidebar from "../Component/Sidebar";
import "../Css/FinancialDashboard.css";
import {
  financeApi,
  formatMoney,
  type SummaryResponse,
  type TrendPoint,
} from "../services/financeApi";

function readStoredUser(): { username?: string; email?: string } | null {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    return JSON.parse(raw) as { username?: string; email?: string };
  } catch {
    return null;
  }
}

function DashboardPage() {
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const storedUser = useMemo(readStoredUser, []);
  const displayName = storedUser?.username || storedUser?.email || "Dashboard User";
  const initials = (displayName.match(/\b\w/g) ?? []).slice(0, 2).join("").toUpperCase() || "U";

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      setIsLoading(true);
      setError("");

      try {
        const [summaryResponse, trendResponse] = await Promise.all([
          financeApi.getSummary(),
          financeApi.getTrend(6),
        ]);

        if (!isMounted) {
          return;
        }

        setSummary(summaryResponse);
        setTrend(trendResponse.data);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        const message =
          loadError instanceof Error ? loadError.message : "Failed to load dashboard";
        setError(message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  const monthlyTrend = trend;
  const chartMax = Math.max(
    1,
    ...monthlyTrend.flatMap((point) => [point.income, point.expense]),
  );
  const linePath = (key: "income" | "expense") =>
    buildLinePath(monthlyTrend, key, chartMax);

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <Sidebar activeMenu="dashboard" />

        <div className="main-content">
          <header className="dashboard-header">
            <div className="header-left">
              <h1>Financial Dashboard</h1>
              <p className="header-copy">
                Track balance, cash flow, and savings targets from one place.
              </p>
            </div>
            <div className="header-right">
              <div className="user-profile">
                <div className="user-avatar user-avatar-initials">{initials}</div>
                <div className="user-info">
                  <span>{displayName}</span>
                  <span>{storedUser?.email ?? "Financial overview"}</span>
                </div>
              </div>
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </div>
          </header>

          <section className="summary-grid">
            <StatCard
              label="Total Balance"
              value={summary?.totalBalance ?? 0}
              tone="balance"
              detail="Across all transactions"
            />
            <StatCard
              label="Monthly Income"
              value={summary?.monthlyIncome ?? 0}
              tone="income"
              detail="Credits this month"
            />
            <StatCard
              label="Monthly Expenses"
              value={summary?.monthlyExpenses ?? 0}
              tone="expense"
              detail="Debits this month"
            />
            <StatCard
              label="Savings This Month"
              value={summary?.savingsOverview.savingsAmount ?? 0}
              tone="neutral"
              detail={`${Math.round((summary?.savingsOverview.savingsRate ?? 0) * 100)}% of income saved`}
            />
          </section>

          {error ? <div className="empty-state">{error}</div> : null}

          <section className="dashboard-grid">
            <div className="chart-panel">
              <div className="panel-header">
                <div>
                  <h2 className="panel-title">Cash Flow Trend</h2>
                  <p className="panel-subtitle">
                    Income and expenses across the last six months.
                  </p>
                </div>
                <div className="chart-legend-inline">
                  <span className="legend-dot legend-income" />
                  <span>Income</span>
                  <span className="legend-dot legend-expense" />
                  <span>Expense</span>
                </div>
              </div>

              {isLoading ? (
                <div className="loading-state">Loading chart data...</div>
              ) : monthlyTrend.every((p) => p.income === 0 && p.expense === 0) ? (
                <div className="empty-state">No transactions in the last 6 months yet.</div>
              ) : (
                <div className="chart-frame">
                  <svg
                    className="trend-chart"
                    viewBox="0 0 860 320"
                    role="img"
                    aria-label="Monthly cash flow chart"
                  >
                    <defs>
                      <linearGradient id="incomeLine" x1="0" x2="1" y1="0" y2="0">
                        <stop offset="0%" stopColor="#7cda7b" />
                        <stop offset="100%" stopColor="#5bd6ff" />
                      </linearGradient>
                      <linearGradient id="expenseLine" x1="0" x2="1" y1="0" y2="0">
                        <stop offset="0%" stopColor="#f97316" />
                        <stop offset="100%" stopColor="#ef4444" />
                      </linearGradient>
                    </defs>
                    <rect
                      x="0"
                      y="0"
                      width="860"
                      height="320"
                      rx="22"
                      fill="rgba(8,15,31,0.45)"
                    />
                    {buildGridLines(860, 320).map((line) => (
                      <line
                        key={line.key}
                        x1={line.x1}
                        y1={line.y1}
                        x2={line.x2}
                        y2={line.y2}
                        stroke="rgba(148,163,184,0.12)"
                      />
                    ))}
                    <path
                      d={linePath("income")}
                      fill="none"
                      stroke="url(#incomeLine)"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d={linePath("expense")}
                      fill="none"
                      stroke="url(#expenseLine)"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {monthlyTrend.map((point, index) => {
                      const x = 70 + (index * 720) / Math.max(1, monthlyTrend.length - 1);
                      return (
                        <g key={point.label}>
                          <circle cx={x} cy={chartPointY(point.income, chartMax)} r="5" fill="#7cda7b" />
                          <circle cx={x} cy={chartPointY(point.expense, chartMax)} r="5" fill="#ef4444" />
                          <text x={x} y="295" textAnchor="middle" fill="#8ea0b6" fontSize="14">
                            {point.label}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              )}
            </div>

            <div className="panel">
              <div className="panel-header">
                <div>
                  <h2 className="panel-title">Financial Snapshot</h2>
                  <p className="panel-subtitle">Summary and planning metrics from your goals.</p>
                </div>
              </div>

              <div className="stacked-list">
                <div className="stacked-item">
                  <div>
                    <strong>Monthly Savings</strong>
                    <span>{formatMoney(summary?.savingsOverview.savingsAmount ?? 0)}</span>
                  </div>
                  <span className="pill">
                    {Math.round((summary?.savingsOverview.savingsRate ?? 0) * 100)}%
                  </span>
                </div>
                <div className="stacked-item">
                  <div>
                    <strong>Goal Target</strong>
                    <span>{formatMoney(summary?.savingsOverview.totalGoalTarget ?? 0)}</span>
                  </div>
                  <span className="pill">Goals</span>
                </div>
                <div className="stacked-item">
                  <div>
                    <strong>Goal Completion</strong>
                    <span>{formatMoney(summary?.savingsOverview.totalGoalCurrent ?? 0)}</span>
                  </div>
                  <span className="pill">
                    {Math.round((summary?.savingsOverview.goalCompletionRate ?? 0) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  detail,
  suffix = '',
  tone,
}: {
  label: string;
  value: number;
  detail?: string;
  suffix?: string;
  tone: 'balance' | 'income' | 'expense' | 'neutral';
}) {
  const toneClass =
    tone === 'income' ? 'amount-positive' : tone === 'expense' ? 'amount-negative' : '';

  return (
    <article className="summary-card stat-card">
      <span className="summary-label">{label}</span>
      <strong className={`summary-value ${toneClass}`}>{formatMoney(value)}</strong>
      <span className="summary-detail">{detail ?? suffix}</span>
    </article>
  );
}

function buildLinePath(
  trend: Array<{ income: number; expense: number }>,
  key: 'income' | 'expense',
  maxValue: number,
) {
  const usableWidth = 720;
  const offsetX = 70;
  const baseline = 252;

  return trend
    .map((point, index) => {
      const x = offsetX + (index * usableWidth) / Math.max(1, trend.length - 1);
      const y = chartPointY(point[key], maxValue, baseline);

      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');
}

function chartPointY(value: number, maxValue: number, baseline = 252) {
  const chartHeight = 180;
  const normalized = maxValue > 0 ? value / maxValue : 0;
  return baseline - normalized * chartHeight;
}

function buildGridLines(width: number, height: number) {
  return [1, 2, 3, 4].map((step) => ({
    key: step,
    x1: 60,
    y1: (height / 5) * step,
    x2: width - 40,
    y2: (height / 5) * step,
  }));
}

export default DashboardPage;
