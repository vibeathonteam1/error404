import React, { useState, useRef, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid 
} from 'recharts';
import { 
  Users, AlertTriangle, ShieldCheck, Clock, Check, X, Search, Filter, FileText, Download, PlusCircle, Car, Scan, Upload, QrCode, Camera, UserCheck, AlertOctagon 
} from 'lucide-react';
import { INITIAL_VISITORS, MOCK_LOGS, ANALYTICS_DATA } from '../constants';
import { Visitor, AccessStatus, LogEntry } from '../types';

const AdminDashboard: React.FC = () => {
  const [visitors, setVisitors] = useState<Visitor[]>(INITIAL_VISITORS);
  const [logs, setLogs] = useState<LogEntry[]>(MOCK_LOGS);
  const [activeTab, setActiveTab] = useState<'overview' | 'approvals' | 'logs' | 'lpr' | 'face' | 'qr'>('overview');
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [isAfterHours, setIsAfterHours] = useState(false);

  // Check for after-hours on mount
  useEffect(() => {
    const checkTime = () => {
        const hour = new Date().getHours();
        // Office hours: 07:30 to 18:00. 
        // Simple check: if < 7 or >= 18. (Ignoring 30min granularity for simplicity in demo)
        if (hour < 7 || hour >= 18) {
            setIsAfterHours(true);
        } else {
            setIsAfterHours(false);
        }
    };
    checkTime();
    const interval = setInterval(checkTime, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  // LPR State
  const [lprScanning, setLprScanning] = useState(false);
  const [lprResult, setLprResult] = useState<any>(null);
  const [lprImage, setLprImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Face Rec State
  const [faceScanning, setFaceScanning] = useState(false);
  const [faceResult, setFaceResult] = useState<any>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const faceVideoRef = useRef<HTMLVideoElement>(null);

  // QR State
  const [qrScanning, setQrScanning] = useState(false);
  const [qrResult, setQrResult] = useState<any>(null);

  // Cleanup camera when switching tabs
  useEffect(() => {
    if (activeTab !== 'face' && cameraActive) {
        if (faceVideoRef.current && faceVideoRef.current.srcObject) {
            const tracks = (faceVideoRef.current.srcObject as MediaStream).getTracks();
            tracks.forEach(track => track.stop());
        }
        setCameraActive(false);
    }
  }, [activeTab, cameraActive]);

  // Logic to approve/reject
  const handleApproval = (id: string, approved: boolean) => {
    setVisitors(prev => prev.map(v => 
      v.id === id ? { ...v, status: approved ? AccessStatus.APPROVED : AccessStatus.REJECTED } : v
    ));
    
    // Add log entry for the action
    const newLog: LogEntry = {
        id: `L-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        action: approved ? 'Access Granted' : 'Access Denied',
        user: 'Admin',
        details: `Manual decision for visitor ${id}`,
        type: 'INFO'
    };
    setLogs(prev => [newLog, ...prev]);
  };

  const pendingCount = visitors.filter(v => v.status === AccessStatus.PENDING).length;
  const activeCount = visitors.filter(v => v.status === AccessStatus.CHECKED_IN).length;

  const handleExport = (format: 'PDF' | 'EXCEL') => {
      alert(`Exporting Audit Logs to ${format}... (Simulation)`);
  };

  // --- LPR Handlers ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLprImage(reader.result as string);
        setLprResult(null); 
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLPRScan = () => {
    if (!lprImage) {
        alert("Please upload a vehicle image first.");
        return;
    }
    setLprScanning(true);
    setLprResult(null);

    // Simulate AI Scanning
    setTimeout(() => {
        setLprScanning(false);
        const scannedPlate = "WAA 1234"; 
        const match = visitors.find(v => v.plateNumber === scannedPlate);

        if (match) {
            setLprResult({
                success: true,
                plate: scannedPlate,
                vehicle: match.vehicleModel || "Unknown Model",
                color: "Black",
                owner: match.name,
                status: "ACCESS GRANTED"
            });
             setLogs(prev => [{
                id: `LPR-${Date.now()}`,
                timestamp: new Date().toLocaleTimeString(),
                action: 'LPR Match',
                user: 'AI System',
                details: `Vehicle ${scannedPlate} matched to ${match.name}`,
                type: 'INFO'
            }, ...prev]);
        } else {
             setLprResult({
                success: false,
                plate: "UNK 9999",
                vehicle: "Unknown Sedan",
                color: "Red",
                owner: "Unknown",
                status: "ACCESS DENIED"
            });
        }
    }, 2000);
  };

  // --- Face Recognition Handlers ---
  const handleFaceScan = async () => {
    // 1. Activate Camera if not active
    if (!cameraActive) {
        setCameraActive(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (faceVideoRef.current) {
                faceVideoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Camera access error:", err);
            setCameraActive(false);
            alert("Unable to access camera. Please ensure permissions are granted.");
        }
        return;
    }

    // 2. Perform Scan
    setFaceScanning(true);
    setFaceResult(null);

    // Simulate processing delay and match finding
    setTimeout(() => {
        setFaceScanning(false);
        // Simulate finding "Sarah Connor"
        const match = visitors.find(v => v.name === 'Sarah Connor');
        
        if (match) {
            setFaceResult({
                success: true,
                visitor: match,
                confidence: '98.5%'
            });
            setLogs(prev => [{
                id: `FR-${Date.now()}`,
                timestamp: new Date().toLocaleTimeString(),
                action: 'Face Verified',
                user: 'AI System',
                details: `Identity confirmed: ${match.name}`,
                type: 'INFO'
            }, ...prev]);
        } else {
             setFaceResult({ success: false });
        }
    }, 2500);
  };

  // --- QR Scanner Handlers ---
  const handleQRScan = () => {
      setQrScanning(true);
      setQrResult(null);

      setTimeout(() => {
          setQrScanning(false);
          // Simulate a valid scan
          const match = visitors[0]; 
          setQrResult({
              success: true,
              data: match,
              timestamp: new Date().toLocaleTimeString()
          });
          setLogs(prev => [{
            id: `QR-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString(),
            action: 'QR Scan',
            user: 'Scanner 01',
            details: `Badge verified for ${match.name}`,
            type: 'INFO'
        }, ...prev]);
      }, 1500);
  };

  const handleLogIncident = (e: React.FormEvent) => {
      e.preventDefault();
      const newLog: LogEntry = {
          id: `INC-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          action: 'Incident Report',
          user: 'Admin',
          details: 'Manual incident logged via Dashboard.',
          type: 'ALERT'
      };
      setLogs(prev => [newLog, ...prev]);
      setShowIncidentModal(false);
  };

  return (
    <div className="flex h-full relative">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col z-20">
        <div className="p-6">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Main Menu</h2>
            <nav className="space-y-2">
                <SidebarItem 
                    active={activeTab === 'overview'} 
                    onClick={() => setActiveTab('overview')} 
                    icon={ShieldCheck} 
                    label="Overview" 
                />
                <SidebarItem 
                    active={activeTab === 'approvals'} 
                    onClick={() => setActiveTab('approvals')} 
                    icon={Clock} 
                    label="Approvals" 
                    badge={pendingCount}
                />
                <SidebarItem 
                    active={activeTab === 'logs'} 
                    onClick={() => setActiveTab('logs')} 
                    icon={Users} 
                    label="Visitor Logs" 
                />
            </nav>

            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 mt-8">Scanners</h2>
            <nav className="space-y-2">
                <SidebarItem 
                    active={activeTab === 'lpr'} 
                    onClick={() => setActiveTab('lpr')} 
                    icon={Car} 
                    label="LPR Module" 
                />
                <SidebarItem 
                    active={activeTab === 'face'} 
                    onClick={() => setActiveTab('face')} 
                    icon={Scan} 
                    label="Face Verification" 
                />
                <SidebarItem 
                    active={activeTab === 'qr'} 
                    onClick={() => setActiveTab('qr')} 
                    icon={QrCode} 
                    label="QR Scanner" 
                />
            </nav>
        </div>
        
        <div className="mt-auto p-6 border-t border-slate-100">
             <div className="bg-red-50 p-4 rounded-xl border border-red-100 mb-4">
                <div className="flex items-center gap-2 text-red-700 font-bold text-sm mb-1">
                    <AlertTriangle size={16} /> Risk Alert
                </div>
                <p className="text-xs text-red-600 leading-relaxed">
                    Vehicle WAA 1234 has exceeded authorized parking duration.
                </p>
             </div>
             
             <button 
                onClick={() => setShowIncidentModal(true)}
                className="w-full py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 flex items-center justify-center gap-2 mb-4"
             >
                 <PlusCircle size={16} /> Log Incident
             </button>

             <div className="text-[10px] text-slate-400 text-center border-t border-slate-100 pt-2">
                <p>Data Privacy Compliance</p>
                <p>Auto-Delete after 30 days active</p>
             </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto bg-slate-50 p-6 md:p-8">
        
        {/* Header */}
        <div className="flex justify-between items-end mb-8">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">Security Dashboard</h2>
                <p className="text-slate-500 text-sm">Real-time monitoring and access control</p>
            </div>
            <div className="text-right hidden sm:block">
                <div className="text-2xl font-mono font-bold text-slate-900">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                <div className="text-xs text-slate-400">{new Date().toLocaleDateString()}</div>
            </div>
        </div>

        {/* Risk Monitoring Banner - Shows only in Overview if After Hours */}
        {activeTab === 'overview' && isAfterHours && (
             <div className="mb-6 bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg shadow-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                <AlertOctagon className="text-amber-600 shrink-0" size={24} />
                <div>
                    <h3 className="text-amber-800 font-bold">After-Hours Access Detected</h3>
                    <p className="text-amber-700 text-sm mt-1">
                        Current system time is outside standard operating hours (07:30 - 18:00). 
                        Enhanced logging and stricter access control rules are now active.
                    </p>
                </div>
             </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard label="Active Visitors" value={activeCount} color="blue" />
                    <StatCard label="Pending Approvals" value={pendingCount} color="amber" />
                    <StatCard label="Total Today" value={145} color="emerald" />
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-slate-800">Crowd Analytics (Friday Peak Monitoring)</h3>
                        <div className="text-xs text-slate-400">Updates in real-time</div>
                    </div>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={ANALYTICS_DATA}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="time" axisLine={false} tickLine={false} fontSize={12} tickMargin={10} />
                                <YAxis axisLine={false} tickLine={false} fontSize={12} />
                                <Tooltip 
                                    cursor={{fill: '#f1f5f9'}}
                                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                                />
                                <Bar dataKey="visitors" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        )}

        {/* LPR Tab */}
        {activeTab === 'lpr' && (
            <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Car size={20} className="text-indigo-600" />
                            License Plate Recognition
                        </h3>
                        <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                        <div onClick={() => fileInputRef.current?.click()} className="aspect-video bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center mb-4 relative overflow-hidden cursor-pointer hover:bg-slate-50 transition-colors group">
                            {lprImage ? (
                                <img src={lprImage} alt="Uploaded Vehicle" className="w-full h-full object-cover" />
                            ) : (
                                <>
                                    <div className="p-4 rounded-full bg-slate-200 mb-3 group-hover:bg-slate-300 transition-colors">
                                        <Upload size={32} className="text-slate-500" />
                                    </div>
                                    <p className="text-sm font-medium text-slate-600">Upload Vehicle Image</p>
                                </>
                            )}
                            {lprScanning && (
                                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white z-10">
                                    <div className="w-16 h-1 bg-green-500 animate-ping mb-4"></div>
                                    <p className="font-mono text-sm">EXTRACTING PLATE...</p>
                                </div>
                            )}
                        </div>
                        <button onClick={handleLPRScan} disabled={lprScanning || !lprImage} className="w-full py-3 rounded-lg font-medium bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg disabled:opacity-50">
                            {lprScanning ? 'Processing...' : 'Verify Vehicle'}
                        </button>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="font-bold text-slate-800 mb-4">Results</h3>
                        {!lprResult ? (
                            <div className="text-center text-slate-400 py-10">No active scan.</div>
                        ) : (
                            <div className="animate-in fade-in space-y-4">
                                <div className={`p-4 rounded-lg border text-center ${lprResult.success ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                                    <div className="text-2xl font-bold">{lprResult.status}</div>
                                </div>
                                {lprResult.success && (
                                    <div className="space-y-2">
                                        <div className="flex justify-between border-b pb-2"><span className="text-slate-500">Plate</span><span className="font-bold font-mono">{lprResult.plate}</span></div>
                                        <div className="flex justify-between border-b pb-2"><span className="text-slate-500">Owner</span><span className="font-medium">{lprResult.owner}</span></div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* Face Verification Tab */}
        {activeTab === 'face' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Scan size={20} className="text-indigo-600" />
                        Face Verification Scanner
                    </h3>
                    <div className="aspect-[4/3] bg-slate-900 rounded-lg mb-4 relative overflow-hidden flex items-center justify-center">
                        {cameraActive ? (
                            <>
                                <video ref={faceVideoRef} autoPlay playsInline muted className="w-full h-full object-cover"></video>
                                {faceScanning && (
                                    <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/30">
                                        <div className="w-48 h-48 border-2 border-indigo-500 rounded-full animate-ping opacity-50 absolute"></div>
                                        <div className="w-40 h-40 border-2 border-indigo-400 rounded-full animate-pulse absolute"></div>
                                        <Scan className="text-white animate-pulse relative z-20" size={48} />
                                        <p className="absolute mt-24 font-mono text-white text-sm bg-black/50 px-2 py-1 rounded">MATCHING...</p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center">
                                <div className="w-20 h-20 bg-slate-800 rounded-full mx-auto mb-3 flex items-center justify-center">
                                    <Camera size={32} className="text-slate-400" />
                                </div>
                                <p className="text-slate-400 text-sm">System Standby</p>
                                <p className="text-xs text-slate-500 mt-1">Camera disabled to save resources</p>
                            </div>
                        )}
                    </div>
                    <button 
                        onClick={handleFaceScan} 
                        disabled={faceScanning} 
                        className={`w-full py-3 rounded-lg font-medium transition-colors shadow-lg ${
                            cameraActive 
                             ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                             : 'bg-slate-800 text-white hover:bg-slate-900'
                        }`}
                    >
                        {faceScanning ? 'Verifying Identity...' : (cameraActive ? 'Capture & Verify Visitor' : 'Activate Camera System')}
                    </button>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-4">Identity Match</h3>
                    {!faceResult ? (
                        <div className="text-center text-slate-400 py-10 flex flex-col items-center">
                            <UserCheck className="mb-2 opacity-50" size={48} />
                            <p>Waiting for scan result...</p>
                        </div>
                    ) : (
                        <div className="animate-in fade-in">
                            {faceResult.success ? (
                                <div className="text-center">
                                    <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4 border-4 border-green-500 shadow-lg">
                                        <img src={faceResult.visitor.photoUrl} alt="Match" className="w-full h-full object-cover" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-900">{faceResult.visitor.name}</h2>
                                    <div className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium mt-2">
                                        <Check size={14} /> Match Confidence: {faceResult.confidence}
                                    </div>
                                    <div className="mt-6 space-y-3 text-left bg-slate-50 p-4 rounded-lg">
                                        <div className="flex justify-between text-sm"><span className="text-slate-500">ID</span><span className="font-mono">{faceResult.visitor.id}</span></div>
                                        <div className="flex justify-between text-sm"><span className="text-slate-500">Destination</span><span className="font-medium">{faceResult.visitor.destination}</span></div>
                                        <div className="flex justify-between text-sm"><span className="text-slate-500">Status</span><span className="text-green-600 font-bold">{faceResult.visitor.status}</span></div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <X size={32} />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900">No Match Found</h3>
                                    <p className="text-slate-500 mt-2">Visitor not registered or image unclear.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* QR Scanner Tab */}
        {activeTab === 'qr' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <QrCode size={20} className="text-indigo-600" />
                        Dynamic QR Scanner
                    </h3>
                    <div className="aspect-square bg-slate-900 rounded-lg mb-4 relative flex items-center justify-center overflow-hidden">
                        {qrScanning && <div className="absolute inset-0 bg-green-500/10 animate-pulse z-10"></div>}
                        <div className="absolute w-64 h-64 border-2 border-white/50 rounded-lg">
                            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-500 -mt-1 -ml-1"></div>
                            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-500 -mt-1 -mr-1"></div>
                            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-500 -mb-1 -ml-1"></div>
                            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-500 -mb-1 -mr-1"></div>
                        </div>
                        {qrScanning && (
                             <div className="absolute w-full h-1 bg-red-500 top-1/2 shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-[scan_2s_ease-in-out_infinite]"></div>
                        )}
                        <QrCode size={64} className="text-slate-700" />
                    </div>
                    <button onClick={handleQRScan} disabled={qrScanning} className="w-full py-3 rounded-lg font-medium bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg">
                        {qrScanning ? 'Verifying Token...' : 'Scan Badge'}
                    </button>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-4">Badge Details</h3>
                    {!qrResult ? (
                        <div className="text-center text-slate-400 py-10">Ready to scan.</div>
                    ) : (
                        <div className="animate-in fade-in bg-green-50 border border-green-200 rounded-xl p-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <ShieldCheck size={120} className="text-green-700" />
                            </div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 text-green-700 font-bold mb-4">
                                    <Check size={20} /> Verified Valid
                                </div>
                                <h2 className="text-2xl font-bold text-slate-900 mb-1">{qrResult.data.name}</h2>
                                <p className="text-slate-600 font-mono text-sm mb-6">{qrResult.data.id}</p>
                                
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <div className="text-slate-500 text-xs uppercase tracking-wider">Destination</div>
                                        <div className="font-bold text-slate-900">{qrResult.data.destination}</div>
                                    </div>
                                    <div>
                                        <div className="text-slate-500 text-xs uppercase tracking-wider">Type</div>
                                        <div className="font-bold text-slate-900">{qrResult.data.type}</div>
                                    </div>
                                    <div>
                                        <div className="text-slate-500 text-xs uppercase tracking-wider">Check-in</div>
                                        <div className="font-bold text-slate-900">{qrResult.data.checkInTime}</div>
                                    </div>
                                    <div>
                                        <div className="text-slate-500 text-xs uppercase tracking-wider">Scan Time</div>
                                        <div className="font-bold text-slate-900">{qrResult.timestamp}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* Approvals Tab */}
        {activeTab === 'approvals' && (
            <div className="space-y-4">
                <h3 className="font-bold text-slate-800">Pending Access Requests</h3>
                {visitors.filter(v => v.status === AccessStatus.PENDING).length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
                        <p className="text-slate-400">No pending approvals needed.</p>
                    </div>
                ) : (
                    visitors.filter(v => v.status === AccessStatus.PENDING).map(visitor => (
                        <div key={visitor.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 font-bold shrink-0">
                                    {visitor.name.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900">{visitor.name}</h4>
                                    <p className="text-sm text-slate-500">{visitor.icNumber || visitor.staffId}</p>
                                    <div className="mt-2 inline-flex items-center text-xs font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded">
                                        Requesting: {visitor.destination}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2 w-full md:w-auto">
                                <button 
                                    onClick={() => handleApproval(visitor.id, false)}
                                    className="flex-1 md:flex-none px-4 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 font-medium flex items-center justify-center gap-2"
                                >
                                    <X size={16} /> Deny
                                </button>
                                <button 
                                    onClick={() => handleApproval(visitor.id, true)}
                                    className="flex-1 md:flex-none px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center justify-center gap-2"
                                >
                                    <Check size={16} /> Approve
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        )}

        {/* Logs Tab */}
        {activeTab === 'logs' && (
            <div className="space-y-4">
                 <div className="flex flex-col md:flex-row gap-4 mb-4 justify-between">
                    <div className="flex gap-4 flex-1">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input type="text" placeholder="Search logs..." className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                        <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 flex items-center gap-2 hover:bg-slate-50">
                            <Filter size={18} /> Filter
                        </button>
                    </div>
                    <div className="flex gap-2">
                         <button 
                            onClick={() => handleExport('PDF')}
                            className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 flex items-center gap-2 hover:bg-slate-50 text-sm font-medium"
                         >
                            <FileText size={16} /> Export PDF
                         </button>
                         <button 
                            onClick={() => handleExport('EXCEL')}
                            className="px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 flex items-center gap-2 hover:bg-emerald-100 text-sm font-medium"
                         >
                            <Download size={16} /> Export Excel
                         </button>
                    </div>
                 </div>

                 <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4">Time</th>
                                <th className="px-6 py-4">Event Type</th>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {logs.map(log => (
                                <tr key={log.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 font-mono text-slate-500">{log.timestamp}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                            log.type === 'ALERT' ? 'bg-red-100 text-red-700' : 
                                            log.type === 'WARNING' ? 'bg-amber-100 text-amber-700' : 
                                            'bg-blue-100 text-blue-700'
                                        }`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-slate-900">{log.user}</td>
                                    <td className="px-6 py-4 text-slate-500">{log.details}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </div>
            </div>
        )}
      </div>

      {/* Incident Logging Modal */}
      {showIncidentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 animate-in fade-in zoom-in duration-200">
                  <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <AlertTriangle className="text-red-500" /> Log Security Incident
                  </h3>
                  <form onSubmit={handleLogIncident} className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Incident Type</label>
                          <select className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500">
                              <option>Unauthorized Access</option>
                              <option>Tailgating Detected</option>
                              <option>Lost Badge</option>
                              <option>Suspicious Behavior</option>
                              <option>Other</option>
                          </select>
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                          <textarea 
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500 h-24 resize-none"
                              placeholder="Describe the incident details..."
                              required
                          ></textarea>
                      </div>
                      <div className="flex justify-end gap-3 pt-4">
                          <button 
                            type="button" 
                            onClick={() => setShowIncidentModal(false)}
                            className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg"
                          >
                              Cancel
                          </button>
                          <button 
                            type="submit" 
                            className="px-4 py-2 bg-red-600 text-white font-medium hover:bg-red-700 rounded-lg"
                          >
                              Submit Report
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

const SidebarItem = ({ active, onClick, icon: Icon, label, badge }: any) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
            active ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
        }`}
    >
        <div className="flex items-center gap-3">
            <Icon size={18} />
            {label}
        </div>
        {badge > 0 && (
            <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">
                {badge}
            </span>
        )}
    </button>
);

const StatCard = ({ label, value, color }: any) => {
    const colors: any = {
        blue: 'bg-blue-50 text-blue-700',
        amber: 'bg-amber-50 text-amber-700',
        emerald: 'bg-emerald-50 text-emerald-700'
    };
    
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="text-slate-500 text-sm font-medium mb-2">{label}</div>
            <div className={`text-4xl font-bold ${colors[color].replace('bg-', 'text-').split(' ')[1]}`}>
                {value}
            </div>
        </div>
    );
};

export default AdminDashboard;