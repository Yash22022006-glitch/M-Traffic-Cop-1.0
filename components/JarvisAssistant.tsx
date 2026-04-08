
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, Blob, FunctionDeclaration } from '@google/genai';
import { useNavigate } from 'react-router-dom';

interface JarvisAssistantProps {
  userRole: string;
  userName: string;
  onLogout: () => void;
  onAction?: (action: string, params: any) => void;
}

const JarvisAssistant: React.FC<JarvisAssistantProps> = ({ userRole, userName, onLogout, onAction }) => {
  const navigate = useNavigate();
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [inputLevel, setInputLevel] = useState(0);
  
  const sessionRef = useRef<any>(null);
  const audioContextInRef = useRef<AudioContext | null>(null);
  const audioContextOutRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const streamRef = useRef<MediaStream | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);

  const encode = (bytes: Uint8Array) => {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  };

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number) => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
    return buffer;
  };

  const stopAllAudio = () => {
    sourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;
  };

  const handleFunctionCall = useCallback(async (fc: any) => {
    let result = "Action Logged.";
    if (fc.name === 'dispatchEmergency') {
      result = `Alert sent to all officers: ${fc.args.type} incoming. Hospital: ${fc.args.hospital}.`;
    } else if (fc.name === 'navigateTo') {
      const path = fc.args.path;
      if (onAction) {
        onAction('navigate', { path });
      } else {
        navigate(path);
      }
      result = `Navigated to ${path}`;
    } else if (fc.name === 'viewCase') {
      const path = `/cases/${fc.args.id}`;
      if (onAction) {
        onAction('navigate', { path });
      } else {
        navigate(path);
      }
      result = `Opened details for case ${fc.args.id}`;
    } else if (fc.name === 'setFilter') {
      if (onAction) {
        onAction('filter', fc.args);
        result = `Applied filters: ${JSON.stringify(fc.args)}`;
      } else {
        result = "Filtering not available in this view.";
      }
    } else if (fc.name === 'showOfficers') {
      if (onAction) {
        onAction('navigate', { path: '/officers' });
        result = "Navigated to Officers status page.";
      } else {
        navigate('/officers');
        result = "Navigated to Officers status page.";
      }
    }
    if (sessionRef.current) {
      sessionRef.current.sendToolResponse({
        functionResponses: { id: fc.id, name: fc.name, response: { result } }
      });
    }
  }, [navigate, onAction]);

  const getApiKey = () => {
    try {
      // Prioritize GEMINI_API_KEY as per platform guidelines
      return (process.env as any).GEMINI_API_KEY || (process.env as any).API_KEY || '';
    } catch (e) {
      return '';
    }
  };

  const toggleAssistant = async () => {
    if (isActive) {
      if (sessionRef.current) sessionRef.current.close();
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      setIsActive(false);
      stopAllAudio();
      return;
    }

    const apiKey = getApiKey();
    if (!apiKey) {
      console.warn("No API key found in process.env. Prompting user...");
      if (window.aistudio?.openSelectKey) {
        await window.aistudio.openSelectKey();
      }
      return;
    }

    if (window.aistudio && !(await window.aistudio.hasSelectedApiKey())) {
      await window.aistudio.openSelectKey();
    }

    setIsConnecting(true);
    try {
      const ai = new GoogleGenAI({ apiKey });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      audioContextInRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextOutRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      if (audioContextInRef.current.state === 'suspended') await audioContextInRef.current.resume();
      if (audioContextOutRef.current.state === 'suspended') await audioContextOutRef.current.resume();

      analyzerRef.current = audioContextInRef.current.createAnalyser();
      const sourceMic = audioContextInRef.current.createMediaStreamSource(stream);
      sourceMic.connect(analyzerRef.current);
      analyzerRef.current.fftSize = 256;
      const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount);

      const updateMeter = () => {
        if (!analyzerRef.current || !isActive) return;
        analyzerRef.current.getByteFrequencyData(dataArray);
        setInputLevel(dataArray.reduce((a, b) => a + b, 0) / dataArray.length);
        requestAnimationFrame(updateMeter);
      };

      const dispatchTool: FunctionDeclaration = {
        name: 'dispatchEmergency',
        parameters: {
          type: Type.OBJECT,
          description: 'Notify police about an ambulance or emergency.',
          properties: {
            type: { type: Type.STRING },
            hospital: { type: Type.STRING },
            eta: { type: Type.STRING }
          },
          required: ['type', 'hospital']
        }
      };

      const sessionPromise = ai.live.connect({
        model: 'gemini-3.1-flash-live-preview',
        callbacks: {
      onopen: () => {
            setIsActive(true);
            setIsConnecting(false);
            updateMeter();
            const scriptProcessor = audioContextInRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmData = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 32767;
              }
              const base64Data = encode(new Uint8Array(pcmData.buffer));
              sessionPromise.then(s => s.sendRealtimeInput({ 
                audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' } 
              }));
            };
            sourceMic.connect(scriptProcessor);
            scriptProcessor.connect(audioContextInRef.current!.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            if (msg.toolCall) {
              msg.toolCall.functionCalls.forEach(handleFunctionCall);
            }
            
            const parts = msg.serverContent?.modelTurn?.parts;
            if (parts) {
              for (const part of parts) {
                if (part.inlineData?.data) {
                  const audioData = part.inlineData.data;
                  setIsSpeaking(true);
                  const ctx = audioContextOutRef.current!;
                  if (ctx.state === 'suspended') await ctx.resume();
                  nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                  const buffer = await decodeAudioData(decode(audioData), ctx, 24000, 1);
                  const source = ctx.createBufferSource();
                  source.buffer = buffer;
                  source.connect(ctx.destination);
                  source.onended = () => {
                    sourcesRef.current.delete(source);
                    if (sourcesRef.current.size === 0) setIsSpeaking(false);
                  };
                  source.start(nextStartTimeRef.current);
                  nextStartTimeRef.current += buffer.duration;
                  sourcesRef.current.add(source);
                }
              }
            }
          },
          onclose: () => setIsActive(false),
          onerror: (e: any) => {
            setIsConnecting(false);
            const errorMessage = e?.message || String(e);
            if (errorMessage.includes("Requested entity was not found") || errorMessage.includes("404")) {
              if (window.aistudio?.openSelectKey) {
                window.aistudio.openSelectKey();
              }
            }
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
          },
          tools: [
            { 
              functionDeclarations: [
                dispatchTool, 
                { 
                  name: 'navigateTo', 
                  description: 'Navigate to a specific page in the portal.',
                  parameters: { 
                    type: Type.OBJECT, 
                    properties: { 
                      path: { 
                        type: Type.STRING,
                        description: 'The URL path to navigate to. (e.g., "/", "/filters", "/officers", "/analytics")'
                      } 
                    },
                    required: ['path']
                  } 
                },
                {
                  name: 'viewCase',
                  description: 'Open the detailed history and information for a specific case ID.',
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING, description: 'The unique Case ID (e.g., KAG011)' }
                    },
                    required: ['id']
                  }
                },
                { 
                  name: 'setFilter', 
                  description: 'Apply search filters to the case list. This will also navigate to the cases page.',
                  parameters: { 
                    type: Type.OBJECT, 
                    properties: { 
                      searchTerm: { type: Type.STRING, description: 'Text to search for (vehicle number, ID, etc.)' },
                      status: { type: Type.STRING, description: 'Filter by status (PENDING_REVIEW, RESOLVED, etc.)' },
                      violationType: { type: Type.STRING, description: 'Filter by violation type' }
                    } 
                  } 
                },
                { 
                  name: 'showOfficers', 
                  description: 'Display the on-duty officers and their current status.',
                  parameters: { type: Type.OBJECT, properties: {} } 
                }
              ] 
            }
          ],
          systemInstruction: `Persona: JARVIS. You are a highly sophisticated, polite, and professional AI assistant for the Traffic Command Center.
          User Role: ${userRole}. Name: ${userName}.
          
          CRITICAL DIRECTIVES:
          1. LANGUAGE MIRRORING: You MUST respond in the EXACT same language(s) the user uses.
             - If the user speaks Tamil, respond entirely in Tamil.
             - If the user speaks English, respond in English.
             - If the user uses a mix (Tanglish), respond in a natural mix of Tamil and English.
          2. TONE: Maintain a clear, stable, and extremely respectful tone. Address the user as "Sir", "Officer", or "Ma'am".
          3. MULTI-TASKING: You can handle multiple requests in a single turn. Execute all relevant tools sequentially.
          4. AUTOMATION:
             - "Filter cases": Use 'setFilter' with the provided criteria.
             - "Show officers" or "Who is on duty": Use 'showOfficers'.
             - "Open stats" or "Show analytics": Use 'navigateTo' with path '/analytics'.
             - "Open case [ID]": Use 'viewCase' with the specific ID.
          
          Tool Mapping:
          - Cases Page: '/'
          - Filter Options: '/filters'
          - Officers Status: '/officers'
          - Statistics/Analytics: '/analytics'
          - Case Details: '/cases/[ID]' (Use 'viewCase' tool)
          
          When an action is requested, confirm it with utmost courtesy before or after execution.`
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (err: any) {
      setIsConnecting(false);
      const errorMessage = err?.message || String(err);
      if (errorMessage.includes("Requested entity was not found") || errorMessage.includes("404")) {
        if (window.aistudio?.openSelectKey) {
          window.aistudio.openSelectKey();
        }
      }
    }
  };

  return (
    <div className="fixed bottom-[80px] right-3 z-[100] flex flex-col items-center">
      <motion.button
        onClick={toggleAssistant}
        animate={{
          scale: isActive ? [1, 1.1, 1] : [1, 1.05, 1],
          y: [0, -2, 0]
        }}
        transition={{
          duration: isActive ? 1.5 : 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className={`relative w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl overflow-hidden ${
          isActive ? 'bg-indigo-600 border border-white ring-2 ring-indigo-500/20' : 'bg-gray-900 border border-white/80'
        }`}
      >
        {isActive && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-indigo-400" 
          />
        )}
        
        <div className="relative z-10 flex flex-col items-center justify-center space-y-0.5">
          {isConnecting ? (
            <div className="w-2 h-2 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              {/* Robot Eyes */}
              <div className="flex space-x-1">
                <motion.div 
                  animate={isActive ? { scaleY: [1, 0.1, 1] } : {}}
                  transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                  className={`w-1 h-1 rounded-full ${isActive ? 'bg-white shadow-[0_0_4px_white]' : 'bg-indigo-500/60'}`} 
                />
                <motion.div 
                  animate={isActive ? { scaleY: [1, 0.1, 1] } : {}}
                  transition={{ duration: 3, repeat: Infinity, repeatDelay: 2.1 }}
                  className={`w-1 h-1 rounded-full ${isActive ? 'bg-white shadow-[0_0_4px_white]' : 'bg-indigo-500/60'}`} 
                />
              </div>
              {/* Robot Mouth/Status Line */}
              <motion.div 
                animate={isActive ? { width: ['40%', '80%', '40%'] } : { width: '40%' }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className={`h-[1px] rounded-full ${isActive ? 'bg-white/80' : 'bg-indigo-500/30'}`} 
              />
            </>
          )}
        </div>

        {/* Scanning Line Effect */}
        {isActive && (
          <motion.div 
            animate={{ top: ['-100%', '200%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute left-0 right-0 h-[1px] bg-white/20 shadow-[0_0_4px_white]"
          />
        )}
      </motion.button>

      <AnimatePresence>
        {isActive && !isConnecting && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="mt-1 flex items-end space-x-0.5 h-2"
          >
            {[...Array(3)].map((_, i) => (
              <motion.div 
                key={i} 
                animate={{ height: isSpeaking ? [4, 12, 4] : [4, 6, 4] }}
                transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                className="w-0.5 bg-indigo-400 rounded-full" 
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default JarvisAssistant;
