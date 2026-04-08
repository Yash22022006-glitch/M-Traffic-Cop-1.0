
import React, { useState, useRef, useCallback } from 'react';
import { LatLng, ManualReport, ViolationType } from '../types';
import Button from '../components/Button';
import { ingestManualReport } from '../services/api';

interface ManualReportFormProps {
  recorderId: string;
}

const ManualReportForm: React.FC<ManualReportFormProps> = ({ recorderId }) => {
  const [selectedViolationTypes, setSelectedViolationTypes] = useState<ViolationType[]>([]);
  const [notes, setNotes] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setImageFile(e.target.files[0]);
    else setImageFile(null);
  };

  const getBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const getCurrentLocation = useCallback(async (): Promise<LatLng | undefined> => {
    return new Promise((resolve) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (p) => resolve({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
          () => resolve(undefined),
          { enableHighAccuracy: true, timeout: 5000 }
        );
      } else resolve(undefined);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedViolationTypes.length === 0) return;

    setIsSubmitting(true);
    try {
      let imageBase64 = '';
      if (imageFile) {
        imageBase64 = await getBase64(imageFile);
      } else {
        // Use a context-aware placeholder if no image is provided
        const { getViolationImage } = await import('../constants');
        imageBase64 = getViolationImage(selectedViolationTypes[0], Math.floor(Math.random() * 1000));
      }
      
      const location = await getCurrentLocation();
      const report: ManualReport = {
        violationType: selectedViolationTypes,
        notes: notes,
        imageBase64: imageBase64,
        location: location,
        timestamp: new Date().toISOString(),
        reporterId: recorderId,
      };
      await ingestManualReport(report);
      setSelectedViolationTypes([]);
      setNotes('');
      setImageFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      alert("Report successfully filed.");
    } catch (error) {
      console.error('Submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleViolation = (type: ViolationType) => {
    setSelectedViolationTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  return (
    <div className="p-6 bg-gray-900 min-h-full text-white pb-24">
      <div className="max-w-md mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-white">Manual Report</h2>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Inline Selection - Removed Modal */}
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-4 ml-1">Violation Categories</label>
            <div className="grid grid-cols-2 gap-3">
              {Object.values(ViolationType).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleViolation(type)}
                  className={`px-4 py-4 rounded-xl border-2 text-xs font-bold uppercase transition-all text-left flex items-center justify-between ${
                    selectedViolationTypes.includes(type)
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  <span className="truncate">{type.replace(/_/g, ' ')}</span>
                  {selectedViolationTypes.includes(type) && (
                    <svg className="w-4 h-4 text-white ml-2 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Incident Notes</label>
            <textarea
              rows={4}
              className="w-full p-5 rounded-xl bg-gray-800 border-2 border-gray-700 text-white text-base focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder-gray-600"
              placeholder="Provide vehicle details or context..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            ></textarea>
          </div>

          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Evidence Capture</label>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              ref={fileInputRef}
              className="hidden"
              onChange={handleImageChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`w-full py-12 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center space-y-4 transition-all ${
                imageFile ? 'border-green-500/50 bg-green-500/5' : 'border-gray-700 hover:border-indigo-500 bg-gray-800/50'
              }`}
            >
              <svg className={`w-12 h-12 ${imageFile ? 'text-green-400' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-xs font-black uppercase tracking-widest text-gray-500">
                {imageFile ? 'Image Loaded' : 'Open Camera Sensor'}
              </span>
            </button>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full py-5 text-sm font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-600/20"
            disabled={selectedViolationTypes.length === 0 || isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'File Violation Report'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ManualReportForm;
