import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, Badge, Button, SkeletonCard } from '../components/ui';
import { dashboardAPI, transactionAPI, projectAPI, workerAPI } from '../api';
import {
  Clock,
  TrendingUp,
  DollarSign,
  Wallet,
  PlusCircle,
  Mic,
  FileText,
  Building2,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

function formatCurrency(amount) {
  return '₹' + Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function relativeTime(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const d = new Date(dateStr);
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

const typeConfig = {
  Materials: { color: '#5B5CEB', bg: '#EEF0FF', label: 'Materials' },
  Wages: { color: '#22C55E', bg: '#F0FDF4', label: 'Labour' },
  Expense: { color: '#F59E0B', bg: '#FFFBEB', label: 'Equipment' },
  Income: { color: '#8B5CF6', bg: '#F3E8FF', label: 'Income' },
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'supervisor';

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [dashData, setDashData] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      projectAPI.getAll().catch(() => ({ data: { projects: [] } })),
      dashboardAPI.getSummary().catch(() => ({ data: null })),
      workerAPI.getAll().catch(() => ({ data: { workers: [] } })),
    ]).then(([projRes, dashRes, workerRes]) => {
      const projList = projRes.data?.projects || projRes.data || [];
      setProjects(projList);
      if (projList.length > 0 && !selectedProjectId) {
        setSelectedProjectId(projList[0]._id || projList[0].id);
      }
      setDashData(dashRes.data);
      setWorkers(workerRes.data?.workers || workerRes.data || []);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedProjectId) return;
    transactionAPI.getAll({ project: selectedProjectId }).then((txRes) => {
      const txList = txRes.data?.transactions || txRes.data || [];
      setTransactions(Array.isArray(txList) ? txList : []);
    }).catch(() => setTransactions([]));
  }, [selectedProjectId]);

  const selectedProject = projects.find((p) => (p._id || p.id) === selectedProjectId);
  const projectTransactions = useMemo(() =>
    transactions.filter((t) => {
      const pid = t.project?._id || t.project?.id || t.project;
      return !selectedProjectId || pid === selectedProjectId;
    }).sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)),
    [transactions, selectedProjectId]
  );
  const recentEntries = projectTransactions.slice(0, 5);

  const progressRaw = Number(selectedProject?.progress || 0);
  const progress = progressRaw > 1 ? progressRaw / 100 : progressRaw;
  const totalCost = Number(selectedProject?.spentAmount || 0);
  const totalRevenue = Number(selectedProject?.totalIncome || 0);
  const netCashflow = totalRevenue - totalCost;
  const budget = Number(selectedProject?.totalBudget || selectedProject?.budget?.total || 0);

  if (loading) {
    return (
      <div style={{ padding: '32px 40px', maxWidth: 1240, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {[1,2,3,4].map((i) => <SkeletonCard key={i} />)}
        </div>
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1240, margin: '0 auto', animation: 'fadeUp 300ms ease' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111827', letterSpacing: '-0.03em', margin: 0, marginBottom: 4 }}>
            Dashboard
          </h1>
          <p style={{ fontSize: 14, color: '#64748B', margin: 0 }}>
            Welcome back, {user?.name || 'User'}
          </p>
        </div>
        <Button variant="primary" size="md" icon={<PlusCircle size={16} />} onClick={() => navigate('/add-entry')}>
          Add Entry
        </Button>
      </div>

      {/* Project Selector + Progress */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 20, marginBottom: 24 }}>
        <Card padding="20px 24px">
          <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 10 }}>
            Active Project
          </div>
          <select
            value={selectedProjectId || ''}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            style={{
              width: '100%', height: 40, padding: '0 14px',
              fontSize: 14, fontWeight: 600,
              borderRadius: 8, border: '1px solid #E5E7EB',
              color: '#111827', background: '#fff',
              cursor: 'pointer', outline: 'none',
              fontFamily: 'inherit',
            }}
          >
            {projects.length === 0 && <option value="">No projects active</option>}
            {projects.map((p) => (
              <option key={p._id || p.id} value={p._id || p.id}>
                {p.projectName || p.name}
              </option>
            ))}
          </select>
          {selectedProject && (
            <div style={{ marginTop: 12, display: 'flex', gap: 12, fontSize: 13, color: '#64748B', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Building2 size={14} />
                {selectedProject.location || selectedProject.city || 'Surathkal'}
              </span>
              <Badge variant={selectedProject.status === 'Active' ? 'success' : selectedProject.status === 'On Hold' ? 'warning' : 'info'}>
                {selectedProject.status || 'Active'}
              </Badge>
            </div>
          )}
        </Card>

        <Card padding="20px 24px">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Badge variant="info" size="sm">
              <TrendingUp size={11} style={{ marginRight: 3 }} /> Overall Progress
            </Badge>
            {selectedProject?.city && (
              <span style={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>
                {selectedProject.city}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
            <span style={{ fontSize: 30, fontWeight: 800, color: '#111827', letterSpacing: '-0.04em' }}>
              {(progress * 100).toFixed(1)}%
            </span>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>
                {selectedProject?.projectName || selectedProject?.name || 'House Construction'}
              </div>
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 1 }}>Current Milestone</div>
            </div>
          </div>
          <div style={{ height: 6, background: '#F1F5F9', borderRadius: 3, marginBottom: 8, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 3,
              background: '#5B5CEB',
              width: `${Math.min((progress * 100), 100)}%`,
              transition: 'width 0.5s ease',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 500 }}>
            <span style={{ color: '#64748B' }}>Progress Status</span>
            <span style={{ color: '#5B5CEB', fontWeight: 600 }}>
              {(progress * 100).toFixed(0)}% Completed
            </span>
          </div>
        </Card>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Cost', value: formatCurrency(totalCost), subtitle: budget > 0 ? `${((totalCost / budget) * 100).toFixed(0)}% Used` : '—', icon: Wallet, color: '#5B5CEB', alert: budget > 0 && totalCost > budget * 0.9 },
          { label: 'Budget', value: formatCurrency(budget), subtitle: `Remaining: ${formatCurrency(Math.max(budget - totalCost, 0))}`, icon: DollarSign, color: '#8B5CF6' },
          { label: 'Total Revenue', value: formatCurrency(totalRevenue), subtitle: 'Cash Inflow', icon: ArrowUpRight, color: '#22C55E' },
          { label: 'Net Cash Flow', value: formatCurrency(Math.abs(netCashflow)), subtitle: netCashflow >= 0 ? 'Net Profit' : 'Net Loss', icon: ArrowDownRight, color: netCashflow >= 0 ? '#22C55E' : '#EF4444', alert: netCashflow < 0 },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} style={{
              background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB',
              padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16,
              transition: 'box-shadow 150ms ease',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 10,
                background: kpi.alert ? '#FEF2F2' : '#F1F5F9',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: kpi.alert ? '#EF4444' : kpi.color, flexShrink: 0,
              }}>
                <Icon size={20} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: kpi.alert ? '#EF4444' : '#111827', letterSpacing: '-0.03em' }}>
                  {kpi.value}
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', letterSpacing: '0.04em', textTransform: 'uppercase', marginTop: 1 }}>
                  {kpi.label}
                </div>
                <div style={{ fontSize: 12, color: kpi.alert ? '#EF4444' : '#64748B', marginTop: 2 }}>
                  {kpi.subtitle}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card padding="20px 24px" style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 16 }}>
          Quick Actions
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { label: 'Add Entry', desc: 'Log a transaction', icon: PlusCircle, path: '/add-entry', color: '#5B5CEB' },
            { label: 'Voice Entry', desc: 'Record via voice', icon: Mic, path: '/voice', color: '#22C55E' },
            { label: 'Manual Entry', desc: 'Enter details', icon: FileText, path: '/manualentry', color: '#F59E0B' },
            { label: 'View Projects', desc: 'Browse all projects', icon: Building2, path: '/projects', color: '#8B5CF6' },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                style={{
                  padding: '16px', borderRadius: 10,
                  border: '1px solid #E5E7EB', background: '#fff',
                  cursor: 'pointer', textAlign: 'left',
                  display: 'flex', flexDirection: 'column', gap: 6,
                  transition: 'all 150ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = action.color;
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: `${action.color}10`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: action.color,
                  }}>
                    <Icon size={16} />
                  </div>
                  <ChevronRight size={14} color="#94A3B8" />
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{action.label}</div>
                <div style={{ fontSize: 12, color: '#64748B' }}>{action.desc}</div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Recent Activity Log */}
      <Card padding="0">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #E5E7EB' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Recent Activity Log
          </div>
          <button onClick={() => navigate('/transaction')} style={{
            border: 'none', background: 'transparent', cursor: 'pointer',
            fontSize: 13, fontWeight: 600, color: '#5B5CEB',
            display: 'flex', alignItems: 'center', gap: 4,
            transition: 'color 150ms ease',
          }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#4B4CDB'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#5B5CEB'; }}
          >
            View All <ChevronRight size={14} />
          </button>
        </div>
        {recentEntries.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 12px', color: '#94A3B8',
            }}>
              <Clock size={18} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 4 }}>No recent entries</div>
            <div style={{ fontSize: 13, color: '#64748B' }}>Transactions you add will appear here.</div>
          </div>
        ) : (
          recentEntries.map((entry, i) => {
            const type = typeConfig[entry.type] || typeConfig.Materials;
            const amt = Number(entry.amount || entry.totalAmount || 0);
            return (
              <div key={entry._id || entry.id || i} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 24px',
                borderBottom: i < recentEntries.length - 1 ? '1px solid #E5E7EB' : 'none',
                cursor: 'pointer', transition: 'background 150ms ease',
              }}
                onClick={() => navigate('/entry-detail', { state: { entry } })}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#F8FAFC'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: type.bg, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <DollarSign size={16} color={type.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 2 }}>
                    {entry.title || entry.name || 'Entry'}
                  </div>
                  <div style={{ display: 'flex', gap: 8, fontSize: 12, color: '#64748B', alignItems: 'center', flexWrap: 'wrap' }}>
                    <Badge variant={entry.type === 'Wages' ? 'success' : entry.type === 'Expense' ? 'warning' : 'info'} size="sm">
                      {type.label}
                    </Badge>
                    <span>{typeof entry.project === 'object' ? (entry.project?.projectName || entry.project?.name || '') : (entry.projectName || entry.project || '')}</span>
                    <span>{relativeTime(entry.date || entry.createdAt)}</span>
                  </div>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', whiteSpace: 'nowrap' }}>
                  {formatCurrency(Math.abs(amt))}
                </div>
              </div>
            );
          })
        )}
      </Card>
    </div>
  );
}
