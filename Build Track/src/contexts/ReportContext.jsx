import { createContext, useContext, useState, useCallback } from 'react';
import { reportAPI } from '../api';

const ReportContext = createContext(null);

export function ReportProvider({ children }) {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchReport = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    try {
      const res = await reportAPI.getFinancial(params);
      setReportData(res.data);
      return res.data;
    } catch (err) {
      setError(err.friendlyMessage || 'Failed to load report');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const exportCSV = useCallback(async (params) => {
    const res = await reportAPI.exportCSV(params);
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `report-${params.year || 'current'}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }, []);

  const exportPDF = useCallback(async (params) => {
    const res = await reportAPI.exportPDF(params);
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `report-${params.year || 'current'}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }, []);

  const value = {
    reportData, loading, error,
    fetchReport, exportCSV, exportPDF,
  };

  return (
    <ReportContext.Provider value={value}>
      {children}
    </ReportContext.Provider>
  );
}

export function useReports() {
  const ctx = useContext(ReportContext);
  if (!ctx) throw new Error('useReports must be used within ReportProvider');
  return ctx;
}

export default ReportContext;
