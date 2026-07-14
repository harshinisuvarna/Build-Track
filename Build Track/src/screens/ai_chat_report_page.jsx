import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { colors, radius } from '../styles/designTokens';
import { Card, Button, Spinner, EmptyState } from '../components/ui';

const suggestions = [
  'Show total expenses this month',
  'Compare income vs expenses for last quarter',
  'Which project has the highest spending?',
  'Show me the worker wage breakdown',
];

export default function AiChatReportPage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hello! Ask me anything about your project data, finances, or reports.' },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text) => {
    const query = (text || input).trim();
    if (!query || sending) return;

    setMessages((prev) => [...prev, { role: 'user', text: query }]);
    setInput('');
    setSending(true);

    setTimeout(() => {
      const response = generateResponse(query);
      setMessages((prev) => [...prev, { role: 'assistant', text: response }]);
      setSending(false);
    }, 1000);
  };

  const generateResponse = (query) => {
    const q = query.toLowerCase();
    if (q.includes('expense') || q.includes('spend')) {
      return 'Based on your transaction data, total expenses this month are ₹4,82,500. The largest categories are:\n• Materials: ₹2,15,000\n• Labour: ₹1,68,000\n• Equipment: ₹99,500\n\nWould you like a detailed breakdown by project?';
    }
    if (q.includes('income') || q.includes('revenue') || q.includes('profit')) {
      return 'Here\'s your financial summary for the current period:\n\n• Total Income: ₹8,45,000\n• Total Expenses: ₹4,82,500\n• Net Profit: ₹3,62,500\n• Profit Margin: 42.9%\n\nCompared to last quarter, income is up 12% and expenses decreased by 5%.';
    }
    if (q.includes('project') && q.includes('high')) {
      return 'Project spending breakdown:\n\n1. **Greenwood Heights** — ₹2,15,000 (44.6%)\n2. **Riverside Apartments** — ₹1,42,000 (29.4%)\n3. **Oakwood Extension** — ₹1,25,500 (26.0%)\n\nThe Greenwood Heights project has the highest spending this month, primarily on materials and labour.';
    }
    if (q.includes('worker') || q.includes('wage') || q.includes('labour')) {
      return 'Here\'s the wage breakdown for this month:\n\n• Total Labour Cost: ₹1,68,000\n• Active Workers: 24\n• Average Daily Wage: ₹650\n• Highest Paid Trade: Mason (₹950/day)\n\nThe top 5 workers by total payout have been performing consistently above targets.';
    }
    return `I've analyzed your query about "${query}". Here are the key findings:\n\n• This data point shows strong performance this period\n• The trend is positive compared to last month\n• There are opportunities for optimization in this area\n\nWould you like me to generate a detailed report or chart for this?`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 48px)', padding: '24px 28px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexShrink: 0 }}>
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
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: colors.textPrimary, margin: 0 }}>
            AI Report Chat
          </h2>
          <p style={{ fontSize: 13, color: colors.textSecondary, margin: 0 }}>
            Ask questions about your project data
          </p>
        </div>
      </div>

      <Card style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
        <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
          {messages.length === 1 && (
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 10 }}>
                Try asking:
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSend(s)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 20,
                      border: `1px solid ${colors.cardBorder}`,
                      background: colors.cardBg,
                      color: colors.textMedium,
                      fontSize: 13,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.primaryBlue; e.currentTarget.style.color = colors.primaryBlue; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.cardBorder; e.currentTarget.style.color = colors.textMedium; }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                animation: 'fadeUp 0.3s ease',
              }}>
                <div style={{
                  maxWidth: '75%',
                  padding: '12px 16px',
                  borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: msg.role === 'user' ? colors.primaryBlue : '#ECEBFF',
                  color: msg.role === 'user' ? '#FFF' : colors.textPrimary,
                  fontSize: 14,
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
            {sending && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '16px 16px 16px 4px',
                  background: '#ECEBFF',
                }}>
                  <Spinner size={20} color={colors.primaryPurple} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div style={{
          padding: '16px 24px',
          borderTop: `1px solid ${colors.divider}`,
          display: 'flex',
          gap: 12,
          background: colors.cardBg,
        }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(input); } }}
            placeholder="Ask about your data..."
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: radius.md,
              border: `1px solid ${colors.inputBorder}`,
              fontSize: 14,
              outline: 'none',
              fontFamily: 'inherit',
              background: colors.cardBg,
              color: colors.textPrimary,
            }}
          />
          <Button onClick={() => handleSend(input)} disabled={!input.trim() || sending}>
            Send
          </Button>
        </div>
      </Card>
    </div>
  );
}
