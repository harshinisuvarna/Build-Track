import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  projectAPI, 
  transactionAPI 
} from "../api";
import { Toast } from "../components/Toast";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { 
  colors, 
  radius, 
  shadows, 
  gradients, 
  typography 
} from "../styles/designTokens";
import RecordPaymentSheet from "../components/RecordPaymentSheet";
import { 
  Sparkles, 
  Building, 
  ChevronDown, 
  Download, 
  SlidersHorizontal, 
  PlusCircle, 
  CreditCard, 
  Edit2, 
  AlertTriangle, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Info, 
  X, 
  Check, 
  RotateCcw, 
  Search,
  Eye,
  FileText,
  User,
  Package,
  Wrench,
  IndianRupee
} from "lucide-react";

// Local Fallback Theme Styles for absolute parity safety
const primaryBlue = "#173EEA";
const primaryPurple = "#8B5CF6";
const primaryLightBlue = "#06B6D4";

// Formatting Helpers
function formatINR(n) { 
  return `\u20B9${Number(n || 0).toLocaleString("en-IN")}`; 
}

function formatDateShort(dt) {
  if (!dt) return "—";
  const date = new Date(dt);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = String(date.getDate()).padStart(2, '0');
  const month = months[date.getMonth()];
  const year = String(date.getFullYear()).substring(2);
  return `${day} ${month} ${year}`;
}

