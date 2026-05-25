import { useEffect, useMemo, useState } from 'react';
import Sidebar from '../Component/Sidebar';
import '../Css/FinancialDashboard.css';
import {
  financeApi,
  formatDate,
  formatMoney,
  type TransactionPayload,
  type TransactionRecord,
  type TransactionType,
} from '../services/financeApi';

type TransactionFormState = TransactionPayload & { isIgnored: boolean };

const initialFormState: TransactionFormState = {
  transactionDate: new Date().toISOString().slice(0, 10),
  description: '',
  type: 'DEBIT',
  amount: 0,
  category: '',
  isIgnored: false,
};

function TransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchDraft, setSearchDraft] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    type: 'all',
    from: '',
    to: '',
  });
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<TransactionRecord | null>(null);
  const [form, setForm] = useState<TransactionFormState>(initialFormState);
  const [isSaving, setIsSaving] = useState(false);

  const categoryOptions = useMemo(() => {
    const values = new Set<string>();
    transactions.forEach((transaction) => {
      if (transaction.category) {
        values.add(transaction.category);
      }
    });
    return Array.from(values).sort((left, right) => left.localeCompare(right));
  }, [transactions]);

  useEffect(() => {
    let isActive = true;

    const loadTransactions = async () => {
      setIsLoading(true);
      setError('');

      try {
        const response = await financeApi.getTransactions({
          page,
          limit: 10,
          search: filters.search || undefined,
          category: filters.category !== 'all' ? filters.category : undefined,
          type: filters.type !== 'all' ? filters.type : undefined,
          from: filters.from || undefined,
          to: filters.to || undefined,
        });

        if (!isActive) {
          return;
        }

        setTransactions(response.data);
        setMeta(response.meta);
      } catch (loadError) {
        if (!isActive) {
          return;
        }

        const message =
          loadError instanceof Error ? loadError.message : 'Failed to load transactions';
        setError(message);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadTransactions();

    return () => {
      isActive = false;
    };
  }, [filters, page]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  const openCreateModal = () => {
    setEditingTransaction(null);
    setForm(initialFormState);
    setModalOpen(true);
  };

  const openEditModal = (transaction: TransactionRecord) => {
    setEditingTransaction(transaction);
    setForm({
      transactionDate: transaction.transactionDate.slice(0, 10),
      description: transaction.description,
      type: transaction.type,
      amount: transaction.amount,
      category: transaction.category ?? '',
      isIgnored: transaction.isIgnored,
    });
    setModalOpen(true);
  };

  const handleSubmitFilters = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setFilters({
      search: searchDraft.trim(),
      category: filters.category,
      type: filters.type,
      from: filters.from,
      to: filters.to,
    });
  };

  const handleClearFilters = () => {
    setSearchDraft('');
    setPage(1);
    setFilters({
      search: '',
      category: 'all',
      type: 'all',
      from: '',
      to: '',
    });
  };

  const handleSaveTransaction = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      const payload: TransactionPayload & { isIgnored?: boolean } = {
        transactionDate: new Date(form.transactionDate).toISOString(),
        description: form.description.trim(),
        type: form.type,
        amount: Number(form.amount),
        category: form.category?.trim() || undefined,
        isIgnored: form.isIgnored,
      };

      if (editingTransaction) {
        await financeApi.updateTransaction(editingTransaction.id, payload);
      } else {
        await financeApi.createTransaction(payload);
      }

      setModalOpen(false);
      setEditingTransaction(null);
      setForm(initialFormState);
      setPage(1);
      setFilters({ ...filters });
    } catch (saveError) {
      const message =
        saveError instanceof Error ? saveError.message : 'Failed to save transaction';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTransaction = async (transaction: TransactionRecord) => {
    const confirmed = window.confirm(`Delete ${transaction.description}?`);
    if (!confirmed) {
      return;
    }

    try {
      await financeApi.deleteTransaction(transaction.id);
      setPage(1);
      setFilters({ ...filters });
    } catch (deleteError) {
      const message =
        deleteError instanceof Error ? deleteError.message : 'Failed to delete transaction';
      setError(message);
    }
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <Sidebar activeMenu="transactions" />

        <main className="main-content">
          <header className="page-header">
            <div className="page-heading">
              <h1 className="page-title">Transactions</h1>
              <p className="page-subtitle">
                Search, filter, edit, and manage manual income or expense entries.
              </p>
            </div>

            <div className="toolbar">
              <button type="button" className="primary-btn" onClick={openCreateModal}>
                Add Transaction
              </button>
              <button type="button" className="secondary-btn" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </header>

          <section className="table-panel">
            <form className="filters-grid" onSubmit={handleSubmitFilters}>
              <div className="field">
                <label htmlFor="transaction-search">Search</label>
                <input
                  id="transaction-search"
                  type="text"
                  placeholder="Search description or category"
                  value={searchDraft}
                  onChange={(event) => setSearchDraft(event.target.value)}
                />
              </div>

              <div className="field">
                <label htmlFor="transaction-category">Category</label>
                <select
                  id="transaction-category"
                  value={filters.category}
                  onChange={(event) =>
                    setFilters((current) => ({ ...current, category: event.target.value }))
                  }
                >
                  <option value="all">All categories</option>
                  {categoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="transaction-type">Type</label>
                <select
                  id="transaction-type"
                  value={filters.type}
                  onChange={(event) =>
                    setFilters((current) => ({ ...current, type: event.target.value }))
                  }
                >
                  <option value="all">All types</option>
                  <option value="CREDIT">Income</option>
                  <option value="DEBIT">Expense</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="transaction-from">From</label>
                <input
                  id="transaction-from"
                  type="date"
                  value={filters.from}
                  onChange={(event) =>
                    setFilters((current) => ({ ...current, from: event.target.value }))
                  }
                />
              </div>

              <div className="field">
                <label htmlFor="transaction-to">To</label>
                <input
                  id="transaction-to"
                  type="date"
                  value={filters.to}
                  onChange={(event) =>
                    setFilters((current) => ({ ...current, to: event.target.value }))
                  }
                />
              </div>

              <div className="page-actions">
                <button type="submit" className="primary-btn">
                  Apply Filters
                </button>
                <button type="button" className="ghost-btn" onClick={handleClearFilters}>
                  Reset
                </button>
              </div>
            </form>

            {error ? <div className="empty-state">{error}</div> : null}

            {isLoading ? (
              <div className="loading-state">Loading transaction history...</div>
            ) : transactions.length === 0 ? (
              <div className="empty-state">
                <strong>No transactions found.</strong>
                <span>Add a manual entry to begin tracking cash flow.</span>
              </div>
            ) : (
              <>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Description</th>
                        <th>Category</th>
                        <th>Type</th>
                        <th>Amount</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((transaction) => (
                        <tr key={transaction.id}>
                          <td>{formatDate(transaction.transactionDate)}</td>
                          <td>{transaction.description}</td>
                          <td>{transaction.category ?? '-'}</td>
                          <td>
                            <span className="pill">
                              {transaction.type === 'CREDIT' ? 'Income' : 'Expense'}
                            </span>
                          </td>
                          <td
                            className={
                              transaction.type === 'CREDIT'
                                ? 'amount-positive'
                                : 'amount-negative'
                            }
                          >
                            {transaction.type === 'CREDIT' ? '+' : '-'}
                            {formatMoney(transaction.amount)}
                          </td>
                          <td>
                            <div className="row-actions">
                              <button
                                type="button"
                                className="secondary-btn"
                                onClick={() => openEditModal(transaction)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="danger-btn"
                                onClick={() => void handleDeleteTransaction(transaction)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="pagination">
                  <span className="support-text">
                    Showing {transactions.length} of {meta.total} transactions
                  </span>
                  <div className="row-actions">
                    <button
                      type="button"
                      className="secondary-btn"
                      disabled={page <= 1}
                      onClick={() => setPage((current) => Math.max(1, current - 1))}
                    >
                      Previous
                    </button>
                    <span className="pill">
                      Page {page} of {meta.totalPages}
                    </span>
                    <button
                      type="button"
                      className="secondary-btn"
                      disabled={page >= meta.totalPages}
                      onClick={() => setPage((current) => Math.min(meta.totalPages, current + 1))}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>
        </main>
      </div>

      {modalOpen ? (
        <div className="modal-overlay" role="presentation" onClick={() => setModalOpen(false)}>
          <div className="modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="section-header">
              <div>
                <h3 className="section-title">
                  {editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
                </h3>
                <p className="section-subtitle">Save a manual income or spending item.</p>
              </div>
              <button type="button" className="ghost-btn" onClick={() => setModalOpen(false)}>
                Close
              </button>
            </div>

            <form className="modal-grid" onSubmit={handleSaveTransaction}>
              <div className="modal-field">
                <label htmlFor="modal-date">Transaction Date</label>
                <input
                  id="modal-date"
                  type="date"
                  value={form.transactionDate}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, transactionDate: event.target.value }))
                  }
                  required
                />
              </div>

              <div className="modal-field">
                <label htmlFor="modal-description">Description</label>
                <input
                  id="modal-description"
                  type="text"
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, description: event.target.value }))
                  }
                  placeholder="Salary, groceries, transfer, etc."
                  required
                />
              </div>

              <div className="modal-field">
                <label htmlFor="modal-type">Type</label>
                <select
                  id="modal-type"
                  value={form.type}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      type: event.target.value as TransactionType,
                    }))
                  }
                >
                  <option value="DEBIT">Expense</option>
                  <option value="CREDIT">Income</option>
                </select>
              </div>

              <div className="modal-field">
                <label htmlFor="modal-amount">Amount</label>
                <input
                  id="modal-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, amount: Number(event.target.value) }))
                  }
                  required
                />
              </div>

              <div className="modal-field">
                <label htmlFor="modal-category">Category</label>
                <input
                  id="modal-category"
                  type="text"
                  value={form.category}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, category: event.target.value }))
                  }
                  placeholder="Food, transport, salary, etc."
                />
              </div>

              <div className="modal-field">
                <label htmlFor="modal-ignored">Ignored</label>
                <select
                  id="modal-ignored"
                  value={form.isIgnored ? 'true' : 'false'}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, isIgnored: event.target.value === 'true' }))
                  }
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </div>

              <div className="modal-actions" style={{ gridColumn: '1 / -1' }}>
                <button type="button" className="ghost-btn" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-btn" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default TransactionsPage;