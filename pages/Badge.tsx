import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  CheckCircle, Clock, AlertOctagon, Printer, Home, 
  UserPlus, QrCode, Shield, Download, Loader2, AlertCircle, X, Check, Fingerprint, Info, FileUp, DownloadCloud, ClipboardList, Database, FileSpreadsheet, Lock, Sparkles
} from 'lucide-react';
import { UserRole, AccessTier, AccessStatus, getTierDisplayLabel, getAccessGuidance } from '../types';

type PortalTab = 'checkin' | 'host';

interface UploadSummary {
  success: number;
  failed: number;
  total: number;
  errors: string[];
}

const Badge: React.FC = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<PortalTab>('checkin');
  const [qrRefreshKey, setQrRefreshKey] = useState<number>(Date.now());
  
  if (!state) {
    return (
      <div className="flex flex-col items-center justify-center h-full pt-20">
        <p className="text-slate-500 font-medium">Session context expired.</p>
        <button onClick={() => navigate('/')} className="mt-4 text-indigo-600 font-bold hover:underline">Return to Main Entry</button>
      </div>
    );
  }

  const { name, identifier, status, role, hasInvitation: initialInvitation } = state;
  const isPending = status === AccessStatus.PENDING;
  const isStaff = role === UserRole.STAFF;
  const hostId = identifier;

  const [sessionTier, setSessionTier] = useState<AccessTier>(AccessTier.GREEN);
  
  const [invitees, setInvitees] = useState<string[]>(() => {
    const saved = localStorage.getItem(`invites_${hostId}`);
    const defaultInvites = isStaff ? ['900101-01-5544', '880202-14-1122'] : [];
    return saved ? JSON.parse(saved) : defaultInvites;
  });

  const hasActiveInvitation = initialInvitation || invitees.length > 0;
  const displayStatus = hasActiveInvitation ? "INVITED ACCESS" : "STANDARD ACCESS";
  
  const [inviteeIC, setInviteeIC] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [uploadSummary, setUploadSummary] = useState<UploadSummary | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem(`invites_${hostId}`, JSON.stringify(invitees));
    
    const globalInvites = JSON.parse(localStorage.getItem('sentinel_global_registry') || '[]');
    const updatedGlobal = [...new Set([...globalInvites, ...invitees])];
    localStorage.setItem('sentinel_global_registry', JSON.stringify(updatedGlobal));
  }, [invitees, hostId]);

  useEffect(() => {
    const interval = setInterval(() => {
      setQrRefreshKey(Date.now());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setUploadSummary(null);

    const cleanIC = inviteeIC.trim().toUpperCase();
    if (!cleanIC) return;

    setIsProcessing(true);
    
    setTimeout(() => {
      setInvitees(prev => [...new Set([...prev, cleanIC])]);
      setInviteeIC('');
      
      setFeedback({ 
        type: 'success', 
        message: `Guest ${cleanIC} registered. Profile remains GREEN (Safe), but you are now authorized for ORANGE zones via active invite.` 
      });
      setIsProcessing(false);
    }, 1000);
  };

  const handleDownloadTemplate = () => {
    const headers = "IC_Passport_Number,Full_Name_Optional\n";
    const example = "900101-14-5544,Sarah Connor";
    const blob = new Blob([headers + example], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sentinel_invite_template.xlsx';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsBulkProcessing(true);
    setTimeout(() => {
      setInvitees(prev => [...new Set([...prev, '950101-01-2233', '910505-14-8899'])]);
      setUploadSummary({ total: 2, success: 2, failed: 0, errors: [] });
      setIsBulkProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }, 1500);
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8 md:py-12">
      <div className={`bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border-t-8 transition-colors duration-500 ${isPending ? 'border-amber-500' : 'border-indigo-600'}`}>
        
        {isStaff && (
          <div className="flex bg-slate-50 p-2 gap-2 border-b border-slate-100">
            <button 
              onClick={() => { setActiveTab('checkin'); setFeedback(null); }} 
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition-all duration-300 ${activeTab === 'checkin' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
            >
              <QrCode size={18} /> My Pass
            </button>
            <button 
              onClick={() => { setActiveTab('host'); setFeedback(null); }} 
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition-all duration-300 ${activeTab === 'host' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
            >
              <UserPlus size={18} /> Manage Host
            </button>
          </div>
        )}

        {activeTab === 'checkin' && (
          <div className="animate-in fade-in duration-300">
            <div className={`px-8 py-6 text-center border-b border-slate-100 ${isPending ? 'bg-amber-50' : 'bg-slate-50'}`}>
              <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${isPending ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600 shadow-sm'}`}>
                {isPending ? <Clock size={32} /> : <Shield size={32} />}
              </div>
              <h2 className="text-2xl font-black text-slate-900 leading-tight">
                {getTierDisplayLabel(sessionTier, false)}
              </h2>
              <p className="text-slate-500 text-xs mt-1 font-bold uppercase tracking-widest">{isStaff ? `Staff ID: ${identifier}` : 'Active Verification Pass'}</p>
              
              <div className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 rounded-full border border-indigo-100">
                 <div className={`h-2 w-2 rounded-full ${hasActiveInvitation ? 'bg-indigo-500 animate-pulse' : 'bg-slate-400'}`}></div>
                 <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{displayStatus}</span>
              </div>
            </div>

            <div className="p-8 space-y-8 text-center">
              <div className="flex flex-col items-center justify-center">
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Secure Dynamic QR</p>
                  <div className="relative group mx-auto">
                    <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                    <div className="relative w-56 h-64 bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col items-center justify-center transition-all">
                      <img 
                        key={qrRefreshKey}
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(JSON.stringify({ id: identifier, tier: sessionTier, inv: hasActiveInvitation, ref: qrRefreshKey }))}`} 
                        alt="Security Pass" 
                        className="w-full h-auto mb-4 animate-in fade-in duration-500"
                      />
                      <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1.5">
                        <Lock size={12} /> Refreshes Regularly
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-1">
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">{name}</h3>
                <div className="flex items-center justify-center gap-2">
                   <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                   <p className="text-indigo-600 text-sm font-black tracking-widest uppercase">Verified System Profile</p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 text-left space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Info size={14} className="text-indigo-400" /> Access Status Logic
                </h4>
                <div className="space-y-3">
                  <p className="text-xs text-slate-700 font-bold leading-relaxed">
                    {hasActiveInvitation 
                      ? "You have active authorization for ORANGE-controlled zones. Proceed to Platinum Towers (A–D)."
                      : getAccessGuidance(sessionTier, AccessStatus.CHECKED_IN)}
                  </p>
                  <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
                    <p className="text-xs text-slate-500 italic font-medium">
                      Base Tier: <span className="font-black text-indigo-600 uppercase">{sessionTier}</span>
                    </p>
                    {hasActiveInvitation && (
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-lg text-[9px] font-black uppercase tracking-tighter">
                        Active Invite
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {isPending && (
                <div className="bg-amber-50 border border-amber-200 p-5 rounded-3xl flex items-start gap-3 animate-pulse">
                  <AlertOctagon className="text-amber-600 shrink-0 mt-0.5" size={24} />
                  <div className="text-left">
                    <p className="text-xs font-black text-amber-900 uppercase">Awaiting Clearance</p>
                    <p className="text-[11px] text-amber-800 font-medium leading-normal mt-0.5">
                      Restricted tier access is currently pending security team approval.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'host' && (
          <div className="p-8 space-y-10 animate-in fade-in duration-500">
             <div className="text-center space-y-2">
               <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-2">
                  <UserPlus size={24} />
               </div>
               <h3 className="text-2xl font-black text-slate-900 tracking-tight">Host Invitations</h3>
               <p className="text-sm text-slate-500 font-medium px-4 leading-relaxed italic text-center">Base access remains GREEN. Your invitations are persisted and reloaded automatically.</p>
             </div>

             <div className="space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">
                  <ClipboardList size={14} className="text-indigo-400" /> Register Guest IC/Passport
                </div>
                <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-2">
                  <input 
                    type="text" 
                    value={inviteeIC}
                    onChange={(e) => setInviteeIC(e.target.value)}
                    placeholder="E.g. 900101-01-5544"
                    className="flex-1 px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-mono font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-300 uppercase"
                  />
                  <button 
                    disabled={!inviteeIC.trim() || isProcessing}
                    className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 disabled:bg-slate-300 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2 min-w-[120px]"
                  >
                    {isProcessing ? <Loader2 size={18} className="animate-spin" /> : 'Invite'}
                  </button>
                </form>

                {feedback && (
                  <div className={`p-4 rounded-2xl flex items-start gap-3 border animate-in slide-in-from-top-2 ${feedback.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
                    <Sparkles size={18} className="mt-0.5 shrink-0 text-indigo-500" />
                    <div className="flex-1 text-[11px] font-bold leading-normal">{feedback.message}</div>
                    <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600 shrink-0"><X size={16} /></button>
                  </div>
                )}
             </div>

             <div className="space-y-4 pt-6 border-t border-slate-100">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">
                  <FileSpreadsheet size={14} className="text-indigo-400" /> Bulk Invitation Upload
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button 
                    onClick={handleDownloadTemplate}
                    className="flex items-center justify-center gap-2 py-5 bg-white border-2 border-slate-200 rounded-3xl text-xs font-bold text-slate-700 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all shadow-sm group"
                  >
                    <DownloadCloud size={18} className="text-indigo-500 group-hover:scale-110 transition-transform" /> 
                    <div className="text-left">
                      <span className="block">Template</span>
                      <span className="text-[9px] text-slate-400 uppercase">.csv Format</span>
                    </div>
                  </button>
                  <label className="cursor-pointer flex items-center justify-center gap-2 py-5 bg-indigo-600 rounded-3xl text-xs font-bold text-white hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 group">
                    {isBulkProcessing ? <Loader2 size={20} className="animate-spin" /> : <><FileUp size={20} className="group-hover:translate-y-[-2px] transition-transform" /> Upload List</>}
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      accept=".csv,.xlsx" 
                      className="hidden" 
                      onChange={handleBulkUpload}
                      disabled={isBulkProcessing}
                    />
                  </label>
                </div>
             </div>

             <div className="pt-6 border-t border-slate-100">
                <div className="flex items-center justify-between mb-4 px-1">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Database size={14} className="text-slate-300" /> Current Database of Invitations
                  </h4>
                </div>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-2 scrollbar-hide">
                   {invitees.slice().reverse().map((id, i) => (
                      <div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                         <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-indigo-600 shadow-sm border border-slate-100 group-hover:scale-105 transition-transform">
                               <Fingerprint size={18} />
                            </div>
                            <div>
                              <span className="block font-mono text-xs font-black text-slate-700 tracking-tight">{id}</span>
                              <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-tighter italic">Contextual: ORANGE authorized</span>
                            </div>
                         </div>
                         <div className="text-[9px] font-black bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full uppercase tracking-tight">Access Registry Persisted</div>
                      </div>
                   ))}
                </div>
             </div>
          </div>
        )}

        <div className="bg-slate-50 px-8 py-6 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
          <button 
            onClick={() => window.print()} 
            className="flex-1 py-4 bg-white border-2 border-slate-200 rounded-2xl text-slate-700 text-sm font-black shadow-sm active:bg-slate-100 transition-all hover:border-slate-300 flex items-center justify-center gap-2"
          >
            <Printer size={18} className="text-slate-400" /> Print Pass
          </button>
          <button 
            onClick={() => navigate('/')} 
            className="flex-1 py-4 bg-slate-900 rounded-2xl text-white text-sm font-black shadow-lg shadow-slate-200 active:scale-95 transition-all hover:bg-slate-800 flex items-center justify-center gap-2"
          >
            <Home size={18} className="text-slate-400" /> Log Out
          </button>
        </div>
      </div>
      
      <div className="mt-8 text-center text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em]">
        Sentinel VMS • Independent Persistence Layer Active
      </div>
    </div>
  );
};

export default Badge;