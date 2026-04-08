

import React, { useState } from 'react';
import { Case, ViolationType } from '../types';
import Button from '../components/Button';
import { VIOLATION_TYPE_COLORS } from '../constants';

interface CaseReviewOverlayProps {
  caseData: Case;
  onApprove: () => Promise<void>;
  onDismiss: () => void;
}

const CaseReviewOverlay: React.FC<CaseReviewOverlayProps> = ({ caseData, onApprove, onDismiss }) => {
  const [isApproving, setIsApproving] = useState(false);

  const handleApprove = async () => {
    setIsApproving(true);
    await onApprove();
    setIsApproving(false);
  };

  return (
    <div className="fixed inset-0 z-30 bg-black bg-opacity-90 flex flex-col p-4 text-white">
      <h2 className="text-xl font-bold text-center mb-4">Review Detected Violation</h2>

      {/* Evidence Image */}
      <div className="flex-shrink-0 relative w-full h-64 sm:h-80 bg-gray-800 rounded-lg overflow-hidden mb-4 shadow-lg">
        {caseData.mediaUrls[0] ? (
          <img src={caseData.mediaUrls[0]} alt="Evidence" className="w-full h-full object-contain" />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-gray-500">No Image Available</div>
        )}
      </div>

      {/* Case Details */}
      <div className="flex-grow overflow-y-auto px-2 mb-4">
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-400">Violation Type(s):</p>
            <div className="flex flex-wrap gap-2 mt-1">
              {caseData.violationTypes.map(type => (
                <span key={type} className={`text-sm font-medium px-3 py-1 rounded-full ${VIOLATION_TYPE_COLORS[type]} text-white`}>
                  {type.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-400">Detected Plate:</p>
            <p className="text-lg font-semibold">{caseData.plateText}</p>
            <p className="text-xs text-gray-500">Confidence: {(caseData.plateConfidence * 100).toFixed(0)}%</p>
          </div>

          <div>
            <p className="text-sm text-gray-400">Location:</p>
            <p className="text-base">{caseData.location.placeName || 'Unknown Location'}</p>
            <p className="text-xs text-gray-500">Lat: {caseData.location.latitude.toFixed(4)}, Lon: {caseData.location.longitude.toFixed(4)}</p>
          </div>

          <div>
            <p className="text-sm text-gray-400">Time:</p>
            <p className="text-base">{new Date(caseData.createdAt).toLocaleTimeString()}</p>
          </div>

          <div>
            <p className="text-sm text-gray-400">AI Confidence:</p>
            <p className="text-base font-semibold text-green-400">{(caseData.confidence * 100).toFixed(0)}%</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex-shrink-0 flex space-x-4 mt-auto p-2">
        <Button
          variant="danger"
          size="lg"
          className="flex-1 py-3"
          onClick={onDismiss}
          disabled={isApproving}
        >
          Dismiss
        </Button>
        <Button
          variant="primary"
          size="lg"
          className="flex-1 py-3"
          onClick={handleApprove}
          disabled={isApproving}
        >
          {isApproving ? 'Approving...' : 'Approve'}
        </Button>
      </div>
    </div>
  );
};

export default CaseReviewOverlay;