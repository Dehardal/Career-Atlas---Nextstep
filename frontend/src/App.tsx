import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import PublicLayout from './components/layout/PublicLayout';
import AdminLayout from './components/layout/AdminLayout';
import AdminGuard from './components/layout/AdminGuard';
import RoleSwitcher from './components/layout/RoleSwitcher';

// Public Pages
import HomePage from './features/home/HomePage';
import RoadmapPage from './features/pathways/RoadmapPage';
import SearchPage from './features/search/SearchPage';
import CareerPage from './features/careers/CareerPage';
import DegreePage from './features/degrees/DegreePage';
import ExamPage from './features/exams/ExamPage';
import InstitutePage from './features/institutes/InstitutePage';

// Admin Pages
import { AdminSuggestionsPage } from './features/admin/AdminSuggestionsPage';
import AdminDashboardPage from './features/admin/AdminDashboardPage';
import AdminNodesPage from './features/admin/AdminNodesPage';
import AdminExamsPage from './features/admin/AdminExamsPage';
import AdminRulesPage from './features/admin/AdminRulesPage';
import AdminMappingsPage from './features/admin/AdminMappingsPage';
import AdminValidationPage from './features/admin/AdminValidationPage';

// Helper component to display simulated role switcher only on admin pages
const ConditionalRoleSwitcher: React.FC = () => {
  const location = useLocation();
  if (!location.pathname.startsWith('/admin')) return null;
  return <RoleSwitcher />;
};

export const App: React.FC = () => {
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <Router>
      <Routes>
        {/* PUBLIC APPLICATION */}
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="roadmap" element={<RoadmapPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="careers" element={<CareerPage />} />
          <Route path="degrees" element={<DegreePage />} />
          <Route path="exams" element={<ExamPage />} />
          <Route path="institutes" element={<InstitutePage />} />
        </Route>

        {/* ADMIN APPLICATION */}
        <Route
          path="/admin"
          element={
            <AdminGuard>
              <AdminLayout />
            </AdminGuard>
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="qualifications" element={<AdminNodesPage nodeType="QUALIFICATION" />} />
          <Route path="streams" element={<AdminNodesPage nodeType="STREAM" />} />
          <Route path="subject-combinations" element={<AdminNodesPage nodeType="SUBJECT_COMBINATION" />} />
          <Route path="degrees" element={<AdminNodesPage nodeType="DEGREE" />} />
          <Route path="occupations" element={<AdminNodesPage nodeType="OCCUPATION" />} />
          <Route path="institutes" element={<AdminNodesPage nodeType="INSTITUTE" />} />
          <Route path="exams" element={<AdminExamsPage />} />
          <Route path="rules" element={<AdminRulesPage />} />
          <Route path="mappings" element={<AdminMappingsPage />} />
          <Route path="validation" element={<AdminValidationPage />} />
          <Route path="suggestions" element={<AdminSuggestionsPage />} />
        </Route>
      </Routes>

      <ConditionalRoleSwitcher />
    </Router>
  );
};

export default App;
