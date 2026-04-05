import { useEffect, useState, type FormEvent } from 'react'
import { apiFetch } from '../services/api'
import '../styles/Admin.css'

interface User {
  id: number
  name: string
  email: string
  role: 'viewer' | 'analyst' | 'admin'
  status: 'active' | 'inactive'
}

interface UsersResponse {
  data: User[]
}

export function Admin() {
  const [users, setUsers] = useState<User[]>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState<number | null>(null)
  const [deleting, setDeleting] = useState<number | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [drafts, setDrafts] = useState<Record<number, { role: string; status: string }>>({})

  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'viewer' as string,
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [creatingUser, setCreatingUser] = useState(false)

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    inactive: users.filter(u => u.status === 'inactive').length,
    admins: users.filter(u => u.role === 'admin').length,
    analysts: users.filter(u => u.role === 'analyst').length,
    viewers: users.filter(u => u.role === 'viewer').length,
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setError('')
      const data = await apiFetch<UsersResponse>('/api/users')
      setUsers(data.data)
      // Initialize drafts
      setDrafts(
        data.data.reduce((acc, user) => {
          acc[user.id] = { role: user.role, status: user.status }
          return acc
        }, {} as Record<number, { role: string; status: string }>)
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
    }
  }

  const handleUpdateUser = async (userId: number) => {
    if (saving === userId) return

    const draft = drafts[userId]
    const user = users.find((u) => u.id === userId)
    if (!draft || !user) return

    setSaving(userId)
    setError('')
    setSuccess('')

    try {
      await apiFetch(`/api/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ role: draft.role, status: draft.status }),
      })
      setSuccess(`Updated user ${user.name}`)
      await loadUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user')
    } finally {
      setSaving(null)
    }
  }

  const handleDeleteUser = async (userId: number) => {
    const user = users.find((u) => u.id === userId)
    if (!user) return

    const confirmed = confirm(
      `⚠️ Delete user "${user.name}"?\n\nEmail: ${user.email}\n\nThis action cannot be undone.`
    )
    if (!confirmed) return

    setDeleting(userId)
    setError('')
    setSuccess('')

    try {
      await apiFetch(`/api/users/${userId}`, { method: 'DELETE' })
      setSuccess(`✓ Deleted user ${user.name}`)
      await loadUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user')
    } finally {
      setDeleting(null)
    }
  }

  const handleCreateUser = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setFormErrors({})

    const errors: Record<string, string> = {}

    if (!newUserForm.name.trim()) errors.name = 'Name is required'
    if (!newUserForm.email.trim()) errors.email = 'Email is required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUserForm.email)) errors.email = 'Invalid email format'
    if (!newUserForm.password) errors.password = 'Password is required'
    if (newUserForm.password.length < 8) errors.password = 'Password must be at least 8 characters'

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    setCreatingUser(true)
    try {
      await apiFetch('/api/users', {
        method: 'POST',
        body: JSON.stringify(newUserForm),
      })
      setSuccess(`✓ Created user ${newUserForm.name}`)
      setNewUserForm({ name: '', email: '', password: '', role: 'viewer' })
      await loadUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user')
    } finally {
      setCreatingUser(false)
    }
  }

  return (
    <div className="admin-page">
      {/* Statistics Dashboard */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Users</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#27ae60' }}>{stats.active}</div>
          <div className="stat-label">Active</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#e74c3c' }}>{stats.inactive}</div>
          <div className="stat-label">Inactive</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.admins}</div>
          <div className="stat-label">Admins</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.analysts}</div>
          <div className="stat-label">Analysts</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.viewers}</div>
          <div className="stat-label">Viewers</div>
        </div>
      </div>

      <div className="card">
        <h2>Create New User</h2>
        <form onSubmit={handleCreateUser} className="user-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="newName">Name</label>
              <input
                id="newName"
                type="text"
                value={newUserForm.name}
                onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                placeholder="John Doe"
                className={formErrors.name ? 'error' : ''}
              />
              {formErrors.name && <span className="error-text">{formErrors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="newEmail">Email</label>
              <input
                id="newEmail"
                type="email"
                value={newUserForm.email}
                onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                placeholder="user@example.com"
                className={formErrors.email ? 'error' : ''}
              />
              {formErrors.email && <span className="error-text">{formErrors.email}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="newPassword">Password</label>
              <input
                id="newPassword"
                type="password"
                value={newUserForm.password}
                onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                placeholder="At least 8 characters"
                className={formErrors.password ? 'error' : ''}
              />
              {formErrors.password && <span className="error-text">{formErrors.password}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="newRole">Role</label>
              <select
                id="newRole"
                value={newUserForm.role}
                onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
              >
                <option value="viewer">Viewer</option>
                <option value="analyst">Analyst</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <button type="submit" disabled={creatingUser} className="btn-primary">
            {creatingUser ? 'Creating...' : '+ Create User'}
          </button>
        </form>
      </div>

      <div className="card">
        <div className="section-header">
          <h2>Manage Users</h2>
          <div className="search-box">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Search by name or email..."
              className="search-input"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="clear-btn">✕</button>
            )}
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="empty-state">
            {searchQuery ? 'No users found matching your search' : 'No users yet'}
          </div>
        ) : (
          <div className="users-table">
            {filteredUsers.map((user) => (
              <div key={user.id} className="user-card">
                <div className="user-info">
                  <div className="user-header">
                    <strong>{user.name}</strong>
                    <div className="badges">
                      <span className={`badge role-${user.role}`}>{user.role}</span>
                      <span className={`badge status-${user.status}`}>
                        {user.status === 'active' ? '●' : '○'} {user.status}
                      </span>
                    </div>
                  </div>
                  <span className="user-email">{user.email}</span>
                </div>

                <div className="user-controls">
                  <div className="form-group">
                    <label>Role</label>
                    <select
                      value={drafts[user.id]?.role || user.role}
                      onChange={(e) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [user.id]: { ...prev[user.id], role: e.target.value },
                        }))
                      }
                    >
                      <option value="viewer">Viewer</option>
                      <option value="analyst">Analyst</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Status</label>
                    <select
                      value={drafts[user.id]?.status || user.status}
                      onChange={(e) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [user.id]: { ...prev[user.id], status: e.target.value },
                        }))
                      }
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>

                  <button
                    onClick={() => handleUpdateUser(user.id)}
                    disabled={saving === user.id}
                    className="btn-save"
                  >
                    {saving === user.id ? '⏳' : '✓'} {saving === user.id ? 'Saving...' : 'Save'}
                  </button>

                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    disabled={deleting === user.id}
                    className="btn-delete"
                  >
                    {deleting === user.id ? '⏳' : '🗑'} {deleting === user.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
