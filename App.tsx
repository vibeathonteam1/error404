import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Badge from './pages/Badge';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';

const App: React.FC = () => {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/badge" element={<Badge />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/login/:role" element={<Login />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;