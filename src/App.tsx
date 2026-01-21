import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Dashboard } from '@/pages/Dashboard';
import { UploadHub } from '@/pages/UploadHub';
import { DataSignals } from '@/pages/DataSignals';
import { SignalVerification } from '@/pages/SignalVerification';
import { Investments } from '@/pages/Investments';
import { TaxCenter } from '@/pages/TaxCenter';
import { Settings } from '@/pages/Settings';
import { AppProvider } from '@/lib/context/AppContext';

function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/signals" element={<DataSignals />} />
            <Route path="/upload" element={<UploadHub />} />
            <Route path="/verify" element={<SignalVerification />} />
            <Route path="/investments" element={<Investments />} />
            <Route path="/tax-center" element={<TaxCenter />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </Router>
    </AppProvider>
  );
}

export default App;
