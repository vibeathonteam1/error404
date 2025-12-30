import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Shield, Briefcase, Lock, UserCheck, ArrowRight, Car, MapPin } from 'lucide-react';
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

    const selectedLoc = LOCATIONS.find(l => l.name === formData.destination);

    // Simulate API Auth
    setTimeout(() => {
      setLoading(false);
      
      if (isAdmin) {
        navigate('/admin');
      } else {
        // Staff Check-in Success
        // Mocking a staff name lookup based on ID
        navigate('/badge', { 
          state: { 
            name: 'Internal Staff Member', // In real app, fetched from backend
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
    }, 1000);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <div className={`w-16 h-16 mx-auto rounded-xl flex items-center justify-center mb-4 ${isAdmin ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'}`}>
          {isAdmin ? <Shield size={32} /> : <Briefcase size={32} />}
        </div>
        <h2 className="text-3xl font-bold text-slate-900">
          {isAdmin ? 'Security Login' : 'Staff Check-In'}
        </h2>
        <p className="text-slate-500 mt-2">
          {isAdmin 
            ? 'Restricted access for security personnel only.' 
            : 'Enter your credentials to log your attendance.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Staff ID</label>
          <div className="relative">
            <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              name="staffId"
              required
              value={formData.staffId}
              onChange={handleInputChange}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              placeholder="e.g. S-1024"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="password" 
              name="password"
              required
              value={formData.password}
              onChange={handleInputChange}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              placeholder="••••••••"
            />
          </div>
        </div>

        {/* Location Selection for Staff */}
        {!isAdmin && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Work Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <select 
                name="destination"
                required
                value={formData.destination}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white appearance-none"
              >
                <option value="">Select location...</option>
                {LOCATIONS.map(loc => (
                  <option key={loc.name} value={loc.name}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Plate Number is only required for Staff (if driving), not Admin */}
        {!isAdmin && (
          <div>
             <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-slate-700">Vehicle Plate</label>
                <span className="text-xs text-slate-400">Optional (if driving)</span>
             </div>
            <div className="relative">
              <Car className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                name="plateNumber"
                value={formData.plateNumber}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none uppercase placeholder:normal-case"
                placeholder="WAA 1234"
              />
            </div>
          </div>
        )}

        <button 
          type="submit"
          disabled={loading}
          className={`w-full py-3 rounded-xl font-semibold text-white shadow-lg transition-all flex items-center justify-center gap-2
            ${loading ? 'opacity-70 cursor-not-allowed' : ''}
            ${isAdmin ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'}
          `}
        >
          {loading ? 'Authenticating...' : (isAdmin ? 'Access Dashboard' : 'Check In')}
          {!loading && <ArrowRight size={18} />}
        </button>
      </form>

      <div className="mt-6 text-center">
        <button onClick={() => navigate('/')} className="text-sm text-slate-500 hover:text-slate-800">
          Cancel and return to home
        </button>
      </div>
    </div>
  );
};

export default Login;