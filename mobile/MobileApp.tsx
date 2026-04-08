
import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import CameraView from './CameraView';
import ManualReportForm from './ManualReportForm';
import SubmittedCasesView from './SubmittedCasesView';
import ProfilePage from './ProfilePage';
import ChatbotPage from './ChatbotPage';
import TrafficMapView from './TrafficMapView';
import EmergencySOSView from './EmergencySOSView';
import Header from '../components/Header';
import { User, CaseStatus } from '../types';
import Button from '../components/Button';

interface MobileAppProps {
  loggedInUser: User;
  onLogout: () => void;
}

const MobileApp: React.FC<MobileAppProps> = ({ loggedInUser, onLogout }) => {
  const [cameraStatus, setCameraStatus] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [locationStatus, setLocationStatus] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [activeBroadcast, setActiveBroadcast] = useState<any>(null);
  
  const navigate = useNavigate();
  const location = useLocation();

  const requestPermissions = useCallback(async () => {
    try {
      await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
      });
      setLocationStatus('granted');
    } catch (error) { setLocationStatus('denied'); }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      stream.getTracks().forEach(track => track.stop());
      setCameraStatus('granted');
    } catch (error) { setCameraStatus('denied'); }
  }, []);

  useEffect(() => { requestPermissions(); }, [requestPermissions]);

  // Global Emergency Broadcast Listener
  useEffect(() => {
    const checkBroadcast = () => {
      const broadcast = localStorage.getItem('active_emergency_broadcast');
      if (broadcast) {
        const data = JSON.parse(broadcast);
        // Only show if it's "fresh" (within last 30 seconds for demo)
        if (Date.now() - data.timestamp < 30000) {
          setActiveBroadcast(data);
        } else {
          setActiveBroadcast(null);
          localStorage.removeItem('active_emergency_broadcast');
        }
      } else {
        setActiveBroadcast(null);
      }
    };
    const interval = setInterval(checkBroadcast, 2000);
    return () => clearInterval(interval);
  }, []);

  if (cameraStatus === 'pending' || locationStatus === 'pending') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 p-6 text-center text-white font-sans">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-6"></div>
        <h2 className="text-xl font-bold uppercase tracking-widest mb-2">Syncing Bio-Net</h2>
      </div>
    );
  }

  const navItems = [
    { path: '/', label: 'SCANNER', icon: 'M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15.5a2.25 2.25 0 0 0 2.25-2.25V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.04z' },
    { path: '/traffic', label: 'RADAR', icon: 'M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v5.25H6a.75.75 0 0 0 0 1.5h6a.75.75 0 0 0 .75-.75V6Z' },
    { path: '/report', label: 'REPORT', icon: 'M12 4.5v15m7.5-7.5h-15' },
    { path: '/cases', label: 'HISTORY', icon: 'M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25' },
    { path: '/chatbot', label: 'AI CHAT', icon: 'M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12' },
    { path: '/sos', label: 'SOS', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
  ];

  return (
    <div className="relative flex flex-col h-screen overflow-hidden bg-gray-950 font-sans">
      <Header onLogout={onLogout} title="Citizen Portal" />
      <main className="flex-1 overflow-y-auto pb-16 hide-scrollbar relative bg-gray-900">
        <Routes>
          <Route path="/" element={<CameraView recorderId={loggedInUser.id} />} />
          <Route path="/traffic" element={<TrafficMapView />} />
          <Route path="/sos" element={<EmergencySOSView user={loggedInUser} />} />
          <Route path="/report" element={<ManualReportForm recorderId={loggedInUser.id} />} />
          <Route path="/cases" element={<SubmittedCasesView />} />
          <Route path="/chatbot" element={<ChatbotPage />} />
          <Route path="/profile" element={<ProfilePage loggedInUser={loggedInUser} />} />
        </Routes>
      </main>

      {/* Emergency Global Broadcast UI */}
      {activeBroadcast && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-red-600/20 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="w-full max-w-sm bg-gray-950 border-4 border-red-500 rounded-[40px] p-8 text-center shadow-[0_0_100px_rgba(239,68,68,0.4)] ring-8 ring-red-500/10">
              <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce shadow-lg shadow-red-600/40">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Emergency Inbound</h2>
              <p className="text-red-400 font-black uppercase text-[10px] tracking-[0.3em] mb-6">Clear your path immediately</p>
              
              <div className="bg-red-500/10 border border-red-500/30 rounded-3xl p-6 mb-8">
                 <p className="text-lg font-black text-white italic leading-tight mb-2">
                   "There is an ambulance coming back to you. Just give me a way."
                 </p>
                 <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Relayed via AI Command Center</p>
              </div>

              <div className="flex flex-col space-y-3">
                 <div className="flex justify-between text-[11px] font-bold text-gray-400 uppercase tracking-widest px-2">
                    <span>Target</span>
                    <span className="text-white">{activeBroadcast.hospital}</span>
                 </div>
                 <Button 
                   variant="primary" 
                   className="w-full py-4 bg-red-600 hover:bg-red-700 rounded-2xl font-black uppercase tracking-widest"
                   onClick={() => setActiveBroadcast(null)}
                 >
                   I Have Cleared the Way
                 </Button>
              </div>
           </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 w-full bg-indigo-900 border-t border-white/5 z-50">
        <ul className="flex justify-around items-center h-16">
          {navItems.map(item => {
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
    </div>
  );
};

export default MobileApp;
