import { useState, useEffect } from "react";
import { subscriptionAPI } from "../api";
import { Bell, Star, ClipboardList, AlertTriangle, Lock, Building2, CreditCard } from "lucide-react";

const PLANS = [
  {
    id: "free",
    title: "Free",
    price: 0,
    period: "forever",
    tagline: "Get started with basics",
    users: "1 user",
    projects: "2 projects",
    features: [
      "Basic dashboard",
      "Up to 2 projects",
      "Transaction tracking",
      "1 user access",
      "Community support",
      "Basic reports",
    ],
    highlighted: false,
  },
  {
    id: "starter",
    title: "Starter",
    price: 498,
    period: "/mo",
    tagline: "For small construction sites",
    users: "3 users",
    projects: "10 projects",
    features: [
      "Everything in Free",
      "Up to 10 projects",
      "Up to 3 user access",
      "Worker management",
      "Daily task reports",
      "Email support",
      "Inventory tracking",
      "Financial summaries",
    ],
    highlighted: false,
  },
  {
    id: "growth",
    title: "Growth",
    price: 999,
    period: "/mo",
    tagline: "Scale your operations",
    users: "8 users",
    projects: "30 projects",
    features: [
      "Everything in Starter",
      "Up to 30 projects",
      "Up to 8 user access",
      "Supervisor oversight",
      "Advanced analytics",
      "Priority support",
      "Custom report export",
      "Multi-site management",
      "Approval workflows",
    ],
    highlighted: false,
  },
  {
    id: "pro",
    title: "Pro",
    price: 1499,
    period: "/mo",
    tagline: "Most popular for growing teams",
    users: "20 users",
    projects: "Unlimited projects",
    features: [
      "Everything in Growth",
      "Unlimited projects",
      "Up to 20 user access",
      "AI-powered insights",
      "Advanced budget tracking",
      "Dedicated account manager",
      "Custom integrations",
      "Audit logs",
      "Two-factor authentication",
      "API access",
    ],
    highlighted: true,
  },
  {
    id: "business",
    title: "Business",
    price: 2499,
    period: "/mo",
    tagline: "For established businesses",
    users: "50 users",
    projects: "Unlimited projects",
    features: [
      "Everything in Pro",
      "Up to 50 user access",
      "White-label options",
      "Bulk data import/export",
      "Custom role permissions",
      "Phone support",
      "Advanced security",
      "SLA guarantee",
      "Onboarding assistance",
      "Real-time collaboration",
    ],
    highlighted: false,
  },
  {
    id: "enterprise",
    title: "Enterprise",
    price: 4999,
    period: "/mo",
    tagline: "Custom solutions for large orgs",
    users: "Unlimited users",
    projects: "Unlimited projects",
    features: [
      "Everything in Business",
      "Unlimited users",
      "Dedicated infrastructure",
      "Custom development",
      "On-premise deployment",
      "24/7 premium support",
      "Custom training",
      "Legal & compliance tools",
      "Multi-tenant setup",
      "Data migration assistance",
    ],
    highlighted: false,
  },
];

const CHECKMARK = (
  <span style={{
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    width: 18, height: 18, borderRadius: "50%", background: "#fff5f0",
    color: "#ea580c", fontSize: 11, fontWeight: 800, flexShrink: 0,
  }}>✓</span>
);

const TOPBAR_H = 65;

