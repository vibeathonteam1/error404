import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Shield, Lock, UserCheck, ShieldCheck, Zap, Briefcase, Car, MapPin } from 'lucide-react';
import { UserRole, AccessStatus, DestinationType } from '../types';
import { LOCATIONS } from '../constants';

const Login: React.FC = () => {
  const { role } = useParams<{ role: string }>();
  const navigate = useNavigate();
  const isAdmin = role === 'admin';

  const [formData, setFormData] = useState({
    staffId: '',
    password: '',
    plateNumber: '',
    destination: '',
  });

  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API Auth
    setTimeout(() => {
      setLoading(false);
      if (isAdmin) {
        navigate('/admin');
      } else {
        const selectedLoc = LOCATIONS.find(l => l.name === formData.destination);
        navigate('/badge', { 
          state: { 
            name: 'Internal Staff Member',
            identifier: formData.staffId,
            plateNumber: formData.plateNumber,
            role: UserRole.STAFF,
            destination: formData.destination,
            destinationType: selectedLoc?.type || DestinationType.GENERAL,
            status: AccessStatus.CHECKED_IN,
            timestamp: new Date().toLocaleTimeString(),
            restricted: false
          } 
        });
      }
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <div className={`w-24 h-24 mx-auto rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl ${isAdmin ? 'bg-slate-900 text-indigo-400' : 'bg-indigo-600 text-white'}`}>
            {isAdmin ? <Shield size={44} /> : <ShieldCheck size={44} />}
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">
            {isAdmin ? 'Operator Link' : 'Secure Entry'}
          </h2>
          <p className="text-slate-400 mt-4 font-bold text-xs uppercase tracking-[0.2em] px-12 leading-relaxed">
            {isAdmin 
              ? 'Authorized Security Personnel (Polis Bantuan) Identity Gateway.' 
              : 'Internal verification portal for registered staff members.'}
          </p>
        </div>

        <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border border-slate-200 relative overflow-hidden">
          {isAdmin && (
            <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600"></div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Identification Number</label>
              <div className="relative">
                <UserCheck className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                <input 
                  type="text" 
                  name="staffId"
                  required
                  value={formData.staffId}
                  onChange={handleInputChange}
                  className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-700 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-300"
                  placeholder="e.g. PB-1002"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Access PIN / Password</label>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                <input 
                  type="password" 
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-700 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-300"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {!isAdmin && (
              <div className="space-y-6 pt-4 animate-in fade-in duration-500">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Duty Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                    <select 
                      name="destination"
                      required
                      value={formData.destination}
                      onChange={handleInputChange}
                      className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-700 outline-none appearance-none cursor-pointer focus:ring-4 focus:ring-indigo-500/10 transition-all"
                    >
                      <option value="">Select a zone...</option>
                      {LOCATIONS.map(loc => (
                        <option key={loc.name} value={loc.name}>{loc.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Vehicle Plate (Optional)</label>
                  <div className="relative">
                    <Car className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                    <input 
                      type="text" 
                      name="plateNumber"
                      value={formData.plateNumber}
                      onChange={handleInputChange}
                      className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-700 uppercase outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-300"
                      placeholder="e.g. WAA 1234"
                    />
                  </div>
                </div>
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className={`w-full py-6 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] text-white shadow-2xl transition-all flex items-center justify-center gap-4 active:scale-95
                ${loading ? 'opacity-70 cursor-not-allowed' : ''}
                ${isAdmin ? 'bg-slate-900 hover:bg-slate-800 shadow-slate-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'}`}
            >
              {loading ? <Zap className="animate-spin" size={20} /> : (isAdmin ? 'Initiate Session' : 'Confirm Check-In')}
            </button>
          </form>
        </div>
        
        <div className="mt-12 text-center">
           <button onClick={() => navigate('/')} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-all">
             Back to Main Console
           </button>
        </div>
      </div>
    </div>
  );
};

export default Login;