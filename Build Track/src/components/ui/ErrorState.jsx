import { colors, radius } from '../../styles/designTokens';
import Button from './Button';

export default function ErrorState({
  message = 'Something went wrong',
  onRetry,
  fullPage,
}) {
  const content = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: fullPage ? '80px 24px' : '40px 24px',
        textAlign: 'center',
        animation: 'fadeUp 0.4s ease',
      }}
    >
      <div
        style={{
          fontSize: 48,
          marginBottom: 16,
          width: 80,
          height: 80,
          borderRadius: '50%',
          backgroundColor: '#FEE2E2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        ⚠️
      </div>
      <h3
        style={{
          fontSize: 17,
          fontWeight: 700,
          color: colors.textPrimary,
          marginBottom: 8,
        }}
      >
        Error
      </h3>
      <p
        style={{
          fontSize: 14,
          color: colors.error,
          maxWidth: 400,
          lineHeight: 1.5,
          marginBottom: 20,
        }}
      >
        {message}
      </p>
      {onRetry && <Button onClick={onRetry}>Try Again</Button>}
    </div>
  );

  if (fullPage) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
        }}
      >
        {content}
      </div>
    );
  }
  return content;
}
