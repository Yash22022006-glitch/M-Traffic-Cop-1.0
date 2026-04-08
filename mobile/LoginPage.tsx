
import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, User as UserIcon, ArrowRight, Camera, Check, X, Mail, Lock, UserPlus } from 'lucide-react';
import { signInUser, signUpUser } from '../services/api';
import { User, UserRole } from '../types';

interface LoginPageProps {
  onLogin: (user: User) => void;
  onLoginError: (message: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onLoginError }) => {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [regStep, setRegStep] = useState<1 | 2>(1);
  
  // Registration Form State
  const [regData, setRegData] = useState({
    name: '',
    email: '',
    password: '',
    avatar: ''
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handlePortalSelect = async (type: 'admin' | 'public') => {
    setIsAuthenticating(true);
    try {
      const identifier = type === 'admin' ? 'murugan&222' : 'murugan_222';
      const user = await signInUser(identifier, '123');
      onLogin(user);
    } catch (error: any) {
      onLoginError(error.message || 'Failed to enter portal.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access denied", err);
    }
  };

  const captureSelfie = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setRegData(prev => ({ ...prev, avatar: dataUrl }));
        // Stop camera
        const stream = video.srcObject as MediaStream;
        if (stream) stream.getTracks().forEach(t => t.stop());
      }
    }
  };

  const handleRegister = async () => {
    setIsAuthenticating(true);
    try {
      const user = await signUpUser({
        ...regData,
        role: UserRole.PUBLIC
      });
      onLogin(user);
    } catch (error: any) {
      onLoginError(error.message || 'Registration failed.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col items-center justify-center p-4 overflow-hidden relative">
      {/* Background Accents */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="inline-block p-3 bg-indigo-600 rounded-xl shadow-2xl shadow-indigo-600/20 mb-3"
          >
            <Shield className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter mb-2 bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent">
            M-TRAFFIC COP
          </h1>
          <p className="text-gray-400 text-xs md:text-sm font-medium tracking-[0.4em] uppercase">
            Next-Gen AI Traffic Enforcement
          </p>
        </div>

        <AnimatePresence mode="wait">
          {mode === 'login' ? (
            <motion.div 
              key="login"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid gap-4"
            >
              <motion.button
                whileHover={{ scale: 1.01, x: 2 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => handlePortalSelect('admin')}
                disabled={isAuthenticating}
                className="group relative bg-gray-900/40 border border-white/5 p-4 rounded-xl text-left transition-all hover:bg-indigo-600/10 hover:border-indigo-500/30 overflow-hidden"
              >
                <div className="flex items-center space-x-4 relative z-10">
                  <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-indigo-600/20">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold leading-none mb-1">Admin Portal</h2>
                    <p className="text-gray-500 text-xs leading-tight truncate">HQ Command & Dispatch</p>
                  </div>
                  <div className="flex items-center text-indigo-400 font-bold text-[10px] tracking-widest uppercase group-hover:translate-x-1 transition-transform shrink-0">
                    ENTER <ArrowRight className="ml-2 w-3 h-3" />
                  </div>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.01, x: 2 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => handlePortalSelect('public')}
                disabled={isAuthenticating}
                className="group relative bg-gray-900/40 border border-white/5 p-4 rounded-xl text-left transition-all hover:bg-blue-600/10 hover:border-blue-500/30 overflow-hidden"
              >
                <div className="flex items-center space-x-4 relative z-10">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-blue-600/20">
                    <UserIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold leading-none mb-1">User Portal</h2>
                    <p className="text-gray-500 text-xs leading-tight truncate">Reports & Case Status</p>
                  </div>
                  <div className="flex items-center text-blue-400 font-bold text-[10px] tracking-widest uppercase group-hover:translate-x-1 transition-transform shrink-0">
                    ENTER <ArrowRight className="ml-2 w-3 h-3" />
                  </div>
                </div>
              </motion.button>

              <div className="mt-4 text-center">
                <button 
                  onClick={() => setMode('register')}
                  className="text-indigo-400 text-xs font-bold uppercase tracking-widest hover:text-indigo-300 transition-colors"
                >
                  New Officer? Register Here
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="register"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-gray-900/40 border border-white/5 p-6 rounded-2xl backdrop-blur-xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black tracking-tight">Officer Registration</h2>
                <button onClick={() => setMode('login')} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
              </div>

              {regStep === 1 ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Full Name</label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input 
                        type="text" 
                        value={regData.name}
                        onChange={e => setRegData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm focus:border-indigo-500 outline-none transition-all"
                        placeholder="Officer Name"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input 
                        type="email" 
                        value={regData.email}
                        onChange={e => setRegData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm focus:border-indigo-500 outline-none transition-all"
                        placeholder="officer@mtraffic.gov"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input 
                        type="password" 
                        value={regData.password}
                        onChange={e => setRegData(prev => ({ ...prev, password: e.target.value }))}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm focus:border-indigo-500 outline-none transition-all"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                  <button 
                    onClick={() => { setRegStep(2); startCamera(); }}
                    disabled={!regData.name || !regData.email || !regData.password}
                    className="w-full bg-indigo-600 py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-indigo-600/20 disabled:opacity-50 mt-4"
                  >
                    Next: Identity Verification
                  </button>
                </div>
              ) : (
                <div className="space-y-6 text-center">
                  <div className="relative aspect-square w-full max-w-[240px] mx-auto bg-black rounded-2xl overflow-hidden border-2 border-indigo-500/30">
                    {!regData.avatar ? (
                      <>
                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
                        <div className="absolute inset-0 border-[20px] border-black/40 rounded-full pointer-events-none"></div>
                      </>
                    ) : (
                      <img src={regData.avatar} className="w-full h-full object-cover scale-x-[-1]" alt="Selfie" />
                    )}
                    <canvas ref={canvasRef} className="hidden" />
                  </div>
                  
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Please take a clear selfie for your <span className="text-indigo-400 font-bold">Digital ID Card</span>. 
                    Ensure your face is centered.
                  </p>

                  <div className="flex space-x-3">
                    {!regData.avatar ? (
                      <button 
                        onClick={captureSelfie}
                        className="flex-1 bg-indigo-600 py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center space-x-2"
                      >
                        <Camera className="w-4 h-4" /> <span>Capture Selfie</span>
                      </button>
                    ) : (
                      <>
                        <button 
                          onClick={() => { setRegData(prev => ({ ...prev, avatar: '' })); startCamera(); }}
                          className="flex-1 bg-gray-800 py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em]"
                        >
                          Retake
                        </button>
                        <button 
                          onClick={handleRegister}
                          disabled={isAuthenticating}
                          className="flex-1 bg-green-600 py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center space-x-2"
                        >
                          <Check className="w-4 h-4" /> <span>Complete</span>
                        </button>
                      </>
                    )}
                  </div>
                  <button onClick={() => setRegStep(1)} className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Back to Info</button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading State */}
        {isAuthenticating && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center z-50"
          >
            <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-indigo-400 font-black tracking-widest uppercase text-xs">Syncing with Secure HQ...</p>
          </motion.div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center opacity-20">
          <p className="text-[10px] font-bold tracking-[0.5em] uppercase text-gray-500">
            Vision Intelligence Engine v4.0
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;

