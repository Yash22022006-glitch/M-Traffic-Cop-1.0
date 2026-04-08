
import React, { useState, useCallback } from 'react';
import { User, UserRole, Case, CaseStatus, ViolationType, SensorSource } from '../types';
import { ingestCase, findNearestHospital, confirmEmergencyCase } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { motion, AnimatePresence } from 'motion/react';

interface EmergencySOSViewProps {
  user: User;
}

interface EmergencyContact {
  id: string;
  name: string;
  relation: string;
  phone: string;
  whatsapp: string;
}

const EmergencySOSView: React.FC<EmergencySOSViewProps> = ({ user }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastFiledCaseId, setLastFiledCaseId] = useState<string | null>(null);
  const [showContacts, setShowContacts] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const emergencyContacts: EmergencyContact[] = [
    { id: '1', name: 'Rajesh Kumar', relation: 'Father', phone: '+919876543210', whatsapp: '919876543210' },
    { id: '2', name: 'Sunita Devi', relation: 'Mother', phone: '+919876543211', whatsapp: '919876543211' },
    { id: '3', name: 'Amit Singh', relation: 'Brother', phone: '+919876543212', whatsapp: '919876543212' },
  ];

  const handleSOS = useCallback(async () => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    try {
      // 1. Get location (using Bangalore default if GPS fails, but trying GPS first)
      let loc = { latitude: 12.9716, longitude: 77.5946 };
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 5000 });
        });
        loc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      } catch (e) {
        console.warn("GPS failed for SOS, using default node location", e);
      }
      setCurrentLocation(loc);

      // 2. Find nearest hospital
      const hospital = await findNearestHospital(loc) || undefined;

      // 3. Create emergency case
      const sosCase: Case = {
        id: `sos-${Date.now()}`,
        createdAt: new Date().toISOString(),
        status: CaseStatus.EMERGENCY,
        violationTypes: [ViolationType.AMBULANCE],
        confidence: 1.0,
        plateText: 'SOS-MANUAL',
        plateConfidence: 1.0,
        location: { ...loc, geoHash: 'sos', placeName: 'SOS Manual Trigger' },
        deviceId: 'SOS-BUTTON',
        recorderId: user.id,
        mediaUrls: [],
        rulesMatched: ['Manual-SOS-Trigger'],
        duplicateOf: null,
        hospitalRoute: hospital,
        sensorSource: SensorSource.LOCAL
      };

      await ingestCase(sosCase);
      
      // 4. Confirm it
      await confirmEmergencyCase(sosCase.id);
      
      setLastFiledCaseId(sosCase.id);
      
      // If user is public, show contacts
      if (user.role === UserRole.PUBLIC) {
        setShowContacts(true);
      }

      setTimeout(() => setLastFiledCaseId(null), 5000);
    } catch (err) {
      console.error("SOS Trigger failed:", err);
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing, user]);

  const sendAlert = (contact: EmergencyContact, type: 'sms' | 'whatsapp') => {
    const locStr = currentLocation 
      ? `https://www.google.com/maps?q=${currentLocation.latitude},${currentLocation.longitude}`
      : "my current location";
    const message = encodeURIComponent(`I am in emergency at ${locStr}. Please help!`);
    
    if (type === 'whatsapp') {
      window.open(`https://wa.me/${contact.whatsapp}?text=${message}`, '_blank');
    } else {
      window.location.href = `sms:${contact.phone}?body=${message}`;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full bg-gray-950 p-6 text-center">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm"
      >
        <div className="mb-12">
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">Emergency SOS</h2>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Immediate AI-Assisted Dispatch</p>
        </div>

        <div className="relative flex items-center justify-center mb-16">
          {/* Pulse Effect */}
          <div className="absolute w-64 h-64 bg-red-600/20 rounded-full animate-ping"></div>
          <div className="absolute w-48 h-48 bg-red-600/30 rounded-full animate-pulse"></div>
          
          <button
            onClick={handleSOS}
            disabled={isAnalyzing}
            className="relative z-10 bg-red-600 hover:bg-red-700 active:scale-90 text-white w-40 h-40 rounded-full flex flex-col items-center justify-center shadow-[0_0_50px_rgba(220,38,38,0.6)] border-4 border-red-400 transition-all disabled:opacity-50"
          >
            <span className="text-4xl font-black tracking-tighter leading-none">SOS</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] mt-2">Tap to Trigger</span>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 text-left">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center space-x-4">
            <div className="w-10 h-10 bg-indigo-600/20 rounded-xl flex items-center justify-center text-indigo-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </div>
            <div>
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Auto-Location</p>
              <p className="text-xs text-white font-bold">Nearest Node Identified</p>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center space-x-4">
            <div className="w-10 h-10 bg-green-600/20 rounded-xl flex items-center justify-center text-green-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            </div>
            <div>
              <p className="text-[10px] font-black text-green-400 uppercase tracking-widest">Secure Link</p>
              <p className="text-xs text-white font-bold">Direct Hospital Routing</p>
            </div>
          </div>
        </div>

        {lastFiledCaseId && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mt-8 bg-green-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center justify-center space-x-3 border border-green-400"
          >
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
             <span className="text-xs font-black uppercase tracking-widest">EMERGENCY DISPATCHED</span>
          </motion.div>
        )}

        <AnimatePresence>
          {showContacts && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-8 w-full overflow-hidden"
            >
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 text-left">
                <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                  Nominated Relatives
                </h3>
                <div className="space-y-3">
                  {emergencyContacts.map(contact => (
                    <div key={contact.id} className="bg-white/5 rounded-2xl p-4 border border-white/5 hover:border-indigo-500/30 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-sm font-black text-white">{contact.name}</p>
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{contact.relation}</p>
                        </div>
                        <p className="text-[10px] font-mono text-indigo-400">{contact.phone}</p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => sendAlert(contact, 'sms')}
                          className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all flex items-center justify-center gap-2"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                          SMS
                        </button>
                        <button 
                          onClick={() => sendAlert(contact, 'whatsapp')}
                          className="flex-1 py-2 bg-green-600/20 hover:bg-green-600/30 rounded-xl text-[10px] font-black uppercase tracking-widest text-green-400 transition-all flex items-center justify-center gap-2 border border-green-500/20"
                        >
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                          WhatsApp
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => setShowContacts(false)}
                  className="mt-6 w-full py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 transition-all"
                >
                  Dismiss Contacts
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {isAnalyzing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center">
            <LoadingSpinner />
            <p className="text-[10px] font-black text-white uppercase tracking-[0.4em] mt-4">Processing Emergency Protocol</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmergencySOSView;
