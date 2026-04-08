
import React, { useState, useEffect, useCallback } from 'react';
import { LatLng, TrafficInfo } from '../types';
import { fetchTrafficGrounding } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button';

import MapComponent from '../components/MapComponent';

const MONITOR_OPTIONS = [
  { id: 'jams', label: 'Heavy Jams', icon: '🚗' },
  { id: 'closures', label: 'Closures', icon: '🚧' },
  { id: 'accidents', label: 'Incidents', icon: '⚠️' },
];

const TrafficMapView: React.FC = () => {
  const [location, setLocation] = useState<(LatLng & { placeName?: string }) | null>(null);
  const [trafficInfo, setTrafficInfo] = useState<TrafficInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeOptions, setActiveOptions] = useState<string[]>(['jams']);

  const toggleOption = (id: string) => {
    setActiveOptions(prev => 
      prev.includes(id) ? prev.filter(o => o !== id) : [...prev, id]
    );
  };

  const updateTraffic = useCallback(async (currentLoc: LatLng) => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      const info = await fetchTrafficGrounding(currentLoc);
      setTrafficInfo(info);
      
      // Update location with the specific area name from AI for better map labeling
      if (info.specificArea && info.specificArea !== "Current Location") {
        setLocation(prev => prev ? { ...prev, placeName: info.specificArea } : null);
      }
    } catch (err) {
      setError("Failed to analyze traffic. Satellite sync offline.");
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      return;
    }

    // Initial fetch
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { 
          latitude: pos.coords.latitude, 
          longitude: pos.coords.longitude,
          placeName: 'Live Location'
        };
        setLocation(loc);
        updateTraffic(loc);
      },
      (err) => {
        console.error("Initial geolocation error:", err);
        setError("Could not determine initial status. Please check permissions.");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setLocation(prev => ({
          latitude: pos.coords.latitude, 
          longitude: pos.coords.longitude,
          placeName: prev?.placeName || 'Live Location'
        }));
      },
      (err) => {
        console.error("Geolocation watch error:", err);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [updateTraffic]);

  const recenter = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { 
            latitude: pos.coords.latitude, 
            longitude: pos.coords.longitude,
            placeName: 'Live Location'
          };
          setLocation(loc);
          updateTraffic(loc);
        },
        (err) => setError("Failed to recenter. Check GPS."),
        { enableHighAccuracy: true, maximumAge: 0 }
      );
    }
  };

  return (
    <div className="p-4 bg-gray-900 min-h-full text-white pb-24 flex flex-col items-center">
      <div className="w-full mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold">Traffic Radar</h2>
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              size="md" 
              onClick={recenter}
              className="!py-2 !text-xs uppercase tracking-tighter"
            >
              Recenter
            </Button>
            {location && (
              <Button 
                variant="outline" 
                size="md" 
                onClick={() => updateTraffic(location)} 
                disabled={isLoading}
                className="!py-2 !text-xs uppercase tracking-tighter"
              >
                {isLoading ? 'Scanning...' : 'Sync Satellite'}
              </Button>
            )}
          </div>
        </div>

        {/* Monitor Options */}
        <div className="flex space-x-3 overflow-x-auto pb-3 hide-scrollbar">
          {MONITOR_OPTIONS.map(opt => (
            <button
              key={opt.id}
              onClick={() => toggleOption(opt.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold border-2 transition-all flex items-center space-x-2 ${
                activeOptions.includes(opt.id) 
                ? 'bg-indigo-600 border-indigo-400 text-white shadow-[0_0_10px_rgba(79,70,229,0.4)]' 
                : 'bg-gray-800 border-gray-700 text-gray-400'
              }`}
            >
              <span className="text-lg">{opt.icon}</span>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Real-Time Radar Map */}
      <div className="relative w-full h-96 mb-6 rounded-3xl overflow-hidden border-2 border-indigo-500/30 shadow-[0_0_40px_rgba(79,70,229,0.3)]">
        {location ? (
          <div className="absolute inset-0">
            <MapComponent location={location} zoom={14} placeName={location.placeName} />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gray-800 animate-pulse flex items-center justify-center">
            <LoadingSpinner />
          </div>
        )}

        {/* Radar Overlay on Map */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3/4 h-3/4 border border-indigo-500/40 rounded-full"></div>
              <div className="absolute w-1/2 h-1/2 border border-indigo-500/40 rounded-full"></div>
              <div className="absolute w-1/4 h-1/4 border border-indigo-500/40 rounded-full"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-[1px] bg-indigo-500/40"></div>
              <div className="h-full w-[1px] bg-indigo-500/40"></div>
            </div>
          </div>

          <div className="absolute inset-0 animate-[spin_6s_linear_infinite] origin-center">
            <div className="absolute top-0 left-1/2 w-[1px] h-1/2 bg-gradient-to-t from-transparent to-indigo-400/60"></div>
            <div className="absolute top-0 left-1/2 w-32 h-1/2 bg-indigo-500/5 -translate-x-full rounded-tl-full blur-xl"></div>
          </div>

          {/* Dynamic Radar Blobs based on results */}
          {trafficInfo && trafficInfo.sources.length > 0 && !isLoading && (
            <div className="absolute inset-0">
              {trafficInfo.sources.map((_, idx) => (
                <div 
                  key={idx}
                  className={`absolute w-10 h-10 blur-[12px] rounded-full animate-pulse ${
                    idx % 2 === 0 ? 'bg-red-600/40' : 'bg-orange-500/40'
                  }`}
                  style={{
                    top: `${20 + (idx * 15) % 60}%`,
                    left: `${20 + (idx * 25) % 60}%`,
                    animationDelay: `${idx * 0.5}s`,
                  }}
                />
              ))}
            </div>
          )}

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/80 px-5 py-2 rounded-full border-2 border-indigo-500/30 flex items-center space-x-3">
            <div className={`w-2.5 h-2.5 rounded-full ${isLoading ? 'bg-yellow-500' : 'bg-green-500'} animate-pulse`}></div>
            <span className="text-xs font-black uppercase tracking-tighter text-indigo-400">
              {isLoading ? 'Scanning' : 'Ready'}
            </span>
          </div>
        </div>
      </div>

      {/* Results only - No location name */}
      {!isLoading && trafficInfo && (
        <div className="w-full space-y-6">
          <div className="bg-gray-800/80 border border-gray-700/50 rounded-3xl p-8 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Global Intelligence</p>
              <div className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-tighter border-2 ${
                trafficInfo.congestionLevel === 'Severe' ? 'bg-red-900/40 border-red-500 text-red-400' :
                trafficInfo.congestionLevel === 'High' ? 'bg-orange-900/40 border-orange-500 text-orange-400' :
                trafficInfo.congestionLevel === 'Moderate' ? 'bg-yellow-900/40 border-yellow-500 text-yellow-400' :
                'bg-green-900/40 border-green-500 text-green-400'
              }`}>
                {trafficInfo.congestionLevel} Traffic
              </div>
            </div>
            <p className="text-lg text-gray-200 leading-snug mb-6">{trafficInfo.summary}</p>
            
            {trafficInfo.sources.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {trafficInfo.sources.map((source, i) => (
                  <a 
                    key={i} 
                    href={source.uri} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center px-4 py-3 bg-indigo-600/20 text-indigo-400 text-xs font-bold uppercase rounded-xl border-2 border-indigo-500/30 hover:bg-indigo-600 hover:text-white transition-all"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    {source.title}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Route Impacts */}
          {trafficInfo.routeImpacts.length > 0 && (
            <div className="bg-gray-800/80 border border-gray-700/50 rounded-3xl p-8 shadow-2xl backdrop-blur-sm">
              <p className="text-xs text-gray-500 font-bold uppercase mb-6 tracking-widest">Route Impact Analysis</p>
              <div className="space-y-4">
                {trafficInfo.routeImpacts.map((impact, i) => (
                  <div key={i} className="flex items-start space-x-4 border-l-4 border-indigo-500/30 pl-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-gray-100">{impact.route}</p>
                        <p className="text-xs font-black text-red-400 uppercase">+{impact.delay}</p>
                      </div>
                      <p className="text-xs text-gray-400 mt-2 leading-tight">{impact.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="w-full mt-4 p-4 bg-red-900/20 border-2 border-red-500/50 rounded-xl text-red-400 text-xs font-black uppercase tracking-widest text-center">
          {error}
        </div>
      )}
    </div>
  );
};

export default TrafficMapView;
