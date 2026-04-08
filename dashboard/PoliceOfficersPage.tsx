
import React, { useState, useEffect, useMemo } from 'react';
import { OfficerDuty, DutyStatus } from '../types';
import { fetchOfficerDuties } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const PoliceOfficersPage: React.FC = () => {
  const [officers, setOfficers] = useState<OfficerDuty[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DutyStatus>(DutyStatus.ON_DUTY);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let isMounted = true;
    const loadOfficers = async () => {
      setLoading(true);
      try {
        const data = await fetchOfficerDuties();
        if (isMounted) {
          // Set state strictly once to prevent accidental duplication
          setOfficers(data);
        }
      } catch (err) {
        console.error("Failed to load officers:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadOfficers();
    return () => { isMounted = false; };
  }, []);

  const filteredOfficers = useMemo(() => {
    return officers.filter(o => {
      const matchesTab = o.status === activeTab;
      const term = searchTerm.toLowerCase();
      const matchesSearch = o.name.toLowerCase().includes(term) || 
                           o.badgeId.toLowerCase().includes(term) ||
                           o.assignedUnit.toLowerCase().includes(term);
      return matchesTab && matchesSearch;
    });
  }, [officers, activeTab, searchTerm]);

  const stats = useMemo(() => {
    return {
      onDuty: officers.filter(o => o.status === DutyStatus.ON_DUTY).length,
      nextDuty: officers.filter(o => o.status === DutyStatus.NEXT_DUTY).length,
      pastDuty: officers.filter(o => o.status === DutyStatus.PAST_DUTY).length,
    };
  }, [officers]);

  return (
    <div className="flex-1 p-3 bg-gray-950 text-white min-h-full overflow-y-auto hide-scrollbar">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-xl font-bold mb-4 text-white">Officer Status</h2>

        {/* Stats Header */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-900 p-4 rounded-2xl border border-green-500/20 shadow-xl">
            <p className="text-xs text-gray-500 font-black uppercase tracking-widest mb-1">On Duty</p>
            <p className="text-2xl font-black text-green-400 leading-none">{stats.onDuty}</p>
          </div>
          <div className="bg-gray-900 p-4 rounded-2xl border border-indigo-500/20 shadow-xl">
            <p className="text-xs text-gray-500 font-black uppercase tracking-widest mb-1">Scheduled</p>
            <p className="text-2xl font-black text-indigo-400 leading-none">{stats.nextDuty}</p>
          </div>
          <div className="bg-gray-900 p-4 rounded-2xl border border-gray-800 shadow-xl">
            <p className="text-xs text-gray-500 font-black uppercase tracking-widest mb-1">Completed</p>
            <p className="text-2xl font-black text-gray-600 leading-none">{stats.pastDuty}</p>
          </div>
        </div>

        {/* Tabs & Search */}
        <div className="bg-gray-900 rounded-2xl p-3 mb-8 flex flex-col sm:flex-row items-center justify-between border border-gray-800 shadow-2xl">
          <div className="flex space-x-2 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab(DutyStatus.ON_DUTY)}
              className={`flex-1 sm:flex-none px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === DutyStatus.ON_DUTY ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
            >
              ON DUTY
            </button>
            <button
              onClick={() => setActiveTab(DutyStatus.NEXT_DUTY)}
              className={`flex-1 sm:flex-none px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === DutyStatus.NEXT_DUTY ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
            >
              NEXT
            </button>
            <button
              onClick={() => setActiveTab(DutyStatus.PAST_DUTY)}
              className={`flex-1 sm:flex-none px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === DutyStatus.PAST_DUTY ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
            >
              PAST
            </button>
          </div>
          <div className="w-full sm:w-64 mt-4 sm:mt-0">
            <input
              type="text"
              placeholder="Search officers..."
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Officers List */}
        {loading ? (
          <LoadingSpinner />
        ) : filteredOfficers.length === 0 ? (
          <div className="text-center py-20 text-sm text-gray-600 uppercase tracking-widest font-black italic">No records found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredOfficers.map(officer => (
              <div key={officer.id} className="bg-gray-900 border border-gray-800 p-5 rounded-2xl flex items-center space-x-5 hover:border-indigo-500/30 transition-all group shadow-xl">
                <div className="relative">
                   <div className="w-16 h-16 bg-indigo-900/20 rounded-full flex items-center justify-center border border-indigo-500/10 shadow-inner">
                      <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                   </div>
                   {officer.status === DutyStatus.ON_DUTY && (
                     <div className="absolute bottom-0.5 right-0.5 w-4 h-4 bg-green-500 border-4 border-gray-900 rounded-full shadow-lg"></div>
                   )}
                </div>
                <div className="flex-1 overflow-hidden">
                   <h3 className="text-lg font-black text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{officer.name}</h3>
                   <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1 font-mono uppercase tracking-widest">
                      <span className="text-indigo-500/60">{officer.badgeId}</span>
                      <span>•</span>
                      <span className="truncate">{officer.assignedUnit}</span>
                   </div>
                   <div className="mt-4 flex items-center space-x-6">
                      <div>
                        <p className="text-xs text-gray-600 font-black uppercase tracking-tighter mb-1">Shift</p>
                        <p className="text-sm font-bold text-gray-300">{officer.shift}</p>
                      </div>
                      {officer.location && (
                        <div>
                          <p className="text-xs text-gray-600 font-black uppercase tracking-tighter mb-1">Area</p>
                          <p className="text-sm font-bold text-indigo-400">{officer.location}</p>
                        </div>
                      )}
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PoliceOfficersPage;
