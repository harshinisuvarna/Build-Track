import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { colors, radius, typography } from '../styles/designTokens';
import { Card, Badge, Button, SkeletonCard } from '../components/ui';
import { dashboardAPI, transactionAPI, projectAPI, workerAPI } from '../api';
import { Shield, TrendingUp, CheckCircle, AlertTriangle, HelpCircle, Activity, LayoutGrid, Calendar, ChevronRight } from 'lucide-react';

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
  Materials: { icon: '📦', bg: '#EEF0FF', color: '#4361EE', label: 'Materials' },
  Wages: { icon: '👷', bg: '#F0FDF4', color: '#15803D', label: 'Labour' },
  Expense: { icon: '🏗️', bg: '#FFF7ED', color: '#C2410C', label: 'Equipment' },
  Income: { icon: '💰', bg: '#F3E8FF', color: '#7C3AED', label: 'Income' },
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
      transactionAPI.getAll({ limit: 10 }).catch(() => ({ data: { transactions: [] } })),
      workerAPI.getAll().catch(() => ({ data: { workers: [] } })),
    ]).then(([projRes, dashRes, txRes, workerRes]) => {
      const projList = projRes.data?.projects || projRes.data || [];
      setProjects(projList);
      if (projList.length > 0 && !selectedProjectId) {
        setSelectedProjectId(projList[0]._id || projList[0].id);
      }
      setDashData(dashRes.data);
      const txList = txRes.data?.transactions || txRes.data || [];
      setTransactions(Array.isArray(txList) ? txList : []);
      setWorkers(workerRes.data?.workers || workerRes.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const selectedProject = projects.find((p) => (p._id || p.id) === selectedProjectId);
  const projectTransactions = useMemo(() =>
    transactions.filter((t) => {
      const pid = t.project?._id || t.project?.id || t.project;
      return !selectedProjectId || pid === selectedProjectId;
    }).sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)),
    [transactions, selectedProjectId]
  );
  const recentEntries = projectTransactions.slice(0, 5);

  const totalCost = projectTransactions
    .filter((t) => t.type !== 'Income')
    .reduce((s, t) => s + Math.abs(Number(t.amount || t.totalAmount || 0)), 0);
  const totalRevenue = projectTransactions
    .filter((t) => t.type === 'Income')
    .reduce((s, t) => s + Math.abs(Number(t.amount || t.totalAmount || 0)), 0);
  const netCashflow = totalRevenue - totalCost;
  const budget = Number(selectedProject?.totalBudget || selectedProject?.budget || 0);
  const progress = Number(selectedProject?.progress || 0) / 100;

  const weeklyData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().slice(0, 10);
      const dayTxs = transactions.filter((t) => {
        const txDate = (t.date || t.createdAt || '').slice(0, 10);
        return txDate === dayStr;
      });
      const income = dayTxs.filter((t) => t.type === 'Income').reduce((s, t) => s + Math.abs(Number(t.amount || 0)), 0);
      const expense = dayTxs.filter((t) => t.type !== 'Income').reduce((s, t) => s + Math.abs(Number(t.amount || 0)), 0);
      const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      days.push({ day: labels[d.getDay()], income, expense });
    }
    return days;
  }, [transactions]);

  const maxVal = Math.max(...weeklyData.map((d) => Math.max(d.income, d.expense)), 1);

  if (loading) {
    return (
      <div style={{ padding: '24px 28px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {[1,2,3,4].map((i) => <SkeletonCard key={i} />)}
        </div>
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1240, margin: '0 auto' }}>
      
      {/* Header Row resembling Nurofin */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: '10px',
            background: 'rgba(67, 97, 238, 0.1)', display: 'flex',
            alignItems: 'center', justifyContent: 'center'
          }}>
            <Shield size={20} color="#4361EE" />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: '#111827', letterSpacing: '-0.5px', margin: 0 }}>
              Dashboard Overview
            </h1>
            <p style={{ fontSize: 13.5, color: '#6B7280', margin: '3px 0 0' }}>
              Welcome back, {user?.name || 'harshini'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            onClick={() => navigate('/notifications')}
            style={{
              width: 36, height: 36, borderRadius: '50%',
              border: '1px solid #E8EAF0', background: '#FFFFFF',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#4B5563', boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}
          >
            🔔
          </button>
          <button
            onClick={() => navigate('/settings')}
            style={{
              width: 36, height: 36, borderRadius: '50%',
              border: '1px solid #E8EAF0', background: '#FFFFFF',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}
          >
            👤
          </button>
        </div>
      </div>

      {/* Project Selector & Progress Card row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 20, marginBottom: 24 }}>
        {/* Project Selector */}
        <Card padding="20px 24px">
          <div style={{ fontSize: 10, fontWeight: 800, color: '#9CA3AF', letterSpacing: '1px', marginBottom: 10, textTransform: 'uppercase' }}>
            ACTIVE PROJECT
          </div>
          <select
            value={selectedProjectId || ''}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            style={{
              width: '100%', padding: '12px 14px', fontSize: 14,
              borderRadius: radius.md, border: '1.5px solid #E8EAF0',
              fontFamily: typography.fontFamily, fontWeight: 700,
              color: '#111827', background: '#FFFFFF',
              cursor: 'pointer', outline: 'none',
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
            <div style={{ marginTop: 14, display: 'flex', gap: 16, fontSize: 13, color: '#6B7280', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>📍 {selectedProject.location || selectedProject.city || 'surathkal'}</span>
              <Badge variant={selectedProject.status === 'Active' ? 'success' : selectedProject.status === 'On Hold' ? 'warning' : 'info'}>
                {selectedProject.status || 'Active'}
              </Badge>
            </div>
          )}
        </Card>

        {/* Progress Card */}
        <Card padding="20px 24px">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{
              padding: '3px 10px', borderRadius: 20,
              background: 'rgba(67, 97, 238, 0.08)',
              fontSize: 10, fontWeight: 800, color: '#4361EE',
              letterSpacing: '0.8px', display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <TrendingUp size={12} /> OVERALL PROGRESS
            </div>
            {selectedProject?.city && (
              <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>
                📍 {selectedProject.city}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
            <span style={{ fontSize: 34, fontWeight: 900, color: '#111827', letterSpacing: '-1.5px' }}>
              {(progress * 100).toFixed(1)}%
            </span>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 14.5, fontWeight: 800, color: '#111827' }}>
                {selectedProject?.projectName || selectedProject?.name || 'House construction'}
              </div>
              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 1 }}>Current Milestone</div>
            </div>
          </div>
          <div style={{ height: 8, background: '#EEF2FF', borderRadius: 4, marginBottom: 8, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 4,
              background: 'linear-gradient(90deg, #4361EE 0%, #7B5EA7 100%)',
              width: `${(progress * 100).toFixed(1)}%`,
              transition: 'width 0.5s ease',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600 }}>
            <span style={{ color: '#6B7280' }}>Progress status</span>
            <span style={{ color: '#7B5EA7', fontWeight: 800 }}>
              {(progress * 100).toFixed(0)}% Completed
            </span>
          </div>
        </Card>
      </div>

      {/* KPI Cards styled exactly like Nurofin */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'TOTAL COST', value: formatCurrency(totalCost), subtitle: budget > 0 ? `${((totalCost / budget) * 100).toFixed(0)}% Used` : '—', alert: totalCost > budget * 0.9, icon: '⏱️', bg: 'rgba(67,97,238,0.08)', color: '#4361EE' },
          { label: 'BUDGET', value: formatCurrency(budget), subtitle: `Remaining: ${formatCurrency(Math.max(budget - totalCost, 0))}`, icon: '💼', bg: 'rgba(123,94,167,0.08)', color: '#7B5EA7' },
          { label: 'TOTAL REVENUE', value: formatCurrency(totalRevenue), subtitle: 'Cash Inflow', icon: '✅', bg: 'rgba(21,128,61,0.08)', color: '#15803D' },
          { label: 'NET CASH FLOW', value: formatCurrency(Math.abs(netCashflow)), subtitle: netCashflow >= 0 ? 'Net Profit' : 'Net Loss', alert: netCashflow < 0, icon: '🚨', bg: 'rgba(239,68,68,0.08)', color: '#EF4444' },
        ].map((kpi) => (
          <Card key={kpi.label} padding="16px 20px" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: '12px',
              background: kpi.bg, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: 18, color: kpi.color, flexShrink: 0
            }}>
              {kpi.icon}
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color: kpi.alert ? colors.error : '#111827', letterSpacing: '-0.5px' }}>
                {kpi.value}
              </div>
              <div style={{ fontSize: 9.5, fontWeight: 800, color: '#9CA3AF', letterSpacing: '0.8px', marginTop: 1 }}>
                {kpi.label}
              </div>
              <div style={{ fontSize: 11, color: kpi.alert ? colors.error : '#6B7280', fontWeight: 600, marginTop: 2 }}>
                {kpi.subtitle}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Weekly Chart + Quick Actions row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Weekly Performance Chart */}
        <Card padding="20px 24px">
          <div style={{ fontSize: 13, fontWeight: 800, color: '#9CA3AF', letterSpacing: '0.8px', marginBottom: 18, textTransform: 'uppercase' }}>
            Weekly Performance
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 140 }}>
            {weeklyData.map((d, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ position: 'relative', width: '100%', height: 120, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                  <div style={{
                    width: '100%',
                    height: `${(d.income / maxVal) * 100}%`,
                    background: 'linear-gradient(135deg, #4361EE 0%, #7B5EA7 100%)',
                    borderRadius: '4px 4px 0 0',
                    minHeight: d.income > 0 ? 4 : 0,
                    transition: 'height 0.3s',
                  }} />
                  <div style={{
                    width: '100%',
                    height: `${(d.expense / maxVal) * 100}%`,
                    background: '#7B5EA7',
                    borderRadius: '4px 4px 0 0',
                    minHeight: d.expense > 0 ? 4 : 0,
                    opacity: 0.6,
                    transition: 'height 0.3s',
                  }} />
                </div>
                <span style={{ fontSize: 10, color: '#6B7280', fontWeight: 700 }}>{d.day.slice(0, 3)}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 14, fontSize: 12, color: '#6B7280', fontWeight: 600 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: 'linear-gradient(135deg, #4361EE 0%, #7B5EA7 100%)' }} /> Income
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: '#7B5EA7', opacity: 0.6 }} /> Expenses
            </span>
          </div>
        </Card>

        {/* Quick Actions */}
        <Card padding="20px 24px">
          <div style={{ fontSize: 13, fontWeight: 800, color: '#9CA3AF', letterSpacing: '0.8px', marginBottom: 16, textTransform: 'uppercase' }}>
            Quick Actions
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <button onClick={() => navigate('/add-entry')} style={{
              padding: '16px', borderRadius: radius.md,
              border: '1.5px solid #E8EAF0', background: '#EEF2FF',
              cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s ease',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#4361EE'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#E8EAF0'; e.currentTarget.style.transform = 'none'; }}
            >
              <div style={{ fontSize: 24, marginBottom: 6 }}>📦</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#4361EE' }}>Add Entry</div>
            </button>
            <button onClick={() => navigate('/manualentry')} style={{
              padding: '16px', borderRadius: radius.md,
              border: '1.5px solid #E8EAF0', background: '#F0FDF4',
              cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s ease',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#15803D'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#E8EAF0'; e.currentTarget.style.transform = 'none'; }}
            >
              <div style={{ fontSize: 24, marginBottom: 6 }}>✍️</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#15803D' }}>Manual Entry</div>
            </button>
            <button onClick={() => navigate('/projects')} style={{
              padding: '16px', borderRadius: radius.md,
              border: '1.5px solid #E8EAF0', background: '#FFF7ED',
              cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s ease',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#C2410C'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#E8EAF0'; e.currentTarget.style.transform = 'none'; }}
            >
              <div style={{ fontSize: 24, marginBottom: 6 }}>🏗️</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#C2410C' }}>Projects</div>
            </button>
            <button onClick={() => navigate('/reports')} style={{
              padding: '16px', borderRadius: radius.md,
              border: '1.5px solid #E8EAF0', background: '#F3E8FF',
              cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s ease',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#7C3AED'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#E8EAF0'; e.currentTarget.style.transform = 'none'; }}
            >
              <div style={{ fontSize: 24, marginBottom: 6 }}>📊</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#7C3AED' }}>Reports</div>
            </button>
          </div>
        </Card>
      </div>

      {/* Recent Activity Section styled like Nurofin list */}
      <Card padding="0">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #E8EAF0' }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#9CA3AF', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
            Recent Activity Log
          </div>
          <button onClick={() => navigate('/transaction')} style={{
            border: 'none', background: 'transparent', cursor: 'pointer',
            fontSize: 12.5, fontWeight: 800, color: '#4361EE', display: 'flex', alignItems: 'center', gap: 4
          }}>
            View All <ChevronRight size={14} />
          </button>
        </div>
        {recentEntries.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.4 }}>📋</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 4 }}>No recent entries</div>
            <div style={{ fontSize: 12, color: '#6B7280' }}>Updates you add will appear here.</div>
          </div>
        ) : (
          recentEntries.map((entry, i) => {
            const type = typeConfig[entry.type] || typeConfig.Materials;
            const amt = Number(entry.amount || entry.totalAmount || 0);
            return (
              <div key={entry._id || entry.id || i} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '16px 24px',
                borderBottom: i < recentEntries.length - 1 ? '1px solid #E8EAF0' : 'none',
                cursor: 'pointer', transition: 'background 0.15s ease',
              }}
                onClick={() => navigate('/entry-detail', { state: { entry } })}
                onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: type.bg, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0,
                }}>
                  {type.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 2 }}>
                    {entry.title || entry.name || 'Entry'}
                  </div>
                  <div style={{ display: 'flex', gap: 10, fontSize: 12, color: '#6B7280', alignItems: 'center' }}>
                    <Badge variant={entry.type === 'Wages' ? 'success' : entry.type === 'Expense' ? 'warning' : 'info'} style={{ fontSize: 10, padding: '1px 8px', borderRadius: 6 }}>
                      {type.label}
                    </Badge>
                    <span>{entry.projectName || entry.project || ''}</span>
                    <span>{relativeTime(entry.date || entry.createdAt)}</span>
                  </div>
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: amt < 0 ? colors.error : '#111827' }}>
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
