import { useEffect, useState } from 'react';
import Sidebar from '../Component/Sidebar';
import '../Css/FinancialDashboard.css';
import { financeApi, formatMoney, type GoalRecord } from '../services/financeApi';

function GoalsPage() {
  const [goals, setGoals] = useState<GoalRecord[]>([]);
  const [summary, setSummary] = useState({
    totalTargetAmount: 0,
    totalCurrentAmount: 0,
    completionRate: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formTarget, setFormTarget] = useState('');
  const [formCurrent, setFormCurrent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const loadGoals = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await financeApi.getGoals();
      setGoals(response.data);
      setSummary(response.summary);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Failed to load goals';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadGoals();
  }, []);

  const resetForm = () => {
    setFormName('');
    setFormTarget('');
    setFormCurrent('');
    setFormError('');
  };

  const handleCreateGoal = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');

    const targetAmount = Number(formTarget);
    const currentAmount = formCurrent === '' ? 0 : Number(formCurrent);

    if (!formName.trim()) {
      setFormError('Goal name is required.');
      return;
    }
    if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
      setFormError('Target amount must be greater than 0.');
      return;
    }
    if (!Number.isFinite(currentAmount) || currentAmount < 0) {
      setFormError('Current amount must be zero or greater.');
      return;
    }

    setIsSaving(true);
    try {
      await financeApi.createGoal({
        name: formName.trim(),
        targetAmount,
        currentAmount,
      });
      resetForm();
      setShowForm(false);
      await loadGoals();
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : 'Failed to create goal';
      setFormError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteGoal = async (goal: GoalRecord) => {
    const confirmed = window.confirm(`Delete goal "${goal.name}"?`);
    if (!confirmed) {
      return;
    }

    try {
      await financeApi.deleteGoal(goal.id);
      await loadGoals();
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : 'Failed to delete goal';
      setError(message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <Sidebar activeMenu="goals" />

        <main className="main-content">
          <header className="page-header">
            <div className="page-heading">
              <h1 className="page-title">Goals</h1>
              <p className="page-subtitle">
                Track savings targets and monitor how close each target is to completion.
              </p>
            </div>

            <div className="toolbar">
              <span className="pill">{Math.round(summary.completionRate * 100)}% overall</span>
              <button
                type="button"
                className="primary-btn"
                onClick={() => {
                  setShowForm((prev) => !prev);
                  setFormError('');
                }}
              >
                {showForm ? 'Close' : 'New Goal'}
              </button>
              <button type="button" className="secondary-btn" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </header>

          <section className="summary-grid">
            <article className="summary-card">
              <span className="summary-label">Total Target</span>
              <strong className="summary-value">{formatMoney(summary.totalTargetAmount)}</strong>
              <span className="summary-detail">Combined savings objective</span>
            </article>
            <article className="summary-card">
              <span className="summary-label">Current Savings</span>
              <strong className="summary-value amount-positive">
                {formatMoney(summary.totalCurrentAmount)}
              </strong>
              <span className="summary-detail">Recorded contributions so far</span>
            </article>
            <article className="summary-card">
              <span className="summary-label">Completion Rate</span>
              <strong className="summary-value">{Math.round(summary.completionRate * 100)}%</strong>
              <span className="summary-detail">Across all tracked goals</span>
            </article>
          </section>

          {showForm ? (
            <section className="form-panel summary-card">
              <div className="section-header">
                <div>
                  <h2 className="section-title">Create a new goal</h2>
                  <p className="section-subtitle">
                    Goals are stored in the database and shared across this dashboard.
                  </p>
                </div>
              </div>

              <form className="goal-form-grid" onSubmit={handleCreateGoal}>
                <div className="field">
                  <label htmlFor="goal-name">Name</label>
                  <input
                    id="goal-name"
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Emergency fund"
                    disabled={isSaving}
                  />
                </div>
                <div className="field">
                  <label htmlFor="goal-target">Target amount</label>
                  <input
                    id="goal-target"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formTarget}
                    onChange={(e) => setFormTarget(e.target.value)}
                    placeholder="10000"
                    disabled={isSaving}
                  />
                </div>
                <div className="field">
                  <label htmlFor="goal-current">Current saved (optional)</label>
                  <input
                    id="goal-current"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formCurrent}
                    onChange={(e) => setFormCurrent(e.target.value)}
                    placeholder="0"
                    disabled={isSaving}
                  />
                </div>

                <div className="page-actions" style={{ gridColumn: '1 / -1' }}>
                  {formError ? (
                    <span className="amount-negative" role="alert">
                      {formError}
                    </span>
                  ) : (
                    <span />
                  )}
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      type="button"
                      className="ghost-btn"
                      onClick={() => {
                        resetForm();
                        setShowForm(false);
                      }}
                      disabled={isSaving}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="primary-btn" disabled={isSaving}>
                      {isSaving ? 'Saving…' : 'Save Goal'}
                    </button>
                  </div>
                </div>
              </form>
            </section>
          ) : null}

          {error ? <div className="empty-state">{error}</div> : null}

          {isLoading ? (
            <div className="loading-state">Loading savings goals...</div>
          ) : goals.length === 0 ? (
            <div className="empty-state">
              <strong>No savings goals yet.</strong>
              <span>Click “New Goal” to add your first savings target.</span>
            </div>
          ) : (
            <section className="goals-grid" style={{ gridTemplateColumns: '1fr' }}>
              <div className="goals-panel">
                <div className="section-header">
                  <div>
                    <h2 className="section-title">Savings Targets</h2>
                    <p className="section-subtitle">Visual progress for each active target.</p>
                  </div>
                </div>

                <div className="goal-summary-grid">
                  {goals.map((goal) => {
                    const progress =
                      goal.targetAmount > 0 ? Math.min(goal.currentAmount / goal.targetAmount, 1) : 0;

                    return (
                      <article className="goal-card" key={goal.id}>
                        <div className="goal-card-header">
                          <div>
                            <strong>{goal.name}</strong>
                            <span className="card-detail">Goal progress tracker</span>
                          </div>
                          <span className="pill">{Math.round(progress * 100)}%</span>
                        </div>

                        <div className="progress-track" aria-hidden="true">
                          <div className="progress-bar" style={{ width: `${Math.round(progress * 100)}%` }} />
                        </div>

                        <div className="goal-stats">
                          <span>{formatMoney(goal.currentAmount)} saved</span>
                          <span>{formatMoney(goal.targetAmount)} target</span>
                        </div>

                        <div className="row-actions">
                          <button
                            type="button"
                            className="danger-btn"
                            onClick={() => handleDeleteGoal(goal)}
                          >
                            Delete
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

export default GoalsPage;
