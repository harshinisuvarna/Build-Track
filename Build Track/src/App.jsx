import { Routes, Route } from "react-router-dom";
import DashboardLayout from "./layout/DashboardLayout";

import Dashboard from "./screens/dashboard_page";
import VoiceAssistant from "./screens/voice_assistant";
import Workers from "./screens/work_list";
import TransactionLog from "./screens/transaction_log";
import Projects from "./screens/project_management";
import Reports from "./screens/financial_report";
import Settings from "./screens/settings_page"
import NewProject from "./screens/add_new_project";
import NewWorker from "./screens/add_new_worker";
import ManageSite from "./screens/managesite_dashboard";


function App() {
  return (
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/voice" element={<VoiceAssistant />} />
          <Route path="/workers" element={<Workers />} />
          <Route path="/transaction" element={<TransactionLog />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/newproject" element={<NewProject />} />
          <Route path="/newworker" element={<NewWorker />} />
          <Route path="/managesite" element={<ManageSite />} />
        </Route>
      </Routes>
  );
}

export default App;
