import { AuthProvider } from './AuthContext';
import { ProjectProvider } from './ProjectContext';
import { InventoryProvider } from './InventoryContext';
import { ReportProvider } from './ReportContext';
import { NotificationProvider } from './NotificationContext';

export default function AppProviders({ children }) {
  return (
    <AuthProvider>
      <NotificationProvider>
        <ProjectProvider>
          <InventoryProvider>
            <ReportProvider>
              {children}
            </ReportProvider>
          </InventoryProvider>
        </ProjectProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}
