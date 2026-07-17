import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { colors, radius } from '../styles/designTokens';
import { Card, Badge, Button, Input, Spinner, EmptyState, Toast, ConfirmDialog } from '../components/ui';
import { authAPI, projectAPI } from '../api';
import { Users, User } from 'lucide-react';

const roles = [
  { id: 'admin', label: 'Admin', description: 'Full access to all features and settings' },
  { id: 'supervisor', label: 'Supervisor', description: 'Can manage projects, entries, and workers' },
  { id: 'mason', label: 'Mason', description: 'Can view assigned projects and add entries' },
];

export default function AssignRolesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const editingUser = location.state?.user;

  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'info', key: 0 });
  const [confirmDlg, setConfirmDlg] = useState(null);

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('supervisor');
  const [selectedProjects, setSelectedProjects] = useState([]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [userRes, projRes] = await Promise.all([
        authAPI.getUsers(),
        projectAPI.getAll(),
      ]);
      setUsers(userRes.data?.users || userRes.data || []);
      setProjects(projRes.data?.projects || projRes.data || []);
    } catch (err) {
      setError(err.friendlyMessage || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleProvision = async () => {
    if (!newName.trim() || !newEmail.trim()) return;
    setSaving(true);
    try {
      await authAPI.provision({
        name: newName.trim(),
        email: newEmail.trim(),
        role: newRole,
        projects: selectedProjects,
      });
      setToast({ message: 'User created successfully', type: 'success', key: Date.now() });
      setShowCreate(false);
      setNewName('');
      setNewEmail('');
      setSelectedProjects([]);
      fetchAll();
    } catch (err) {
      setToast({ message: err.friendlyMessage || 'Failed to create user', type: 'error', key: Date.now() });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    setSaving(true);
    try {
      await authAPI.updateUser(userId, { role: newRole });
      setToast({ message: 'Role updated successfully', type: 'success', key: Date.now() });
      fetchAll();
    } catch (err) {
      setToast({ message: err.friendlyMessage || 'Failed to update role', type: 'error', key: Date.now() });
    } finally {
      setSaving(false);
    }
  };

  const toggleProject = (projectId) => {
    setSelectedProjects((prev) =>
      prev.includes(projectId) ? prev.filter((id) => id !== projectId) : [...prev, projectId]
    );
  };

  return (
    <div style={{ padding: '24px 28px', maxWidth: 800, margin: '0 auto' }}>
      <Toast
        key={toast.key}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((prev) => ({ ...prev, message: '' }))}
      />
      <ConfirmDialog
        open={!!confirmDlg}
        message={confirmDlg?.message || ''}
        onConfirm={confirmDlg?.onConfirm}
        onCancel={() => setConfirmDlg(null)}
        danger={confirmDlg?.danger}
        confirmLabel={confirmDlg?.confirmLabel}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              border: 'none', background: colors.iconBg, cursor: 'pointer',
              width: 36, height: 36, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, color: colors.textPrimary,
            }}
          >
            ←
          </button>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: colors.textPrimary, margin: 0 }}>
            {editingUser ? 'Edit User' : 'Assign Roles'}
          </h2>
        </div>
        <Button onClick={() => setShowCreate(true)}>+ Add User</Button>
      </div>

      {showCreate && (
        <Card style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: colors.textPrimary, marginBottom: 16 }}>
            Create New User
          </h3>
          <Input label="Full Name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="John Doe" />
          <Input label="Email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="john@company.com" />
          
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: colors.textSecondary, marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
              Role
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {roles.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setNewRole(r.id)}
                  style={{
                    flex: 1, padding: '10px', borderRadius: radius.sm,
                    border: newRole === r.id ? `2px solid ${colors.primaryBlue}` : `1px solid ${colors.cardBorder}`,
                    background: newRole === r.id ? '#ECEBFF' : colors.cardBg,
                    cursor: 'pointer', textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary }}>{r.label}</div>
                  <div style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>{r.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: colors.textSecondary, marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
              Assign Projects
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {projects.map((p) => {
                const pid = p._id || p.id;
                const isSelected = selectedProjects.includes(pid);
                return (
                  <button
                    key={pid}
                    onClick={() => toggleProject(pid)}
                    style={{
                      padding: '6px 14px', borderRadius: 20,
                      border: `1px solid ${isSelected ? colors.primaryBlue : colors.cardBorder}`,
                      background: isSelected ? '#ECEBFF' : colors.cardBg,
                      color: isSelected ? colors.primaryBlue : colors.textMedium,
                      fontSize: 13, cursor: 'pointer',
                    }}
                  >
                    {p.projectName || p.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <Button variant="ghost" onClick={() => setShowCreate(false)} style={{ flex: 1 }}>Cancel</Button>
            <Button onClick={handleProvision} loading={saving} style={{ flex: 1 }}>
              Create User
            </Button>
          </div>
        </Card>
      )}

      {loading ? (
        <Spinner style={{ padding: 60 }} />
      ) : error ? (
        <div style={{ color: colors.error, padding: 20, textAlign: 'center' }}>
          <p>{error}</p>
          <Button variant="ghost" onClick={fetchAll}>Retry</Button>
        </div>
      ) : users.length === 0 ? (
        <EmptyState icon={<Users size={48} />} title="No Users" description="Create your first team member to get started." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {users.map((user) => {
            const uid = user._id || user.id;
            const currentRole = user.role || 'user';
            return (
              <Card key={uid} padding="16px 20px">
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: '50%',
                    background: colors.iconBg, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, flexShrink: 0,
                  }}>
                    {user.profilePhoto ? (
                      <img src={user.profilePhoto} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : <User size={18} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimary }}>
                      {user.name || 'Unknown'}
                    </div>
                    <div style={{ fontSize: 12, color: colors.textSecondary }}>{user.email}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {roles.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => handleUpdateRole(uid, r.id)}
                        disabled={saving}
                        style={{
                          padding: '4px 10px', borderRadius: 6,
                          border: currentRole === r.id ? 'none' : `1px solid ${colors.cardBorder}`,
                          background: currentRole === r.id ? colors.primaryBlue : 'transparent',
                          color: currentRole === r.id ? '#FFF' : colors.textSecondary,
                          fontSize: 12, fontWeight: 600, cursor: 'pointer',
                          opacity: saving ? 0.5 : 1,
                        }}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
