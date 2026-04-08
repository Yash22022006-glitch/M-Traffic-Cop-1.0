
import React, { useState, useEffect, useCallback } from 'react';
import { Case, CaseStatus, User, UserRole } from '../types';
import { fetchCases, PaginatedCases, searchUsers } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { VIOLATION_TYPE_COLORS } from '../constants';

// Local custom hook for debouncing search input
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
    return () => { clearTimeout(handler); };
  }, [value, delay]);
  return debouncedValue;
}

const CaseDisplayCard: React.FC<{ caseItem: Case }> = ({ caseItem }) => {
  const statusColor = (status: CaseStatus): string => {
    switch (status) {
      case CaseStatus.ACCEPTED: return 'bg-green-700 text-white';
      case CaseStatus.REJECTED: return 'bg-red-700 text-white';
      case CaseStatus.PENDING_REVIEW: return 'bg-yellow-700 text-white';
      case CaseStatus.ASSIGNED: return 'bg-blue-700 text-white';
      case CaseStatus.DRAFT: return 'bg-gray-700 text-white';
      default: return 'bg-gray-700 text-white';
    }
  };

  return (
    <div className="bg-gray-800 border-b border-gray-700 p-4 hover:bg-gray-750 transition-colors">
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="text-sm font-bold text-white mb-1">Case ID: {caseItem.id}</p>
          <p className="text-[11px] text-gray-500 font-mono">PLATE: <span className="text-indigo-400 font-bold">{caseItem.plateText}</span></p>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${statusColor(caseItem.status)}`}>
          {caseItem.status.replace(/_/g, ' ')}
        </span>
      </div>
      
      <div className="flex flex-wrap gap-1.5 mb-4">
        {caseItem.violationTypes.map(type => (
          <span key={type} className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${VIOLATION_TYPE_COLORS[type]} text-white uppercase`}>
            {type.replace(/_/g, ' ')}
          </span>
        ))}
      </div>

      <div className="flex items-center text-[11px] text-gray-400 space-x-2">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        <span>{caseItem.location.placeName}</span>
        <span>•</span>
        <span>{new Date(caseItem.createdAt).toLocaleDateString()}</span>
      </div>
      
      {caseItem.mediaUrls[0] && (
        <div className="mt-4 rounded-xl overflow-hidden border border-white/5 aspect-video bg-black">
          <img src={caseItem.mediaUrls[0]} alt="Evidence" className="w-full h-full object-cover" />
        </div>
      )}
    </div>
  );
};

const UserDisplayCard: React.FC<{ user: User }> = ({ user }) => {
  return (
    <div className="bg-gray-800 p-4 border-b border-gray-700 flex items-center space-x-4">
      <div className="w-10 h-10 bg-indigo-900/30 rounded-full flex items-center justify-center border border-indigo-500/20">
         <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
      </div>
      <div>
        <p className="text-sm font-bold text-white">{user.name}</p>
        <p className="text-xs text-gray-500">{user.email}</p>
        <div className="mt-1 flex items-center space-x-2">
          <span className="text-[9px] font-black uppercase text-indigo-400 tracking-widest">{user.role}</span>
          <span className="text-gray-700">•</span>
          <span className="text-[9px] font-bold text-gray-600">{user.unit}</span>
        </div>
      </div>
    </div>
  );
};

const SubmittedCasesView: React.FC = () => {
  const [allCases, setAllCases] = useState<Case[]>([]); 
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [searchResultsCases, setSearchResultsCases] = useState<Case[]>([]);
  const [searchResultsUsers, setSearchResultsUsers] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchExecuted, setSearchExecuted] = useState(false);

  const fetchAllCasesData = useCallback(async () => {
    setLoading(true);
    try {
      const data: PaginatedCases = await fetchCases({}, { page: 1, pageSize: 1000 });
      setAllCases(data.cases);
    } catch (err) {
      console.error('Failed to fetch submitted cases:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (!debouncedSearchTerm && !searchExecuted) fetchAllCasesData(); }, [debouncedSearchTerm, searchExecuted, fetchAllCasesData]);

  useEffect(() => {
    const performSearch = async () => {
      if (debouncedSearchTerm) {
        setIsSearching(true);
        setSearchExecuted(true);
        try {
          const casesData = await fetchCases({ searchTerm: debouncedSearchTerm }, { page: 1, pageSize: 100 });
          setSearchResultsCases(casesData.cases);
          const usersData = await searchUsers(debouncedSearchTerm);
          setSearchResultsUsers(usersData);
        } catch (err) {
          console.error('Search failed:', err);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResultsCases([]);
        setSearchResultsUsers([]);
        setIsSearching(false);
        setSearchExecuted(false);
      }
    };
    performSearch();
  }, [debouncedSearchTerm]);

  return (
    <div className="bg-gray-900 min-h-full text-white">
      <div className="p-4 border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-10">
        <h2 className="text-xl font-bold mb-4">Registry History</h2>
        <div className="relative">
          <input
            type="search"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            placeholder="Search cases, plates or people..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <svg className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
      </div>

      <div className="pb-24">
        {loading && !searchExecuted && <div className="p-10"><LoadingSpinner /></div>}
        {isSearching && <div className="p-10"><LoadingSpinner /></div>}
        
        {!isSearching && searchExecuted && searchTerm && (
          (searchResultsCases.length === 0 && searchResultsUsers.length === 0) ? (
            <div className="text-center text-gray-500 py-20 text-sm italic">No records found for "{searchTerm}"</div>
          ) : (
            <div className="divide-y divide-gray-800">
              {searchResultsCases.length > 0 && searchResultsCases.map(caseItem => <CaseDisplayCard key={caseItem.id} caseItem={caseItem} />)}
              {searchResultsUsers.length > 0 && searchResultsUsers.map(user => <UserDisplayCard key={user.id} user={user} />)}
            </div>
          )
        )}

        {!isSearching && !searchExecuted && !loading && (
          allCases.length === 0 ? (
            <div className="text-center text-gray-500 py-20 italic">History is clear.</div>
          ) : (
            <div className="divide-y divide-gray-800">
              {allCases.map(caseItem => <CaseDisplayCard key={caseItem.id} caseItem={caseItem} />)}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default SubmittedCasesView;
