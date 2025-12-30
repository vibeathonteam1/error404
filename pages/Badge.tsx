import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, AlertOctagon, Printer, Home } from 'lucide-react';

const Badge: React.FC = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  if (!state) {
    return (
        <div className="flex flex-col items-center justify-center h-full pt-20">
            <p className="text-slate-500">No badge data found.</p>
            <button onClick={() => navigate('/')} className="mt-4 text-indigo-600 underline">Return Home</button>
        </div>
    );
  }

  const { name, identifier, destination, status, timestamp, restricted } = state;
  const isPending = status === 'PENDING';

  return (
    <div className="max-w-md mx-auto px-6 py-12">
      <div className={`bg-white rounded-2xl shadow-xl overflow-hidden border-t-8 ${isPending ? 'border-amber-500' : 'border-green-500'}`}>
        
        {/* Status Header */}
        <div className={`px-6 py-4 text-center border-b border-slate-100 ${isPending ? 'bg-amber-50' : 'bg-green-50'}`}>
          <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-2 ${isPending ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>
            {isPending ? <Clock size={24} /> : <CheckCircle size={24} />}
          </div>
          <h2 className={`text-lg font-bold ${isPending ? 'text-amber-800' : 'text-green-800'}`}>
            {isPending ? 'Approval Pending' : 'Check-In Successful'}
          </h2>
          <p className="text-xs text-slate-500">
            {isPending ? 'Waiting for security officer review' : 'You are cleared to enter'}
          </p>
        </div>

        {/* Badge Content */}
        <div className="p-6 space-y-6">
          <div className="text-center">
             <div className="w-32 h-32 mx-auto bg-slate-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                {/* Simulated QR Code */}
                <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(JSON.stringify(state))}`} 
                    alt="QR Code" 
                    className="w-full h-full object-cover opacity-90 mix-blend-multiply"
                />
             </div>
             <p className="text-xs font-mono text-slate-400 mb-1">ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
             <h3 className="text-2xl font-bold text-slate-900">{name}</h3>
             <p className="text-slate-500 text-sm">{identifier}</p>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex justify-between text-sm">
                <span className="text-slate-500">Destination</span>
                <span className="font-semibold text-slate-900 text-right">{destination}</span>
            </div>
            <div className="flex justify-between text-sm">
                <span className="text-slate-500">Check-In Time</span>
                <span className="font-semibold text-slate-900">{timestamp}</span>
            </div>
            <div className="flex justify-between text-sm">
                <span className="text-slate-500">Valid Until</span>
                <span className="font-semibold text-slate-900">18:00 PM</span>
            </div>
          </div>

          {restricted && isPending && (
              <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg flex gap-3">
                  <AlertOctagon className="text-amber-600 shrink-0" size={20} />
                  <p className="text-xs text-amber-800 leading-relaxed">
                      You are attempting to access a <strong>Restricted Area</strong>. 
                      Please wait in the lobby until your host or security approves this request.
                  </p>
              </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex gap-3">
            <button 
                onClick={() => window.print()}
                className="flex-1 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 text-sm font-medium hover:bg-slate-50 flex items-center justify-center gap-2"
            >
                <Printer size={16} /> Print Badge
            </button>
            <button 
                onClick={() => navigate('/')}
                className="flex-1 py-2 bg-slate-900 rounded-lg text-white text-sm font-medium hover:bg-slate-800 flex items-center justify-center gap-2"
            >
                <Home size={16} /> Finish
            </button>
        </div>
      </div>
    </div>
  );
};

export default Badge;