import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Landing } from './pages/Landing';
import { Auth } from './pages/Auth';
import { PostOrder } from './pages/PostOrder';
import { Marketplace } from './pages/Marketplace';
import { OrderDetails } from './pages/OrderDetails';
import { DealDetails } from './pages/DealDetails';
import { Profile } from './pages/Profile';
import { AdminDashboard } from './pages/AdminDashboard';
import { KYC } from './pages/KYC';
import { Subscription } from './pages/Subscription';
import { authService } from './services/api';
import { ToastProvider, useToast } from './components/Toast';

const ProtectedRoute = ({ children }: { children?: React.ReactNode }) => {
  const user = authService.getCurrentUser();
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  return <Layout>{children}</Layout>;
};

const PublicRoute = ({ children }: { children?: React.ReactNode }) => {
    return <>{children}</>;
};

// Component to handle global app side effects (like PWA notifications)
const AppEffects = () => {
    const { showToast } = useToast();
    const user = authService.getCurrentUser();

    useEffect(() => {
        if (!user) return;

        // PWA Notification Permission Logic
        if ('Notification' in window) {
            if (Notification.permission === 'default') {
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        showToast("Notifications enabled! You will receive updates on deals.", "success");
                        // Here you would typically subscribe to VAPID push manager
                    }
                });
            }
        }
    }, [user, showToast]);

    return null;
};

function App() {
  return (
    <ToastProvider>
      <Router>
        <AppEffects />
        <Routes>
          <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
          <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />
          
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/post-order" element={<ProtectedRoute><PostOrder /></ProtectedRoute>} />
          <Route path="/orders/:id" element={<ProtectedRoute><OrderDetails /></ProtectedRoute>} />
          <Route path="/deals/:id" element={<ProtectedRoute><DealDetails /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/kyc" element={<ProtectedRoute><KYC /></ProtectedRoute>} />
          <Route path="/subscription" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          
          <Route path="/browse" element={<Layout><Marketplace /></Layout>} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;