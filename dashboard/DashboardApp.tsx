
import React, { useState, useCallback } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import CaseList from '../components/CaseList';
import CaseDetail from '../components/CaseDetail';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import AdminFilterPage from './AdminFilterPage';
import PoliceOfficersPage from './PoliceOfficersPage';
import JarvisAssistant from '../components/JarvisAssistant';
import { FilterOptions, User } from '../types';
import ToastNotification from '../components/ToastNotification';

interface DashboardAppProps {
  loggedInUser: User;
  onLogout: () => void;
}

const DashboardApp: React.FC<DashboardAppProps> = ({ loggedInUser, onLogout }) => {
  const [currentFilters, setCurrentFilters] = useState<FilterOptions>({});
  const [triggerFetch, setTriggerFetch] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'success' | 'error' } | null>(null);

  const location = useLocation();
  const navigate = useNavigate();

  const showToast = useCallback((message: string, type: 'info' | 'success' | 'error' = 'success') => {
    setToast({ message, type });
  }, []);

  const handleApplyAdminFilters = useCallback((filters: FilterOptions) => {
    setCurrentFilters(filters);
    setTriggerFetch(prev => !prev);
  }, []);

  const handleJarvisAction = useCallback((action: string, params: any) => {
    if (action === 'filter') {
      setCurrentFilters(prev => ({ ...prev, ...params }));
      setTriggerFetch(prev => !prev);
      if (location.pathname !== '/') navigate('/');
    } else if (action === 'navigate') {
      navigate(params.path);
    }
  }, [navigate, location.pathname]);

  const adminNav = [
    { path: '/', label: 'Cases', icon: 'M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25M9 16.5H6.5v-4.75a.75.75 0 0 1 .75-.75h2.5c.331 0 .6-.269.6-.6V9c0-.621-.504-1.125-1.125-1.125h-2.25c-.516 0-.932-.397-.974-.91V2.25a.75.75 0 0 1 .75-.75h5.5c.331 0 .6.269.6.6v.75a.75.75 0 0 1-.75.75H10.5M19.5 14.25H21.75a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-.75.75h-5.5a.75.75 0 0 1-.75-.75v-3.75c0-.621.504-1.125 1.125-1.125H18' },
    { path: '/filters', label: 'Filters', icon: 'M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0M3.75 18H7.5m3-6h9.75m-9.75 0a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 12H7.5' },
    { path: '/officers', label: 'Officers', icon: 'M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z' },
    { path: '/analytics', label: 'Stats', icon: 'M3 13.125l7.5-7.5 7.5 7.5c.414.414 1.088.414 1.5 0l1.125-1.125c.414-.414.414-1.088 0-1.5l-7.5-7.5-7.5 7.5c-.414.414-.414-1.088 0 1.5l1.125 1.125c.414.414 1.088.414 1.5 0z' },
  ];

  return (
    <div className="relative flex flex-col h-screen overflow-hidden bg-gray-950">
      <Header onLogout={onLogout} />
      <main className="flex-1 overflow-y-auto bg-gray-950 pb-16 hide-scrollbar">
        <Routes>
          <Route path="/" element={<CaseList currentFilters={currentFilters} triggerFetch={triggerFetch} onNotify={showToast} />} />
          <Route path="/cases/:id" element={<CaseDetail onNotify={showToast} />} />
          <Route path="/filters" element={<AdminFilterPage currentFilters={currentFilters} onApplyFilters={handleApplyAdminFilters} onNotify={showToast} triggerFetch={triggerFetch} />} />
          <Route path="/officers" element={<PoliceOfficersPage />} />
          <Route path="/analytics" element={<AnalyticsDashboard />} />
        </Routes>
      </main>
      <JarvisAssistant userRole={loggedInUser.role} userName={loggedInUser.name} onLogout={onLogout} onAction={handleJarvisAction} />
      <nav className="fixed bottom-0 left-0 w-full bg-indigo-900 border-t border-white/5 z-50">
        <ul className="flex justify-around items-center h-16">
          {adminNav.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path} className="flex-1 h-full">
                <button
                  onClick={() => navigate(item.path)}
                  className={`w-full h-full flex flex-col items-center justify-center transition-all border-t-2 ${isActive ? 'text-white border-white bg-indigo-800/20' : 'text-indigo-400 border-transparent'}`}
                >
                  <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} /></svg>
                  <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      {toast && <ToastNotification message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default DashboardApp;