export default function SubscriptionPage() {
  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [subStatus, setSubStatus] = useState(null);
  const [processing, setProcessing] = useState(null);
  const [error, setError] = useState("");
  const [isNarrow, setIsNarrow] = useState(window.innerWidth < 768);

  useEffect(() => {
    const onResize = () => setIsNarrow(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    let isMounted = true;

    subscriptionAPI
      .getStatus()
      .then(({ data }) => {
        if (!isMounted) return;
        if (data.hasSubscription) {
          setCurrentPlan(data.plan || "free");
          setSubStatus(data);
        } else {
          setCurrentPlan("free");
          setSubStatus({ hasSubscription: false, plan: "free" });
        }
        setLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setCurrentPlan("free");
        setSubStatus({ hasSubscription: false, plan: "free" });
        setLoading(false);
      });

    return () => { isMounted = false; };
  }, []);

  const handleSubscribe = async (planId) => {
    if (planId === currentPlan) return;
    if (planId === "free") return;

    try {
      setProcessing(planId);
      setError("");

      const { data } = await subscriptionAPI.initiate({ plan: planId });

      if (data.success && data.paymentParams) {
        const { airpayUrl, ...formFields } = data.paymentParams;

        const form = document.createElement("form");
        form.method = "POST";
        form.action = airpayUrl;

        Object.entries(formFields).forEach(([key, value]) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = value;
          form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to initiate payment. Please try again.");
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: "flex", flexDirection: "column",
        minHeight: "100vh", flex: 1, minWidth: 0, width: "100%",
        fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      }}>
        <div style={{
          height: TOPBAR_H, flexShrink: 0,
          background: "#fff", borderBottom: "1px solid #ebebeb",
          padding: "0 24px", display: "flex", alignItems: "center",
          justifyContent: "space-between",
        }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#1a1a1a" }}>Subscription Plans</h1>
        </div>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          flex: 1, color: "#888", fontSize: 15,
        }}>
          Loading subscription plans...
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      minHeight: "100vh",
      flex: 1, minWidth: 0, width: "100%",
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      background: "#f7f7f8",
    }}>

      {/* ── Topbar ── */}
      <div style={{
        height: TOPBAR_H, flexShrink: 0,
        background: "#fff", borderBottom: "1px solid #ebebeb",
        padding: "0 24px", display: "flex", alignItems: "center",
        justifyContent: "space-between", gap: 12, overflow: "hidden",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <h1 style={{ margin: 0, fontSize: "clamp(16px,2vw,20px)", fontWeight: 700, color: "#1a1a1a", whiteSpace: "nowrap" }}>
            Subscription & Billing
          </h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div style={{ width: 36, height: 36, background: "#f5f5f5", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Bell size={16} /></div>
          <div style={{ width: 36, height: 36, background: "#f5f5f5", border: "2px solid #e5e5e5", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#888", cursor: "pointer" }}>?</div>
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div style={{
        flex: 1,
        minHeight: 0,
        overflowY: "auto", overflowX: "hidden", WebkitOverflowScrolling: "touch",
        padding: "clamp(16px,2.5vw,28px) clamp(16px,3vw,28px) 60px",
        display: "flex", flexDirection: "column", gap: "clamp(14px,2vw,22px)",
        boxSizing: "border-box",
      }}>

        {/* ── Hero Section ── */}
        <div style={{
          background: "linear-gradient(135deg, #ea580c 0%, #f97316 50%, #fb923c 100%)",
          borderRadius: "clamp(16px,2vw,20px)",
          padding: isNarrow ? "28px 20px" : "40px 44px",
          color: "#fff",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* Decorative circles */}
          <div style={{
            position: "absolute", top: -60, right: -40,
            width: 220, height: 220, borderRadius: "50%",
            background: "rgba(255,255,255,0.08)",
          }} />
          <div style={{
            position: "absolute", bottom: -80, left: "40%",
            width: 280, height: 280, borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
          }} />

          <div style={{ position: "relative", zIndex: 1, maxWidth: 640 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "rgba(255,255,255,0.2)", borderRadius: 20,
              padding: "6px 14px", fontSize: 12, fontWeight: 700,
              letterSpacing: "0.03em", marginBottom: 16, backdropFilter: "blur(4px)",
            }}>
              <Star size={14} /> Unlock Premium Features
            </div>
            <h2 style={{
              margin: "0 0 8px", fontSize: "clamp(22px,3vw,32px)",
              fontWeight: 800, letterSpacing: "-0.5px", lineHeight: 1.2,
            }}>
              Choose the Right Plan for Your Business
            </h2>
            <p style={{
              margin: 0, fontSize: "clamp(13px,1.4vw,16px)", lineHeight: 1.6,
              opacity: 0.9,
            }}>
              Scale your construction management with powerful tools designed for teams of all sizes.
              No hidden fees, cancel anytime.
            </p>
          </div>
        </div>

        {/* ── Current Plan Banner ── */}
        {subStatus && (
          <div style={{
            background: "#fff",
            borderRadius: 14,
            border: "1px solid #ebebeb",
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: "#fff5f0", display: "flex",
                alignItems: "center", justifyContent: "center",
              }}><ClipboardList size={16} /></div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a" }}>
                  Current Plan: <span style={{ color: "#ea580c" }}>{PLANS.find(p => p.id === currentPlan)?.title || "Free"}</span>
                </div>
                {subStatus.endDate && (
                  <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
                    Renews on {new Date(subStatus.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                  </div>
                )}
              </div>
            </div>
            {subStatus.status && subStatus.status !== "cancelled" && (
              <span style={{
                fontSize: 11, fontWeight: 700,
                color: subStatus.status === "active" ? "#16a34a" : "#ea580c",
                background: subStatus.status === "active" ? "#f0fdf4" : "#fff5f0",
                padding: "4px 12px", borderRadius: 20, letterSpacing: "0.03em",
                textTransform: "uppercase",
              }}>
                {subStatus.status}
              </span>
            )}
          </div>
        )}

        {/* ── Error Banner ── */}
        {error && (
          <div style={{
            padding: "12px 16px", background: "#fee2e2",
            border: "1px solid #fca5a5", borderRadius: 10,
            color: "#991b1b", fontSize: 13, display: "flex",
            alignItems: "center", gap: 8,
          }}>
            <span><AlertTriangle size={14} /></span>
            <span>{error}</span>
            <span onClick={() => setError("")} style={{ marginLeft: "auto", cursor: "pointer", fontWeight: 700, fontSize: 16, lineHeight: 1 }}>×</span>
          </div>
        )}

        {/* ── Plan Cards Grid ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: isNarrow
            ? "1fr"
            : "repeat(3, 1fr)",
          gap: "clamp(12px,1.5vw,18px)",
        }}>
          {PLANS.map((plan) => {
            const isCurrent = plan.id === currentPlan;
            const isProcessing = processing === plan.id;

            return (
              <div
                key={plan.id}
                style={{
                  background: plan.highlighted
                    ? "linear-gradient(180deg, #fff5f0 0%, #fff 40%)"
                    : "#fff",
                  borderRadius: "clamp(14px,1.5vw,18px)",
                  border: plan.highlighted
                    ? "2px solid #ea580c"
                    : "1px solid #ebebeb",
                  padding: "clamp(20px,2.5vw,28px)",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                  boxShadow: plan.highlighted
                    ? "0 8px 32px rgba(234,88,12,0.12)"
                    : "0 1px 8px rgba(0,0,0,0.04)",
                  transition: "transform 0.2s, box-shadow 0.2s",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.boxShadow = plan.highlighted
                    ? "0 12px 40px rgba(234,88,12,0.18)"
                    : "0 8px 24px rgba(0,0,0,0.08)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = plan.highlighted
                    ? "0 8px 32px rgba(234,88,12,0.12)"
                    : "0 1px 8px rgba(0,0,0,0.04)";
                }}>

                {/* ── Badges ── */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                  {plan.highlighted && (
                    <span style={{
                      fontSize: 10, fontWeight: 800, color: "#fff",
                      background: "#ea580c", padding: "3px 10px",
                      borderRadius: 20, letterSpacing: "0.05em",
                      textTransform: "uppercase",
                    }}>
                      Most Popular
                    </span>
                  )}
                  {isCurrent && (
                    <span style={{
                      fontSize: 10, fontWeight: 800, color: "#16a34a",
                      background: "#f0fdf4", border: "1px solid #bbf7d0",
                      padding: "3px 10px", borderRadius: 20,
                      letterSpacing: "0.05em", textTransform: "uppercase",
                    }}>
                      Current Plan
                    </span>
                  )}
                </div>

                {/* ── Title ── */}
                <div style={{
                  fontSize: "clamp(16px,1.6vw,20px)", fontWeight: 800,
                  color: "#1a1a1a", marginBottom: 4,
                }}>
                  {plan.title}
                </div>

                {/* ── Tagline ── */}
                <div style={{
                  fontSize: "clamp(11px,1.1vw,13px)", color: "#888",
                  marginBottom: 16, lineHeight: 1.4,
                }}>
                  {plan.tagline}
                </div>

                {/* ── Price ── */}
                <div style={{ marginBottom: 20 }}>
                  <span style={{
                    fontSize: "clamp(28px,3vw,36px)", fontWeight: 800,
                    color: plan.highlighted ? "#ea580c" : "#1a1a1a",
                    letterSpacing: "-1px",
                  }}>
                    {plan.price === 0 ? "₹0" : `₹${plan.price.toLocaleString("en-IN")}`}
                  </span>
                  <span style={{
                    fontSize: 13, color: "#888", fontWeight: 500,
                    marginLeft: 4,
                  }}>
                    {plan.period}
                  </span>
                </div>

                {/* ── Limits ── */}
                <div style={{
                  display: "flex", gap: 12, marginBottom: 18,
                  paddingBottom: 16, borderBottom: "1px solid #f0f0f0",
                }}>
                  <div style={{
                    flex: 1, background: "#f7f7f8", borderRadius: 8,
                    padding: "8px 10px", textAlign: "center",
                  }}>
                    <div style={{ fontSize: 11, color: "#888", fontWeight: 600 }}>Users</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", marginTop: 2 }}>{plan.users}</div>
                  </div>
                  <div style={{
                    flex: 1, background: "#f7f7f8", borderRadius: 8,
                    padding: "8px 10px", textAlign: "center",
                  }}>
                    <div style={{ fontSize: 11, color: "#888", fontWeight: 600 }}>Projects</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", marginTop: 2 }}>{plan.projects}</div>
                  </div>
                </div>

                {/* ── Features ── */}
                <div style={{
                  flex: 1, display: "flex", flexDirection: "column", gap: 10,
                  marginBottom: 20,
                }}>
                  {plan.features.map((feat, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      {CHECKMARK}
                      <span style={{
                        fontSize: "clamp(12px,1.1vw,13px)", color: "#555",
                        lineHeight: 1.5, fontWeight: 500,
                      }}>
                        {feat}
                      </span>
                    </div>
                  ))}
                </div>

                {/* ── CTA Button ── */}
                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={isCurrent || isProcessing}
                  style={{
                    width: "100%",
                    padding: "12px 0",
                    borderRadius: 12,
                    border: isCurrent
                      ? "1px solid #e5e5e5"
                      : plan.highlighted
                        ? "none"
                        : "2px solid #ea580c",
                    background: isCurrent
                      ? "#f5f5f5"
                      : plan.highlighted
                        ? "#ea580c"
                        : "#fff",
                    color: isCurrent
                      ? "#999"
                      : plan.highlighted
                        ? "#fff"
                        : "#ea580c",
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: isCurrent || isProcessing ? "not-allowed" : "pointer",
                    boxShadow: isCurrent
                      ? "none"
                      : plan.highlighted
                        ? "0 4px 14px rgba(234,88,12,0.35)"
                        : "none",
                    transition: "all 0.2s ease",
                    opacity: isProcessing ? 0.7 : 1,
                    letterSpacing: "0.02em",
                  }}
                  onMouseEnter={e => {
                    if (isCurrent || isProcessing) return;
                    if (plan.highlighted) {
                      e.currentTarget.style.background = "#c2410c";
                      e.currentTarget.style.transform = "translateY(-1px)";
                      e.currentTarget.style.boxShadow = "0 6px 20px rgba(234,88,12,0.4)";
                    } else {
                      e.currentTarget.style.background = "#fff5f0";
                    }
                  }}
                  onMouseLeave={e => {
                    if (isCurrent || isProcessing) return;
                    if (plan.highlighted) {
                      e.currentTarget.style.background = "#ea580c";
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 4px 14px rgba(234,88,12,0.35)";
                    } else {
                      e.currentTarget.style.background = "#fff";
                    }
                  }}
                >
                  {isCurrent
                    ? "✓ Current Plan"
                    : isProcessing
                      ? "Processing..."
                      : plan.price === 0
                        ? "Get Started"
                        : `Subscribe to ${plan.title}`}
                </button>
              </div>
            );
          })}
        </div>

        {/* ── Bottom Links ── */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          marginTop: 8,
          paddingBottom: 20,
        }}>
          {/* Restore Purchases */}
          <span
            style={{
              fontSize: 14, color: "#ea580c", fontWeight: 700,
              cursor: "pointer", padding: "8px 20px", borderRadius: 10,
              background: "#fff5f0", border: "1px solid #fde8d8",
              transition: "background 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "#fde8d8"}
            onMouseLeave={e => e.currentTarget.style.background = "#fff5f0"}
            onClick={async () => {
              try {
                await subscriptionAPI.getStatus();
                alert("Purchases restored successfully!");
              } catch {
                alert("No previous purchases found to restore.");
              }
            }}
          >
            Restore Purchases
          </span>

          {/* Auto-renew Disclaimer */}
          <p style={{
            fontSize: 11, color: "#aaa", textAlign: "center",
            maxWidth: 520, lineHeight: 1.6, margin: 0,
          }}>
            Subscriptions automatically renew at the end of each billing period unless cancelled
            at least 24 hours before the renewal date. You can manage your subscription from your
            account settings. Payment is processed securely through our payment partner.
          </p>

          {/* Security & Compliance */}
          <div style={{
            display: "flex", alignItems: "center", gap: 16,
            marginTop: 4,
          }}>
            {[
              { icon: Lock, label: "Secure Payment" },
              { icon: Building2, label: "RBI Compliant" },
              { icon: CreditCard, label: "UPI / Cards" },
            ].map(({ icon: Icon, label }) => (
              <span key={label} style={{
                fontSize: 11, color: "#888", fontWeight: 600,
                display: "flex", alignItems: "center", gap: 4,
              }}>
                <Icon size={14} />
                {label}
              </span>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
