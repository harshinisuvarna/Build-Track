import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "./layout/DashboardLayout";
import AppProviders from "./contexts/AppProviders";
import { useAuth } from "./contexts/AuthContext";
import RequireRole from "./components/RequireRole";

import LoginPage       from "./pages/login_page";
import SignUpPage      from "./pages/signup_page";
import OAuthCallback   from "./pages/oauth_callback";
import Dashboard       from "./screens/dashboard_page";
import VoiceAssistant  from "./screens/voice_assistant";
import Workers         from "./screens/work_list";
import TransactionLog  from "./screens/transaction_log";
import Projects        from "./screens/project_management";
import Reports         from "./screens/financial_report";
import Settings        from "./screens/settings_page";
import NewProject      from "./screens/add_new_project";
import AddEntry        from "./screens/add_entry_page";
import EntryDetail     from "./screens/entry_detail_page";
import Approvals       from "./screens/approvals_page";
import AdminOverview   from "./screens/admin_overview_page";
import AiChatReport    from "./screens/ai_chat_report_page";
import AssignRoles     from "./screens/assign_roles_page";
import Notifications   from "./screens/notifications_page";
import NewWorker       from "./screens/add_new_worker";
import ManageSite      from "./screens/managesite_dashboard";
import ManualEntryPage from "./screens/manual_entry";
import WorkerDetails   from "./screens/worker_details_page";
import InventoryPage   from "./screens/inventory_page";
import SubscriptionPage from "./screens/subscription_page";
import AuditLogsPage    from "./screens/audit_logs_page";

function RequireAuth({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh',
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
        color: '#6B7280', fontSize: 14,
      }}>
        Loading...
      </div>
    );
  }
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login"          element={<LoginPage />} />
      <Route path="/signup"         element={<SignUpPage />} />
      <Route path="/oauth/callback" element={<OAuthCallback />} />

      <Route element={<RequireAuth><DashboardLayout /></RequireAuth>}>
        <Route path="/"            element={<Dashboard />} />
        <Route path="/add-entry"    element={<AddEntry />} />
        <Route path="/manualentry" element={
          <RequireRole permission="add_entries">
            <ManualEntryPage />
          </RequireRole>
        } />
        <Route path="/entry-detail" element={<EntryDetail />} />
        <Route path="/voice"       element={<VoiceAssistant />} />
        <Route path="/workers"     element={<Workers />} />
        <Route path="/workers/:id" element={<WorkerDetails />} />
        <Route path="/newworker"   element={<NewWorker />} />
        <Route path="/transaction" element={<TransactionLog />} />
        <Route path="/projects"    element={<Projects />} />
        <Route path="/newproject"  element={
          <RequireRole permission="create_project">
            <NewProject />
          </RequireRole>
        } />
        <Route path="/inventory"   element={<InventoryPage />} />
        
        <Route path="/reports"     element={
          <RequireRole permission="view_reports" route="/reports">
            <Reports />
          </RequireRole>
        } />
        
        <Route path="/settings"    element={<Settings />} />
        <Route path="/managesite"  element={<ManageSite />} />
        
        <Route path="/approvals"  element={
          <RequireRole permission="approve_payments" route="/approvals">
            <Approvals />
          </RequireRole>
        } />
        
        <Route path="/admin"      element={
          <RequireRole route="/admin">
            <AdminOverview />
          </RequireRole>
        } />
        
        <Route path="/ai-chat"    element={<AiChatReport />} />
        
        <Route path="/assign-role" element={
          <RequireRole permission="assign_roles">
            <AssignRoles />
          </RequireRole>
        } />
        
        <Route path="/notifications" element={<Notifications />} />
        
        {/* Unique pages from stashed changes */}
        <Route path="/subscription" element={<SubscriptionPage />} />
        <Route path="/audit-logs"   element={
          <RequireRole route="/audit-logs">
            <AuditLogsPage />
          </RequireRole>
        } />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AppProviders>
      <AppRoutes />
    </AppProviders>
  );
}
