import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, LogOut, Menu } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isDashboard = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className={`z-10 px-6 py-4 flex items-center justify-between shadow-sm ${isDashboard ? 'bg-slate-900 text-white' : 'bg-white text-slate-800'}`}>
        <div 
          className="flex items-center gap-2 cursor-pointer" 
          onClick={() => navigate('/')}
        >
          <div className={`p-2 rounded-lg ${isDashboard ? 'bg-indigo-600' : 'bg-indigo-600 text-white'}`}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Sentinel VMS</h1>
            <p className={`text-xs ${isDashboard ? 'text-slate-400' : 'text-slate-500'}`}>Secure Visitor Management</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {isDashboard && (
            <button 
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              <LogOut size={18} />
              Logout
            </button>
          )}
          {!isDashboard && location.pathname !== '/' && (
            <button 
               onClick={() => navigate('/')}
               className="text-sm font-medium text-slate-500 hover:text-indigo-600"
            >
              Home
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative">
        {children}
      </main>
      
      {/* Simple Footer */}
      {!isDashboard && (
        <footer className="py-6 text-center text-slate-400 text-sm">
          &copy; {new Date().getFullYear()} Sentinel Security Systems. All rights reserved.
        </footer>
      )}
    </div>
  );
};

export default Layout;