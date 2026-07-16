import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, Badge, Button, Spinner } from '../components/ui';
import { transactionAPI } from '../api';
import {
  Package, User, Wrench, DollarSign, ArrowLeft, Trash2, Calendar,
  CreditCard, Building2, Hash, FileText, AlertTriangle, CheckCircle,
  XCircle, Clock, MapPin, Phone, UserCheck,
} from 'lucide-react';

const typeConfig = {
  Materials: { label: 'Material', bg: '#EEF0FF', color: '#5B5CEB', icon: <Package size={18} /> },
  Wages: { label: 'Labour', bg: '#F0FDF4', color: '#22C55E', icon: <User size={18} /> },
  Expense: { label: 'Equipment', bg: '#FFF7ED', color: '#F97316', icon: <Wrench size={18} /> },
  Income: { label: 'Income', bg: '#F3E8FF', color: '#8B5CF6', icon: <DollarSign size={18} /> },
};

function formatCurrency(amount) {
  return '\u20B9' + Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function formatDate(dateStr) {
  if (!dateStr) return '\u2014';
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
        <AlertTriangle size={48} color="#CBD5E1" style={{ marginBottom: 16 }} />
        <h3 style={{ color: '#111827', margin: '0 0 8px', fontWeight: 700 }}>No Entry Data</h3>
        <p style={{ color: '#64748B', marginBottom: 20 }}>Please navigate here from a transaction or entry list.</p>
        <Button variant="secondary" size="md" onClick={() => navigate(-1)}>
          <ArrowLeft size={14} /> Go Back
        </Button>
      </div>
    );
  }

  if (deleted) {
    return (
      <div style={{ padding: '40px 28px', textAlign: 'center' }}>
        <CheckCircle size={48} color="#22C55E" style={{ marginBottom: 16 }} />
        <h3 style={{ color: '#111827', margin: '0 0 8px', fontWeight: 700 }}>Entry Deleted</h3>
        <p style={{ color: '#64748B', marginBottom: 20 }}>This entry has been successfully removed.</p>
        <Button variant="secondary" size="md" onClick={() => navigate(-1)}>
          <ArrowLeft size={14} /> Go Back
        </Button>
      </div>
    );
  }

  const tc = typeConfig[entry.type] || { label: 'Entry', bg: '#F1F5F9', color: '#64748B', icon: <FileText size={18} /> };

  const fields = [
    { icon: <Calendar size={14} />, label: 'Date', value: formatDate(entry.date) },
    { icon: <Hash size={14} />, label: 'Entry ID', value: entry._id || entry.id || '\u2014' },
    { icon: <Building2 size={14} />, label: 'Project', value: entry.project?.projectName || entry.projectName || '\u2014' },
    { icon: <MapPin size={14} />, label: 'Location/Site', value: entry.site || entry.location || '\u2014' },
    { icon: <User size={14} />, label: 'Supplier/Vendor', value: entry.supplier || entry.vendor || entry.contractor || entry.workerName || '\u2014' },
    { icon: <UserCheck size={14} />, label: 'Operator/Worker', value: entry.operator || entry.workerName || '\u2014' },
    { icon: <Phone size={14} />, label: 'Contact', value: entry.contact || entry.phone || '\u2014' },
    { icon: <FileText size={14} />, label: 'Category', value: entry.category || entry.materialType || entry.workType || '\u2014' },
    { icon: <Package size={14} />, label: 'Quantity', value: entry.quantity ? `${entry.quantity} ${entry.unit || ''}` : '\u2014' },
    { icon: <CreditCard size={14} />, label: 'Rate', value: entry.rate ? formatCurrency(entry.rate) : '\u2014' },
    { icon: <DollarSign size={14} />, label: 'Amount', value: formatCurrency(entry.amount), highlight: true },
    { icon: <CheckCircle size={14} />, label: 'Payment Status', value: entry.paymentStatus || '\u2014' },
  ];

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await transactionAPI.delete(entry._id || entry.id);
      setDeleted(true);
    } catch {
      setDeleting(false);
      setShowDelete(false);
    }
  };

  return (
    <div style={{ padding: '24px 28px', maxWidth: 680, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate(-1)}
            style={{ border: 'none', background: '#F1F5F9', cursor: 'pointer', width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0, letterSpacing: '-0.03em' }}>Entry Details</h2>
            <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0' }}>{entry.title || tc.label}</p>
          </div>
        </div>
        <button onClick={() => setShowDelete(true)}
          style={{ border: '1px solid #FECACA', borderRadius: 8, padding: '8px 14px', background: '#fff', color: '#EF4444', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}>
          <Trash2 size={14} /> Delete
        </button>
      </div>

      {/* Type Badge + Amount */}
      <Card padding="20px" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: tc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: tc.color }}>
              {tc.icon}
            </div>
            <div>
              <Badge variant={entry.type === 'Wages' ? 'success' : entry.type === 'Expense' ? 'warning' : 'info'} size="sm">{tc.label}</Badge>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginTop: 6 }}>{entry.title || 'Untitled Entry'}</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: entry.type === 'Income' ? '#22C55E' : '#111827', letterSpacing: '-0.03em' }}>
              {entry.type === 'Income' ? '+' : '-'}{formatCurrency(entry.amount)}
            </div>
            <Badge variant={entry.paymentStatus === 'Paid' ? 'success' : entry.paymentStatus === 'Partial' ? 'warning' : 'info'} size="sm">{entry.paymentStatus || '\u2014'}</Badge>
          </div>
        </div>
      </Card>

      {/* Details Grid */}
      <Card padding="20px" style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: '0 0 14px' }}>Entry Information</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
          {fields.map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid #F8FAFC' }}>
              <span style={{ color: '#94A3B8', display: 'flex', flexShrink: 0 }}>{f.icon}</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8', letterSpacing: '0.03em', textTransform: 'uppercase' }}>{f.label}</div>
                <div style={{ fontSize: 13, fontWeight: f.highlight ? 700 : 500, color: f.highlight ? '#5B5CEB' : '#111827' }}>{f.value}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Notes */}
      {entry.notes && (
        <Card padding="20px" style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: '0 0 10px' }}>Notes</h3>
          <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, margin: 0 }}>{entry.notes}</p>
        </Card>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10 }}>
        <Button variant="secondary" size="md" fullWidth onClick={() => navigate('/manualentry', { state: { transaction: { ...entry, isEditing: true } } })}>
          <FileText size={14} /> Edit Entry
        </Button>
      </div>

      {/* Delete Confirmation */}
      {showDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}
          onClick={() => setShowDelete(false)}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, maxWidth: 400, width: '100%' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>Delete Entry?</h3>
            <p style={{ fontSize: 13, color: '#64748B', marginBottom: 20 }}>This action cannot be undone. Are you sure you want to delete this entry?</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <Button variant="secondary" size="md" fullWidth onClick={() => setShowDelete(false)} disabled={deleting}>Cancel</Button>
              <Button variant="danger" size="md" fullWidth onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
