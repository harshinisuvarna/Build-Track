import { useState, useRef, useEffect } from "react";
import { reportAPI } from "../api";

// ── Date helpers ──────────────────────────────────────────────────────────────
const MONTH_NAMES  = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const SHORT_MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const YEARS        = Array.from({ length: 11 }, (_, i) => 2020 + i); // 2020–2030

const now          = new Date();
const THIS_YEAR    = now.getFullYear();
const THIS_MONTH   = now.getMonth();   // 0-indexed

function lastMonthOf(year, month) {
  return month === 0
    ? { year: year - 1, month: 11 }
    : { year, month: month - 1 };
}
function fullMonthRange(year, month) {
  return {
    start: new Date(year, month, 1),
    end:   new Date(year, month + 1, 0),
  };
}
function formatShortDate(d) {
  if (!d) return "…";
  return `${SHORT_MONTHS[d.getMonth()]} ${String(d.getDate()).padStart(2,"0")}`;
}
function formatRangeLabel(start, end) {
  if (!start) return "Select range";
  if (!end)   return `${formatShortDate(start)} – …`;
  const sy = start.getFullYear(), ey = end.getFullYear();
  return `${formatShortDate(start)} – ${formatShortDate(end)}, ${sy === ey ? sy : ey}`;
}
function sameDay(a, b)  { return a && b && a.toDateString() === b.toDateString(); }
function inRange(d, s, e) { return s && e && d > s && d < e; }
function daysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function firstDayOf(y, m)  { return new Date(y, m, 1).getDay(); }


