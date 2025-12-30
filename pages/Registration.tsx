import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, User, Car, MapPin, CheckCircle, AlertTriangle, Loader2, ArrowRight } from 'lucide-react';
import { LOCATIONS } from '../constants';
import { DestinationType, UserRole } from '../types';

const Registration: React.FC = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    plateNumber: '',
    destination: '',
    vehicleColor: '',
  });

  const [analyzing, setAnalyzing] = useState(false);
  const [photoCaptured, setPhotoCaptured] = useState(false);
  const [aiData, setAiData] = useState<any>(null);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Camera handling (Simulation)
  const startCamera = async () => {
    setShowCamera(true);
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
       try {
         const stream = await navigator.mediaDevices.getUserMedia({ video: true });
         if (videoRef.current) {
           videoRef.current.srcObject = stream;
         }
       } catch (err) {
         console.error("Camera access denied", err);
       }
    }
  };

  const capturePhoto = () => {
    // In a real app, we would capture the frame from videoRef
    // Here we just simulate the capture
    setShowCamera(false);
    setPhotoCaptured(true);
    handleSimulateAI();
  };

  const handleSimulateAI = () => {
    setAnalyzing(true);
    // Simulate API delay for Face Rec & Watchlist check
    setTimeout(() => {
      setAnalyzing(false);
      setAiData({
        watchlistStatus: 'CLEAR',
        faceDetected: true
      });
    }, 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoCaptured) return;

    // Determine status based on destination
    const selectedLoc = LOCATIONS.find(l => l.name === formData.destination);
    const isRestricted = selectedLoc?.type === DestinationType.RESTRICTED;
    
    navigate('/badge', { 
      state: { 
        ...formData, 
        role: UserRole.VISITOR,
        status: isRestricted ? 'PENDING' : 'APPROVED', // Default Approved unless Restricted
        timestamp: new Date().toLocaleTimeString(),
        restricted: isRestricted,
        // Since ID fields are removed, generate a system ID
        identifier: `VIS-${Math.floor(Math.random() * 10000)}` 
      } 
    });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <User className="text-blue-600" />
          Visitor Registration
        </h2>
        <p className="text-slate-500 mt-2">
          Please complete the form below. A photo is required for AI-driven security verification.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Left Column: Photo/AI Section - MANDATORY */}
        <div className="md:col-span-1 space-y-6">
          <div className={`p-4 rounded-xl shadow-sm border-2 transition-colors ${photoCaptured ? 'bg-white border-green-200' : 'bg-blue-50 border-blue-200'}`}>
            <label className="block text-sm font-bold text-slate-800 mb-3 flex items-center justify-between">
              Photo Registration
              {!photoCaptured && <span className="text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full">Required</span>}
            </label>
            
            <div className="relative aspect-square bg-slate-200 rounded-lg flex flex-col items-center justify-center overflow-hidden group">
              {showCamera ? (
                 <div className="relative w-full h-full">
                   <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                   <button 
                      type="button"
                      onClick={capturePhoto}
                      className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white text-slate-900 px-4 py-2 rounded-full font-bold shadow-lg hover:bg-slate-100"
                   >
                     Capture
                   </button>
                 </div>
              ) : photoCaptured ? (
                <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                    <User size={64} className="text-slate-400" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <CheckCircle className="text-white drop-shadow-lg" size={48} />
                    </div>
                </div>
              ) : (
                <div className="text-center p-4">
                  <Camera size={48} className="text-slate-400 mx-auto mb-2" />
                  <span className="text-xs text-slate-500 block">Click below to take photo</span>
                </div>
              )}
            </div>
            
            {!showCamera && !photoCaptured && (
               <button 
                type="button"
                onClick={startCamera}
                className="mt-4 w-full py-2 px-4 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Camera size={16} /> Open Camera
              </button>
            )}

            {analyzing && (
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-blue-600 font-medium animate-pulse">
                <Loader2 className="animate-spin" size={16} /> Processing AI Check...
              </div>
            )}

            {aiData && (
              <div className="mt-4 text-xs space-y-2 p-3 bg-green-50 rounded border border-green-100">
                 <div className="flex items-center gap-2 font-bold text-green-700">
                    <CheckCircle size={14} /> Identity Verified
                 </div>
                 <div className="flex justify-between text-slate-600">
                  <span>Watchlist Status:</span>
                  <span className="font-mono text-green-600 font-bold">{aiData.watchlistStatus}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Form Fields */}
        <div className="md:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-6">
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input 
                type="text" 
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="e.g. John Doe"
              />
            </div>

            <div className="border-t border-slate-100 pt-4">
              <h4 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Car size={16} className="text-slate-400" /> Vehicle Details (Optional)
              </h4>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Plate Number</label>
                  <input 
                    type="text" 
                    name="plateNumber"
                    value={formData.plateNumber}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none uppercase placeholder:normal-case"
                    placeholder="WAA 1234"
                  />
                </div>
                <div>
                   <label className="block text-xs font-medium text-slate-500 mb-1">Model & Color</label>
                   <input 
                    type="text" 
                    name="vehicleColor"
                    value={formData.vehicleColor}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Black Toyota"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <h4 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <MapPin size={16} className="text-slate-400" /> Visit Details
              </h4>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Destination</label>
                <select 
                  name="destination"
                  required
                  value={formData.destination}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="">Select a location...</option>
                  {LOCATIONS.map(loc => (
                    <option key={loc.name} value={loc.name}>
                      {loc.name} {loc.type === DestinationType.RESTRICTED && '(Restricted)'}
                    </option>
                  ))}
                </select>
                {LOCATIONS.find(l => l.name === formData.destination)?.type === DestinationType.RESTRICTED && (
                  <div className="mt-2 flex items-start gap-2 text-amber-600 text-xs bg-amber-50 p-2 rounded">
                    <AlertTriangle size={14} className="mt-0.5" />
                    <span>This area requires security clearance. Your pass will be pending approval.</span>
                  </div>
                )}
                {formData.destination.includes("NLDC") && (
                    <div className="mt-2 flex items-start gap-2 text-blue-600 text-xs bg-blue-50 p-2 rounded">
                    <div className="mt-0.5 font-bold">i</div>
                    <span>Note: Please collect a physical access card from the counter for NLDC.</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4">
              <button 
                type="submit"
                disabled={!photoCaptured || analyzing}
                className={`w-full py-3 rounded-xl font-semibold transition-colors shadow-lg flex items-center justify-center gap-2
                  ${!photoCaptured || analyzing 
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                    : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-200'}`}
              >
                {analyzing ? 'Processing...' : 'Generate Visitor Pass'}
                {!analyzing && <ArrowRight size={18} />}
              </button>
              {!photoCaptured && (
                <p className="text-xs text-red-500 text-center mt-2">
                  * Please capture a photo to proceed.
                </p>
              )}
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default Registration;