
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, Clock, Shield, AlertTriangle, 
  Users, QrCode, LogOut, CheckCircle, XCircle, 
  Search, AlertOctagon, Camera, Scan, 
  UserCheck, ClipboardList, Zap, RefreshCw,
  Bell, Eye, Trash2, Car, UserMinus, X, MapPin, ChevronDown, ShieldAlert, Check
} from 'lucide-react';
import { INITIAL_VISITORS } from '../constants';
import { Visitor, AccessStatus, AccessTier, STATUS_LABELS } from '../types';

type DashboardTab = 'DASHBOARD' | 'APPROVALS' | 'SCANNERS' | 'INCIDENTS';

interface SecurityAlert {
  id: string;
  time: string;
  visitorId: string;
  reason: string;
  status: 'UNREAD' | 'REVIEWED';
}

interface RedApprovalRecord {
  visitorId: string;
  tier: AccessTier;
  status: 'ALLOWED' | 'DENIED';
  timestamp: string;
}

/**
 * AdminDashboard component provides high-level security management tools,
 * including real-time access scanning, manual clearance approval, and incident logging.
 */
const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [visitors, setVisitors] = useState<Visitor[]>(INITIAL_VISITORS);
  const [activeTab, setActiveTab] = useState<DashboardTab>('DASHBOARD');
  const [isScanning, setIsScanning] = useState(false);
  const [scanningType, setScanningType] = useState<'QR' | 'FACE' | 'PLATE'>('QR');
  const [scanCategory, setScanCategory] = useState<AccessTier>(AccessTier.GREEN);
  const [scanResult, setScanResult] = useState<'ALLOW' | 'DENY' | null>(null);
  const [scanReason, setScanReason] = useState<string>('');
  
  const [activeApprovalRequest, setActiveApprovalRequest] = useState<Visitor | null>(null);
  const [redApprovals, setRedApprovals] = useState<RedApprovalRecord[]>(() => {
    const saved = localStorage.getItem('sentinel_red_approvals');
    return saved ? JSON.parse(saved) : [];
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [alerts, setAlerts] = useState<SecurityAlert[]>([
    { id: 'A1', time: '10:45 AM', visitorId: 'V-2022', reason: 'Blocked - Blacklisted', status: 'UNREAD' },
    { id: 'A2', time: '10:30 AM', visitorId: 'WCG 8821', reason: 'Invalid Plate Details', status: 'UNREAD' },
  ]);

  const [incidents, setIncidents] = useState<any[]>(() => {
    const saved = localStorage.getItem('sentinel_incidents');
    return saved ? JSON.parse(saved) : [
      { id: 'INC-01', time: '08:30 AM', ref: 'V-1005', type: 'Denied Entry', desc: 'Attempted entry without valid QR.' }
    ];
  });

  const pendingVisitors = visitors.filter(v => v.status === AccessStatus.PENDING);
  const totalInside = visitors.filter(v => v.status === AccessStatus.CHECKED_IN).length;
  const totalToday = visitors.length;

  useEffect(() => {
    localStorage.setItem('sentinel_red_approvals', JSON.stringify(redApprovals));
  }, [redApprovals]);

  useEffect(() => {
    localStorage.setItem('sentinel_incidents', JSON.stringify(incidents));
  }, [incidents]);

  const handleApproval = (id: string, approved: boolean) => {
    setVisitors(prev => prev.map(v => 
      v.id === id ? { ...v, status: approved ? AccessStatus.APPROVED : AccessStatus.REJECTED } : v
    ));
  };

  useEffect(() => {
    if (activeTab === 'SCANNERS' && isScanning) {
      navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      }).catch(err => console.error("Scanner error", err));
    }
    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
    };
  }, [activeTab, isScanning]);

  const logIncident = (visitor: Visitor, reason: string) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const incident = {
      id: `INC-${Date.now()}`,
      time: timestamp,
      ref: visitor.id || 'SYSTEM',
      type: 'Security Breach/Refusal',
      desc: `Scan at [${scanCategory}]. ${reason}.`
    };
    setIncidents(prev => [incident, ...prev]);
  };

  const simulateScan = () => {
    if (!isScanning) setIsScanning(true);
    setScanResult(null);
    setScanReason('');
    setActiveApprovalRequest(null);
    
    setTimeout(() => {
      const userDb = JSON.parse(localStorage.getItem('sentinel_user_db') || '[]');
      const allPossibleVisitors = [...INITIAL_VISITORS, ...userDb];
      const mockVisitor = allPossibleVisitors[Math.floor(Math.random() * allPossibleVisitors.length)];
      
      const scanFailedBySystem = Math.random() < 0.05;
      
      if (scanFailedBySystem) {
        setScanResult('DENY');
        setScanReason(`Failure: Unrecognized ${scanningType} record`);
        return;
      }

      const freshApprovals: RedApprovalRecord[] = JSON.parse(localStorage.getItem('sentinel_red_approvals') || '[]');

      if (scanCategory === AccessTier.RED_1 || scanCategory === AccessTier.RED_2) {
        const existingApproval = freshApprovals.find(a => 
          a.visitorId === mockVisitor.id && 
          a.tier === scanCategory && 
          a.status === 'ALLOWED'
        );
        
        if (existingApproval) {
          setScanResult('ALLOW');
          setScanReason(`Allowed: Persistent ${scanCategory} Clearance Valid`);
        } else {
          setActiveApprovalRequest(mockVisitor);
        }
      } 
      else if (scanCategory === AccessTier.GREEN) {
        setScanResult('ALLOW');
        setScanReason('Allowed: GREEN Category Access');
      } else if (scanCategory === AccessTier.ORANGE) {
        const globalInvites = JSON.parse(localStorage.getItem('sentinel_global_registry') || '[]');
        const hasInvite = globalInvites.includes(mockVisitor.icNumber || mockVisitor.id) || mockVisitor.type === 'STAFF';
        
        if (hasInvite) {
          setScanResult('ALLOW');
          setScanReason('Allowed: Active Invitation session found');
        } else {
          setScanResult('DENY');
          setScanReason('Pending: No active invitation for ORANGE zone');
          logIncident(mockVisitor, 'Attempted ORANGE access without invitation');
        }
      }
    }, 1200);
  };

  const approveRedRequest = () => {
    if (!activeApprovalRequest) return;
    
    const newApproval: RedApprovalRecord = {
      visitorId: activeApprovalRequest.id,
      tier: scanCategory,
      status: 'ALLOWED',
      timestamp: new Date().toISOString()
    };
    
    const updatedApprovals = [...redApprovals.filter(a => !(a.visitorId === activeApprovalRequest.id && a.tier === scanCategory)), newApproval];
    setRedApprovals(updatedApprovals);
    
    setScanResult('ALLOW');
    setScanReason(`Allowed: ${scanCategory} Clearance Granted`);
    setActiveApprovalRequest(null);
  };

  const rejectRedRequest = () => {
    if (!activeApprovalRequest) return;
    
    setScanResult('DENY');
    setScanReason(`Denied: ${scanCategory} Clearance Refused`);
    
    logIncident(activeApprovalRequest, `${scanCategory} clearance rejected by operator`);
    setActiveApprovalRequest(null);
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden text-slate-900">
      <aside className="w-64 bg-slate-900 text-white flex flex-col z-30">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-10 text-indigo-400">
            <ShieldCheck size={32} />
            <span className="text-xl font-black tracking-tight text-white">SENTINEL</span>
          </div>

          <nav className="space-y-1">
            {[
              { id: 'DASHBOARD', label: 'Dashboard', icon: Zap },
              { id: 'APPROVALS', label: 'Restricted Approvals', icon: Clock, count: pendingVisitors.length },
              { id: 'SCANNERS', label: 'Scanner Tools', icon: Scan },
              { id: 'INCIDENTS', label: 'Incident Log', icon: AlertTriangle },
            ].map((item) => (
              <button 
                key={item.id}
                onClick={() => { setActiveTab(item.id as DashboardTab); setIsScanning(false); setScanResult(null); setActiveApprovalRequest(null); }} 
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === item.id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-white/5'}`}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={18} />
                  {item.label}
                </div>
                {item.count !== undefined && item.count > 0 && (
                  <span className="bg-white/20 px-2 py-0.5 rounded text-[10px]">{item.count}</span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-white/10">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest">
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-slate-50 p-8">
        {activeTab === 'DASHBOARD' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">On-Site Now</p>
                <p className="text-4xl font-black text-slate-900">{totalInside}</p>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Entries</p>
                <p className="text-4xl font-black text-slate-900">{totalToday}</p>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Queue Size</p>
                <p className="text-4xl font-black text-indigo-600">{pendingVisitors.length}</p>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Refusals</p>
                <p className="text-4xl font-black text-red-600">{incidents.length}</p>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-black text-sm uppercase tracking-widest">Recent Check-ins</h3>
                <Users size={16} className="text-slate-400" />
              </div>
              <div className="divide-y divide-slate-100">
                {visitors.map(visitor => (
                  <div key={visitor.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                        <UserCheck size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{visitor.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{visitor.id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter ${visitor.status === AccessStatus.CHECKED_IN ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {visitor.status}
                      </span>
                      <span className="text-xs font-bold text-indigo-600">{visitor.accessTier}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'SCANNERS' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-200 text-center">
              <div className="flex justify-center gap-4 mb-8">
                {['QR', 'FACE', 'PLATE'].map((type) => (
                  <button 
                    key={type}
                    onClick={() => setScanningType(type as any)}
                    className={`px-6 py-2 rounded-full text-[10px] font-black tracking-widest uppercase transition-all ${scanningType === type ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <div className="relative aspect-video max-w-lg mx-auto bg-slate-900 rounded-[2rem] overflow-hidden border-8 border-white shadow-2xl mb-8">
                {isScanning ? (
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover opacity-60" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 gap-4">
                    <Scan size={64} className="opacity-20" />
                    <p className="text-xs font-black uppercase tracking-[0.2em]">Scanner Standby</p>
                  </div>
                )}
                
                {scanResult && (
                  <div className={`absolute inset-0 flex flex-col items-center justify-center animate-in zoom-in-95 duration-300 ${scanResult === 'ALLOW' ? 'bg-emerald-600/90' : 'bg-red-600/90'} text-white`}>
                    {scanResult === 'ALLOW' ? <CheckCircle size={80} /> : <XCircle size={80} />}
                    <h4 className="text-2xl font-black mt-4 uppercase tracking-tighter">{scanResult === 'ALLOW' ? 'ACCESS GRANTED' : 'ACCESS DENIED'}</h4>
                    <p className="text-xs font-bold mt-2 opacity-80 uppercase tracking-widest">{scanReason}</p>
                    <button onClick={() => setScanResult(null)} className="mt-8 px-8 py-3 bg-white text-slate-900 rounded-full font-black text-[10px] uppercase tracking-widest">Reset Scanner</button>
                  </div>
                )}

                {activeApprovalRequest && (
                  <div className="absolute inset-0 bg-slate-900/95 p-8 flex flex-col items-center justify-center text-white animate-in fade-in duration-300">
                    <ShieldAlert size={48} className="text-amber-500 mb-4" />
                    <h4 className="text-xl font-black uppercase tracking-tight text-center">Manual Clearance Required</h4>
                    <p className="text-xs text-slate-400 mt-2 text-center px-10">Verification required for <span className="text-white font-bold">{activeApprovalRequest.name}</span> requesting <span className="text-indigo-400 font-bold">{scanCategory}</span> zone access.</p>
                    <div className="flex gap-4 mt-8 w-full max-w-xs">
                      <button onClick={approveRedRequest} className="flex-1 py-4 bg-emerald-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all">Approve</button>
                      <button onClick={rejectRedRequest} className="flex-1 py-4 bg-red-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-700 transition-all">Reject</button>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Target Zone Category</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {Object.values(AccessTier).map(tier => (
                      <button 
                        key={tier}
                        onClick={() => setScanCategory(tier)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-all ${scanCategory === tier ? 'bg-slate-900 text-white ring-2 ring-indigo-500' : 'bg-slate-100 text-slate-500'}`}
                      >
                        {tier}
                      </button>
                    ))}
                  </div>
                </div>
                <button 
                  onClick={simulateScan} 
                  disabled={!!scanResult || !!activeApprovalRequest}
                  className="w-full max-w-md py-5 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-700 disabled:bg-slate-200 transition-all active:scale-95 mx-auto block"
                >
                  Initiate System Scan
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'APPROVALS' && (
          <div className="max-w-5xl mx-auto space-y-6">
            <h2 className="text-2xl font-black">Pending Authorization Queue</h2>
            {pendingVisitors.length === 0 ? (
              <div className="bg-white p-20 rounded-[3rem] text-center border-2 border-dashed border-slate-200">
                <CheckCircle size={48} className="text-emerald-500 mx-auto mb-4" />
                <p className="font-bold text-slate-400 uppercase tracking-widest text-xs">All Clearance Requests Processed</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pendingVisitors.map(visitor => (
                  <div key={visitor.id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200 flex gap-6">
                    <div className="w-24 h-24 bg-slate-100 rounded-2xl flex items-center justify-center shrink-0">
                      <Users size={32} className="text-slate-300" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-black text-lg leading-tight">{visitor.name}</h4>
                          <p className="text-xs text-slate-400 font-mono mt-1">{visitor.id}</p>
                        </div>
                        <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-[10px] font-black">PENDING</span>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                         <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">{visitor.accessTier}</p>
                         <div className="flex gap-2">
                            <button onClick={() => handleApproval(visitor.id, true)} className="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all"><Check size={18} /></button>
                            <button onClick={() => handleApproval(visitor.id, false)} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all"><X size={18} /></button>
                         </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'INCIDENTS' && (
          <div className="max-w-5xl mx-auto space-y-6">
            <h2 className="text-2xl font-black">Security Incidents & Refusals</h2>
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
               <div className="divide-y divide-slate-100">
                  {incidents.map((inc, i) => (
                    <div key={i} className="p-6 flex items-start gap-4">
                      <div className="p-3 bg-red-50 text-red-500 rounded-2xl">
                        <AlertTriangle size={24} />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h4 className="font-black text-slate-900 uppercase tracking-tight text-sm">{inc.type}</h4>
                          <span className="text-[10px] font-bold text-slate-400">{inc.time}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 font-medium italic">{inc.desc}</p>
                        <div className="mt-2 text-[10px] font-black text-slate-400 uppercase">Subject Reference: {inc.ref}</div>
                      </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
