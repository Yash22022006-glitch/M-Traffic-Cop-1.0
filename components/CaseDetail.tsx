
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Case, CaseStatus, AuditLog, User, UserRole, ViolationType } from '../types';
import { VIOLATION_TYPE_COLORS } from '../constants';
import { fetchCaseById, updateCaseStatus, fetchAuditLogsForCase, assignCase, fetchAllPotentialAssignees, analyzeContentWithGemini, fetchUserById, confirmEmergencyCase } from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import MapComponent from './MapComponent';
import Button from './Button';
import Modal from './Modal';
import Dropdown from './Dropdown';

interface CaseDetailProps {
  onNotify?: (message: string, type?: 'info' | 'success' | 'error') => void;
}

const CaseDetail: React.FC<CaseDetailProps> = ({ onNotify }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [caseDetail, setCaseDetail] = useState<Case | null>(null);
  const [assigneeUser, setAssigneeUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignees, setAssignees] = useState<User[]>([]);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string>('');

  const fetchCaseAndLogs = useCallback(async () => {
    setLoading(true);
    if (!id) return;
    try {
      const fetchedCase = await fetchCaseById(id);
      if (fetchedCase) {
        setCaseDetail(fetchedCase);
        if (fetchedCase.assigneeId) {
          const user = await fetchUserById(fetchedCase.assigneeId);
          if (user) setAssigneeUser(user);
        }
        const logs = await fetchAuditLogsForCase(id);
        setAuditLogs(logs);
      }
    } catch (error) {
      console.error('Failed to fetch case details:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCaseAndLogs();
  }, [fetchCaseAndLogs]);

  const handleConfirmEmergency = async () => {
    if (!id) return;
    setLoading(true);
    try {
      await confirmEmergencyCase(id);
      onNotify?.('Emergency Path Authorized. Broadcast live.', 'success');
      fetchCaseAndLogs();
    } catch (err) {
      onNotify?.('Broadcast failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openAssignModal = async () => {
    try {
      const potential = await fetchAllPotentialAssignees();
      setAssignees(potential);
      if (potential.length > 0) setSelectedAssigneeId(potential[0].id);
      setIsAssignModalOpen(true);
    } catch (error) {
      onNotify?.('Failed to load users.', 'error');
    }
  };

  const handleAssignCase = async () => {
    if (!id || !selectedAssigneeId) return;
    setLoading(true);
    try {
      const result = await assignCase(id, selectedAssigneeId);
      if (result.success) {
        if (result.case) setCaseDetail(result.case);
        const user = await fetchUserById(selectedAssigneeId);
        if (user) setAssigneeUser(user);
        const logs = await fetchAuditLogsForCase(id);
        setAuditLogs(logs);
        onNotify?.(result.message, 'success');
      }
    } catch (error) {
      onNotify?.('Failed to assign case.', 'error');
    } finally {
      setLoading(false);
      setIsAssignModalOpen(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!caseDetail) return <div className="p-6 text-center text-red-500 font-bold uppercase tracking-widest">Case not found.</div>;

  const isEmergency = caseDetail.violationTypes.includes(ViolationType.AMBULANCE);

  return (
    <div className="flex-1 p-3 bg-gray-950 text-white pb-20">
      <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-3">
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => navigate(-1)} 
            className="p-1.5 hover:bg-white/5 rounded-full transition-colors border border-white/5"
            aria-label="Go back"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-gray-400" />
          </button>
          <div className="flex flex-col">
             <p className="text-[7px] font-black text-gray-600 uppercase tracking-[0.3em] leading-none mb-1">Incident Registry</p>
             <h2 className="text-[13px] font-black uppercase tracking-tight text-white leading-none">ID: {caseDetail.id}</h2>
          </div>
        </div>
        <div className="flex items-center space-x-2">
           {isEmergency && caseDetail.status !== CaseStatus.EMERGENCY_CONFIRMED && (
             <Button 
               variant="primary" 
               className="!bg-blue-600 hover:!bg-blue-700 !rounded-md px-2.5 py-1 text-[8px] animate-pulse font-black uppercase tracking-widest" 
               onClick={handleConfirmEmergency}
             >
               Authorize Clear Path
             </Button>
           )}
           <Button variant="secondary" onClick={openAssignModal} className="!rounded-md px-2.5 py-1 text-[8px] font-black uppercase tracking-widest !bg-indigo-500 !text-white border-none shadow-lg shadow-indigo-500/20">Dispatch</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="p-2">
            
            {/* Section 1: Detected Entities */}
            <div className="mb-6">
               <p className="text-gray-600 font-black uppercase text-[7px] tracking-[0.2em] mb-2 flex items-center">
                 <span className="w-1 h-1 bg-indigo-500 rounded-full mr-2" />
                 Detected Entities
               </p>
               <div className="flex flex-wrap gap-1.5">
                 {caseDetail.violationTypes.map(type => (
                   <span key={type} className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-widest border border-white/5 ${VIOLATION_TYPE_COLORS[type]} text-white shadow-sm`}>
                     {type.replace(/_/g, ' ')}
                   </span>
                 ))}
               </div>
            </div>

            {/* Section 2: Live Stats */}
            <div className="mb-8">
              <p className="text-gray-600 font-black uppercase text-[7px] tracking-[0.2em] mb-3 flex items-center">
                <span className="w-1 h-1 bg-indigo-500 rounded-full mr-2" />
                Live Stats
              </p>
              <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                <div>
                  <p className="text-gray-500 font-bold uppercase text-[6px] tracking-widest mb-1">Current Status</p>
                  <span className={`inline-block text-[12px] font-black uppercase tracking-widest ${isEmergency ? 'text-blue-400' : 'text-indigo-400'}`}>
                    {caseDetail.status.replace(/_/g, ' ')}
                  </span>
                </div>
                {caseDetail.hospitalRoute && (
                  <div>
                    <p className="text-gray-500 font-bold uppercase text-[6px] tracking-widest mb-1">Destination ETA</p>
                    <p className="font-black text-white text-[12px] uppercase tracking-tight">{caseDetail.hospitalRoute.name}</p>
                    <p className="text-[9px] text-blue-400 font-black uppercase tracking-tighter">{caseDetail.hospitalRoute.eta} / {caseDetail.hospitalRoute.distance}</p>
                  </div>
                )}
                <div>
                  <p className="text-gray-500 font-bold uppercase text-[6px] tracking-widest mb-1">Confidence Score</p>
                  <p className="font-black text-white text-[16px] uppercase tracking-tight">{(caseDetail.confidence * 100).toFixed(0)}%</p>
                </div>
                <div>
                  <p className="text-gray-500 font-bold uppercase text-[6px] tracking-widest mb-1">Plate Recognition</p>
                  <p className="font-black text-white text-[16px] uppercase tracking-tight font-mono">{caseDetail.plateText}</p>
                </div>
              </div>
            </div>
            
            {/* Section 3: About Incident */}
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[7px] font-black uppercase tracking-[0.3em] text-indigo-400 flex items-center">
                  <span className="relative flex h-1.5 w-1.5 mr-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500"></span>
                  </span>
                  About Incident
                </h3>
              </div>
              
              <div className="border-l-2 border-indigo-500/30 pl-4">
                <p className="text-[13px] leading-relaxed text-gray-300 font-medium italic">
                  "{caseDetail.description || "No tactical description available for this incident."}"
                </p>
              </div>
              
              {isEmergency && (
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[6px] font-black text-blue-400/60 uppercase tracking-widest">Emergency Broadcast Active</span>
                  <span className="text-[6px] font-black text-gray-600 uppercase tracking-widest">Priority: Omega</span>
                </div>
              )}
            </div>

          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="p-2">
            <h3 className="text-[7px] font-black text-indigo-500/60 mb-2 uppercase tracking-[0.2em] italic">Visual Telemetry</h3>
            <div className="aspect-video bg-black rounded-lg overflow-hidden border border-white/5 shadow-2xl">
              <img src={caseDetail.mediaUrls[0]} className="w-full h-full object-cover opacity-80 contrast-125" alt="Evidence" />
            </div>
          </div>
          <div className="p-2">
            <h3 className="text-[7px] font-black text-indigo-500/60 mb-2 uppercase tracking-[0.2em] italic">Global Coordinates</h3>
            <div className="rounded-lg overflow-hidden grayscale contrast-150 opacity-60 h-32 border border-white/5 shadow-2xl">
              <MapComponent location={caseDetail.location} placeName={caseDetail.location.placeName} />
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Personnel Deployment"
        size="xs"
        footer={<Button className="w-full !rounded-lg py-2 text-xs font-black uppercase tracking-widest" onClick={handleAssignCase} disabled={!selectedAssigneeId}>Authorize Mission</Button>}
      >
        <p className="mb-2 text-[8px] text-gray-600 font-black uppercase tracking-[0.2em]">Select Unit or Officer</p>
        <Dropdown
          options={assignees.map(u => ({ label: `[${u.role}] ${u.name}`, value: u.id }))}
          selectedValue={selectedAssigneeId}
          onSelect={setSelectedAssigneeId}
          buttonClassName="w-full !bg-gray-950 !rounded-lg !border-white/5 py-2 text-[10px]"
          menuClassName="!bg-gray-950"
        />
      </Modal>
    </div>
  );
};

export default CaseDetail;
