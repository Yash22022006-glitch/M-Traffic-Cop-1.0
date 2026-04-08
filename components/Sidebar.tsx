import React from 'react';
import { NavLink } from 'react-router-dom';
import { CaseStatus, ViolationType } from '../types';
import Dropdown from './Dropdown';
import Button from './Button';

interface SidebarProps {
  filterStatus: CaseStatus | 'ALL';
  onFilterStatusChange: (status: CaseStatus | 'ALL') => void;
  filterViolationType: ViolationType | 'ALL';
  onFilterViolationTypeChange: (type: ViolationType | 'ALL') => void;
  filterConfidenceMin: number;
  onFilterConfidenceMinChange: (min: number) => void;
  filterLocationSearch: string;
  onFilterLocationSearchChange: (search: string) => void;
  filterCreatedAtAfter: string; // New prop for Created After date
  onFilterCreatedAtAfterChange: (date: string) => void; // Handler for Created After date
  filterCreatedAtBefore: string; // New prop for Created Before date
  onFilterCreatedAtBeforeChange: (date: string) => void; // Handler for Created Before date
  onApplyFilters: () => void;
  onClearFilters: () => void;
  newCasesCount: number; // New prop for notification badge
}

const Sidebar: React.FC<SidebarProps> = ({
  filterStatus,
  onFilterStatusChange,
  filterViolationType,
  onFilterViolationTypeChange,
  filterConfidenceMin,
  onFilterConfidenceMinChange,
  filterLocationSearch,
  onFilterLocationSearchChange,
  filterCreatedAtAfter,
  onFilterCreatedAtAfterChange,
  filterCreatedAtBefore,
  onFilterCreatedAtBeforeChange,
  onApplyFilters,
  onClearFilters,
  newCasesCount, // Destructure new prop
}) => {
  const statusOptions = [
    { label: 'All Statuses', value: 'ALL' },
    ...Object.values(CaseStatus).map(status => ({ label: status.replace(/_/g, ' '), value: status }))
  ];

  const violationOptions = [
    { label: 'All Violations', value: 'ALL' },
    ...Object.values(ViolationType).map(type => ({ label: type.replace(/_/g, ' '), value: type }))
  ];

  const confidenceOptions = [
    { label: 'Any Confidence', value: '0' },
    { label: '0.70+', value: '0.7' },
    { label: '0.80+', value: '0.8' },
    { label: '0.90+', value: '0.9' },
  ];

  return (
    <aside className="w-64 bg-gray-800 shadow-xl p-6 flex flex-col h-full sticky top-16 overflow-y-auto hide-scrollbar">
      <nav className="mb-8">
        <ul className="space-y-2">
          <li>
            <NavLink
              to="/"
              className={({ isActive }) =>
                `relative flex items-center px-4 py-2 rounded-md text-gray-300 hover:bg-gray-700 ${
                  isActive ? 'bg-indigo-700 text-white font-semibold' : ''
                }`
              }
              end
            >
              All Cases
              {newCasesCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                  {newCasesCount}
                </span>
              )}
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/analytics"
              className={({ isActive }) =>
                `block px-4 py-2 rounded-md text-gray-300 hover:bg-gray-700 ${
                  isActive ? 'bg-indigo-700 text-white font-semibold' : ''
                }`
              }
            >
              Analytics
            </NavLink>
          </li>
        </ul>
      </nav>

      <div className="flex-grow">
        <h3 className="text-lg font-semibold text-white mb-4">Filters</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-300 mb-1">
              Status
            </label>
            <Dropdown
              options={statusOptions}
              selectedValue={filterStatus}
              onSelect={(value) => onFilterStatusChange(value as CaseStatus | 'ALL')}
              buttonClassName="w-full !bg-gray-700 !border-gray-600 !text-white hover:!bg-gray-600"
              menuClassName="!bg-gray-800"
            />
          </div>
          <div>
            <label htmlFor="violation-filter" className="block text-sm font-medium text-gray-300 mb-1">
              Violation Type
            </label>
            <Dropdown
              options={violationOptions}
              selectedValue={filterViolationType}
              onSelect={(value) => onFilterViolationTypeChange(value as ViolationType | 'ALL')}
              buttonClassName="w-full !bg-gray-700 !border-gray-600 !text-white hover:!bg-gray-600"
              menuClassName="!bg-gray-800"
            />
          </div>
          <div>
            <label htmlFor="confidence-filter" className="block text-sm font-medium text-gray-300 mb-1">
              Min. Confidence
            </label>
            <Dropdown
              options={confidenceOptions}
              selectedValue={String(filterConfidenceMin)}
              onSelect={(value) => onFilterConfidenceMinChange(parseFloat(value))}
              buttonClassName="w-full !bg-gray-700 !border-gray-600 !text-white hover:!bg-gray-600"
              menuClassName="!bg-gray-800"
            />
          </div>
          <div>
            <label htmlFor="location-search" className="block text-sm font-medium text-gray-300 mb-1">
              Location Search
            </label>
            <input
              type="text"
              id="location-search"
              className="w-full rounded-md border border-gray-600 shadow-sm px-3 py-2 text-sm bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g., Anna Salai"
              value={filterLocationSearch}
              onChange={(e) => onFilterLocationSearchChange(e.target.value)}
            />
          </div>
          {/* New Date Filters */}
          <div>
            <label htmlFor="created-after" className="block text-sm font-medium text-gray-300 mb-1">
              Created After
            </label>
            <input
              type="date"
              id="created-after"
              className="w-full rounded-md border border-gray-600 shadow-sm px-3 py-2 text-sm bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={filterCreatedAtAfter}
              onChange={(e) => onFilterCreatedAtAfterChange(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="created-before" className="block text-sm font-medium text-gray-300 mb-1">
              Created Before
            </label>
            <input
              type="date"
              id="created-before"
              className="w-full rounded-md border border-gray-600 shadow-sm px-3 py-2 text-sm bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={filterCreatedAtBefore}
              onChange={(e) => onFilterCreatedAtBeforeChange(e.target.value)}
            />
          </div>
          <div className="flex space-x-2">
            <Button variant="primary" onClick={onApplyFilters} className="w-full">
              Apply Filters
            </Button>
            <Button variant="outline" onClick={onClearFilters} className="w-full">
              Clear
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;