// ── Mini Calendar with month+year dropdowns in header ────────────────────────
function MiniCalendar({ calYear, calMonth, rangeStart, rangeEnd, hoverDay,
                        onDayClick, onDayHover, setCalYear, setCalMonth }) {

  const [showMonthMenu, setShowMonthMenu] = useState(false);
  const [showYearMenu,  setShowYearMenu]  = useState(false);
  const monthMenuRef = useRef(null);
  const yearMenuRef  = useRef(null);

  // Close menus on outside click
  useEffect(() => {
    function handle(e) {
      if (monthMenuRef.current && !monthMenuRef.current.contains(e.target)) setShowMonthMenu(false);
      if (yearMenuRef.current  && !yearMenuRef.current.contains(e.target))  setShowYearMenu(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const days        = daysInMonth(calYear, calMonth);
  const startOffset = firstDayOf(calYear, calMonth);
  const cells       = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(new Date(calYear, calMonth, d));

  function prevMonth() {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  }
  function nextMonth() {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  }

  return (
    <div style={{ padding:"16px", minWidth:272 }}>

      {/* ── Header: ‹  [Month ▾]  [Year ▾]  › ── */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12, gap:6 }}>

        <button onClick={prevMonth}
          style={{ background:"none", border:"none", cursor:"pointer", fontSize:18, color:"#555", padding:"2px 8px", borderRadius:6, lineHeight:1 }}>‹</button>

        <div style={{ display:"flex", gap:6, flex:1, justifyContent:"center" }}>

          {/* Month dropdown */}
          <div ref={monthMenuRef} style={{ position:"relative" }}>
            <button
              onClick={() => { setShowMonthMenu(v=>!v); setShowYearMenu(false); }}
              style={{ padding:"5px 10px", background:"#f5f5f5", border:"1px solid #e5e5e5", borderRadius:7, fontSize:13, fontWeight:700, color:"#111", cursor:"pointer", display:"flex", alignItems:"center", gap:4 }}>
              {SHORT_MONTHS[calMonth]} <span style={{ fontSize:10, color:"#888" }}>▾</span>
            </button>
            {showMonthMenu && (
              <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, background:"#fff", border:"1px solid #ebebeb", borderRadius:10, boxShadow:"0 8px 24px rgba(0,0,0,0.12)", zIndex:300, width:130 }}>
                {MONTH_NAMES.map((name, mi) => (
                  <div key={name}
                    onClick={() => { setCalMonth(mi); setShowMonthMenu(false); }}
                    style={{ padding:"8px 14px", fontSize:13, fontWeight: mi===calMonth?700:400, color: mi===calMonth?"#ea580c":"#333", background: mi===calMonth?"#fff5f0":"transparent", cursor:"pointer", borderLeft: mi===calMonth?"3px solid #ea580c":"3px solid transparent" }}
                    onMouseEnter={e=>{ if(mi!==calMonth) e.currentTarget.style.background="#f9f9f9"; }}
                    onMouseLeave={e=>{ if(mi!==calMonth) e.currentTarget.style.background="transparent"; }}>
                    {name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Year dropdown */}
          <div ref={yearMenuRef} style={{ position:"relative" }}>
            <button
              onClick={() => { setShowYearMenu(v=>!v); setShowMonthMenu(false); }}
              style={{ padding:"5px 10px", background:"#f5f5f5", border:"1px solid #e5e5e5", borderRadius:7, fontSize:13, fontWeight:700, color:"#111", cursor:"pointer", display:"flex", alignItems:"center", gap:4 }}>
              {calYear} <span style={{ fontSize:10, color:"#888" }}>▾</span>
            </button>
            {showYearMenu && (
              <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, background:"#fff", border:"1px solid #ebebeb", borderRadius:10, boxShadow:"0 8px 24px rgba(0,0,0,0.12)", zIndex:300, width:100, maxHeight:200, overflowY:"auto" }}>
                {YEARS.map(y => (
                  <div key={y}
                    onClick={() => { setCalYear(y); setShowYearMenu(false); }}
                    style={{ padding:"8px 14px", fontSize:13, fontWeight: y===calYear?700:400, color: y===calYear?"#ea580c":"#333", background: y===calYear?"#fff5f0":"transparent", cursor:"pointer", borderLeft: y===calYear?"3px solid #ea580c":"3px solid transparent" }}
                    onMouseEnter={e=>{ if(y!==calYear) e.currentTarget.style.background="#f9f9f9"; }}
                    onMouseLeave={e=>{ if(y!==calYear) e.currentTarget.style.background="transparent"; }}>
                    {y}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <button onClick={nextMonth}
          style={{ background:"none", border:"none", cursor:"pointer", fontSize:18, color:"#555", padding:"2px 8px", borderRadius:6, lineHeight:1 }}>›</button>
      </div>

      {/* Day-of-week labels */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2, marginBottom:4 }}>
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d=>(
          <div key={d} style={{ textAlign:"center", fontSize:11, fontWeight:700, color:"#aaa", padding:"2px 0" }}>{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={`e${i}`} />;
          const isStart   = sameDay(day, rangeStart);
          const isEnd     = sameDay(day, rangeEnd);
          const isHover   = sameDay(day, hoverDay);
          const endOrHov  = isEnd || (!rangeEnd && isHover);
          const inSel     = inRange(day, rangeStart, rangeEnd || hoverDay);
          const isToday   = sameDay(day, new Date());

          let bg="#transparent", color="#333", br=6;
          if (isStart || endOrHov) { bg="#ea580c"; color="#fff"; }
          else if (inSel)          { bg="#fff0e8"; color="#ea580c"; br=0; }

          return (
            <div key={day.toISOString()}
              onClick={()=>onDayClick(day)}
              onMouseEnter={()=>onDayHover(day)}
              style={{ textAlign:"center", fontSize:13, fontWeight:isStart||endOrHov?700:400,
                padding:"6px 2px", borderRadius:br, background:bg, color, cursor:"pointer",
                outline: isToday&&!isStart&&!endOrHov?"1.5px solid #ea580c":"none", outlineOffset:-1 }}>
              {day.getDate()}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function FinancialReportPage() {

  // ── Date states ───────────────────────────────────────────────────────────
  const [selYear,  setSelYear]  = useState(THIS_YEAR);
  const [selMonth, setSelMonth] = useState(THIS_MONTH);

  // ── Data states ───────────────────────────────────────────────────────────
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showMonthDrop, setShowMonthDrop] = useState(false);
  const [dropYear,      setDropYear]      = useState(THIS_YEAR);
  const monthDropRef = useRef(null);

  const initRange = fullMonthRange(THIS_YEAR, THIS_MONTH);
  const [rangeStart,   setRangeStart]   = useState(initRange.start);
  const [rangeEnd,     setRangeEnd]     = useState(initRange.end);
  const [hoverDay,     setHoverDay]     = useState(null);
  const [pickingStart, setPickingStart] = useState(true);
  const [showCal,      setShowCal]      = useState(false);
  const [calYear,      setCalYear]      = useState(THIS_YEAR);
  const [calMonth,     setCalMonth]     = useState(THIS_MONTH);
  const calRef = useRef(null);

  const [search, setSearch] = useState("");

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError("");
    reportAPI.getFinancial({ year: selYear, month: selMonth })
      .then(({ data }) => {
        if (isMounted) {
          setReportData(data);
          setLoading(false);
        }
      })
      .catch(err => {
        if (isMounted) {
          console.error("Report load error:", err);
          setError("Failed to load report data");
          setLoading(false);
        }
      });
    return () => { isMounted = false; };
  }, [selYear, selMonth]);

  useEffect(() => {
    function handle(e) {
      if (monthDropRef.current && !monthDropRef.current.contains(e.target)) setShowMonthDrop(false);
      if (calRef.current        && !calRef.current.contains(e.target))       setShowCal(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  if (loading && !reportData) {
    return <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", color:"#888" }}>Loading Report...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: 40, color: "#dc2626", textAlign: "center" }}>
        <h3>Error</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} style={{ padding: "8px 16px", borderRadius: 8, background: "#ea580c", color: "#fff", border: "none", cursor: "pointer" }}>Retry</button>
      </div>
    );
  }

  const { income = 0, expenses = 0, profit = 0, compliance = 0, workers = [] } = reportData || {};

  const margin = income > 0 ? ((profit / income) * 100).toFixed(1) : "0.0";
  const metrics = [
    { label:"TOTAL INCOME",  value:`₹${income.toLocaleString("en-IN")}.00`, sub:"Real-time data", subColor:"#16a34a", dot:"#16a34a" },
    { label:"EXPENDITURES",  value:`₹${expenses.toLocaleString("en-IN")}.00`, sub:"Updated hourly",  subColor:"#ea580c", dot:"#ef4444" },
    { label:"NET PROFIT",    value:`₹${profit.toLocaleString("en-IN")}.00`, sub:`${margin}% Margin`, subColor:"#6b7280", dot:"#ea580c", valueColor:"#ea580c" },
  ];

  const monthLabel = `${MONTH_NAMES[selMonth]} ${selYear}`;
  const rangeLabel = formatRangeLabel(rangeStart, rangeEnd);

  const filtered = workers.filter(w =>
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    (w.trade && w.trade.toLowerCase().includes(search.toLowerCase()))
  );

  // ── Apply a month selection (shared by month-dropdown & last-month btn) ───
  function applyMonth(year, month) {
    setSelYear(year);
    setSelMonth(month);
    const r = fullMonthRange(year, month);
    setRangeStart(r.start);
    setRangeEnd(r.end);
    setCalYear(year);
    setCalMonth(month);
    setShowMonthDrop(false);
  }

  // ── "Last Month" — always computes the real previous calendar month ───────
  function handleLastMonth() {
    const { year, month } = lastMonthOf(THIS_YEAR, THIS_MONTH);
    applyMonth(year, month);
  }

  // ── Calendar day click ────────────────────────────────────────────────────
  function onDayClick(day) {
    if (pickingStart) {
      setRangeStart(day); setRangeEnd(null); setPickingStart(false);
    } else {
      const [s, e] = day < rangeStart ? [day, rangeStart] : [rangeStart, day];
      setRangeStart(s); setRangeEnd(e);
      setPickingStart(true); setShowCal(false);
    }
  }

  return (
    <div style={{ flex:1, minWidth:0, width:"100%", display:"flex", flexDirection:"column", height:"100vh", overflow:"hidden", background:"#f7f7f8", fontFamily:"'Segoe UI', sans-serif" }}>

      {/* Topbar */}
      <div style={{ background:"#fff", borderBottom:"1px solid #ebebeb", padding:"0 28px", height:64, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"space-between", gap:16, boxSizing:"border-box" }}>
        <h1 style={{ margin:0, fontSize:20, fontWeight:800, color:"#111", whiteSpace:"nowrap" }}>Financial Reports</h1>
        <div style={{ flex:1, maxWidth:420, margin:"0 auto", display:"flex", alignItems:"center", background:"#f5f5f5", border:"1px solid #e5e5e5", borderRadius:10, padding:"9px 14px", gap:8 }}>
          <span style={{ color:"#aaa", fontSize:14 }}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search transactions..."
            style={{ border:"none", background:"transparent", outline:"none", fontSize:14, color:"#555", width:"100%" }} />
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <button style={{ padding:"10px 20px", background:"#ea580c", color:"#fff", border:"none", borderRadius:10, fontWeight:700, fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", gap:8, boxShadow:"0 4px 14px rgba(234,88,12,0.3)", whiteSpace:"nowrap" }}>⬇ Export Report</button>
          <div style={{ width:38, height:38, background:"#f5f5f5", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:17, cursor:"pointer", border:"1px solid #e5e5e5" }}>🔔</div>
          <div style={{ width:38, height:38, background:"#f5f5f5", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, fontWeight:700, color:"#888", cursor:"pointer", border:"1px solid #e5e5e5" }}>?</div>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex:1, overflowY:"auto", overflowX:"hidden", padding:"28px 28px 60px", boxSizing:"border-box" }}>

        {/* Page heading */}
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:16, marginBottom:24 }}>
          <div>
            <h2 style={{ margin:"0 0 6px", fontSize:"clamp(24px,3vw,34px)", fontWeight:900, color:"#111", letterSpacing:"-0.5px" }}>{monthLabel} Analysis</h2>
            <p style={{ margin:0, fontSize:14, color:"#888", maxWidth:340, lineHeight:1.5 }}>Reporting period performance and labor expenditure overview.</p>
          </div>
          <button style={{ padding:"14px 28px", background:"#ea580c", color:"#fff", border:"none", borderRadius:12, fontWeight:700, fontSize:15, cursor:"pointer", display:"flex", alignItems:"center", gap:10, boxShadow:"0 4px 18px rgba(234,88,12,0.35)" }}>
            <span style={{ fontSize:18 }}>📄</span>
            <span>Download<br /><span style={{ fontSize:13, fontWeight:600 }}>PDF</span></span>
          </button>
        </div>

        {/* ── Date filter strip ──────────────────────────────────────────────── */}
        <div style={{ background:"#fff", borderRadius:14, border:"1px solid #ebebeb", padding:"14px 20px", display:"flex", alignItems:"center", gap:10, marginBottom:24, flexWrap:"wrap", boxShadow:"0 1px 4px rgba(0,0,0,0.04)", position:"relative" }}>

          {/* Last Month — dynamically computes previous calendar month */}
          <button
            onClick={handleLastMonth}
            style={{ padding:"9px 20px", background:"transparent", color:"#333", border:"1.5px solid #e5e5e5", borderRadius:8, fontWeight:500, fontSize:14, cursor:"pointer", transition:"border-color 0.15s" }}
            onMouseEnter={e=>e.currentTarget.style.borderColor="#ccc"}
            onMouseLeave={e=>e.currentTarget.style.borderColor="#e5e5e5"}>
            Last Month
          </button>

          {/* ── Month selector dropdown with inline year switcher ─────────── */}
          <div ref={monthDropRef} style={{ position:"relative" }}>
            <button
              onClick={()=>{ setShowMonthDrop(v=>!v); setShowCal(false); }}
              style={{ padding:"9px 20px", background:"transparent", color:"#ea580c", border:"1.5px solid #ea580c", borderRadius:8, fontWeight:700, fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
              {monthLabel} <span style={{ fontSize:11 }}>▾</span>
            </button>

            {showMonthDrop && (
              <div style={{ position:"absolute", top:"calc(100% + 8px)", left:0, background:"#fff", border:"1px solid #ebebeb", borderRadius:12, boxShadow:"0 8px 32px rgba(0,0,0,0.14)", zIndex:200, width:240, overflow:"hidden" }}>

                {/* Year switcher row inside the dropdown */}
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px", borderBottom:"1px solid #f0f0f0", background:"#fafafa" }}>
                  <button onClick={()=>setDropYear(y=>Math.max(2020,y-1))}
                    style={{ background:"none", border:"none", cursor:"pointer", fontSize:16, color:"#555", padding:"2px 8px" }}>‹</button>
                  <span style={{ fontWeight:700, fontSize:14, color:"#111" }}>{dropYear}</span>
                  <button onClick={()=>setDropYear(y=>Math.min(2030,y+1))}
                    style={{ background:"none", border:"none", cursor:"pointer", fontSize:16, color:"#555", padding:"2px 8px" }}>›</button>
                </div>

                {/* Month grid */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:4, padding:"10px 12px 12px" }}>
                  {MONTH_NAMES.map((name, mi) => {
                    const isActive = dropYear===selYear && mi===selMonth;
                    return (
                      <button key={name}
                        onClick={()=>applyMonth(dropYear, mi)}
                        style={{ padding:"8px 4px", fontSize:12, fontWeight:isActive?700:500, color:isActive?"#fff":"#333", background:isActive?"#ea580c":"#f5f5f5", border:"none", borderRadius:8, cursor:"pointer", transition:"all 0.12s" }}
                        onMouseEnter={e=>{ if(!isActive) e.currentTarget.style.background="#ffe8d8"; }}
                        onMouseLeave={e=>{ if(!isActive) e.currentTarget.style.background="#f5f5f5"; }}>
                        {SHORT_MONTHS[mi]}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div style={{ width:1, height:28, background:"#e5e5e5" }} />

          {/* ── Date range picker ─────────────────────────────────────────── */}
          <div ref={calRef} style={{ position:"relative" }}>
            <div
              onClick={()=>{ setShowCal(v=>!v); setShowMonthDrop(false); setPickingStart(true); }}
              style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 16px", border:"1.5px solid #e5e5e5", borderRadius:8, cursor:"pointer", userSelect:"none" }}>
              <span style={{ fontSize:15 }}>📅</span>
              <span style={{ fontSize:14, color:rangeEnd?"#444":"#ea580c", fontWeight:500 }}>{rangeLabel}</span>
              <span style={{ fontSize:12, color:"#aaa" }}>▾</span>
            </div>

            {showCal && (
              <div style={{ position:"absolute", top:"calc(100% + 8px)", left:0, background:"#fff", border:"1px solid #ebebeb", borderRadius:12, boxShadow:"0 8px 32px rgba(0,0,0,0.12)", zIndex:200 }}>
                <div style={{ padding:"10px 16px 8px", fontSize:12, color:"#888", borderBottom:"1px solid #f5f5f5" }}>
                  {pickingStart
                    ? "Click to set start date"
                    : <span>Set end date — <span style={{ color:"#ea580c", fontWeight:600 }}>From: {formatShortDate(rangeStart)}</span></span>}
                </div>

                <MiniCalendar
                  calYear={calYear} calMonth={calMonth}
                  rangeStart={rangeStart} rangeEnd={rangeEnd} hoverDay={hoverDay}
                  onDayClick={onDayClick}
                  onDayHover={d => !pickingStart && setHoverDay(d)}
                  setCalYear={setCalYear}
                  setCalMonth={setCalMonth}
                />

                <div style={{ padding:"10px 16px", borderTop:"1px solid #f0f0f0", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <button onClick={()=>{ setRangeStart(null); setRangeEnd(null); setPickingStart(true); }}
                    style={{ background:"none", border:"none", color:"#888", fontSize:12, cursor:"pointer" }}>Clear</button>
                  <button onClick={()=>setShowCal(false)}
                    style={{ padding:"6px 16px", background:"#ea580c", color:"#fff", border:"none", borderRadius:7, fontSize:13, fontWeight:700, cursor:"pointer" }}>Done</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Metrics + Compliance */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1.15fr", gap:16, marginBottom:24 }}>
          {metrics.map(m=>(
            <div key={m.label} style={{ background:"#fff", borderRadius:16, border:"1px solid #ebebeb", padding:"24px 22px", boxShadow:"0 1px 6px rgba(0,0,0,0.04)", display:"flex", flexDirection:"column", gap:10 }}>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <div style={{ width:9, height:9, borderRadius:"50%", background:m.dot, flexShrink:0 }} />
                <span style={{ fontSize:11, fontWeight:700, color:"#aaa", letterSpacing:"0.08em" }}>{m.label}</span>
              </div>
              <div style={{ fontSize:"clamp(18px,2vw,26px)", fontWeight:800, color:m.valueColor||"#111", letterSpacing:"-0.5px" }}>{m.value}</div>
              <div style={{ fontSize:12, color:m.subColor, fontWeight:600 }}>{m.sub}</div>
            </div>
          ))}
          <div style={{ background:"#ea580c", borderRadius:16, padding:"24px 22px", display:"flex", flexDirection:"column", gap:12, boxShadow:"0 4px 20px rgba(234,88,12,0.3)" }}>
            <div style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.75)", letterSpacing:"0.08em" }}>OVERALL COMPLIANCE</div>
            <div style={{ fontSize:"clamp(28px,3vw,38px)", fontWeight:900, color:"#fff", letterSpacing:"-1px", lineHeight:1 }}>
              {compliance.toFixed(1)}%<br /><span style={{ fontSize:"clamp(22px,2.5vw,30px)" }}>Compliance</span>
            </div>
            <div style={{ height:8, background:"rgba(255,255,255,0.25)", borderRadius:4, overflow:"hidden" }}>
              <div style={{ width:`${compliance}%`, height:"100%", background:"#fff", borderRadius:4, transition:"width 0.4s ease" }} />
            </div>
            <p style={{ margin:0, fontSize:12, color:"rgba(255,255,255,0.85)", lineHeight:1.5 }}>Budget adherence for {monthLabel}.</p>
          </div>
        </div>

        {/* Wages Per Worker table */}
        <div style={{ background:"#fff", borderRadius:16, border:"1px solid #ebebeb", boxShadow:"0 1px 6px rgba(0,0,0,0.04)", overflow:"hidden" }}>
          <div style={{ padding:"22px 24px 0", display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div>
              <div style={{ fontSize:18, fontWeight:800, color:"#111" }}>Wages Per Worker</div>
              <div style={{ fontSize:13, color:"#888", marginTop:3 }}>Breakdown of labor costs for {monthLabel}</div>
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button style={{ background:"none", border:"none", cursor:"pointer", fontSize:18, color:"#888" }}>≡</button>
              <button style={{ background:"none", border:"none", cursor:"pointer", fontSize:20, color:"#888" }}>⋮</button>
            </div>
          </div>
          <div style={{ padding:"14px 24px", display:"flex", alignItems:"center", gap:20, borderBottom:"1px solid #f0f0f0", flexWrap:"wrap" }}>
            <div style={{ display:"flex", alignItems:"center", gap:16 }}>
              <span style={{ fontSize:11, fontWeight:700, color:"#aaa", letterSpacing:"0.06em" }}>PROJECT STATUS LEGEND:</span>
              {[["#16a34a","ON TRACK"],["#3b82f6","IN PROGRESS"],["#f59e0b","REVIEW NEEDED"]].map(([c,l])=>(
                <div key={l} style={{ display:"flex", alignItems:"center", gap:5 }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:c }}/><span style={{ fontSize:11, fontWeight:600, color:"#666" }}>{l}</span>
                </div>
              ))}
            </div>
            <div style={{ width:1, height:16, background:"#e5e5e5" }} />
            <div style={{ display:"flex", alignItems:"center", gap:16 }}>
              <span style={{ fontSize:11, fontWeight:700, color:"#aaa", letterSpacing:"0.06em" }}>PROFIT LEGEND:</span>
              {[["#16a34a","HIGH"],["#f59e0b","MED"],["#ef4444","LOW"]].map(([c,l])=>(
                <div key={l} style={{ display:"flex", alignItems:"center", gap:5 }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:c }}/><span style={{ fontSize:11, fontWeight:600, color:"#666" }}>{l}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"2.2fr 1.4fr 1fr 1fr 1.2fr 0.7fr", padding:"10px 24px", borderBottom:"1px solid #f0f0f0" }}>
            {["WORKER DETAILS","PROJECT","TOTAL HOURS","RATE","TOTAL PAYOUT","ACTION"].map(col=>(
              <div key={col} style={{ fontSize:11, fontWeight:700, color:"#aaa", letterSpacing:"0.07em" }}>{col}</div>
            ))}
          </div>
          {filtered.map((w,i)=>(
            <div key={i}
              style={{ display:"grid", gridTemplateColumns:"2.2fr 1.4fr 1fr 1fr 1.2fr 0.7fr", padding:"18px 24px", borderBottom:i<filtered.length-1?"1px solid #f5f5f5":"none", alignItems:"center", transition:"background 0.15s" }}
              onMouseEnter={e=>e.currentTarget.style.background="#fafafa"}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:40, height:40, borderRadius:"50%", background:"#2d3748", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:"#fff", flexShrink:0 }}>{w.name?.charAt(0)}</div>
                <div>
                  <div style={{ fontSize:14, fontWeight:700, color:"#111" }}>{w.name}</div>
                  <div style={{ fontSize:12, color:"#888", marginTop:2 }}>{w.trade}</div>
                </div>
              </div>
              <div><span style={{ padding:"4px 10px", background:"#e0e7ff", color:"#3730a3", borderRadius:6, fontSize:11, fontWeight:700, letterSpacing:"0.04em", whiteSpace:"nowrap" }}>{w.project || "Various"}</span></div>
              <div style={{ fontSize:14, fontWeight:600, color:"#333" }}>26d</div>
              <div style={{ fontSize:14, fontWeight:600, color:"#333" }}>₹{w.dailyWage || 0}</div>
              <div style={{ fontSize:14, fontWeight:700, color:"#111" }}>₹{w.estimatedMonthlyPayout?.toLocaleString("en-IN")}</div>
              <div><button style={{ background:"none", border:"none", color:"#ea580c", fontWeight:700, fontSize:12, cursor:"pointer", letterSpacing:"0.04em" }}>DETAILS</button></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}