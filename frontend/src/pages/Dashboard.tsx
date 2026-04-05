import { useEffect, useState, useMemo } from 'react'
import { apiFetch } from '../services/api'
import '../styles/Dashboard.css'

interface Summary {
  totalIncome: number
  totalExpenses: number
  netBalance: number
  categoryTotals: Array<{ category: string; total: number; type: 'income' | 'expense' }>
  recentActivity: Array<{
    id: number
    amount: number
    type: 'income' | 'expense'
    category: string
    date: string
    notes: string | null
  }>
  trends: Array<{ period: string; income: number; expense: number }>
}

export function Dashboard() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [trendMode, setTrendMode] = useState<'monthly' | 'weekly'>('monthly')

  useEffect(() => {
    loadSummary()
  }, [trendMode])

  const loadSummary = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await apiFetch<{ data: Summary }>(`/api/dashboard/summary?trend=${trendMode}`)
      setSummary(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load summary')
    } finally {
      setLoading(false)
    }
  }

  const trendChartRows = useMemo(() => {
    const rows = (summary?.trends ?? []).slice(-4)
    const max = Math.max(...rows.map((r) => Math.max(r.income, r.expense)), 1)

    return rows.map((row) => ({
      label: row.period,
      incomeHeight: Math.max((row.income / max) * 180, 6),
      expenseHeight: Math.max((row.expense / max) * 180, 6),
      income: row.income,
      expense: row.expense,
    }))
  }, [summary])

  const expenseCategories = useMemo(() => {
    return (summary?.categoryTotals ?? [])
      .filter((item) => item.type === 'expense')
      .sort((a, b) => b.total - a.total)
      .slice(0, 8)
  }, [summary])

  const donutStyle = useMemo(() => {
    if (!expenseCategories.length) {
      return { background: '#e5edf5' }
    }

    const palette = ['#2f62bc', '#2fa88f', '#ea5579', '#ef9b21', '#8b6bd4', '#95a8d8', '#80c9b4', '#dc8f9f']
    const total = expenseCategories.reduce((acc, item) => acc + item.total, 0) || 1
    let cursor = 0

    const segments = expenseCategories.map((item, index) => {
      const start = (cursor / total) * 100
      cursor += item.total
      const end = (cursor / total) * 100
      const color = palette[index % palette.length]
      return `${color} ${start}% ${end}%`
    })

    return {
      background: `conic-gradient(${segments.join(', ')})`,
    }
  }, [expenseCategories])

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(value)

  if (loading) return <div className="dashboard">Loading...</div>
  if (error) return <div className="dashboard error">{error}</div>
  if (!summary) return <div className="dashboard">No data available</div>

  return (
    <div className="dashboard">
      <div className="cards-grid">
        <div className="stat-card">
          <div className="stat-label">Total Income</div>
          <div className="stat-value income">{formatCurrency(summary.totalIncome)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Expenses</div>
          <div className="stat-value expense">{formatCurrency(summary.totalExpenses)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Net Balance</div>
          <div className={`stat-value ${summary.netBalance >= 0 ? 'income' : 'expense'}`}>
            {formatCurrency(summary.netBalance)}
          </div>
        </div>
      </div>

      <div className="content-grid">
        <div className="card">
          <h3>Trends ({trendMode})</h3>
          <div className="trend-selector">
            <button
              className={trendMode === 'weekly' ? 'active' : ''}
              onClick={() => setTrendMode('weekly')}
            >
              Weekly
            </button>
            <button
              className={trendMode === 'monthly' ? 'active' : ''}
              onClick={() => setTrendMode('monthly')}
            >
              Monthly
            </button>
          </div>

          <div className="trend-chart">
            {trendChartRows.map((row) => (
              <div key={row.label} className="trend-bar">
                <div
                  className="bar income-bar"
                  style={{ height: `${row.incomeHeight}px` }}
                  title={formatCurrency(row.income)}
                />
                <div
                  className="bar expense-bar"
                  style={{ height: `${row.expenseHeight}px` }}
                  title={formatCurrency(row.expense)}
                />
                <div className="label">{row.label}</div>
              </div>
            ))}
          </div>

          <div className="legend">
            <div className="legend-item">
              <div className="legend-color income-bar" />
              <span>Income</span>
            </div>
            <div className="legend-item">
              <div className="legend-color expense-bar" />
              <span>Expense</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3>Expense Categories</h3>
          <div className="donut-container">
            <div className="donut" style={donutStyle} />
          </div>
          <div className="category-list">
            {expenseCategories.map((cat) => (
              <div key={cat.category} className="category-item">
                <span>{cat.category}</span>
                <strong>{formatCurrency(cat.total)}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Recent Activity</h3>
        <div className="activity-table">
          <div className="table-header">
            <div>Date</div>
            <div>Category</div>
            <div>Amount</div>
            <div>Type</div>
          </div>
          {summary.recentActivity.map((item) => (
            <div key={item.id} className="table-row">
              <div>{new Date(item.date).toLocaleDateString()}</div>
              <div>{item.category}</div>
              <div>{formatCurrency(item.amount)}</div>
              <div className={`type ${item.type}`}>{item.type}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
