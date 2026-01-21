import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import UserDetail from './components/UserDetail';
import ComputerDashboard from './components/ComputerDashboard';
import ComputerDetail from './components/ComputerDetail';
import Settings from './components/Settings';
import AuditLogs from './components/AuditLogs';
import Reports from './components/Reports';
import Groups from './components/Groups';
import Layout from './components/Layout';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/user/:samAccountName" element={<UserDetail />} />
          <Route path="/computers" element={<ComputerDashboard />} />
          <Route path="/computer/:samAccountName" element={<ComputerDetail />} />
          <Route path="/audit" element={<AuditLogs />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
