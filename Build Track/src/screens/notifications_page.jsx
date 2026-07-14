import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { colors, radius } from '../styles/designTokens';
import { Card, Badge, Button, EmptyState } from '../components/ui';

function formatTimeAgo(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

const sampleNotifications = [
  { id: 1, type: 'approval', title: 'New Entry Pending Approval', message: 'Ravi Kumar added a Material entry for Greenwood Heights. ₹45,000 pending your review.', time: '2026-07-14T10:30:00', read: false },
  { id: 2, type: 'payment', title: 'Payment Received', message: 'Payment of ₹1,20,000 has been received for Riverside Project - Phase 2.', time: '2026-07-14T08:15:00', read: false },
  { id: 3, type: 'inventory', title: 'Low Stock Alert', message: 'Cement (PPC 43 Grade) is running low at Oakwood Extension. Current stock: 12 bags.', time: '2026-07-13T16:45:00', read: true },
  { id: 4, type: 'project', title: 'Project Milestone Reached', message: 'Greenwood Heights has reached 60% completion - MEP Works phase started.', time: '2026-07-13T11:20:00', read: true },
  { id: 5, type: 'worker', title: 'Worker Attendance Updated', message: 'Weekly attendance report for Greenwood Heights is now available.', time: '2026-07-12T09:00:00', read: true },
];

const typeIcons = {
  approval: '✅',
  payment: '💰',
  inventory: '📦',
  project: '🏗️',
  worker: '👷',
  system: '🔔',
};

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [notifications, setNotifications] = useState(sampleNotifications);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const filtered = filter === 'all' ? notifications : filter === 'unread' ? notifications.filter((n) => !n.read) : notifications;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <div style={{ padding: '24px 28px', maxWidth: 700, margin: '0 auto' }}>
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
            Notifications
            {unreadCount > 0 && (
              <span style={{
                marginLeft: 8,
                background: colors.error,
                color: '#FFF',
                fontSize: 12,
                padding: '2px 8px',
                borderRadius: 10,
                fontWeight: 600,
              }}>
                {unreadCount}
              </span>
            )}
          </h2>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {unreadCount > 0 && (
            <Button variant="ghost" onClick={markAllRead} style={{ height: 36, fontSize: 13, padding: '0 14px' }}>
              Mark All Read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button variant="ghost" onClick={clearAll} style={{ height: 36, fontSize: 13, padding: '0 14px', color: colors.error }}>
              Clear All
            </Button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[
          { id: 'all', label: 'All', count: notifications.length },
          { id: 'unread', label: 'Unread', count: unreadCount },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id)}
            style={{
              padding: '8px 18px', borderRadius: radius.sm,
              border: filter === t.id ? 'none' : `1px solid ${colors.cardBorder}`,
              background: filter === t.id ? colors.primaryBlue : colors.cardBg,
              color: filter === t.id ? '#FFF' : colors.textSecondary,
              fontWeight: 600, fontSize: 14, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            {t.label}
            <span style={{
              background: filter === t.id ? 'rgba(255,255,255,0.2)' : colors.iconBg,
              padding: '1px 8px', borderRadius: 10, fontSize: 12,
            }}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="🔔"
          title="No Notifications"
          description={filter === 'unread' ? 'No unread notifications.' : 'You\'re all caught up!'}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map((n) => (
            <Card key={n.id} padding="16px 20px" hoverable
              onClick={() => {
                setNotifications((prev) => prev.map((item) => item.id === n.id ? { ...item, read: true } : item));
              }}
              style={{
                opacity: n.read ? 0.7 : 1,
                borderLeft: n.read ? `0.5px solid ${colors.cardBorder}` : `3px solid ${colors.primaryBlue}`,
              }}
            >
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: n.read ? colors.iconBg : '#EEF0FF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, flexShrink: 0,
                }}>
                  {typeIcons[n.type] || '🔔'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <h4 style={{
                      fontSize: 14, fontWeight: n.read ? 500 : 700,
                      color: colors.textPrimary, margin: 0,
                    }}>
                      {n.title}
                    </h4>
                    <span style={{ fontSize: 11, color: colors.textSecondary, flexShrink: 0, marginLeft: 8 }}>
                      {formatTimeAgo(n.time)}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 1.5, margin: 0 }}>
                    {n.message}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
