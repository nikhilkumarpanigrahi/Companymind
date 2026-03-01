import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import AdminPage from './pages/AdminPage';
import BenchmarksPage from './pages/BenchmarksPage';
import DashboardPage from './pages/DashboardPage';
import DocumentsPage from './pages/DocumentsPage';
import ComparisonPage from './pages/ComparisonPage';
import GreetingPage from './pages/GreetingPage';
import HowItWorksPage from './pages/HowItWorksPage';
import SearchPage from './pages/SearchPage';

function App() {
  const location = useLocation();
  const isGreeting = location.pathname === '/';

  // Show the greeting page without the sidebar/layout
  if (isGreeting) {
    return (
      <Routes>
        <Route path="/" element={<GreetingPage />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/benchmarks" element={<BenchmarksPage />} />
        <Route path="/comparison" element={<ComparisonPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;
