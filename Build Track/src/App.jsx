import { Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "./layout/DashboardLayout";

import LoginPage       from "./pages/login_page";
import SignUpPage      from "./pages/signup_page";
import OAuthCallback   from "./pages/oauth_callback";   // ← OAuth landing page
import Dashboard       from "./screens/dashboard_page";
import VoiceAssistant  from "./screens/voice_assistant";
import Workers         from "./screens/work_list";
import TransactionLog  from "./screens/transaction_log";
import Projects        from "./screens/project_management";
import Reports         from "./screens/financial_report";
import Settings        from "./screens/settings_page";
import NewProject      from "./screens/add_new_project";
import NewWorker       from "./screens/add_new_worker";
import ManageSite      from "./screens/managesite_dashboard";
import ManualEntryPage from "./screens/manual_entry";
import WorkerDetails   from "./screens/worker_details_page";

function RequireAuth({ children }) {
  const token = localStorage.getItem("bt_token");
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login"          element={<LoginPage />} />
      <Route path="/signup"         element={<SignUpPage />} />
      <Route path="/oauth/callback" element={<OAuthCallback />} />   {/* ← OAuth token landing */}

      <Route element={<RequireAuth><DashboardLayout /></RequireAuth>}>
        <Route path="/"            element={<Dashboard />} />
        <Route path="/voice"       element={<VoiceAssistant />} />
        <Route path="/workers"     element={<Workers />} />
        <Route path="/transaction" element={<TransactionLog />} />
        <Route path="/projects"    element={<Projects />} />
        <Route path="/reports"     element={<Reports />} />
        <Route path="/settings"    element={<Settings />} />
        <Route path="/newproject"  element={<NewProject />} />
        <Route path="/newworker"   element={<NewWorker />} />
        <Route path="/managesite"  element={<ManageSite />} />
        <Route path="/manualentry" element={<ManualEntryPage />} />
        <Route path="/workers/:id" element={<WorkerDetails />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}