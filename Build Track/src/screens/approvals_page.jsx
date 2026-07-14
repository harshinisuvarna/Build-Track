import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { colors, radius, typography } from '../styles/designTokens';
import { Card, Badge, Button, Spinner, EmptyState, ErrorState, Toast, ConfirmDialog } from '../components/ui';
import { approvalAPI, transactionAPI } from '../api';

function formatCurrency(amount) {
  return '₹' + Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return dateStr; }
}

const typeStyles = {
  Materials: { bg: '#EEF0FF', color: '#173EEA' },
  Wages: { bg: '#E8F5E9', color: '#2E7D32' },
  Expense: { bg: '#FFF3E0', color: '#E65100' },
  Income: { bg: '#F3E8FF', color: '#7C3AED' },
};

export default function ApprovalsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('pending');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [approving, setApproving] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'info', key: 0 });
  const [confirmDlg, setConfirmDlg] = useState(null);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = tab === 'pending'
        ? await approvalAPI.getPending()
        : await approvalAPI.getHistory();
      const data = res.data?.entries || res.data?.transactions || res.data || [];
      setEntries(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.friendlyMessage || 'Failed to load entries');
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const handleApprove = async (id) => {
    setApproving(id);
    try {
      await approvalAPI.approve(id);
      setToast({ message: 'Entry approved successfully', type: 'success', key: Date.now() });
      setEntries((prev) => prev.filter((e) => (e._id || e.id) !== id));
    } catch (err) {
      setToast({ message: err.friendlyMessage || 'Failed to approve', type: 'error', key: Date.now() });
    } finally {
      setApproving(null);
    }
  };

  const handleReject = async (id) => {
    setRejecting(id);
    try {
      await approvalAPI.reject(id, 'Rejected by manager');
      setToast({ message: 'Entry rejected', type: 'info', key: Date.now() });
      setEntries((prev) => prev.filter((e) => (e._id || e.id) !== id));
    } catch (err) {
      setToast({ message: err.friendlyMessage || 'Failed to reject', type: 'error', key: Date.now() });
    } finally {
      setRejecting(null);
    }
  };

  const showNotify = (msg, type) => {
    setToast({ message: msg, type, key: Date.now() });
  };

  return (
    <div style={{ padding: '24px 28px', maxWidth: 900, margin: '0 auto' }}>
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
        <h2 style={{ fontSize: 22, fontWeight: 800, color: colors.textPrimary, margin: 0 }}>
          Approvals
        </h2>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['pending', 'history'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '8px 20px',
              borderRadius: radius.sm,
              background: tab === t ? colors.primaryBlue : colors.cardBg,
              color: tab === t ? '#FFF' : colors.textSecondary,
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
              transition: 'all 0.15s',
              border: tab === t ? 'none' : `1px solid ${colors.cardBorder}`,
            }}
          >
            {t === 'pending' ? 'Pending' : 'History'}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner style={{ padding: 60 }} />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchEntries} />
      ) : entries.length === 0 ? (
        <EmptyState
          icon={tab === 'pending' ? '✅' : '📋'}
          title={tab === 'pending' ? 'No Pending Approvals' : 'No Approval History'}
          description={tab === 'pending'
            ? 'All entries have been reviewed. Great job!'
            : 'No approval history found.'}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {entries.map((entry) => {
            const id = entry._id || entry.id;
            const type = typeStyles[entry.type] || typeStyles.Materials;
            const amount = Number(entry.amount || entry.totalAmount || 0);
            const isPending = tab === 'pending';

            return (
              <Card key={id} hoverable onClick={() => navigate('/entry-detail', { state: { entry } })}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    backgroundColor: type.bg, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: 20, flexShrink: 0,
                  }}>
                    {entry.type === 'Wages' ? '👷' : entry.type === 'Expense' ? '🏗️' : '📦'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: colors.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {entry.title || entry.name || 'Untitled'}
                      </span>
                      <Badge variant={entry.type === 'Wages' ? 'success' : entry.type === 'Expense' ? 'warning' : 'info'} style={{ fontSize: 10 }}>
                        {entry.type || 'N/A'}
                      </Badge>
                    </div>
                    <div style={{ display: 'flex', gap: 16, fontSize: 13, color: colors.textSecondary }}>
                      <span>{formatDate(entry.date || entry.createdAt)}</span>
                      <span>{entry.projectName || entry.project || '—'}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: colors.textPrimary }}>
                      {formatCurrency(amount)}
                    </div>
                    {isPending && (
                      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleApprove(id); }}
                          disabled={approving === id}
                          style={{
                            padding: '4px 12px', borderRadius: 6, border: 'none',
                            background: colors.success, color: '#FFF',
                            fontSize: 12, fontWeight: 600, cursor: 'pointer',
                            opacity: approving === id ? 0.5 : 1,
                          }}
                        >
                          {approving === id ? '...' : 'Approve'}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleReject(id); }}
                          disabled={rejecting === id}
                          style={{
                            padding: '4px 12px', borderRadius: 6, border: 'none',
                            background: colors.error, color: '#FFF',
                            fontSize: 12, fontWeight: 600, cursor: 'pointer',
                            opacity: rejecting === id ? 0.5 : 1,
                          }}
                        >
                          {rejecting === id ? '...' : 'Reject'}
                        </button>
                      </div>
                    )}
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
