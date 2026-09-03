import { useState } from "react";
import { AlertTriangle } from "lucide-react";

export default function LightPremiumInput({ icon: Icon, label, error, ...props }) {
  const [focused, setFocused] = useState(false);
  const [hasValue, setHasValue] = useState(false);

  return (
    <div style={{ position: "relative", marginBottom: 20, width: "100%" }}>
      <div
        className={`premium-input-wrapper ${error ? "error" : focused ? "focused" : ""}`}
      >
        {Icon && <Icon size={16} style={{ color: focused ? "#6366F1" : "#8E9AA8", marginRight: 10, flexShrink: 0 }} />}

        <input
          {...props}
          className="custom-input-field"
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            setHasValue(!!e.target.value);
            props.onBlur?.(e);
          }}
          onChange={(e) => {
            setHasValue(!!e.target.value);
            props.onChange?.(e);
          }}
          style={{
            flex: 1,
            color: "#18181B",
            fontSize: "14px",
            fontFamily: "inherit",
            padding: "2px 0 0",
            zIndex: 10
          }}
        />

        <label
          style={{
            position: "absolute",
            left: Icon ? 38 : 14,
            top: (focused || hasValue || props.value) ? "3.5px" : "15px",
            fontSize: (focused || hasValue || props.value) ? "9px" : "13.5px",
            color: error ? "#EF4444" : (focused ? "#6366F1" : "#71717A"),
            fontWeight: "700",
            pointerEvents: "none",
            transition: "all 0.18s cubic-bezier(0.4, 0, 0.2, 1)",
            textTransform: (focused || hasValue || props.value) ? "uppercase" : "none",
            letterSpacing: (focused || hasValue || props.value) ? "0.08em" : "normal",
            zIndex: 20
          }}
        >
          {label}
        </label>
      </div>

      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 5, color: "#EF4444", fontSize: "11px", fontWeight: "700", animation: "slideDown 0.15s ease" }}>
          <AlertTriangle size={11} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
