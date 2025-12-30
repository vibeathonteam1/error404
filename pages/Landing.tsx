import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, Briefcase, History, Camera, CheckCircle, AlertTriangle, 
  ArrowRight, Loader2, Lock, MapPin, Car, ChevronDown 
} from 'lucide-react';
import { LOCATIONS } from '../constants';
import { DestinationType, UserRole, AccessStatus } from '../types';

type UserState = '' | 'NEW' | 'STAFF' | 'RETURNING';

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [userState, setUserState] = useState<UserState>('');
  const [showCamera, setShowCamera] = useState(false);
  const [photoCaptured, setPhotoCaptured] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Form States
  const [formData, setFormData] = useState({
    name: '',
    plateNumber: '',
    destination: '',
    staffId: '',
    password: '',
    icNumber: ''
  });

  // Cleanup camera on unmount or state change
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startCamera = async () => {
    setShowCamera(true);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera access error:", err);
      alert("Unable to access camera.");
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
    }
    setShowCamera(false);
  };

  const handleCapture = () => {
    // Simulate capture
    setPhotoCaptured(true);
    stopCamera();
    
    if (userState === 'RETURNING') {
        setAnalyzing(true);
        setTimeout(() => {
            setAnalyzing(false);
            // Simulate match success -> Redirect
            navigate('/badge', {
                state: {
                    name: 'Sarah Connor',
                    identifier: 'V-1001',
                    destination: 'General Meeting Room A',
                    status: AccessStatus.CHECKED_IN,
                    timestamp: new Date().toLocaleTimeString(),
                    restricted: false
                }
            });
        }, 2000);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAnalyzing(true);

    setTimeout(() => {
        setAnalyzing(false);

        // Logic for Staff
        if (userState === 'STAFF') {
            const isAdmin = formData.staffId.toUpperCase().startsWith('ADMIN') || formData.staffId.toUpperCase().startsWith('SEC');
            if (isAdmin) {
                navigate('/admin');
                return;
            }
        }

        // Logic for Visitor/Staff Entry
        const selectedLoc = LOCATIONS.find(l => l.name === formData.destination);
        const isRestricted = selectedLoc?.type === DestinationType.RESTRICTED;

        navigate('/badge', {
            state: {
                name: userState === 'STAFF' ? 'Staff Member' : formData.name,
                identifier: userState === 'STAFF' ? formData.staffId : `VIS-${Math.floor(Math.random() * 10000)}`,
                destination: formData.destination || 'Main Lobby',
                status: isRestricted ? AccessStatus.PENDING : AccessStatus.APPROVED,
                timestamp: new Date().toLocaleTimeString(),
                restricted: isRestricted,
                role: userState === 'STAFF' ? UserRole.STAFF : UserRole.VISITOR
            }
        });
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      
      {/* Header / Brand */}
      <div className="text-center mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Sentinel VMS</h1>
        <p className="text-slate-500">Secure AI-Powered Visitor Management</p>
      </div>

      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        
        {/* 1. Dropdown Selection Menu */}
        <div className="p-6 bg-slate-900 text-white">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 block">
            Select Your Status
          </label>
          <div className="relative">
            <select 
              value={userState}
              onChange={(e) => {
                  setUserState(e.target.value as UserState);
                  setPhotoCaptured(false);
                  stopCamera();
                  setFormData({ name: '', plateNumber: '', destination: '', staffId: '', password: '', icNumber: '' });
              }}
              className="w-full appearance-none bg-slate-800 border border-slate-700 text-white py-3 px-4 pr-8 rounded-lg font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
            >
              <option value="" disabled>-- Choose an option to proceed --</option>
              <option value="NEW">I am new here (Visitor Registration)</option>
              <option value="STAFF">I am staff (Login)</option>
              <option value="RETURNING">I've been here before (Quick Verify)</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
          </div>
        </div>

        {/* 2. Dynamic Action Panel */}
        <div className="p-6 md:p-8">
            
            {/* EMPTY STATE */}
            {userState === '' && (
              <div className="text-center py-10 text-slate-400">
                <p>Please select your status from the menu above to begin.</p>
              </div>
            )}

            {/* STATE 1: NEW VISITOR */}
            {userState === 'NEW' && (
                <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="space-y-4">
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-4">
                            <label className="flex items-center justify-between text-sm font-bold text-blue-800 mb-2">
                                <span className="flex items-center gap-2"><Camera size={16} /> Photo Registration</span>
                                {!photoCaptured ? <span className="text-xs bg-blue-200 px-2 py-0.5 rounded-full">Required</span> : <CheckCircle size={16} className="text-green-600"/>}
                            </label>
                            
                            {!showCamera && !photoCaptured && (
                                <button type="button" onClick={startCamera} className="w-full py-8 border-2 border-dashed border-blue-200 rounded-lg bg-white hover:bg-blue-50 transition-colors flex flex-col items-center justify-center text-blue-500">
                                    <Camera size={32} className="mb-2" />
                                    <span className="text-sm font-medium">Tap to Capture Photo</span>
                                </button>
                            )}
                            
                            {showCamera && (
                                <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
                                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                                    <button type="button" onClick={handleCapture} className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white text-black px-6 py-2 rounded-full font-bold shadow-lg">
                                        Capture
                                    </button>
                                </div>
                            )}

                            {photoCaptured && (
                                <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-blue-100">
                                    <span className="text-sm text-slate-600">Photo captured successfully</span>
                                    <button type="button" onClick={() => { setPhotoCaptured(false); startCamera(); }} className="text-xs text-blue-600 font-medium underline">Retake</button>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                            <input required name="name" value={formData.name} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Enter your full name" />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Destination</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <select required name="destination" value={formData.destination} onChange={handleInputChange} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                                    <option value="">Select location...</option>
                                    {LOCATIONS.map(loc => (
                                        <option key={loc.name} value={loc.name}>{loc.name} {loc.type === DestinationType.RESTRICTED ? '(Restricted)' : ''}</option>
                                    ))}
                                </select>
                            </div>
                            {/* Restricted Warning */}
                            {LOCATIONS.find(l => l.name === formData.destination)?.type === DestinationType.RESTRICTED && (
                                <div className="mt-2 flex gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-100">
                                    <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                                    <span>Approval required from security operator.</span>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle Plate (Optional)</label>
                            <div className="relative">
                                <Car className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input name="plateNumber" value={formData.plateNumber} onChange={handleInputChange} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none uppercase" placeholder="WAA 1234" />
                            </div>
                        </div>
                    </div>

                    <button disabled={!photoCaptured || analyzing} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4 shadow-lg shadow-indigo-200">
                        {analyzing ? <Loader2 className="animate-spin" /> : <>Register Entry <ArrowRight size={18} /></>}
                    </button>
                </form>
            )}

            {/* STATE 2: STAFF */}
            {userState === 'STAFF' && (
                <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Staff ID</label>
                        <div className="relative">
                            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input required name="staffId" value={formData.staffId} onChange={handleInputChange} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. S-101 or ADMIN" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input required type="password" name="password" value={formData.password} onChange={handleInputChange} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="••••••••" />
                        </div>
                    </div>
                    
                    <div className="border-t border-slate-100 pt-4 mt-4">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Work Location</label>
                        <select required name="destination" value={formData.destination} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                             <option value="">Select location...</option>
                             {LOCATIONS.map(loc => (
                                <option key={loc.name} value={loc.name}>{loc.name}</option>
                             ))}
                        </select>
                    </div>

                    <button disabled={analyzing} className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-4 shadow-lg shadow-emerald-200">
                         {analyzing ? <Loader2 className="animate-spin" /> : <>Secure Login <ArrowRight size={18} /></>}
                    </button>
                    
                    <div className="text-center mt-4">
                        <p className="text-xs text-slate-400">Security Operators: Use your ID to access Dashboard.</p>
                    </div>
                </form>
            )}

            {/* STATE 3: RETURNING */}
            {userState === 'RETURNING' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                     <div className="text-center">
                        <div className="bg-indigo-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <User size={32} className="text-indigo-600" />
                        </div>
                        <h3 className="font-bold text-slate-900 text-lg">Face Verification</h3>
                        <p className="text-sm text-slate-500">Look at the camera to verify your identity</p>
                     </div>

                     <div className="relative rounded-xl overflow-hidden bg-black aspect-[4/3] shadow-inner">
                        {!showCamera && !analyzing ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-white">
                                <button onClick={startCamera} className="px-6 py-3 bg-indigo-600 rounded-full font-bold hover:bg-indigo-700 transition-colors">
                                    Start Scan
                                </button>
                            </div>
                        ) : (
                            <>
                                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                                <div className="absolute inset-0 border-[30px] border-black/50 pointer-events-none"></div>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-indigo-400 rounded-full animate-pulse"></div>
                                {!analyzing && (
                                    <button onClick={handleCapture} className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white text-black px-6 py-2 rounded-full font-bold shadow-lg z-10">
                                        Verify Me
                                    </button>
                                )}
                            </>
                        )}
                        
                        {analyzing && (
                             <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white z-20">
                                <Loader2 size={48} className="animate-spin text-indigo-500 mb-4" />
                                <p className="font-medium animate-pulse">Matching Biometrics...</p>
                             </div>
                        )}
                     </div>

                     <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                        <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400">Or use fallback</span></div>
                     </div>

                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">IC / Passport Number</label>
                        <div className="flex gap-2">
                            <input name="icNumber" value={formData.icNumber} onChange={handleInputChange} className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Enter ID number" />
                            <button onClick={handleSubmit} className="bg-slate-900 text-white px-4 rounded-lg font-medium hover:bg-slate-800">
                                Verify
                            </button>
                        </div>
                     </div>
                </div>
            )}

        </div>

        {/* Footer Info */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 text-center">
            <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400">
                <Lock size={10} />
                <span>Your data is secure. Visitor records are automatically deleted after 30 days.</span>
            </div>
        </div>
      </div>
      
      {/* Operator Access Hint */}
      <div className="mt-8">
          <button onClick={() => { setUserState('STAFF'); setFormData(prev => ({...prev, staffId: 'ADMIN'})); }} className="text-xs text-slate-300 hover:text-slate-500 transition-colors flex items-center gap-1">
             <Lock size={10} /> Operator Access
          </button>
      </div>

    </div>
  );
};

export default Landing;