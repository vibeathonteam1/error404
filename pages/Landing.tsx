import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, Briefcase, Camera, CheckCircle, AlertTriangle, 
  ArrowRight, Loader2, Lock, MapPin, Car, ChevronDown,
  Scan, RefreshCw, Trash2, ShieldCheck, XCircle, Shield, Info, HelpCircle, Search, Fingerprint, QrCode, Settings, AlertOctagon
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { UserRole, AccessStatus, AccessTier, Visitor } from '../types';
import { INITIAL_VISITORS } from '../constants';

type UserState = '' | 'NEW' | 'STAFF' | 'RETURNING';

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [userState, setUserState] = useState<UserState>('');
  const [activeStep, setActiveStep] = useState<1 | 2>(1);
  const [lookupMethod, setLookupMethod] = useState<'BIOMETRIC' | 'MANUAL'>('BIOMETRIC');
  
  const [showCamera, setShowCamera] = useState(false);
  const [isScanningIC, setIsScanningIC] = useState(false);
  const [photoCaptured, setPhotoCaptured] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    plateNumber: '',
    staffId: '',
    password: '',
    icNumber: ''
  });

  const [lookupId, setLookupId] = useState('');

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  useEffect(() => {
    if (showCamera && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [showCamera, stream]);

  const startCamera = async () => {
    try {
      const isFaceCapture = (userState === 'NEW' && activeStep === 2) || (userState === 'RETURNING' && lookupMethod === 'BIOMETRIC');
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: isFaceCapture ? 'user' : 'environment' } 
      });
      setStream(mediaStream);
      setShowCamera(true);
    } catch (err) {
      alert("Camera access denied.");
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setStream(null);
    setShowCamera(false);
  };

  const captureImageToBase64 = (): string | null => {
    if (!videoRef.current) return null;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  const handleICScan = async () => {
    const fullBase64 = captureImageToBase64();
    if (!fullBase64) return;
    const base64Data = fullBase64.split(',')[1];
    setIsScanningIC(true);
    stopCamera();

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { inlineData: { data: base64Data, mimeType: 'image/jpeg' } },
            { text: "Extract Name and IC Number from this ID card. Respond strictly in JSON format with keys 'name' and 'ic'." }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              ic: { type: Type.STRING }
            },
            required: ['name', 'ic']
          }
        }
      });

      const result = JSON.parse(response.text || '{}');
      if (result.name || result.ic) {
        setFormData(prev => ({ ...prev, name: result.name || '', icNumber: result.ic || '' }));
        setActiveStep(2);
      }
    } catch (err) {
      alert("OCR failed. Enter manually.");
      setActiveStep(2);
    } finally {
      setIsScanningIC(false);
    }
  };

  const handleCaptureFace = () => {
    const base64 = captureImageToBase64();
    setCapturedImage(base64);
    setPhotoCaptured(true);
    stopCamera();
    
    if (userState === 'RETURNING' && lookupMethod === 'BIOMETRIC') {
      handleReturningVerification();
    }
  };

  const handleReturningVerification = (idInput?: string) => {
    setAnalyzing(true);
    const searchId = idInput?.toUpperCase() || lookupId.toUpperCase();
    
    const userDb: any[] = JSON.parse(localStorage.getItem('sentinel_user_db') || '[]');
    const resolvedUser = userDb.find(u => u.icNumber?.toUpperCase() === searchId) 
                     || INITIAL_VISITORS.find(v => (v.icNumber || v.staffId)?.toUpperCase() === searchId);

    setTimeout(() => {
      setAnalyzing(false);
      
      if (!resolvedUser && searchId) {
        alert("Identity record not found. Please complete first-time registration.");
        setUserState('NEW');
        setActiveStep(2);
        setFormData(prev => ({ ...prev, icNumber: searchId }));
        return;
      }

      const globalInvites: string[] = JSON.parse(localStorage.getItem('sentinel_global_registry') || '[]');
      const isInvited = globalInvites.includes(searchId);

      navigate('/badge', {
        state: {
          name: resolvedUser?.name || 'Verified User',
          identifier: searchId,
          accessTier: AccessTier.GREEN,
          status: AccessStatus.CHECKED_IN,
          timestamp: new Date().toLocaleTimeString(),
          role: resolvedUser?.type === 'STAFF' ? UserRole.STAFF : UserRole.VISITOR,
          hasInvitation: isInvited
        }
      });
    }, 1500);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAnalyzing(true);

    setTimeout(() => {
        setAnalyzing(false);
        const isStaff = userState === 'STAFF';
        
        let assignedTier = AccessTier.GREEN;
        let assignedStatus = AccessStatus.CHECKED_IN;
        let hasInv = false;
        
        const searchIC = isStaff ? formData.staffId.toUpperCase() : formData.icNumber.toUpperCase();
        
        if (userState === 'NEW') {
            const userDb = JSON.parse(localStorage.getItem('sentinel_user_db') || '[]');
            const newUser = {
                id: searchIC,
                name: formData.name,
                icNumber: searchIC,
                accessTier: assignedTier,
                status: assignedStatus,
                type: 'GUEST'
            };
            if (!userDb.find((u: any) => u.icNumber === searchIC)) {
                userDb.push(newUser);
                localStorage.setItem('sentinel_user_db', JSON.stringify(userDb));
            }
        }

        const globalInvites = JSON.parse(localStorage.getItem('sentinel_global_registry') || '[]');
        if (globalInvites.includes(searchIC)) {
            hasInv = true;
        }

        navigate('/badge', {
            state: {
                name: isStaff ? 'Authorized Staff Member' : formData.name,
                identifier: searchIC,
                status: assignedStatus,
                accessTier: assignedTier,
                timestamp: new Date().toLocaleTimeString(),
                role: isStaff ? UserRole.STAFF : UserRole.VISITOR,
                photo: capturedImage,
                hasInvitation: hasInv
            }
        });
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">Sentinel VMS</h1>
        <p className="text-slate-500 font-medium italic text-sm">Deterministic Identification & Access Control</p>
      </div>

      <div className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200">
        <div className="p-6 bg-slate-900 text-white">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Choose Portal</label>
          <select 
            value={userState}
            onChange={(e) => {
                setUserState(e.target.value as UserState);
                setActiveStep(1);
                stopCamera();
                setPhotoCaptured(false);
                setCapturedImage(null);
                setFormData({ name: '', plateNumber: '', staffId: '', password: '', icNumber: '' });
                setLookupMethod('BIOMETRIC');
            }}
            className="w-full appearance-none bg-slate-800 border border-slate-700 text-white py-4 px-5 pr-8 rounded-2xl font-bold cursor-pointer outline-none transition-all"
          >
            <option value="" disabled>Identification Type...</option>
            <option value="NEW">I’m visiting for the first time</option>
            <option value="RETURNING">I’m visiting again</option>
            <option value="STAFF">Staff access</option>
          </select>
        </div>

        <div className="p-6 md:p-10">
            {userState === '' && (
              <div className="text-center py-10 space-y-6">
                <div className="p-6 bg-indigo-50 rounded-full w-24 h-24 flex items-center justify-center mx-auto text-indigo-400">
                  <Shield size={48} />
                </div>
                <p className="text-slate-400 text-sm font-medium px-10 leading-relaxed">Select an option to generate your standard entry pass. General area access is active immediately after registration.</p>
              </div>
            )}

            {userState === 'NEW' && (
                <div className="animate-in fade-in duration-300">
                    {activeStep === 1 ? (
                        <div className="space-y-6">
                            <div className="relative bg-slate-900 rounded-[2rem] aspect-[1.6/1] overflow-hidden border border-slate-800 shadow-inner">
                                {showCamera ? (
                                    <>
                                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                                        <button onClick={handleICScan} className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white text-slate-900 px-8 py-3 rounded-full font-bold shadow-2xl">Extract Identity</button>
                                    </>
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                                        <Scan size={48} className="text-slate-600 mb-2" />
                                        <button onClick={startCamera} className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl">Scan Identification Pass</button>
                                        <button onClick={() => setActiveStep(2)} className="text-indigo-400 text-xs font-bold hover:underline uppercase tracking-widest">Manual Input</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {!photoCaptured ? (
                                <form onSubmit={(e) => { e.preventDefault(); startCamera(); }} className="space-y-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Identity Profile</label>
                                        <div className="bg-slate-50 p-2 rounded-3xl space-y-1 border border-slate-100 shadow-inner">
                                            <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-5 py-3 bg-white border border-slate-100 rounded-2xl outline-none font-bold text-slate-700" placeholder="Full Registered Name" />
                                            <input required value={formData.icNumber} onChange={e => setFormData({...formData, icNumber: e.target.value})} className="w-full px-5 py-3 bg-white border border-slate-100 rounded-2xl outline-none font-mono font-bold text-slate-700 uppercase" placeholder="IC / Passport Number" />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Biometric Verification Link</label>
                                        <div className="bg-indigo-50/30 p-4 rounded-[2rem] border border-indigo-100 min-h-[160px] flex flex-col items-center justify-center overflow-hidden">
                                            {showCamera ? (
                                                <div className="relative w-full rounded-2xl overflow-hidden bg-black aspect-video shadow-lg">
                                                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                                                    <button 
                                                        type="button" 
                                                        onClick={handleCaptureFace} 
                                                        className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white text-slate-900 px-8 py-3 rounded-full font-bold shadow-2xl"
                                                    >
                                                        Capture Face
                                                    </button>
                                                </div>
                                            ) : (
                                                <button type="button" onClick={startCamera} className="w-full py-10 border-2 border-dashed border-indigo-200 rounded-[2rem] flex flex-col items-center justify-center text-indigo-500 hover:bg-indigo-50/50 transition-all group">
                                                    <Camera size={32} />
                                                    <span className="text-[10px] mt-4 font-black uppercase tracking-[0.2em]">Open Security Camera</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <button disabled={showCamera} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-xl hover:bg-slate-800 disabled:bg-slate-200 transition-all flex items-center justify-center gap-3 active:scale-95">
                                        Finish Setup <ArrowRight size={18} />
                                    </button>
                                </form>
                            ) : (
                                <div className="space-y-6 animate-in zoom-in-95 duration-300">
                                    <div className="text-center space-y-1">
                                        <h3 className="text-2xl font-black text-slate-900 leading-tight">Confirmation Probe</h3>
                                        <p className="text-xs text-slate-500 font-medium px-6">Is this photo clear? It will be used for your gate verification.</p>
                                    </div>

                                    <div className="max-w-[280px] mx-auto">
                                        <div className="aspect-[4/5] bg-slate-100 rounded-[2.5rem] border-4 border-white shadow-xl overflow-hidden">
                                            {capturedImage && <img src={capturedImage} className="w-full h-full object-cover" alt="Captured Probe" />}
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3">
                                        <button 
                                            onClick={() => handleSubmit()} 
                                            disabled={analyzing}
                                            className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                                        >
                                            {analyzing ? <Loader2 size={16} className="animate-spin" /> : <><CheckCircle size={16} /> Confirm Identity</>}
                                        </button>
                                        <button 
                                            onClick={() => { setPhotoCaptured(false); setCapturedImage(null); startCamera(); }} 
                                            className="w-full py-4 border-2 border-slate-200 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
                                        >
                                            Retake Scan
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {userState === 'STAFF' && (
                <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-300">
                    <div className="text-center">
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Internal Security Protocol</p>
                    </div>
                    <div className="space-y-3">
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input required name="staffId" value={formData.staffId} onChange={e => setFormData({...formData, staffId: e.target.value})} className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-700 focus:ring-2 focus:ring-indigo-600 shadow-sm" placeholder="Personnel ID" />
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input required type="password" name="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-700 focus:ring-2 focus:ring-indigo-600 shadow-sm" placeholder="Security PIN" />
                      </div>
                    </div>
                    <button className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 active:scale-95">
                       Grant Authorization <ShieldCheck size={18} />
                    </button>
                </form>
            )}
            
            {userState === 'RETURNING' && (
                <div className="text-center space-y-8 animate-in fade-in duration-300">
                  <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
                    <button onClick={() => { setLookupMethod('BIOMETRIC'); stopCamera(); }} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${lookupMethod === 'BIOMETRIC' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Biometric Probe</button>
                    <button onClick={() => { setLookupMethod('MANUAL'); stopCamera(); }} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${lookupMethod === 'MANUAL' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>ID Search</button>
                  </div>

                  {lookupMethod === 'BIOMETRIC' ? (
                    <div className="space-y-6">
                      {showCamera ? (
                        <div className="relative rounded-[2rem] overflow-hidden bg-black aspect-square max-w-[300px] mx-auto shadow-2xl border-4 border-white">
                            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                            <button 
                              onClick={handleCaptureFace} 
                              className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white text-slate-900 px-10 py-3 rounded-full font-black text-xs shadow-xl active:scale-95 transition-all"
                            >
                              Scan Face
                            </button>
                        </div>
                      ) : (
                        <div className="space-y-8">
                          <div className="p-8 bg-indigo-50 rounded-[2.5rem] w-32 h-32 flex items-center justify-center mx-auto text-indigo-600 shadow-inner">
                            <Fingerprint size={64} />
                          </div>
                          <div className="space-y-3">
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none uppercase">Identity Link</h3>
                            <p className="text-sm text-slate-500 px-8 font-medium">Link your current session to your registered biometric profile.</p>
                          </div>
                          <button onClick={startCamera} className="bg-indigo-600 text-white px-12 py-5 rounded-2xl font-black text-sm shadow-xl hover:bg-indigo-700 transition-all active:scale-95">Verify Profile</button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-8 py-4">
                      <div className="p-8 bg-slate-50 rounded-[2.5rem] w-32 h-32 flex items-center justify-center mx-auto text-slate-400 shadow-inner">
                        <Search size={64} />
                      </div>
                      <div className="space-y-4">
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none uppercase text-center">Profile Lookup</h3>
                        <div className="relative max-w-sm mx-auto">
                          <input 
                            value={lookupId} 
                            onChange={e => setLookupId(e.target.value)} 
                            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold font-mono text-center tracking-widest focus:ring-2 focus:ring-indigo-600 uppercase" 
                            placeholder="IC / PASSPORT NO" 
                          />
                        </div>
                      </div>
                      <button 
                        onClick={() => handleReturningVerification(lookupId)} 
                        disabled={!lookupId || analyzing}
                        className="bg-indigo-600 text-white px-12 py-5 rounded-2xl font-black text-sm shadow-xl hover:bg-indigo-700 disabled:bg-slate-200 active:scale-95"
                      >
                        Find Access Pass
                      </button>
                    </div>
                  )}
                </div>
            )}
        </div>

        <div className="bg-slate-50 px-6 py-5 border-t border-slate-100 text-center relative group/footer">
            <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">
                <ShieldCheck size={14} className="text-emerald-500" />
                <span>Verified Access Protocol Active</span>
            </div>
        </div>
      </div>
      
      <div className="mt-12 text-center space-y-4">
        <button 
          onClick={() => navigate('/login/admin')}
          className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-all flex items-center justify-center gap-1.5 mx-auto px-4 py-2 bg-white/50 rounded-full border border-slate-200 hover:border-indigo-100 group"
        >
          <Lock size={12} className="group-hover:text-indigo-500" /> 
          Operator Identity Gateway
        </button>
        <p className="text-[9px] text-slate-300 font-bold uppercase tracking-[0.2em]">Safe • Simple • Traceable</p>
      </div>
    </div>
  );
};

export default Landing;