
import React, { useState, useEffect, useCallback } from 'react';
import { Case, CaseStatus, FilterOptions, PaginationInfo, User, ViolationType } from '../types';
import { fetchCases, fetchUsersByRole, PaginatedCases, updateCaseStatus, assignCase, acceptAllPendingCases } from '../services/api';
import CaseListItem from './CaseListItem';
import LoadingSpinner from '../components/LoadingSpinner';
import Pagination from './Pagination';
import Dropdown from './Dropdown';
import Button from './Button';
import Modal from './Modal';
import { UserRole } from '../types';
import { MOCK_USERS } from '../constants'; // For mock assignee options

interface CaseListProps {
  currentFilters: FilterOptions;
  triggerFetch: boolean;
  onNotify?: (message: string, type?: 'info' | 'success' | 'error') => void;
}

const CaseList: React.FC<CaseListProps> = ({ currentFilters, triggerFetch, onNotify }) => {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, pageSize: 10, totalItems: 0, totalPages: 0 });
  const [selectedCaseIds, setSelectedCaseIds] = useState<Set<string>>(new Set());
  const [isBulkActionModalOpen, setIsBulkActionModalOpen] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<'accept' | 'reject' | 'assign' | null>(null);
  const [assignees, setAssignees] = useState<User[]>([]);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string>('');

  const [isAcceptAllLoading, setIsAcceptAllLoading] = useState(false);
  const [pendingReviewCasesExist, setPendingReviewCasesExist] = useState(false);

  const fetchCasesData = useCallback(async () => {
    setLoading(true);
    setSelectedCaseIds(new Set()); // Clear selection on new fetch
    try {
      const data: PaginatedCases = await fetchCases(currentFilters, { page: pagination.page, pageSize: pagination.pageSize });
      setCases(data.cases);
      setPagination(data.pagination);
      setPendingReviewCasesExist(data.cases.some(c => c.status === CaseStatus.PENDING_REVIEW));
    } catch (error) {
      console.error('Failed to fetch cases:', error);
    } finally {
      setLoading(false);
    }
  }, [currentFilters, pagination.page, pagination.pageSize]);

  const fetchAssignees = useCallback(async () => {
    try {
      const reviewers = await fetchUsersByRole(UserRole.REVIEWER);
      setAssignees(reviewers);
      if (reviewers.length > 0) {
        setSelectedAssigneeId(reviewers[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch assignees:', error);
    }
  }, []);

  useEffect(() => {
    if (pagination.page !== 1) {
      setPagination(prev => ({ ...prev, page: 1 }));
    } else {
      fetchCasesData();
    }
  }, [triggerFetch, currentFilters]); // Re-fetch on filter change or trigger

  useEffect(() => {
    fetchCasesData();
  }, [pagination.page]); // Re-fetch when page changes

  useEffect(() => {
    fetchAssignees();
  }, [fetchAssignees]);

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleSelectCase = (id: string, isSelected: boolean) => {
    setSelectedCaseIds(prev => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = new Set(cases.map(c => c.id));
      setSelectedCaseIds(allIds);
    } else {
      setSelectedCaseIds(new Set());
    }
  };

  const openBulkActionModal = (action: 'accept' | 'reject' | 'assign') => {
    if (selectedCaseIds.size === 0) {
      onNotify?.('Please select at least one case for bulk action.', 'info');
      return;
    }
    setBulkActionType(action);
    setIsBulkActionModalOpen(true);
  };

  const closeBulkActionModal = () => {
    setIsBulkActionModalOpen(false);
    setBulkActionType(null);
    setSelectedAssigneeId(assignees.length > 0 ? assignees[0].id : '');
  };

  const performBulkAction = async () => {
    setLoading(true);
    const actions: Promise<any>[] = [];
    const failedCases: string[] = [];

    for (const caseId of selectedCaseIds) {
      try {
        if (bulkActionType === 'accept') {
          actions.push(updateCaseStatus(caseId, CaseStatus.ACCEPTED));
        } else if (bulkActionType === 'reject') {
          actions.push(updateCaseStatus(caseId, CaseStatus.REJECTED));
        } else if (bulkActionType === 'assign' && selectedAssigneeId) {
          actions.push(assignCase(caseId, selectedAssigneeId));
        }
      } catch (error) {
        console.error(`Failed to perform action on case ${caseId}:`, error);
        failedCases.push(caseId);
      }
    }

    const results = await Promise.allSettled(actions); 

    const successfulCount = results.filter(r => r.status === 'fulfilled').length;
    
    if (failedCases.length > 0 || successfulCount < selectedCaseIds.size) {
      onNotify?.(`Bulk action completed with ${failedCases.length} failures.`, 'error');
    } else {
      onNotify?.(`Bulk action successful for ${selectedCaseIds.size} cases.`, 'success');
    }
    
    closeBulkActionModal();
    fetchCasesData(); // Re-fetch cases to reflect changes
  };

  const handleAcceptAllPending = async () => {
    setIsAcceptAllLoading(true);
    try {
      const result = await acceptAllPendingCases();
      if (result.success > 0) {
        onNotify?.(`Accepted ${result.success} pending cases.`, 'success');
      }
      if (result.failed > 0) {
        onNotify?.(`Failed to accept ${result.failed} cases.`, 'error');
      }
    } catch (error) {
      console.error('Failed to accept all pending cases:', error);
      onNotify?.('Bulk accept action failed.', 'error');
    } finally {
      setIsAcceptAllLoading(false);
      fetchCasesData(); // Re-fetch cases to reflect changes
      setSelectedCaseIds(new Set()); // Clear selection after bulk action
    }
  };

  const isAllSelected = selectedCaseIds.size === cases.length && cases.length > 0;

  // Add a placeholder value for the dropdown to correctly type selectedValue
  const BULK_ACTION_PLACEHOLDER_VALUE = 'BULK_ACTION_PLACEHOLDER';

  return (
    <div className="flex-1 p-4 bg-gray-900 text-white"> {/* Set background and text color */}
      <h2 className="text-xl font-bold mb-4 text-white">All Cases</h2> {/* Set heading color */}

      <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden"> {/* Updated background and shadow */}
        <div className="flex items-center justify-between p-2 border-b border-gray-700"> {/* Updated border color */}
          <div className="flex items-center">
            <input
              type="checkbox"
              className="form-checkbox h-4 w-4 text-indigo-600 rounded mr-2 bg-gray-700 border-gray-600"
              onChange={handleSelectAll}
              checked={isAllSelected}
              disabled={cases.length === 0 || loading}
            />
            <label className="text-xs text-gray-300">Select All ({selectedCaseIds.size} selected)</label>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleAcceptAllPending}
              disabled={isAcceptAllLoading || loading || !pendingReviewCasesExist}
            >
              {isAcceptAllLoading ? 'Accepting...' : 'Accept All Pending'}
            </Button>
            <Dropdown
              options={[
                { label: 'Bulk Actions', value: BULK_ACTION_PLACEHOLDER_VALUE },
                { label: 'Accept', value: 'accept' },
                { label: 'Reject', value: 'reject' },
                { label: 'Assign', value: 'assign' },
              ]}
              selectedValue={BULK_ACTION_PLACEHOLDER_VALUE}
              onSelect={(value) => {
                if (value !== BULK_ACTION_PLACEHOLDER_VALUE) {
                  openBulkActionModal(value as 'accept' | 'reject' | 'assign');
                }
              }}
              placeholder="Bulk Actions"
              size="sm"
              buttonClassName="!bg-indigo-500 hover:!bg-indigo-600 !text-white"
              menuClassName="!bg-gray-800"
            />
          </div>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : cases.length === 0 ? (
          <div className="p-4 text-center text-gray-400">No cases found matching your criteria.</div> /* Updated text color */
        ) : (
          <div>
            {cases.map(caseItem => (
              <CaseListItem
                key={caseItem.id}
                caseItem={caseItem}
                isSelected={selectedCaseIds.has(caseItem.id)}
                onSelect={handleSelectCase}
              />
            ))}
          </div>
        )}
      </div>

      <Pagination pagination={pagination} onPageChange={handlePageChange} />

      <Modal
        isOpen={isBulkActionModalOpen}
        onClose={closeBulkActionModal}
        title="Confirm Bulk Action"
        size="xs"
        footer={
          <div className="flex justify-end space-x-2">
            <Button variant="primary" size="sm" onClick={performBulkAction} disabled={bulkActionType === 'assign' && !selectedAssigneeId}>
              Confirm
            </Button>
          </div>
        }
      >
        <p className="mb-4 text-sm text-gray-300">Apply {bulkActionType} to {selectedCaseIds.size} cases?</p> {/* Updated text color */}
        {bulkActionType === 'assign' && (
          <div>
            <label htmlFor="assignee-select" className="block text-sm font-medium text-gray-300 mb-1">Assign to:</label> {/* Updated text color */}
            <Dropdown
              options={assignees.map(u => ({ label: `[${u.unit}] ${u.email}`, value: u.id }))}
              selectedValue={selectedAssigneeId}
              onSelect={setSelectedAssigneeId}
              placeholder="Select Unit"
              buttonClassName="w-full !bg-gray-700 !border-gray-600 !text-white text-sm"
              menuClassName="!bg-gray-800"
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CaseList;
