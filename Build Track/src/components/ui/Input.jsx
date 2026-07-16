import { useState } from 'react';
import { colors, radius, typography } from '../../styles/designTokens';

export default function Input({
  label,
  error,
  hint,
  type = 'text',
  value,
  onChange,
  placeholder,
  required,
  multiline,
  style,
  prefix,
  ...props
}) {
  const [focused, setFocused] = useState(false);
  const id = `input-${label?.replace(/\s/g, '-').toLowerCase()}-${Math.random().toString(36).slice(2, 6)}`;

  const baseStyle = {
    width: '100%',
    padding: '14px 16px',
    fontSize: 14,
    fontFamily: typography.fontFamily,
    color: colors.textPrimary,
    backgroundColor: colors.cardBg,
    border: `1px solid ${error ? colors.error : focused ? colors.primaryBlue : colors.inputBorder}`,
    borderRadius: radius.md,
    outline: 'none',
    transition: 'border-color 0.2s ease',
    lineHeight: 1.5,
    ...(multiline ? { minHeight: 100, resize: 'vertical' } : {}),
    ...style,
  };

  const inputProps = {
    id,
    value,
    onChange,
    placeholder,
    required,
    disabled: props.disabled,
    readOnly: props.readOnly,
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
    style: baseStyle,
    ...(multiline ? {} : { type }),
  };

  return (
    <div style={{ marginBottom: 16 }}>
      {label && (
        <label
          htmlFor={id}
          style={{
            display: 'block',
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.3px',
            color: colors.textSecondary,
            marginBottom: 6,
            textTransform: 'uppercase',
          }}
        >
          {label}
          {required && <span style={{ color: colors.error, marginLeft: 2 }}>*</span>}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        {prefix && (
          <span
            style={{
              position: 'absolute',
              left: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              color: colors.textSecondary,
              fontSize: 14,
            }}
          >
            {prefix}
          </span>
        )}
        {multiline ? (
          <textarea {...inputProps} style={{ ...baseStyle, paddingLeft: prefix ? 40 : 14 }} />
        ) : (
          <input {...inputProps} style={{ ...baseStyle, paddingLeft: prefix ? 40 : 14 }} />
        )}
      </div>
      {error && (
        <p style={{ color: colors.error, fontSize: 12, marginTop: 4 }}>{error}</p>
      )}
      {hint && !error && (
        <p style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>{hint}</p>
      )}
    </div>
  );
}
