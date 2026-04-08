
import React from 'react';
import { Case, CaseStatus } from '../types';
import { VIOLATION_TYPE_COLORS } from '../constants';
import { NavLink } from 'react-router-dom';

interface CaseListItemProps {
  caseItem: Case;
  isSelected: boolean;
  onSelect: (id: string, isSelected: boolean) => void;
}

const CaseListItem: React.FC<CaseListItemProps> = ({ caseItem, isSelected, onSelect }) => {
  const statusColor = (status: CaseStatus): string => {
    switch (status) {
      case CaseStatus.ACCEPTED: return 'bg-green-500/20 text-green-400 border border-green-500/30';
      case CaseStatus.REJECTED: return 'bg-red-500/20 text-red-400 border border-red-500/30';
      case CaseStatus.PENDING_REVIEW: return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
      case CaseStatus.ASSIGNED: return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      case CaseStatus.DRAFT: return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
    }
  };

  return (
    <div className={`flex items-center px-4 py-3 border-b border-gray-800/30 hover:bg-white/[0.02] transition-all duration-150 group ${isSelected ? 'bg-indigo-950/30 border-l-2 border-l-indigo-500' : 'border-l-2 border-l-transparent'}`}>
      <input
        type="checkbox"
        className="form-checkbox h-4 w-4 text-indigo-600 rounded-sm mr-4 bg-gray-950 border-gray-800 focus:ring-0 focus:ring-offset-0"
        checked={isSelected}
        onChange={(e) => onSelect(caseItem.id, e.target.checked)}
      />
      <NavLink to={`/cases/${caseItem.id}`} className="flex-grow flex items-center justify-between cursor-pointer overflow-hidden">
        <div className="flex-grow mr-4 min-w-0">
          <div className="flex flex-col space-y-0.5">
            <p className="text-[9px] font-black text-gray-500 group-hover:text-indigo-400 transition-colors uppercase tracking-widest truncate">ID: {caseItem.id}</p>
            <p className="text-[13px] font-black text-white uppercase tracking-widest truncate">{caseItem.plateText}</p>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {caseItem.violationTypes.map(type => (
              <span key={type} className="text-[9px] font-black px-2 py-0.5 rounded bg-gray-800 text-gray-500 uppercase tracking-widest border border-gray-700/50">
                {type.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
          <div className="flex items-center space-x-1 mt-1.5 opacity-60">
            <svg className="w-2.5 h-2.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest truncate">
              {caseItem.location.placeName}
            </p>
          </div>
        </div>
        <div className="flex-shrink-0 flex flex-col items-end justify-center space-y-2">
          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${statusColor(caseItem.status)}`}>
            {caseItem.status.replace(/_/g, ' ')}
          </span>
          <span className="text-[10px] font-black text-gray-600 uppercase tracking-tighter tabular-nums">
            {new Date(caseItem.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
          </span>
        </div>
      </NavLink>
    </div>
  );
};

export default CaseListItem;