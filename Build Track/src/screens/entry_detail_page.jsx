import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { colors, radius, typography } from '../styles/designTokens';
import { Card, Badge, Button, Spinner, ConfirmDialog } from '../components/ui';
import { transactionAPI } from '../api';

const typeConfig = {
  Materials: { label: 'Material', bg: '#ECEBFF', color: '#6C63FF', icon: '📦' },
  Wages: { label: 'Labour', bg: '#E8F5E9', color: '#2E7D32', icon: '👷' },
  Expense: { label: 'Equipment', bg: '#FFF3E0', color: '#E65100', icon: '🏗️' },
  Income: { label: 'Income', bg: '#F3E8FF', color: '#7C3AED', icon: '💰' },
};

function formatCurrency(amount) {
  return '₹' + Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return dateStr; }
}

export default function EntryDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const entry = location.state?.entry;

  const [deleting, setDeleting] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleted, setDeleted] = useState(false);

  if (!entry) {
    return (
      <div style={{ padding: '40px 28px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <h3 style={{ color: colors.textPrimary, marginBottom: 8 }}>No Entry Data</h3>
        <p style={{ color: colors.textSecondary, marginBottom: 20 }}>
          Please navigate here from a transaction or entry list.
        </p>
        <Button variant="ghost" onClick={() => navigate(-1)}>← Go Back</Button>
      </div>
    );
  }

  if (deleted) {
    return (
      <div style={{ padding: '40px 28px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🗑️</div>
        <h3 style={{ color: colors.textPrimary, marginBottom: 8 }}>Entry Deleted</h3>
        <p style={{ color: colors.textSecondary, marginBottom: 20 }}>
          The entry has been permanently removed.
        </p>
        <Button variant="ghost" onClick={() => navigate('/transaction')}>
          ← Back to Transactions
        </Button>
      </div>
    );
  }

  const type = typeConfig[entry.type] || typeConfig.Materials;
  const amount = Number(entry.amount || entry.totalAmount || 0);
  const paidAmount = Number(entry.paidAmount || 0);
  const balance = amount - paidAmount;
  const paymentHistory = entry.paymentHistory || [];
  const paymentStatus = entry.paymentStatus || 'Pending';

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await transactionAPI.delete(entry._id || entry.id);
      setDeleted(true);
    } catch {
      alert('Failed to delete entry');
    } finally {
      setDeleting(false);
      setShowDelete(false);
    }
  };

  return (
    <div style={{ padding: '24px 28px', maxWidth: 700, margin: '0 auto' }}>
      <ConfirmDialog
        open={showDelete}
        message="This action cannot be undone. The entry will be permanently removed."
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
        confirmLabel="Delete"
        danger
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
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
          Entry Details
        </h2>
      </div>

      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            backgroundColor: type.bg, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: 24,
          }}>
            {type.icon}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: colors.textPrimary, margin: 0 }}>
                {entry.title || entry.name || 'Untitled'}
              </h3>
              <Badge variant={paymentStatus === 'Paid' ? 'success' : paymentStatus === 'Pending' ? 'pending' : 'warning'}>
                {paymentStatus}
              </Badge>
            </div>
            <Badge variant="info">{type.label}</Badge>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 2 }}>Amount</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: colors.textPrimary }}>
              {formatCurrency(amount)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 2 }}>Paid</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: colors.success }}>
              {formatCurrency(paidAmount)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 2 }}>Balance</div>
            <div style={{
              fontSize: 18, fontWeight: 700,
              color: balance <= 0 ? colors.success : colors.warning,
            }}>
              {formatCurrency(balance)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 2 }}>Date</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: colors.textPrimary }}>
              {formatDate(entry.date || entry.createdAt)}
            </div>
          </div>
        </div>

        {(entry.project || entry.projectName) && (
          <div style={{ paddingTop: 16, borderTop: `1px solid ${colors.divider}` }}>
            <div style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 2 }}>Project</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: colors.textPrimary }}>
              {entry.projectName || entry.project}
            </div>
          </div>
        )}

        {entry.notes && (
          <div style={{ paddingTop: 16, borderTop: `1px solid ${colors.divider}` }}>
            <div style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>Notes</div>
            <div style={{ fontSize: 14, color: colors.textMedium, lineHeight: 1.5 }}>{entry.notes}</div>
          </div>
        )}
      </Card>

      {entry.quantity > 0 && (
        <Card style={{ marginBottom: 20 }}>
          <h4 style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.3px', color: colors.textSecondary, marginBottom: 12, textTransform: 'uppercase' }}>
            Details
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            {entry.quantity && (
              <div>
                <div style={{ fontSize: 11, color: colors.textSecondary }}>Quantity</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: colors.textPrimary }}>{entry.quantity}</div>
              </div>
            )}
            {entry.unit && (
              <div>
                <div style={{ fontSize: 11, color: colors.textSecondary }}>Unit</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: colors.textPrimary }}>{entry.unit}</div>
              </div>
            )}
            {entry.rate > 0 && (
              <div>
                <div style={{ fontSize: 11, color: colors.textSecondary }}>Rate</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: colors.textPrimary }}>
                  {formatCurrency(entry.rate)}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {paymentHistory.length > 0 && (
        <Card style={{ marginBottom: 20 }}>
          <h4 style={{
            fontSize: 11, fontWeight: 800, color: colors.textSecondary,
            letterSpacing: '1px', marginBottom: 14, textTransform: 'uppercase',
          }}>
            Payment History
          </h4>
          {paymentHistory.map((pmt, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 0', borderBottom: i < paymentHistory.length - 1 ? `1px solid ${colors.divider}` : 'none',
            }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary }}>
                  {formatDate(pmt.date || pmt.paymentDate)}
                </div>
                <Badge variant="info" style={{ fontSize: 10, padding: '2px 8px', marginTop: 4 }}>
                  {(pmt.method || 'Cash').toUpperCase()}
                </Badge>
              </div>
              <div style={{ fontSize: 15, fontWeight: 900, color: colors.success }}>
                {formatCurrency(pmt.amount || 0)}
              </div>
            </div>
          ))}
        </Card>
      )}

      <div style={{ display: 'flex', gap: 12 }}>
        <Button variant="ghost" onClick={() => navigate(-1)} style={{ flex: 1 }}>
          ← Back
        </Button>
        <Button
          variant="danger"
          onClick={() => setShowDelete(true)}
          loading={deleting}
          style={{ flex: 1 }}
        >
          Delete Entry
        </Button>
      </div>
    </div>
  );
}
