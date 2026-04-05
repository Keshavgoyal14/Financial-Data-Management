import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../services/api'
import '../styles/Records.css'

interface Record {
  id: number
  amount: number
  type: 'income' | 'expense'
  category: string
  date: string
  notes: string | null
  createdBy?: number
  createdAt?: string
  updatedAt?: string
}

interface RecordsResponse {
  data: Record[]
  meta: {
    total: number
    page: number
    limit: number
    pages: number
  }
}

export function Records() {
  const { user } = useAuth()
  const [records, setRecords] = useState<Record[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [typeFilter, setTypeFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<Partial<Record>>({})
  const [deleting, setDeleting] = useState<number | null>(null)

  const [formData, setFormData] = useState({
    amount: '',
    type: 'expense' as 'income' | 'expense',
    category: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  })

  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    loadRecords()
  }, [page, typeFilter, categoryFilter])

  const loadRecords = async () => {
    try {
      setLoading(true)
      setError('')
      const params = new URLSearchParams()
      if (typeFilter) params.set('type', typeFilter)
      if (categoryFilter) params.set('category', categoryFilter)
      params.set('page', String(page))
      params.set('limit', '10')

      const data = await apiFetch<RecordsResponse>(`/api/records?${params.toString()}`)
      setRecords(data.data)
      setTotalPages(data.meta.pages)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load records')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!formData.category || !formData.amount) {
      setError('Category and amount are required')
      return
    }

    try {
      await apiFetch('/api/records', {
        method: 'POST',
        body: JSON.stringify({
          amount: Number(formData.amount),
          type: formData.type,
          category: formData.category,
          date: formData.date,
          notes: formData.notes || null,
        }),
      })
      setSuccess('✓ Record created successfully')
      setFormData({
        amount: '',
        type: 'expense',
        category: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
      })
      setPage(1)
      await loadRecords()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create record')
    }
  }

  const handleEdit = (record: Record) => {
    setEditingId(record.id)
    setEditForm({
      amount: record.amount,
      type: record.type,
      category: record.category,
      date: record.date,
      notes: record.notes,
    })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditForm({})
  }

  const handleSaveEdit = async (recordId: number) => {
    setError('')
    setSuccess('')

    if (!editForm.category || !editForm.amount) {
      setError('Category and amount are required')
      return
    }

    try {
      await apiFetch(`/api/records/${recordId}`, {
        method: 'PATCH',
        body: JSON.stringify(editForm),
      })
      setSuccess('✓ Record updated successfully')
      setEditingId(null)
      setEditForm({})
      await loadRecords()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update record')
    }
  }

  const handleDelete = async (recordId: number) => {
    const record = records.find(r => r.id === recordId)
    if (!record) return

    const confirmed = confirm(
      `⚠️ Delete this record?\n\n${record.type.toUpperCase()} - ${record.category}\n${formatCurrency(record.amount)}\n\nThis action cannot be undone.`
    )
    if (!confirmed) return

    setDeleting(recordId)
    setError('')
    setSuccess('')

    try {
      await apiFetch(`/api/records/${recordId}`, { method: 'DELETE' })
      setSuccess('✓ Record deleted successfully')
      if (records.length === 1 && page > 1) {
        setPage(page - 1)
      } else {
        await loadRecords()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete record')
    } finally {
      setDeleting(null)
    }
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)

  return (
    <div className="records-page">
      {isAdmin && (
        <div className="card">
          <h2>📝 Add New Record</h2>
          <form onSubmit={handleSubmit} className="record-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="type">Type</label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'income' | 'expense' })}
                >
                  <option value="income">+ Income</option>
                  <option value="expense">- Expense</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="category">Category</label>
                <input
                  id="category"
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Salary, Rent"
                />
              </div>

              <div className="form-group">
                <label htmlFor="amount">Amount</label>
                <input
                  id="amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </div>

              <div className="form-group">
                <label htmlFor="date">Date</label>
                <input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="notes">Notes (Optional)</label>
              <input
                id="notes"
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes"
              />
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <button type="submit" className="btn-primary">
              ✓ Create Record
            </button>
          </form>
        </div>
      )}

      {!isAdmin && (
        <div className="card info-card">
          <p className="info-text">
            <strong>📖 Analyst Permissions:</strong> You can view and analyze all financial records. Record creation is restricted to Administrators only.
          </p>
        </div>
      )}

      <div className="card">
        <div className="section-header">
          <h2>💰 Financial Records</h2>
          <div className="record-count">{records.length} records</div>
        </div>

        <div className="filters">
          <div className="form-group">
            <label htmlFor="typeFilter">Type Filter</label>
            <select id="typeFilter" value={typeFilter} onChange={(e) => {setCategoryFilter(''); setTypeFilter(e.target.value); setPage(1)}}>
              <option value="">All Types</option>
              <option value="income">+ Income</option>
              <option value="expense">- Expense</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="categoryFilter">Category Filter</label>
            <input
              id="categoryFilter"
              type="text"
              value={categoryFilter}
              onChange={(e) => {setCategoryFilter(e.target.value); setPage(1)}}
              placeholder="Search category"
            />
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {loading && <div className="loading">Loading records...</div>}

        {!loading && records.length === 0 && (
          <div className="empty-state">No records found</div>
        )}

        {!loading && records.length > 0 && (
          <>
            <div className="records-table">
              <div className="table-header">
                <div>Date</div>
                <div>Type</div>
                <div>Category</div>
                <div>Amount</div>
                <div>Notes</div>
                {isAdmin && <div className="actions-col">Actions</div>}
              </div>
              {records.map((record) => (
                <div key={record.id} className={`table-row ${editingId === record.id ? 'editing' : ''}`}>
                  {editingId === record.id ? (
                    <>
                      <div>
                        <input
                          type="date"
                          value={editForm.date || ''}
                          onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                        />
                      </div>
                      <div>
                        <select
                          value={editForm.type || 'expense'}
                          onChange={(e) => setEditForm({ ...editForm, type: e.target.value as 'income' | 'expense' })}
                        >
                          <option value="income">Income</option>
                          <option value="expense">Expense</option>
                        </select>
                      </div>
                      <div>
                        <input
                          type="text"
                          value={editForm.category || ''}
                          onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          value={editForm.amount || ''}
                          onChange={(e) => setEditForm({ ...editForm, amount: Number(e.target.value) })}
                          step="0.01"
                          min="0"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={editForm.notes || ''}
                          onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                        />
                      </div>
                      <div className="actions-col">
                        <button
                          onClick={() => handleSaveEdit(record.id)}
                          className="btn-icon save"
                          title="Save"
                        >
                          ✓
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="btn-icon cancel"
                          title="Cancel"
                        >
                          ✕
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>{new Date(record.date).toLocaleDateString()}</div>
                      <div>
                        <span className={`type-badge ${record.type}`}>
                          {record.type === 'income' ? '📈' : '📉'} {record.type}
                        </span>
                      </div>
                      <div>{record.category}</div>
                      <div className={`amount ${record.type}`}>{formatCurrency(record.amount)}</div>
                      <div className="notes">{record.notes || '-'}</div>
                      {isAdmin && (
                        <div className="actions-col">
                          <button
                            onClick={() => handleEdit(record)}
                            className="btn-icon edit"
                            title="Edit"
                          >
                            ✎
                          </button>
                          <button
                            onClick={() => handleDelete(record.id)}
                            disabled={deleting === record.id}
                            className="btn-icon delete"
                            title="Delete"
                          >
                            {deleting === record.id ? '⏳' : '🗑'}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>

            <div className="pagination">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
              >
                ← Previous
              </button>
              <span>Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
              >
                Next →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