function formatDateLong(dt) {
  if (!dt) return "—";
  const date = new Date(dt);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = String(date.getDate()).padStart(2, '0');
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const hour24 = date.getHours();
  const ampm = hour24 >= 12 ? 'PM' : 'AM';
  let hour12 = hour24 % 12;
  if (hour12 === 0) hour12 = 12;
  const hour = String(hour12).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${year} ${hour}:${minute} ${ampm}`;
}

function getPaymentStatusLabel(status) {
  switch ((status || '').toLowerCase().trim()) {
    case 'paid':
    case 'fully paid':
    case 'fullypaid':
      return 'Fully Paid';
    case 'partial':
      return 'Partial';
    case 'pending':
    case 'not paid':
    case 'notpaid':
    case 'unpaid':
    default:
      return 'Not Paid';
  }
}

// Map transaction structure from API to exact EntryModel structure in Flutter
function mapTransactionToEntry(tx) {
  let parsedType = "material";
  const rawType = (tx.type || '').toLowerCase();
  if (rawType === 'labour' || rawType === 'wages') {
    parsedType = "labour";
  } else if (rawType === 'equipment' || rawType === 'expense') {
    parsedType = "equipment";
  }

  let entryProjectId = '';
  if (tx.project && typeof tx.project === 'object') {
    entryProjectId = tx.project._id || '';
  } else if (tx.project) {
    entryProjectId = tx.project.toString();
  }
  if (!entryProjectId && tx.projectId) {
    if (typeof tx.projectId === 'object') {
      entryProjectId = tx.projectId._id || '';
    } else {
      entryProjectId = tx.projectId.toString();
    }
  }
  entryProjectId = entryProjectId.trim();
  if (!entryProjectId) entryProjectId = 'p1';

  let amount = 0;
  const paymentStatus = (tx.paymentStatus || '').toLowerCase().trim();
  const paidAmount = tx.paidAmount;

  if (paymentStatus === 'paid') {
    if (paidAmount !== undefined && paidAmount !== null && typeof paidAmount === 'number' && paidAmount > 0) {
      amount = paidAmount;
    } else {
      const v = tx.amount;
      if (v !== undefined && v !== null && typeof v === 'number' && v > 0) {
        amount = v;
      } else {
        const qty = tx.quantity;
        const rate = tx.rate;
        if (typeof qty === 'number' && typeof rate === 'number' && qty > 0 && rate > 0) {
          amount = qty * rate;
        }
      }
    }
  } else if (paymentStatus === 'partial') {
    if (paidAmount !== undefined && paidAmount !== null && typeof paidAmount === 'number' && paidAmount > 0) {
      amount = paidAmount;
    }
  } else {
    const v = tx.amount;
    if (v !== undefined && v !== null && typeof v === 'number' && v > 0) {
      amount = v;
    } else {
      const qty = tx.quantity;
      const rate = tx.rate;
      if (typeof qty === 'number' && typeof rate === 'number' && qty > 0 && rate > 0) {
        amount = qty * rate;
      }
    }
  }

  const createdByRaw = tx.createdBy || tx.addedBy || tx.submittedBy || tx.userId || tx.user;
  let createdBy = '';
  if (createdByRaw && typeof createdByRaw === 'object') {
    createdBy = createdByRaw._id || createdByRaw.id || '';
  } else if (createdByRaw) {
    createdBy = createdByRaw.toString();
  }

  return {
    id: tx._id || new Date().getTime().toString(),
    projectId: entryProjectId,
    type: parsedType,
    amount: amount,
    date: tx.date ? new Date(tx.date) : (tx.createdAt ? new Date(tx.createdAt) : new Date()),
    description: String(tx.materialName || tx.title || tx.description || tx.name || 'Entry'),
    brand: String(tx.brand || tx.materialName || tx.name || ''),
    ratePerUnit: typeof tx.rate === 'number' ? tx.rate : 0,
    floor: tx.floor || '',
    phase: tx.phase || '',
    phaseId: tx.phaseId || '',
    activity: tx.activity || '',
    activityId: tx.activityId || '',
    unit: tx.unit || '',
    createdBy: createdBy,
    approvalStatus: tx.approvalStatus || 'Pending',
    paymentStatus: tx.paymentStatus || 'Pending',
    paymentDate: tx.paymentDate ? new Date(tx.paymentDate) : null,
    rejectionReason: tx.rejectionReason || '',
    rawTx: tx // store full raw transaction for editing/saving context
  };
}

// Columns definition
const DEFAULT_COLS = {
  All: ['Purchased Date', 'Project', 'Type', 'Description', 'Brand', 'Floor', 'Phase', 'Activity', 'Unit', 'Status', 'Amount', 'Payment Date'],
  Materials: ['Purchased Date', 'Project', 'Material', 'Brand', 'Rate', 'Qty', 'Unit', 'Status', 'Amount', 'Payment Date'],
  Labour: ['Purchased Date', 'Project', 'Worker Type', 'Rate/Day', 'Days', 'Status', 'Amount', 'Payment Date'],
  Equipment: ['Purchased Date', 'Project', 'Equipment', 'Rent Rate', 'Duration', 'Status', 'Amount', 'Payment Date']
};

const ALL_COLS = {
  All: ['Purchased Date', 'Project', 'Type', 'Description', 'Brand', 'Floor', 'Phase', 'Activity', 'Unit', 'Status', 'Amount', 'Payment Date'],
  Materials: ['Purchased Date', 'Project', 'Material', 'Brand', 'Rate', 'Qty', 'Unit', 'Floor', 'Phase', 'Activity', 'Status', 'Amount', 'Payment Date'],
  Labour: ['Purchased Date', 'Project', 'Worker Type', 'Rate/Day', 'Days', 'Unit', 'Floor', 'Phase', 'Activity', 'Status', 'Amount', 'Payment Date'],
  Equipment: ['Purchased Date', 'Project', 'Equipment', 'Rent Rate', 'Duration', 'Unit', 'Floor', 'Phase', 'Activity', 'Status', 'Amount', 'Payment Date']
};

export default function FinancialReportPage() {
  const navigate = useNavigate();

  // Primary Data State
  const [projects, setProjects] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ msg: "", type: "info" });

  // 1. Project Context Filter State
  const [selectedProjectId, setSelectedProjectId] = useState("all");
  const [selectedFloor, setSelectedFloor] = useState("");
  const [selectedPhaseId, setSelectedPhaseId] = useState("");
  const [selectedActivityName, setSelectedActivityName] = useState("");
  const [datePreset, setDatePreset] = useState("All Time");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  // 2. Tab selection State (All, Materials, Labour, Equipment)
  const [activeTab, setActiveTab] = useState("All");

  // 3. Category Tab Sub-filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItemName, setSelectedItemName] = useState("");
  const [reportGenerated, setReportGenerated] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // 4. Global table configurations
  const [selectedStatus, setSelectedStatus] = useState("All"); // All, Approved, Pending, Rejected
  const [sortColumn, setSortColumn] = useState("date"); // date, amount, project
  const [sortAscending, setSortAscending] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // 5. Columns Customizer State (persist to local storage safely)
  const [activeColumns, setActiveColumns] = useState(() => {
    try {
      const cached = localStorage.getItem("bt_reports_active_cols_v1");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Error reading cached columns:", e);
    }
    return { ...DEFAULT_COLS };
  });

  // Modal Dialog states
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [tempActiveCols, setTempActiveCols] = useState([]);
  const [tempAllCols, setTempAllCols] = useState([]);

  // Detail Modal state
  const [detailsEntry, setDetailsEntry] = useState(null);

  // Record Payment Overlay state
  const [paymentSheetOpen, setPaymentSheetOpen] = useState(false);
  const [paymentItem, setPaymentItem] = useState(null);

  const clearToast = useCallback(() => setToast({ msg: "", type: "info" }), []);

  // Fetch initial data
  const loadData = useCallback(() => {
    setLoading(true);
    setError("");
    Promise.all([
      projectAPI.getAll().catch(() => ({ data: { projects: [] } })),
      transactionAPI.getAll({ limit: 10000, filterByViewAccess: true }).catch(() => ({ data: { transactions: [] } }))
    ])
      .then(([projRes, txRes]) => {
        const projList = projRes.data?.projects || projRes.data || [];
        setProjects(projList);

        const rawList = txRes.data?.transactions || txRes.data || [];
        // Map backend objects to Flutter-aligned EntryModel objects
        const mappedList = rawList
          .map(tx => mapTransactionToEntry(tx))
          .filter(entry => entry.approvalStatus.toLowerCase() !== "rejected"); // Source-filtering matching Flutter
        setTransactions(mappedList);
      })
      .catch(() => setError("Failed to load project details and reports log."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Sync Active Columns to localStorage
  const saveActiveColumns = (updated) => {
    setActiveColumns(updated);
    localStorage.setItem("bt_reports_active_cols_v1", JSON.stringify(updated));
  };

  // Reset tab category sub-filters when tab changes
  useEffect(() => {
    setSearchQuery("");
    setSelectedItemName("");
    setReportGenerated(false);
    setShowSuggestions(false);
    setCurrentPage(1);
  }, [activeTab]);

  // Project lookup
  const selectedProject = useMemo(() => {
    return projects.find(p => String(p._id) === selectedProjectId);
  }, [projects, selectedProjectId]);

  const getProjectName = useCallback((id) => {
    const match = projects.find(p => String(p._id) === String(id));
    return match ? match.projectName || match.name : "Unknown Project";
  }, [projects]);

  // Floor lists
  const floors = useMemo(() => {
    return selectedProject?.floors || [];
  }, [selectedProject]);

  // Phase name lists
  const phases = useMemo(() => {
    return selectedProject?.selectedPhases || [];
  }, [selectedProject]);

  const selectedPhaseName = useMemo(() => {
    const match = phases.find(ph => String(ph.id) === selectedPhaseId);
    return match ? match.phaseName : "Select Phase";
  }, [phases, selectedPhaseId]);

  // Scoped activity names list
  const uniqueActivityNames = useMemo(() => {
    const activities = [];
    if (selectedPhaseId) {
      const match = phases.find(ph => String(ph.id) === selectedPhaseId);
      activities.push(...(match?.activities || []));
    } else if (selectedProject) {
      activities.push(...(selectedProject.selectedPhases?.flatMap(p => p.activities || []) || []));
    }
    return [...new Set(activities.map(a => a.name))];
  }, [selectedProject, phases, selectedPhaseId]);

  // Date Preset setting helper
  const handleDatePreset = (preset) => {
    setDatePreset(preset);
    setCurrentPage(1);
    const now = new Date();

    switch (preset) {
      case "All Time":
        setStartDate(null);
        setEndDate(null);
        break;
      case "Today":
        setStartDate(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
        setEndDate(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59));
        break;
      case "This Week": {
        const weekday = now.getDay() || 7; // 1 (Mon) - 7 (Sun)
        const start = new Date(now);
        start.setDate(now.getDate() - (weekday - 1));
        setStartDate(new Date(start.getFullYear(), start.getMonth(), start.getDate()));
        setEndDate(null);
        break;
      }
      case "This Month":
        setStartDate(new Date(now.getFullYear(), now.getMonth(), 1));
        setEndDate(null);
        break;
      case "Last 30 Days": {
        const start = new Date(now);
        start.setDate(now.getDate() - 30);
        setStartDate(new Date(start.getFullYear(), start.getMonth(), start.getDate()));
        setEndDate(null);
        break;
      }
      case "This Year":
        setStartDate(new Date(now.getFullYear(), 0, 1));
        setEndDate(null);
        break;
      case "Custom":
        // Keep existing or prompt manual selection
        break;
      default:
        break;
    }
  };

  // Determine EntryTypes based on ActiveTab
  const selectedTypes = useMemo(() => {
    if (activeTab === "Materials") return new Set(["material"]);
    if (activeTab === "Labour") return new Set(["labour"]);
    if (activeTab === "Equipment") return new Set(["equipment"]);
    return new Set(["material", "labour", "equipment"]);
  }, [activeTab]);

  // Filter pipeline matching Flutter report.dart line-by-line
  const filteredEntries = useMemo(() => {
    return transactions.filter(entry => {
      // 1. Project Filter
      if (selectedProjectId !== "all" && String(entry.projectId) !== selectedProjectId) {
        return false;
      }

      // Project context filters (only apply when a specific project is selected)
      if (selectedProjectId !== "all") {
        if (selectedFloor && selectedFloor !== "Select Floor") {
          if (entry.floor !== selectedFloor) return false;
        }

        if (selectedPhaseId && selectedPhaseId !== "Select Phase") {
          const matchPhase = phases.find(ph => String(ph.id) === selectedPhaseId);
          const phaseName = matchPhase?.phaseName;

          if (entry.phaseId !== selectedPhaseId && (!phaseName || entry.phase !== phaseName)) {
            return false;
          }
        }

        if (selectedActivityName && selectedActivityName !== "Select Activity") {
          if (entry.activity !== selectedActivityName && entry.description !== selectedActivityName) {
            return false;
          }
        }
      }

      // 2. Type Filter
      if (!selectedTypes.has(entry.type)) {
        return false;
      }

      // 3. Tab Category Specific Search and Filters
      if (activeTab !== "All" && reportGenerated) {
        if (searchQuery.trim().length > 0) {
          const q = searchQuery.toLowerCase();
          const descMatch = entry.description.toLowerCase().includes(q);
          const brandMatch = (entry.brand || '').toLowerCase().includes(q);
          if (!descMatch && !brandMatch) return false;
        }

        if (selectedItemName && selectedItemName !== "All") {
          if (entry.description !== selectedItemName) return false;
        }
      }

      // 4. Global Search Filter for "All" tab (real-time filtering without requiring report generation)
      if (activeTab === "All" && searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase();
        const projectName = getProjectName(entry.projectId).toLowerCase();
        const descMatch = entry.description.toLowerCase().includes(q);
        const brandMatch = (entry.brand || '').toLowerCase().includes(q);
        const projectMatch = projectName.includes(q);
        const floorMatch = (entry.floor || '').toLowerCase().includes(q);
        const phaseMatch = (entry.phase || '').toLowerCase().includes(q);
        const activityMatch = (entry.activity || '').toLowerCase().includes(q);
        const amountMatch = entry.amount.toString().includes(q);
        const typeMatch = entry.type.toLowerCase().includes(q);
        const statusMatch = getPaymentStatusLabel(entry.paymentStatus).toLowerCase().includes(q);
        const dateMatch = formatDateShort(entry.date).toLowerCase().includes(q);
        const payDateMatch = entry.paymentDate ? formatDateShort(entry.paymentDate).toLowerCase().includes(q) : false;

        if (!descMatch && !brandMatch && !projectMatch && !floorMatch && !phaseMatch && 
            !activityMatch && !amountMatch && !typeMatch && !statusMatch && !dateMatch && !payDateMatch) {
          return false;
        }
      }

      // 5. Approval Status Filter (All, Approved, Pending, Rejected)
      if (selectedStatus !== "All" && entry.approvalStatus.toLowerCase() !== selectedStatus.toLowerCase()) {
        return false;
      }

      // 6. Start/End Date Range Filters
      if (startDate) {
        const eDate = new Date(entry.date.getFullYear(), entry.date.getMonth(), entry.date.getDate());
        const sDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        if (eDate.getTime() < sDate.getTime()) return false;
      }
      if (endDate) {
        const eDate = new Date(entry.date.getFullYear(), entry.date.getMonth(), entry.date.getDate());
        const edDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
        if (eDate.getTime() > edDate.getTime()) return false;
      }

      return true;
    });
  }, [transactions, selectedProjectId, selectedFloor, selectedPhaseId, selectedActivityName, selectedTypes, activeTab, reportGenerated, searchQuery, selectedItemName, selectedStatus, startDate, endDate, getProjectName, phases]);

  // Sort logs
  const sortedEntries = useMemo(() => {
    return [...filteredEntries].sort((a, b) => {
      let cmp = 0;
      if (sortColumn === "date") {
        cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortColumn === "amount") {
        cmp = a.amount - b.amount;
      } else if (sortColumn === "project") {
        cmp = getProjectName(a.projectId).localeCompare(getProjectName(b.projectId));
      }
      return sortAscending ? cmp : -cmp;
    });
  }, [filteredEntries, sortColumn, sortAscending, getProjectName]);

  // Total sums dynamically computed from filtered results
  const materialTotal = useMemo(() => {
    return filteredEntries.filter(e => e.type === "material").reduce((sum, e) => sum + e.amount, 0);
  }, [filteredEntries]);

  const labourTotal = useMemo(() => {
    return filteredEntries.filter(e => e.type === "labour").reduce((sum, e) => sum + e.amount, 0);
  }, [filteredEntries]);

  const equipmentTotal = useMemo(() => {
    return filteredEntries.filter(e => e.type === "equipment").reduce((sum, e) => sum + e.amount, 0);
  }, [filteredEntries]);

  const grandTotal = useMemo(() => {
    return materialTotal + labourTotal + equipmentTotal;
  }, [materialTotal, labourTotal, equipmentTotal]);

  // Pagination bounds
  const totalCount = sortedEntries.length;
  const totalPages = Math.ceil(totalCount / rowsPerPage) || 1;
  const safeCurrentPage = Math.max(1, Math.min(currentPage, totalPages));

  const paginatedEntries = useMemo(() => {
    const startIdx = (safeCurrentPage - 1) * rowsPerPage;
    return sortedEntries.slice(startIdx, startIdx + rowsPerPage);
  }, [sortedEntries, safeCurrentPage, rowsPerPage]);

  // Unique names list for tab category autocomplete suggestion search dropdowns (highly robust String conversions)
  const uniqueItemNames = useMemo(() => {
    const targetType = activeTab === "Materials" ? "material" : activeTab === "Labour" ? "labour" : "equipment";
    return [...new Set(
      transactions
        .filter(e => e.type === targetType && (selectedProjectId === "all" || String(e.projectId) === selectedProjectId))
        .map(e => e.description)
        .filter(name => name !== undefined && name !== null && String(name).trim().length > 0)
    )].map(name => String(name));
  }, [transactions, activeTab, selectedProjectId]);

  // Autocomplete suggestion matches
  const textQuerySuggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return uniqueItemNames.filter(name => String(name).toLowerCase().includes(searchQuery.toLowerCase()));
  }, [uniqueItemNames, searchQuery]);

  const showSuggestionsList = showSuggestions && searchQuery.trim().length > 0 && textQuerySuggestions.length > 0 && 
    !(textQuerySuggestions.length === 1 && textQuerySuggestions[0].toLowerCase() === searchQuery.toLowerCase());

  // Edit Columns Modal Actions
  const openCustomizeModal = () => {
    const all = ALL_COLS[activeTab];
    const active = (activeColumns && activeColumns[activeTab]) || DEFAULT_COLS[activeTab];
    const inactive = all.filter(c => !active.includes(c));
    setTempActiveCols([...active]);
    setTempAllCols([...active, ...inactive]);
    setShowCustomizeModal(true);
  };

  const handleToggleColumn = (col) => {
    if (tempActiveCols.includes(col)) {
      if (tempActiveCols.length > 1) {
        setTempActiveCols(tempActiveCols.filter(c => c !== col));
      } else {
        setToast({ msg: "At least one column must be visible.", type: "error" });
      }
    } else {
      // Re-insert col aligned to order inside tempAllCols
      const updated = [];
      for (const c of tempAllCols) {
        if (tempActiveCols.includes(c) || c === col) {
          updated.push(c);
        }
      }
      setTempActiveCols(updated);
    }
  };

  const handleMoveColumn = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= tempAllCols.length) return;

    const copy = [...tempAllCols];
    const [moved] = copy.splice(index, 1);
    copy.splice(newIndex, 0, moved);
    setTempAllCols(copy);

    // Re-align order of active columns to preserve order
    const updatedActive = [];
    for (const c of copy) {
      if (tempActiveCols.includes(c)) {
        updatedActive.push(c);
      }
    }
    setTempActiveCols(updatedActive);
  };

  const saveCustomizeColumns = () => {
    const updated = { ...activeColumns, [activeTab]: tempActiveCols };
    saveActiveColumns(updated);
    setShowCustomizeModal(false);
    setToast({ msg: "Column preferences saved!", type: "success" });
  };

  const resetCustomizeColumns = () => {
    const all = ALL_COLS[activeTab];
    setTempActiveCols([...DEFAULT_COLS[activeTab]]);
    setTempAllCols([...all]);
  };

  // Actions routing helpers
  const handleAddMore = (entry) => {
    const activeKey = entry.type === "material" ? "material" : entry.type === "labour" ? "labour" : "equipment";
    navigate(`/manualentry?type=${activeKey}&project=${entry.projectId}&name=${entry.description}&unit=${entry.unit}&brand=${entry.brand || ""}`);
  };

  const handleEditEntry = (entry) => {
    navigate(`/manualentry`, { state: { transaction: entry.rawTx } });
  };

  const handleRecordPaymentClick = (entry) => {
    setPaymentItem(entry);
    setPaymentSheetOpen(true);
  };

  // CSV Exporter (Custom active columns matching Flutter)
  const handleExportCSV = () => {
    if (filteredEntries.length === 0) {
      setToast({ msg: "No report entries to export.", type: "error" });
      return;
    }

    try {
      const activeCols = (activeColumns && activeColumns[activeTab]) || DEFAULT_COLS[activeTab] || [];
      const headers = activeCols.map(col => col === "Amount" ? "Amount (INR)" : col);
      
      const csvBuffer = [];
      // Header line
      csvBuffer.push(headers.map(h => `"${h.replace(/"/g, '""')}"`).join(","));

      for (const entry of filteredEntries) {
        const dateStr = entry.date.toISOString().split("T")[0];
        const projectName = getProjectName(entry.projectId);
        const amountStr = entry.amount.toFixed(2);
        const statusStr = getPaymentStatusLabel(entry.paymentStatus);
        const payDateStr = entry.paymentDate ? entry.paymentDate.toISOString().split("T")[0] : "—";

        const rowValues = [];
        for (const col of activeCols) {
          if (col === 'Purchased Date') {
            rowValues.push(dateStr);
          } else if (col === 'Payment Date') {
            rowValues.push(payDateStr);
          } else if (col === 'Project') {
            rowValues.push(projectName);
          } else if (col === 'Type') {
            rowValues.push(entry.type.toUpperCase());
          } else if (col === 'Description' || col === 'Material' || col === 'Worker Type' || col === 'Equipment') {
            rowValues.push(entry.description || '—');
          } else if (col === 'Brand') {
            rowValues.push(entry.brand || '—');
          } else if (col === 'Floor') {
            rowValues.push(entry.floor || '—');
          } else if (col === 'Phase') {
            rowValues.push(entry.phase || '—');
          } else if (col === 'Activity') {
            rowValues.push(entry.activity || '—');
          } else if (col === 'Unit') {
            rowValues.push(entry.unit || '—');
          } else if (col === 'Status') {
            rowValues.push(statusStr);
          } else if (col === 'Amount') {
            rowValues.push(amountStr);
          } else if (col === 'Rate' || col === 'Rate/Day' || col === 'Rent Rate') {
            rowValues.push((entry.ratePerUnit || 0).toFixed(2));
          } else if (col === 'Qty' || col === 'Days' || col === 'Duration') {
            const rate = entry.ratePerUnit || 0;
            const val = (rate === 0) ? 0 : entry.amount / rate;
            rowValues.push(val.toFixed(1));
          }
        }
        csvBuffer.push(rowValues.map(v => `"${v.replace(/"/g, '""')}"`).join(","));
      }

      const blob = new Blob(["\uFEFF" + csvBuffer.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `BuildTrack_Report_${new Date().getTime()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setToast({ msg: "CSV exported successfully!", type: "success" });
    } catch {
      setToast({ msg: "CSV Export failed", type: "error" });
    }
  };

  // PDF Exporter (Custom active columns matching Flutter)
  const handleExportPDF = () => {
    if (filteredEntries.length === 0) {
      setToast({ msg: "No report entries to export.", type: "error" });
      return;
    }

    try {
      const doc = new jsPDF("l", "mm", "a4"); // Landscape A4 for custom columns
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);

      const title = selectedProjectId === 'all'
        ? 'All Active Projects Summary Report'
        : `${getProjectName(selectedProjectId)} Report`;
      doc.text(title, 14, 16);

      // Filters summary line
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const parts = [];
      if (selectedProjectId !== "all") {
        parts.push(`Project: ${getProjectName(selectedProjectId)}`);
        if (selectedFloor) parts.push(`Floor: ${selectedFloor}`);
        if (selectedPhaseId) parts.push(`Phase: ${selectedPhaseName}`);
        if (selectedActivityName) parts.push(`Activity: ${selectedActivityName}`);
      } else {
        parts.push("All Projects");
      }
      parts.push(`Types: ${[...selectedTypes].map(t => t.toUpperCase()).join(", ")}`);
      parts.push(`Status: ${selectedStatus}`);
      parts.push(`Date Preset: ${datePreset}`);
      doc.text(parts.join(" | "), 14, 23);

      // KPI box row
      doc.setFontSize(10);
      doc.text(`Total Expense: ${formatINR(grandTotal)}  |  Materials: ${formatINR(materialTotal)}  |  Labour: ${formatINR(labourTotal)}  |  Equipment: ${formatINR(equipmentTotal)}`, 14, 30);

      const activeCols = (activeColumns && activeColumns[activeTab]) || DEFAULT_COLS[activeTab] || [];
      const headers = activeCols.map(col => col === "Amount" ? "Amount (INR)" : col);

      const body = filteredEntries.map(entry => {
        const row = [];
        for (const col of activeCols) {
          if (col === 'Purchased Date') {
            row.push(formatDateShort(entry.date));
          } else if (col === 'Payment Date') {
            row.push(entry.paymentDate ? formatDateShort(entry.paymentDate) : '—');
          } else if (col === 'Project') {
            row.push(getProjectName(entry.projectId));
          } else if (col === 'Type') {
            row.push(entry.type.toUpperCase());
          } else if (col === 'Description' || col === 'Material' || col === 'Worker Type' || col === 'Equipment') {
            row.push(entry.description || '—');
          } else if (col === 'Brand') {
            row.push(entry.brand || '—');
          } else if (col === 'Floor') {
            row.push(entry.floor || '—');
          } else if (col === 'Phase') {
            row.push(entry.phase || '—');
          } else if (col === 'Activity') {
            row.push(entry.activity || '—');
          } else if (col === 'Unit') {
            row.push(entry.unit || '—');
          } else if (col === 'Status') {
            row.push(getPaymentStatusLabel(entry.paymentStatus));
          } else if (col === 'Amount') {
            row.push(entry.amount.toFixed(2));
          } else if (col === 'Rate' || col === 'Rate/Day' || col === 'Rent Rate') {
            row.push((entry.ratePerUnit || 0).toFixed(2));
          } else if (col === 'Qty' || col === 'Days' || col === 'Duration') {
            const rate = entry.ratePerUnit || 0;
            const val = (rate === 0) ? 0 : entry.amount / rate;
            row.push(val.toFixed(1));
          }
        }
        return row;
      });

      autoTable(doc, {
        startY: 35,
        head: [headers],
        body: body,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [23, 62, 234], textColor: 255 }
      });

      doc.save(`BuildTrack_Report_${new Date().getTime()}.pdf`);
      setToast({ msg: "PDF exported successfully!", type: "success" });
    } catch {
      setToast({ msg: "PDF Export failed", type: "error" });
    }
  };

  const activeCols = (activeColumns && activeColumns[activeTab]) || DEFAULT_COLS[activeTab] || [];
  const uiActiveCols = [...activeCols, 'Add More', 'Record Payment', 'Edit Entry'];

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", minHeight: "100vh", background: colors.bgBase4, fontFamily: typography.fontFamily }}>
      <Toast message={toast.msg} type={toast.type} onClose={clearToast} />

      {/* Top Bar */}
      <div style={{ background: colors.cardBg, borderBottom: `1px solid ${colors.cardBorder}`, padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexShrink: 0 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: colors.textPrimary }}>Reports</h1>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: colors.textLight }}>Financial analytics &amp; transaction log audit</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button 
            onClick={() => openCustomizeModal()} 
            style={{ 
              padding: "9px 18px", 
              borderRadius: radius.md, 
              border: `1.5px solid ${colors.cardBorder}`, 
              background: colors.cardBg, 
              color: colors.textMedium, 
              fontWeight: 700, 
              fontSize: 13, 
              cursor: "pointer", 
              display: "flex", 
              alignItems: "center", 
              gap: 8,
              boxShadow: shadows.card
            }}
          >
            <SlidersHorizontal size={14} />
            Edit Columns
          </button>

          <div style={{ position: "relative" }}>
            <button 
              onClick={handleExportCSV}
              disabled={filteredEntries.length === 0}
              style={{ 
                padding: "9px 18px", 
                borderRadius: radius.md, 
                border: "none", 
                background: gradients.primaryButton, 
                color: "#FFF", 
                fontWeight: 700, 
                fontSize: 13, 
                cursor: filteredEntries.length === 0 ? "not-allowed" : "pointer", 
                opacity: filteredEntries.length === 0 ? 0.6 : 1,
                display: "flex",
                alignItems: "center",
                gap: 8,
                boxShadow: shadows.card
              }}
            >
              <Download size={14} />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
        
        {/* SECTION 1: Ask AI Card Banner */}
        <div 
          onClick={() => navigate("/ai-chat")}
          style={{
            background: "linear-gradient(135deg, #5B5FCF 0%, rgba(23, 62, 234, 0.8) 100%)",
            borderRadius: radius.lg,
            padding: "16px 20px",
            marginBottom: 24,
            cursor: "pointer",
            boxShadow: shadows.card,
            display: "flex",
            alignItems: "center",
            gap: 16,
            transition: "transform 0.15s ease",
            transform: "translateY(0)"
          }}
          onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
          onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
        >
          <div style={{ width: 42, height: 42, background: "rgba(255,255,255,0.18)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Sparkles size={20} color="#FFFFFF" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: "#FFFFFF", fontWeight: "800", fontSize: 16 }}>Ask AI</div>
            <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 12.5, marginTop: 2 }}>Ask about costs, entries &amp; inventory insights</div>
          </div>
          <ChevronRight size={18} color="rgba(255,255,255,0.7)" />
        </div>

        {/* SECTION 2: Project Context Filters */}
        <div style={{ background: colors.cardBg, borderRadius: radius.lg, border: `1px solid ${colors.cardBorder}`, padding: 20, marginBottom: 24, boxShadow: shadows.card }}>
          
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ width: 34, height: 34, background: "rgba(23, 62, 234, 0.1)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: primaryBlue, flexShrink: 0 }}>
              <Building size={16} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: "800", color: colors.textPrimary }}>Project Context</div>
              <div style={{ fontSize: 11.5, color: colors.textLight, marginTop: 1 }}>Configure scoping properties</div>
            </div>
          </div>

          <hr style={{ border: "none", borderTop: `1px solid ${colors.divider}`, margin: "0 0 16px" }} />

          {/* Selector Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            
            {/* Project dropdown */}
            <div>
              <label style={{ display: "block", fontSize: 11.5, fontWeight: "600", color: colors.textSecondary, marginBottom: 6 }}>Project</label>
              <div style={{ position: "relative" }}>
                <select 
                  value={selectedProjectId} 
                  onChange={e => {
                    setSelectedProjectId(e.target.value);
                    setSelectedFloor("");
                    setSelectedPhaseId("");
                    setSelectedActivityName("");
                    setCurrentPage(1);
                  }}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.2px solid #E2E4FA`, background: "#FFF", fontSize: 13, fontWeight: "600", color: colors.textPrimary, outline: "none", appearance: "none", cursor: "pointer" }}
                >
                  <option value="all">All projects</option>
                  {projects.map(p => (
                    <option key={p._id} value={p._id}>{p.projectName || p.name}</option>
                  ))}
                </select>
                <ChevronDown size={14} color="#757299" style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
              </div>
            </div>

            {/* Floor dropdown */}
            <div>
              <label style={{ display: "block", fontSize: 11.5, fontWeight: "600", color: selectedProjectId === "all" || floors.length === 0 ? "#C5CAE9" : colors.textSecondary, marginBottom: 6 }}>Floor</label>
              <div style={{ position: "relative" }}>
                <select 
                  disabled={selectedProjectId === "all" || floors.length === 0}
                  value={selectedFloor || "Select Floor"} 
                  onChange={e => {
                    setSelectedFloor(e.target.value === "Select Floor" ? "" : e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.2px solid #E2E4FA`, background: selectedProjectId === "all" || floors.length === 0 ? "#F9FAFB" : "#FFF", fontSize: 13, fontWeight: "600", color: selectedProjectId === "all" || floors.length === 0 ? "#9CA3AF" : colors.textPrimary, outline: "none", appearance: "none", cursor: "pointer" }}
                >
                  <option value="Select Floor">Select Floor (All)</option>
                  {floors.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
                <ChevronDown size={14} color="#757299" style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
              </div>
            </div>

            {/* Phase dropdown */}
            <div>
              <label style={{ display: "block", fontSize: 11.5, fontWeight: "600", color: selectedProjectId === "all" || phases.length === 0 ? "#C5CAE9" : colors.textSecondary, marginBottom: 6 }}>Phase</label>
              <div style={{ position: "relative" }}>
                <select 
                  disabled={selectedProjectId === "all" || phases.length === 0}
                  value={selectedPhaseId || "Select Phase"} 
                  onChange={e => {
                    setSelectedPhaseId(e.target.value === "Select Phase" ? "" : e.target.value);
                    setSelectedActivityName("");
                    setCurrentPage(1);
                  }}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.2px solid #E2E4FA`, background: selectedProjectId === "all" || phases.length === 0 ? "#F9FAFB" : "#FFF", fontSize: 13, fontWeight: "600", color: selectedProjectId === "all" || phases.length === 0 ? "#9CA3AF" : colors.textPrimary, outline: "none", appearance: "none", cursor: "pointer" }}
                >
                  <option value="Select Phase">Select Phase (All)</option>
                  {phases.map(ph => (
                    <option key={ph.id} value={ph.id}>{ph.phaseName}</option>
                  ))}
                </select>
                <ChevronDown size={14} color="#757299" style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
              </div>
            </div>

            {/* Activity dropdown */}
            <div>
              <label style={{ display: "block", fontSize: 11.5, fontWeight: "600", color: selectedProjectId === "all" || uniqueActivityNames.length === 0 ? "#C5CAE9" : colors.textSecondary, marginBottom: 6 }}>Activity</label>
              <div style={{ position: "relative" }}>
                <select 
                  disabled={selectedProjectId === "all" || uniqueActivityNames.length === 0}
                  value={selectedActivityName || "Select Activity"} 
                  onChange={e => {
                    setSelectedActivityName(e.target.value === "Select Activity" ? "" : e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.2px solid #E2E4FA`, background: selectedProjectId === "all" || uniqueActivityNames.length === 0 ? "#F9FAFB" : "#FFF", fontSize: 13, fontWeight: "600", color: selectedProjectId === "all" || uniqueActivityNames.length === 0 ? "#9CA3AF" : colors.textPrimary, outline: "none", appearance: "none", cursor: "pointer" }}
                >
                  <option value="Select Activity">Select Activity (All)</option>
                  {uniqueActivityNames.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
                <ChevronDown size={14} color="#757299" style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
              </div>
            </div>

            {/* Date Period dropdown */}
            <div>
              <label style={{ display: "block", fontSize: 11.5, fontWeight: "600", color: colors.textSecondary, marginBottom: 6 }}>Date Period</label>
              <div style={{ position: "relative" }}>
                <select 
                  value={datePreset} 
                  onChange={e => handleDatePreset(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.2px solid #E2E4FA`, background: "#FFF", fontSize: 13, fontWeight: "600", color: colors.textPrimary, outline: "none", appearance: "none", cursor: "pointer" }}
                >
                  <option value="All Time">All Time</option>
                  <option value="Today">Today</option>
                  <option value="This Week">This Week</option>
                  <option value="This Month">This Month</option>
                  <option value="Last 30 Days">Last 30 Days</option>
                  <option value="This Year">This Year</option>
                  <option value="Custom">Custom Range</option>
                </select>
                <ChevronDown size={14} color="#757299" style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
              </div>
            </div>

            {/* Custom Dates (conditional inline) */}
            {datePreset === "Custom" && (
              <>
                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: "600", color: colors.textSecondary, marginBottom: 6 }}>Start Date</label>
                  <input 
                    type="date" 
                    value={startDate ? startDate.toISOString().split("T")[0] : ""}
                    onChange={e => {
                      setStartDate(e.target.value ? new Date(e.target.value) : null);
                      setCurrentPage(1);
                    }}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: `1.2px solid #E2E4FA`, background: "#FFF", fontSize: 13, color: colors.textPrimary, outline: "none" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: "600", color: colors.textSecondary, marginBottom: 6 }}>End Date</label>
                  <input 
                    type="date" 
                    value={endDate ? endDate.toISOString().split("T")[0] : ""}
                    onChange={e => {
                      setEndDate(e.target.value ? new Date(e.target.value) : null);
                      setCurrentPage(1);
                    }}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: `1.2px solid #E2E4FA`, background: "#FFF", fontSize: 13, color: colors.textPrimary, outline: "none" }}
                  />
                </div>
              </>
            )}

          </div>

        </div>

        {/* SECTION 3: Filtered Cost Summary Cards */}
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: "800", color: colors.textPrimary, margin: "0 0 12px" }}>Filtered Cost Summary</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
            
            {/* Grand Total cost */}
            <div style={{ background: "linear-gradient(135deg, #173EEA 0%, #4667FF 100%)", borderRadius: radius.lg, padding: "20px 24px", boxShadow: shadows.card, display: "flex", flexDirection: "column", justifyContent: "space-between", height: 110 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span style={{ fontSize: 12, fontWeight: "700", color: "rgba(255,255,255,0.7)" }}>Grand Total Expense</span>
                <span style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}><IndianRupee size={16} color="#FFF" /></span>
              </div>
              <div style={{ color: "#FFF", fontSize: 24, fontWeight: "900", letterSpacing: "-0.5px" }}>{formatINR(grandTotal)}</div>
            </div>

            {/* Material Cost card */}
            <div style={{ background: colors.cardBg, borderRadius: radius.lg, border: `1px solid ${colors.cardBorder}`, padding: "20px 24px", boxShadow: shadows.card, display: "flex", flexDirection: "column", justifyContent: "space-between", height: 110 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span style={{ fontSize: 12, fontWeight: "700", color: colors.textLight }}>Material Cost</span>
                <span style={{ width: 28, height: 28, borderRadius: 8, background: "#5B5FCF15", display: "flex", alignItems: "center", justifyContent: "center", color: "#5B5FCF" }}><Package size={16} /></span>
              </div>
              <div style={{ color: colors.textPrimary, fontSize: 24, fontWeight: "900", letterSpacing: "-0.5px" }}>{formatINR(materialTotal)}</div>
            </div>

            {/* Labour Cost card */}
            <div style={{ background: colors.cardBg, borderRadius: radius.lg, border: `1px solid ${colors.cardBorder}`, padding: "20px 24px", boxShadow: shadows.card, display: "flex", flexDirection: "column", justifyContent: "space-between", height: 110 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span style={{ fontSize: 12, fontWeight: "700", color: colors.textLight }}>Labour Cost</span>
                <span style={{ width: 28, height: 28, borderRadius: 8, background: `${primaryPurple}15`, display: "flex", alignItems: "center", justifyContent: "center", color: primaryPurple }}><User size={16} /></span>
              </div>
              <div style={{ color: colors.textPrimary, fontSize: 24, fontWeight: "900", letterSpacing: "-0.5px" }}>{formatINR(labourTotal)}</div>
            </div>

            {/* Equipment Cost card */}
            <div style={{ background: colors.cardBg, borderRadius: radius.lg, border: `1px solid ${colors.cardBorder}`, padding: "20px 24px", boxShadow: shadows.card, display: "flex", flexDirection: "column", justifyContent: "space-between", height: 110 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span style={{ fontSize: 12, fontWeight: "700", color: colors.textLight }}>Equipment Cost</span>
                <span style={{ width: 28, height: 28, borderRadius: 8, background: `${primaryLightBlue}15`, display: "flex", alignItems: "center", justifyContent: "center", color: primaryLightBlue }}><Wrench size={16} /></span>
              </div>
              <div style={{ color: colors.textPrimary, fontSize: 24, fontWeight: "900", letterSpacing: "-0.5px" }}>{formatINR(equipmentTotal)}</div>
            </div>

          </div>
        </div>

        {/* SECTION 4: Category Tabs */}
        <div style={{ display: "flex", background: colors.cardBg, borderRadius: radius.md, border: `1.2px solid ${colors.cardBorder}`, padding: 4, marginBottom: 20, boxShadow: shadows.card }}>
          {["All", "Materials", "Labour", "Equipment"].map(tab => {
            const active = activeTab === tab;
            return (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: radius.sm,
                  border: "none",
                  background: active ? gradients.primaryButton : "transparent",
                  color: active ? "#FFF" : colors.textMedium,
                  fontWeight: "700",
                  fontSize: 13,
                  cursor: "pointer",
                  transition: "all 0.15s ease"
                }}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* SECTION 5: Tab Specific Sub-Filters & Search */}
        {activeTab === "All" ? (
          /* All tab: Normal search bar */
          <div style={{ background: colors.cardBg, borderRadius: radius.lg, border: `1px solid ${colors.cardBorder}`, padding: 14, marginBottom: 20, boxShadow: shadows.card, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, background: colors.bgBase4, borderRadius: 10, padding: "10px 14px" }}>
              <Search size={16} color="#757299" />
              <input 
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search description, brand, project, floor, status..." 
                style={{ border: "none", background: "transparent", width: "100%", outline: "none", fontSize: 13, color: colors.textPrimary }}
              />
            </div>
            
            {/* Status Selector */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <label style={{ fontSize: 12, fontWeight: "600", color: colors.textSecondary }}>Status</label>
              <select 
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid #E2E4FA`, outline: "none", fontSize: 12, fontWeight: "600", color: colors.textPrimary }}
              >
                <option value="All">All Approval Statuses</option>
                <option value="Approved">Approved Only</option>
                <option value="Pending">Pending Only</option>
              </select>
            </div>
          </div>
        ) : (
          /* Materials/Labour/Equipment: Autocomplete Search suggestions + Sub-dropdown dropdown + Generate button */
          <div style={{ background: colors.cardBg, borderRadius: radius.lg, border: `1px solid ${colors.cardBorder}`, padding: 16, marginBottom: 20, boxShadow: shadows.card }}>
            
            <div style={{ position: "relative", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, background: colors.bgBase4, borderRadius: 10, padding: "10px 14px", border: showSuggestionsList ? `1px solid ${primaryBlue}` : "none" }}>
                <Search size={16} color="#757299" />
                <input 
                  value={searchQuery}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  onChange={e => {
                    setSearchQuery(e.target.value);
                    setSelectedItemName("");
                    setShowSuggestions(true);
                  }}
                  placeholder={`Search ${activeTab.toLowerCase()}...`}
                  style={{ border: "none", background: "transparent", width: "100%", outline: "none", fontSize: 13, color: colors.textPrimary }}
                />
              </div>
              
              {/* Autocomplete Suggestions list panel overlay */}
              {showSuggestionsList && (
                <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#FFF", border: `1px solid #E2E4FA`, borderRadius: 10, boxShadow: shadows.card, zIndex: 50, maxHeight: 180, overflowY: "auto" }}>
                  {textQuerySuggestions.map(name => (
                    <div 
                      key={name}
                      onMouseDown={() => {
                        setSearchQuery(name);
                        setSelectedItemName(name);
                        setShowSuggestions(false);
                      }}
                      style={{ padding: "10px 14px", fontSize: 13, color: colors.textPrimary, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
                      onMouseEnter={e => e.currentTarget.style.background = "#F3F4F6"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <span style={{ color: primaryBlue }}>↳</span>
                      <span>{name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ flex: 1, position: "relative" }}>
                <select 
                  value={selectedItemName || "All"}
                  onChange={e => {
                    const val = e.target.value;
                    setSelectedItemName(val === "All" ? "" : val);
                    setSearchQuery(val === "All" ? "" : val);
                  }}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.2px solid #E2E4FA`, background: "#FFF", fontSize: 13, fontWeight: "600", color: colors.textPrimary, outline: "none", appearance: "none", cursor: "pointer" }}
                >
                  <option value="All">All {activeTab === "Materials" ? "Material Names" : activeTab === "Labour" ? "Worker Types" : "Equipment Names"}</option>
                  {uniqueItemNames.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
                <ChevronDown size={14} color="#757299" style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
              </div>

              {/* Status Selector */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <label style={{ fontSize: 12, fontWeight: "600", color: colors.textSecondary }}>Status</label>
                <select 
                  value={selectedStatus}
                  onChange={e => setSelectedStatus(e.target.value)}
                  style={{ padding: "10px 14px", borderRadius: 10, border: `1px solid #E2E4FA`, outline: "none", fontSize: 12, fontWeight: "600", color: colors.textPrimary }}
                >
                  <option value="All">All Approval Statuses</option>
                  <option value="Approved">Approved Only</option>
                  <option value="Pending">Pending Only</option>
                </select>
              </div>
            </div>

            <div style={{ width: "100%", marginTop: 14 }}>
              <button 
                onClick={() => {
                  setReportGenerated(true);
                  setCurrentPage(1);
                }}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: activeTab === "Materials" ? "#5B5FCF" : activeTab === "Labour" ? primaryPurple : primaryLightBlue,
                  borderRadius: 10,
                  color: "#FFFFFF",
                  fontWeight: "700",
                  fontSize: 13.5,
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8
                }}
              >
                Generate CSV Report
              </button>
            </div>

          </div>
        )}

        {/* SECTION 6: Report Logs Table Dynamic Grid */}
        {activeTab !== "All" && !reportGenerated ? (
          /* Placeholder when report is not generated yet */
          <div style={{ background: colors.cardBg, borderRadius: radius.lg, border: `1px solid ${colors.cardBorder}`, padding: "60px 20px", textAlign: "center", boxShadow: shadows.card }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: activeTab === "Materials" ? "#5B5FCF15" : activeTab === "Labour" ? `${primaryPurple}15` : `${primaryLightBlue}15`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: activeTab === "Materials" ? "#5B5FCF" : activeTab === "Labour" ? primaryPurple : primaryLightBlue }}>
              <FileText size={24} />
            </div>
            <h3 style={{ fontSize: 15, fontWeight: "700", color: colors.textPrimary, margin: "0 0 6px" }}>Configure Filters</h3>
            <p style={{ fontSize: 12.5, color: colors.textLight, margin: 0, lineHeight: 1.5 }}>
              Configure filters above and tap<br /><strong>"Generate CSV Report"</strong> to view transaction logs.
            </p>
          </div>
        ) : (
          /* Log Table */
          <div style={{ background: colors.cardBg, borderRadius: radius.lg, border: `1px solid ${colors.cardBorder}`, overflow: "hidden", boxShadow: shadows.card }}>
            
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#F5F6FF" }}>
                    {uiActiveCols.map((colName) => {
                      const isSortable = ["Date", "Purchased Date", "Project", "Amount"].includes(colName);
                      let style = { 
                        padding: "14px 18px", 
                        fontSize: 11, 
                        fontWeight: 700, 
                        color: colors.textMedium, 
                        letterSpacing: "0.06em", 
                        textAlign: colName === "Amount" ? "right" : "left", 
                        whiteSpace: "nowrap",
                        cursor: isSortable ? "pointer" : "default"
                      };

                      const handleSortClick = () => {
                        if (colName === "Date" || colName === "Purchased Date") {
                          setSortColumn("date");
                          setSortAscending(!sortAscending);
                        } else if (colName === "Project") {
                          setSortColumn("project");
                          setSortAscending(!sortAscending);
                        } else if (colName === "Amount") {
                          setSortColumn("amount");
                          setSortAscending(!sortAscending);
                        }
                      };

                      return (
                        <th 
                          key={colName} 
                          style={style}
                          onClick={isSortable ? handleSortClick : undefined}
                        >
                          {colName === "Amount" ? "AMOUNT (INR)" : colName.toUpperCase()}
                          {isSortable && sortColumn === (colName === "Project" ? "project" : colName === "Amount" ? "amount" : "date") && (
                            <span style={{ marginLeft: 4 }}>{sortAscending ? "▲" : "▼"}</span>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {paginatedEntries.length === 0 ? (
                    <tr>
                      <td colSpan={uiActiveCols.length} style={{ padding: 48, textAlign: "center", color: colors.textLight, fontSize: 13 }}>
                        No transaction logs match filters.
                      </td>
                    </tr>
                  ) : (
                    paginatedEntries.map((entry) => {
                      const projectName = getProjectName(entry.projectId);
                      
                      return (
                        <tr 
                          key={entry.id} 
                          style={{ borderBottom: `1px solid ${colors.divider}`, cursor: "pointer" }}
                          onClick={(e) => {
                            // Don't open details modal if clicking button actions
                            if (e.target.closest("button")) return;
                            setDetailsEntry(entry);
                          }}
                          onMouseEnter={ev => ev.currentTarget.style.background = "#F9FAFB"}
                          onMouseLeave={ev => ev.currentTarget.style.background = "transparent"}
                        >
                          {uiActiveCols.map((colName) => {
                            const valStyle = { padding: "14px 18px", fontSize: 12.5, color: colors.textPrimary };
                            
                            if (colName === "Purchased Date") {
                              return <td key={colName} style={valStyle}>{formatDateShort(entry.date)}</td>;
                            } else if (colName === "Payment Date") {
                              return <td key={colName} style={valStyle}>{entry.paymentDate ? formatDateShort(entry.paymentDate) : "—"}</td>;
                            } else if (colName === "Project") {
                              return <td key={colName} style={{ ...valStyle, fontWeight: "600" }}>{projectName}</td>;
                            } else if (colName === "Type") {
                              const chipColor = entry.type === "material" ? "#5B5FCF" : entry.type === "labour" ? primaryPurple : primaryLightBlue;
                              const chipBg = entry.type === "material" ? "#5B5FCF15" : entry.type === "labour" ? `${primaryPurple}15` : `${primaryLightBlue}15`;
                              return (
                                <td key={colName} style={valStyle}>
                                  <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 10.5, fontWeight: "700", background: chipBg, color: chipColor }}>
                                    {entry.type.toUpperCase()}
                                  </span>
                                </td>
                              );
                            } else if (colName === "Description") {
                              return <td key={colName} style={valStyle}>{entry.description || "—"}</td>;
                            } else if (colName === "Material" || colName === "Worker Type" || colName === "Equipment") {
                              return <td key={colName} style={valStyle}>{entry.description}</td>;
                            } else if (colName === "Brand") {
                              return <td key={colName} style={valStyle}>{entry.brand || "—"}</td>;
                            } else if (colName === "Floor") {
                              return <td key={colName} style={valStyle}>{entry.floor || "—"}</td>;
                            } else if (colName === "Phase") {
                              return <td key={colName} style={valStyle}>{entry.phase || "—"}</td>;
                            } else if (colName === "Activity") {
                              return <td key={colName} style={valStyle}>{entry.activity || "—"}</td>;
                            } else if (colName === "Unit") {
                              return <td key={colName} style={valStyle}>{entry.unit || "—"}</td>;
                            } else if (colName === "Status") {
                              const payStatus = getPaymentStatusLabel(entry.paymentStatus);
                              const col = payStatus === "Fully Paid" ? "#16a34a" : payStatus === "Partial" ? "#d97706" : "#dc2626";
                              const bg = payStatus === "Fully Paid" ? "#f0fdf4" : payStatus === "Partial" ? "#fffbeb" : "#fef2f2";
                              return (
                                <td key={colName} style={valStyle}>
                                  <span style={{ padding: "3px 9px", borderRadius: 6, fontSize: 10.5, fontWeight: "700", color: col, background: bg }}>
                                    {payStatus}
                                  </span>
                                </td>
                              );
                            } else if (colName === "Amount") {
                              return (
                                <td key={colName} style={{ ...valStyle, textAlign: "right", fontWeight: "700" }}>
                                  {formatINR(entry.amount)}
                                </td>
                              );
                            } else if (colName === "Rate" || colName === "Rate/Day" || colName === "Rent Rate") {
                              return (
                                <td key={colName} style={{ ...valStyle, textAlign: "right" }}>
                                  {formatINR(entry.ratePerUnit)}
                                </td>
                              );
                            } else if (colName === "Qty" || colName === "Days" || colName === "Duration") {
                              const rate = entry.ratePerUnit || 0;
                              const val = (rate === 0) ? 0 : entry.amount / rate;
                              return (
                                <td key={colName} style={{ ...valStyle, textAlign: "right" }}>
                                  {val.toFixed(1)}
                                </td>
                              );
                            } else if (colName === "Add More") {
                              return (
                                <td key={colName} style={valStyle}>
                                  <button 
                                    onClick={() => handleAddMore(entry)}
                                    style={{ padding: "6px 12px", border: `1.2px solid #E2E4FA`, background: "#FFF", borderRadius: 8, fontSize: 11.5, fontWeight: "700", color: primaryBlue, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                                  >
                                    <PlusCircle size={12} /> Add More
                                  </button>
                                </td>
                              );
                            } else if (colName === "Record Payment") {
                              return (
                                <td key={colName} style={valStyle}>
                                  <button 
                                    onClick={() => handleRecordPaymentClick(entry)}
                                    style={{ padding: "6px 12px", border: `1.2px solid #ca8a04`, background: "#FFF", borderRadius: 8, fontSize: 11.5, fontWeight: "700", color: "#ca8a04", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                                  >
                                    <CreditCard size={12} /> Pay Log
                                  </button>
                                </td>
                              );
                            } else if (colName === "Edit Entry") {
                              return (
                                <td key={colName} style={valStyle}>
                                  <button 
                                    onClick={() => handleEditEntry(entry)}
                                    style={{ padding: "6px 12px", border: `1.2px solid #4b5563`, background: "#FFF", borderRadius: 8, fontSize: 11.5, fontWeight: "700", color: "#4b5563", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                                  >
                                    <Edit2 size={12} /> Edit
                                  </button>
                                </td>
                              );
                            } else {
                              return <td key={colName} style={valStyle}>—</td>;
                            }
                          })}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalCount > 0 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderTop: `1px solid ${colors.cardBorder}`, background: "#FFF", flexWrap: "wrap", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <span style={{ fontSize: 12, color: colors.textLight }}>{totalCount} entries found</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 11.5, color: colors.textLight }}>Show:</span>
                    <select 
                      value={rowsPerPage} 
                      onChange={e => {
                        setRowsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      style={{ padding: "4px 8px", borderRadius: 6, border: `1.2px solid #E2E4FA`, fontSize: 12, fontWeight: "700", color: colors.textPrimary, outline: "none" }}
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button 
                    disabled={safeCurrentPage <= 1}
                    onClick={() => setCurrentPage(safeCurrentPage - 1)}
                    style={{ border: `1px solid ${colors.cardBorder}`, background: "none", cursor: safeCurrentPage <= 1 ? "not-allowed" : "pointer", padding: 6, borderRadius: 8, color: safeCurrentPage <= 1 ? "#aaa" : colors.textPrimary }}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span style={{ fontSize: 12.5, fontWeight: "600", color: colors.textPrimary }}>
                    Page {safeCurrentPage} of {totalPages}
                  </span>
                  <button 
                    disabled={safeCurrentPage >= totalPages}
                    onClick={() => setCurrentPage(safeCurrentPage + 1)}
                    style={{ border: `1px solid ${colors.cardBorder}`, background: "none", cursor: safeCurrentPage >= totalPages ? "not-allowed" : "pointer", padding: 6, borderRadius: 8, color: safeCurrentPage >= totalPages ? "#aaa" : colors.textPrimary }}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>

              </div>
            )}

          </div>
        )}

      </div>

      {/* MODAL 1: Customize Columns Dialog */}
      {showCustomizeModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#FFF", borderRadius: 16, width: 340, padding: 20, boxShadow: shadows.card, position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: primaryBlue }}>Customize Columns</h3>
              <button onClick={() => setShowCustomizeModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: colors.textLight }}><X size={18} /></button>
            </div>
            
            <hr style={{ border: "none", borderTop: `1px solid ${colors.divider}`, margin: "0 0 10px" }} />
            
            <p style={{ margin: "0 0 12px", fontSize: 11, color: colors.textLight, lineHeight: 1.4 }}>
              Toggle visibility or reorder columns in the reports table log layout. Move columns up and down inside the table list.
            </p>

            <div style={{ maxHeight: 280, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6, paddingRight: 4 }}>
              {tempAllCols.map((col, idx) => {
                const isChecked = tempActiveCols.includes(col);
                return (
                  <div key={col} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", background: colors.bgBase4, borderRadius: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <input 
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleColumn(col)}
                        style={{ width: 15, height: 15, accentColor: primaryBlue, cursor: "pointer" }}
                      />
                      <span style={{ fontSize: 12.5, fontWeight: "700", color: colors.textPrimary }}>{col}</span>
                    </div>

                    <div style={{ display: "flex", gap: 4 }}>
                      <button 
                        disabled={idx === 0}
                        onClick={() => handleMoveColumn(idx, -1)}
                        style={{ border: "none", background: "none", cursor: idx === 0 ? "not-allowed" : "pointer", color: idx === 0 ? "#ccc" : colors.textPrimary, fontSize: 11, fontWeight: "bold" }}
                      >
                        ▲
                      </button>
                      <button 
                        disabled={idx === tempAllCols.length - 1}
                        onClick={() => handleMoveColumn(idx, 1)}
                        style={{ border: "none", background: "none", cursor: idx === tempAllCols.length - 1 ? "not-allowed" : "pointer", color: idx === tempAllCols.length - 1 ? "#ccc" : colors.textPrimary, fontSize: 11, fontWeight: "bold" }}
                      >
                        ▼
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", justifyItems: "stretch", gap: 10, marginTop: 18 }}>
              <button 
                onClick={resetCustomizeColumns}
                style={{ flex: 1, padding: "10px 0", border: `1.2px solid ${colors.cardBorder}`, background: "none", borderRadius: 10, fontSize: 13, fontWeight: "700", color: colors.textMedium, cursor: "pointer" }}
              >
                Reset Default
              </button>
              <button 
                onClick={saveCustomizeColumns}
                style={{ flex: 1, padding: "10px 0", border: "none", background: gradients.primaryButton, borderRadius: 10, fontSize: 13, fontWeight: "700", color: "#FFF", cursor: "pointer" }}
              >
                Save Columns
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: Entry Details Dialog (when row clicked) */}
      {detailsEntry && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 900, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#FFF", borderRadius: 16, width: 360, padding: 22, boxShadow: shadows.card }}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: primaryBlue }}>Entry Details</h3>
              <button onClick={() => setDetailsEntry(null)} style={{ background: "none", border: "none", cursor: "pointer", color: colors.textLight }}><X size={18} /></button>
            </div>

            <hr style={{ border: "none", borderTop: `1px solid ${colors.divider}`, margin: "0 0 14px" }} />

            {/* List details */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "Project", val: getProjectName(detailsEntry.projectId) },
                { label: "Type", val: detailsEntry.type.toUpperCase() },
                { label: "Date", val: formatDateLong(detailsEntry.date) },
                { label: "Amount", val: formatINR(detailsEntry.amount), bold: true },
                { label: "Status", val: getPaymentStatusLabel(detailsEntry.paymentStatus) },
                { label: "Description", val: detailsEntry.description || "—" },
                { label: "Brand", val: detailsEntry.brand || "—" },
                { label: "Floor", val: detailsEntry.floor || "—" },
                { label: "Phase", val: detailsEntry.phase || "—" },
                { label: "Unit", val: detailsEntry.unit || "—" },
                { label: "Rejection Reason", val: detailsEntry.rejectionReason, isWarning: true }
              ].map((row) => {
                if (!row.val) return null;
                return (
                  <div key={row.label} style={{ display: "flex", fontSize: 12.5 }}>
                    <span style={{ width: 110, fontWeight: "600", color: colors.textSecondary }}>{row.label}</span>
                    <span style={{ flex: 1, fontWeight: row.bold ? "800" : "700", color: row.isWarning ? "#dc2626" : colors.textPrimary }}>{row.val}</span>
                  </div>
                );
              })}
            </div>

            <hr style={{ border: "none", borderTop: `1px solid ${colors.divider}`, margin: "16px 0 14px" }} />

            {/* Payment History in details modal */}
            {detailsEntry?.rawTx?.paymentHistory?.length > 0 && (
              <>
                <hr style={{ border: "none", borderTop: `1px solid ${colors.divider}`, margin: "14px 0" }} />
                <div style={{ fontSize: 11.5, fontWeight: 700, color: colors.textSecondary, marginBottom: 8 }}>
                  PAYMENT HISTORY
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 140, overflowY: "auto" }}>
                  {detailsEntry.rawTx.paymentHistory.map((ph, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: "8px 10px",
                        borderRadius: 8,
                        background: colors.bgBase4,
                        border: `1px solid ${colors.cardBorder}`,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: colors.textPrimary }}>
                          {formatINR(ph.amount)}
                        </span>
                        <span style={{ fontSize: 11, color: colors.textLight }}>
                          {ph.method || "—"}
                        </span>
                      </div>
                      <div style={{ fontSize: 10.5, color: colors.textLight, marginTop: 2 }}>
                        {formatDateShort(ph.date)}
                        {ph.note ? ` — ${ph.note}` : ""}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Inline dialog actions */}
            <div style={{ display: "flex", gap: 8 }}>
              <button 
                onClick={() => {
                  const entry = detailsEntry;
                  setDetailsEntry(null);
                  handleAddMore(entry);
                }}
                style={{ flex: 1, padding: "8px 0", border: `1.2px solid #E2E4FA`, background: "#FFF", borderRadius: 8, fontSize: 11.5, fontWeight: "700", color: primaryBlue, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}
              >
                <PlusCircle size={11} /> Add More
              </button>
              
              <button 
                onClick={() => {
                  const entry = detailsEntry;
                  setDetailsEntry(null);
                  handleRecordPaymentClick(entry);
                }}
                style={{ flex: 1, padding: "8px 0", border: `1.2px solid #ca8a04`, background: "#FFF", borderRadius: 8, fontSize: 11.5, fontWeight: "700", color: "#ca8a04", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}
              >
                <CreditCard size={11} /> Pay Log
              </button>

              <button 
                onClick={() => {
                  const entry = detailsEntry;
                  setDetailsEntry(null);
                  handleEditEntry(entry);
                }}
                style={{ flex: 1, padding: "8px 0", border: `1.2px solid #4b5563`, background: "#FFF", borderRadius: 8, fontSize: 11.5, fontWeight: "700", color: "#4b5563", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}
              >
                <Edit2 size={11} /> Edit
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 3: Record Payment Sheet (Flutter parity) */}
      <RecordPaymentSheet
        open={paymentSheetOpen}
        entry={paymentItem}
        projects={projects}
        onClose={() => setPaymentSheetOpen(false)}
        onSaved={(msg) => {
          setToast({ msg: msg || "Payment recorded successfully", type: "success" });
          loadData();
        }}
      />

    </div>
  );
}
