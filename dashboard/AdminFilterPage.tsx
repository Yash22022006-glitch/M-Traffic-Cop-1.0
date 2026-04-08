
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CaseStatus, ViolationType, FilterOptions } from '../types';
import Dropdown from '../components/Dropdown';
import Button from '../components/Button';

import CaseList from '../components/CaseList';

interface AdminFilterPageProps {
  currentFilters: FilterOptions;
  onApplyFilters: (filters: FilterOptions) => void;
  onNotify?: (message: string, type?: 'info' | 'success' | 'error') => void;
  triggerFetch: boolean;
}

const AdminFilterPage: React.FC<AdminFilterPageProps> = ({ currentFilters, onApplyFilters, onNotify, triggerFetch }) => {
  const navigate = useNavigate();

  const [filterStatus, setFilterStatus] = useState<CaseStatus | 'ALL'>('ALL');
  const [filterViolationType, setFilterViolationType] = useState<ViolationType | 'ALL'>('ALL');
  const [filterConfidenceMin, setFilterConfidenceMin] = useState<number>(0);
  const [filterLocationSearch, setFilterLocationSearch] = useState<string>('');
  const [filterCreatedAtAfter, setFilterCreatedAtAfter] = useState<string>('');
  const [filterCreatedAtBefore, setFilterCreatedAtBefore] = useState<string>('');

  useEffect(() => {
    setFilterStatus(currentFilters.status || 'ALL');
    setFilterViolationType(currentFilters.violationType || 'ALL');
    setFilterConfidenceMin(currentFilters.confidenceMin || 0);
    setFilterLocationSearch(currentFilters.locationSearch || '');
    setFilterCreatedAtAfter(currentFilters.createdAtAfter || '');
    setFilterCreatedAtBefore(currentFilters.createdAtBefore || '');
  }, [currentFilters]);

  const handleApplyLocalFilters = useCallback(() => {
    const newFilters: FilterOptions = {
      status: filterStatus === 'ALL' ? undefined : filterStatus,
      violationType: filterViolationType === 'ALL' ? undefined : filterViolationType,
      confidenceMin: filterConfidenceMin === 0 ? undefined : filterConfidenceMin,
      locationSearch: filterLocationSearch || undefined,
      createdAtAfter: filterCreatedAtAfter || undefined,
      createdAtBefore: filterCreatedAtBefore || undefined,
    };
    onApplyFilters(newFilters);
  }, [
    filterStatus,
    filterViolationType,
    filterConfidenceMin,
    filterLocationSearch,
    filterCreatedAtAfter,
    filterCreatedAtBefore,
    onApplyFilters,
  ]);

  const handleClearLocalFilters = useCallback(() => {
    setFilterStatus('ALL');
    setFilterViolationType('ALL');
    setFilterConfidenceMin(0);
    setFilterLocationSearch('');
    setFilterCreatedAtAfter('');
    setFilterCreatedAtBefore('');
    onApplyFilters({}); 
  }, [onApplyFilters]);

  const handleUpdateKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
    }
  };

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
    <div className="flex-1 p-4 bg-gray-900 text-white min-h-full overflow-y-auto hide-scrollbar">
      <h2 className="text-xl font-bold mb-4 text-white">Case Filters</h2>

      <div className="bg-gray-800 rounded-lg shadow-xl p-6 mb-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-300 mb-1">
              Status
            </label>
            <Dropdown
              options={statusOptions}
              selectedValue={filterStatus}
              onSelect={(value) => setFilterStatus(value as CaseStatus | 'ALL')}
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
              onSelect={(value) => setFilterViolationType(value as ViolationType | 'ALL')}
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
              onSelect={(value) => setFilterConfidenceMin(parseFloat(value))}
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
              onChange={(e) => setFilterLocationSearch(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="created-after" className="block text-sm font-medium text-gray-300 mb-1">
              Created After
            </label>
            <input
              type="date"
              id="created-after"
              className="w-full rounded-md border border-gray-600 shadow-sm px-3 py-2 text-sm bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={filterCreatedAtAfter}
              onChange={(e) => setFilterCreatedAtAfter(e.target.value)}
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
              onChange={(e) => setFilterCreatedAtBefore(e.target.value)}
            />
          </div>
        </div>
        <div className="flex space-x-2 mt-6">
          <Button variant="primary" onClick={handleApplyLocalFilters} className="flex-1">
            Apply Filters
          </Button>
          <Button variant="outline" onClick={handleClearLocalFilters} className="flex-1">
            Clear
          </Button>
        </div>
      </div>

      <div className="mt-8 border-t border-gray-800 pt-8">
        <h3 className="text-xl font-bold mb-4 text-indigo-400">Filtered Results</h3>
        <CaseList currentFilters={currentFilters} triggerFetch={triggerFetch} onNotify={onNotify} />
      </div>
    </div>
  );
};

export default AdminFilterPage;
