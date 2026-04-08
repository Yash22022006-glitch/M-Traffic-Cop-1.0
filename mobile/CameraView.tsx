
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Case, CaseStatus, ViolationType, Hospital, SensorSource } from '../types';
import { ingestCase, detectViolationWithGemini, findNearestHospital, confirmEmergencyCase } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

interface CameraViewProps {
  recorderId: string;
}

const CameraView: React.FC<CameraViewProps> = ({ recorderId }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isMediaReady, setIsMediaReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [sensorSource, setSensorSource] = useState<SensorSource>(SensorSource.LOCAL);
  
  const [detectionOverlay, setDetectionOverlay] = useState<{ x: number; y: number; width: number; height: number; type: ViolationType; } | null>(null);
  const [lastFiledCaseId, setLastFiledCaseId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const lastDetectionTimeRef = useRef<number>(0);
  const detectionIntervalMs = 4000; // Slightly faster for real-time feel

  const startDrawingLoop = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      const context = canvas.getContext('2d');
      if (!context) return;

      const drawFrame = () => {
        if (!video.videoWidth || !video.videoHeight) {
          animationFrameId.current = requestAnimationFrame(drawFrame);
          return;
        }
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        if (sensorSource !== SensorSource.LOCAL) {
          context.filter = 'contrast(1.1) brightness(1.1) sepia(0.1)';
        } else {
          context.filter = 'none';
        }

        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        if (detectionOverlay) {
          const { x, y, width, height, type } = detectionOverlay;
          const isAmbulance = type === ViolationType.AMBULANCE;
          context.strokeStyle = isAmbulance ? '#3b82f6' : '#ef4444';
          context.setLineDash(isAmbulance ? [10, 5] : []);
          context.lineWidth = 4;
          context.strokeRect((x / 100) * canvas.width, (y / 100) * canvas.height, (width / 100) * canvas.width, (height / 100) * canvas.height);
          
          context.fillStyle = isAmbulance ? '#3b82f6' : '#ef4444';
          context.font = 'bold 16px Arial';
          context.fillText(isAmbulance ? 'EMERGENCY DETECTED' : 'VIOLATION DETECTED', (x / 100) * canvas.width, (y / 100) * canvas.height - 10);
        }

        animationFrameId.current = requestAnimationFrame(drawFrame);
      };
      animationFrameId.current = requestAnimationFrame(drawFrame);
    }
  }, [detectionOverlay, sensorSource]);

  const setupCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      mediaStreamRef.current = mediaStream;
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().then(() => { setIsCameraActive(true); setIsMediaReady(true); startDrawingLoop(); });
        };
      }
    } catch (err: any) { setCameraError("Visual sensor denied."); }
  }, [startDrawingLoop]);

  useEffect(() => { setupCamera(); return () => { if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach(t => t.stop()); }; }, [setupCamera]);

  const performDetection = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || isAnalyzing) return;

    setIsAnalyzing(true);
    try {
      const imageData = canvas.toDataURL('image/jpeg', 0.6);
      const result = await detectViolationWithGemini(imageData);
      
      if (result && result.violationDetected) {
        let hospital: Hospital | undefined;
        const isAmbulance = result.violationType === ViolationType.AMBULANCE;

        if (isAmbulance) {
          // Automatic hospital routing for ambulances
          hospital = (await findNearestHospital({ latitude: 12.9716, longitude: 77.5946 })) || undefined;
        }

        const newCase: Case = {
          id: `auto-${Date.now()}`,
          createdAt: new Date().toISOString(),
          status: isAmbulance ? CaseStatus.EMERGENCY : CaseStatus.PENDING_REVIEW,
          violationTypes: [result.violationType],
          confidence: result.confidence || 0.9,
          plateText: result.plateText || 'UNKNOWN',
          plateConfidence: 0.9,
          location: { latitude: 13.0827, longitude: 80.2707, geoHash: 'cctv', placeName: 'Chennai AI Node' },
          deviceId: sensorSource,
          recorderId,
          mediaUrls: [imageData],
          rulesMatched: ['Autonomous-AI-Filing'],
          duplicateOf: null,
          hospitalRoute: hospital,
          sensorSource: sensorSource
        };

        // AUTOMATIC FILING
        await ingestCase(newCase);
        
        // Visual Feedback
        setDetectionOverlay({ 
          ...result.detectionArea, 
          type: result.violationType 
        });
        setLastFiledCaseId(newCase.id);

        // Clear overlay after 3 seconds
        setTimeout(() => {
          setDetectionOverlay(null);
          setLastFiledCaseId(null);
        }, 3000);
      }
    } catch (e) { 
      console.error("Auto-detection failed:", e); 
    } finally { 
      setIsAnalyzing(false); 
      lastDetectionTimeRef.current = Date.now(); 
    }
  }, [isAnalyzing, recorderId, sensorSource]);

  useEffect(() => {
    if (!isMediaReady) return;
    const interval = setInterval(() => { 
      if (Date.now() - lastDetectionTimeRef.current >= detectionIntervalMs) performDetection(); 
    }, 1000);
    return () => clearInterval(interval);
  }, [isMediaReady, performDetection]);

  const switchSensor = (source: SensorSource) => {
    setIsSyncing(true);
    setSensorSource(source);
    setDetectionOverlay(null);
    setTimeout(() => setIsSyncing(false), 800);
  };

  return (
    <div className="relative h-full w-full bg-black flex flex-col">
      <div className="flex-1 relative">
        <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover opacity-60"></video>
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover"></canvas>
        
        {/* Top Controls */}
        <div className="absolute top-4 left-4 right-4 z-20 flex flex-col space-y-3">
          <div className="flex space-x-1 pb-1">
            {Object.values(SensorSource).map(source => (
              <button
                key={source}
                onClick={() => switchSensor(source)}
                className={`flex-1 px-1 py-1 rounded-md text-[7px] font-black uppercase tracking-tighter border transition-all whitespace-nowrap text-center ${
                  sensorSource === source 
                  ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg' 
                  : 'bg-black/60 border-white/10 text-gray-400 backdrop-blur-md'
                }`}
              >
                {source === SensorSource.LOCAL ? 'LOCAL PHONE' : source.replace('CCTV_WI-FI_', 'CCTV ')}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 w-fit flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isAnalyzing || isSyncing ? 'bg-indigo-500 animate-pulse' : 'bg-green-500'}`}></div>
              <span className="text-[9px] font-black text-white uppercase tracking-widest">
                {isSyncing ? 'Linking Node' : isAnalyzing ? 'AI ANALYZING' : 'SCANNING ACTIVE'}
              </span>
            </div>
            <div className="bg-indigo-600/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-indigo-500/30 w-fit flex items-center space-x-2">
               <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">AUTO-FILING: ON</span>
            </div>
          </div>
        </div>
        
        {/* Filing Notification */}
        {lastFiledCaseId && (
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 z-50 animate-bounce">
            <div className="bg-green-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 border border-green-400">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
               <span className="text-xs font-black uppercase tracking-widest">CASE FILED AUTOMATICALLY</span>
            </div>
          </div>
        )}

        {isSyncing && (
          <div className="absolute inset-0 bg-indigo-900/30 backdrop-blur-md flex items-center justify-center z-30 transition-opacity">
             <div className="text-center">
               <LoadingSpinner />
               <p className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.4em] mt-4">Establishing Wi-Fi Data Stream</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CameraView;
