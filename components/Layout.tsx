import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Home, ShoppingBag, PlusCircle, User, LogOut, Bell, Shield, Crown } from 'lucide-react';
import { authService, notificationService } from '../services/api';
import { useQuery } from '@tanstack/react-query';
import { UserRole } from '../types';

export const Layout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  // Polling for notifications & Syncing Profile
  const { data: notifications, refetch: refetchNotifs } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
        // Sync Profile in background to check for KYC/Subscription updates
        if(user) await authService.getMe(); 
        return notificationService.getAll();
    },
    enabled: !!user,
    refetchInterval: 15000 // Poll every 15s
  });

  const unreadCount = notifications?.filter((n: any) => !n.isRead).length || 0;

  const handleLogout = () => {
    authService.logout();
    navigate('/');
  };

  const markRead = async (id: string) => {
      await notificationService.markRead(id);
      refetchNotifs();
  };

  const isActive = (path: string) => {
    if (path === '/dashboard' && location.pathname === '/dashboard') return true;
    if (path === '/browse' && location.pathname.startsWith('/browse')) return true;
    return location.pathname === path;
  };

  const NavItem = ({ to, icon: Icon, label }: any) => {
    const active = isActive(to);
    return (
      <Link
        to={to}
        onClick={() => setIsMenuOpen(false)}
        className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${active ? 'bg-agri-50 text-agri-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}
      >
        <Icon className={`w-5 h-5 ${active ? 'text-agri-600' : 'text-gray-400'}`} />
        <span>{label}</span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/dashboard" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-agri-600 rounded-full flex items-center justify-center text-white font-bold text-lg">K</div>
                <span className="text-xl font-bold text-gray-900 tracking-tight">Kisan<span className="text-agri-600">Setu</span></span>
              </Link>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center space-x-6">
              <Link to="/browse" className={`font-medium ${isActive('/browse') ? 'text-agri-600' : 'text-gray-600'}`}>Marketplace</Link>
              
              {/* Only Farmers see Sell Crop */}
              {user?.role === UserRole.FARMER && (
                <Link to="/post-order" className={`font-medium ${isActive('/post-order') ? 'text-agri-600' : 'text-gray-600'}`}>Sell Crop</Link>
              )}
              
              {user?.role === 'ADMIN' && (
                  <Link to="/admin" className="text-red-600 font-medium flex items-center"><Shield className="w-4 h-4 mr-1"/> Admin</Link>
              )}

              {user ? (
                 <div className="flex items-center space-x-4 ml-4 pl-4 border-l border-gray-200 relative">
                    <button 
                        className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full outline-none"
                        onClick={() => setShowNotifs(!showNotifs)}
                    >
                        <Bell className="w-5 h-5" />
                        {unreadCount > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white"></span>}
                    </button>
                    
                    {/* Notification Dropdown */}
                    {showNotifs && (
                        <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowNotifs(false)}></div>
                        <div className="absolute right-0 top-12 w-80 bg-white shadow-xl rounded-xl border border-gray-100 z-20 overflow-hidden">
                            <div className="p-3 border-b bg-gray-50 flex justify-between items-center">
                                <h3 className="font-bold text-gray-700">Notifications</h3>
                                <span className="text-xs text-gray-500">{unreadCount} new</span>
                            </div>
                            <div className="max-h-80 overflow-y-auto">
                                {notifications && notifications.length > 0 ? (
                                    notifications.map((n: any) => (
                                        <div 
                                            key={n.id} 
                                            className={`p-3 border-b hover:bg-gray-50 cursor-pointer ${n.isRead ? 'opacity-60' : 'bg-blue-50'}`}
                                            onClick={() => markRead(n.id)}
                                        >
                                            <p className="text-sm text-gray-800">{n.message}</p>
                                            <p className="text-xs text-gray-400 mt-1">{new Date(n.timestamp).toLocaleString()}</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-6 text-center text-gray-400 text-sm">No new notifications</div>
                                )}
                            </div>
                        </div>
                        </>
                    )}

                    <Link to="/profile" className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-agri-600">
                        <div className="w-8 h-8 bg-agri-100 rounded-full flex items-center justify-center text-agri-700 font-bold">
                            {user.name.charAt(0)}
                        </div>
                    </Link>
                 </div>
              ) : (
                <Link to="/auth" className="text-agri-600 font-semibold px-4">Login</Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-2">
               {user && (
                    <button 
                        className="relative p-2 text-gray-500" 
                        onClick={() => { setShowNotifs(!showNotifs); setIsMenuOpen(false); }}
                    >
                        <Bell className="w-6 h-6" />
                        {unreadCount > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white"></span>}
                    </button>
               )}
              <button onClick={() => { setIsMenuOpen(!isMenuOpen); setShowNotifs(false); }} className="p-2 text-gray-600">
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Notification Drawer */}
      {showNotifs && (
         <div className="md:hidden fixed inset-0 z-40 bg-gray-50 flex flex-col pt-16">
             <div className="p-4 border-b bg-white flex justify-between items-center">
                 <h2 className="font-bold text-lg">Notifications</h2>
                 <button onClick={() => setShowNotifs(false)}><X className="w-6 h-6"/></button>
             </div>
             <div className="flex-1 overflow-y-auto p-2">
                {notifications && notifications.length > 0 ? (
                    notifications.map((n: any) => (
                        <div 
                            key={n.id} 
                            className={`p-4 mb-2 rounded-lg border shadow-sm ${n.isRead ? 'bg-white' : 'bg-blue-50 border-blue-200'}`}
                            onClick={() => markRead(n.id)}
                        >
                            <p className="font-medium text-gray-800">{n.message}</p>
                            <p className="text-xs text-gray-500 mt-2">{new Date(n.timestamp).toLocaleString()}</p>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-10 text-gray-500">No notifications</div>
                )}
             </div>
         </div>
      )}

      {/* Mobile Menu Drawer */}
      {isMenuOpen && !showNotifs && (
        <div className="md:hidden fixed inset-0 z-40 bg-black bg-opacity-50 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}>
           <div className="absolute right-0 top-0 bottom-0 w-72 bg-white shadow-2xl pt-20 px-4 flex flex-col space-y-2" onClick={e => e.stopPropagation()}>
              <NavItem to="/dashboard" icon={Home} label="Dashboard" />
              <NavItem to="/browse" icon={ShoppingBag} label="Browse Mandi" />
              {user?.role === UserRole.FARMER && <NavItem to="/post-order" icon={PlusCircle} label="Sell Crop" />}
              <NavItem to="/profile" icon={User} label="Profile & KYC" />
              <NavItem to="/subscription" icon={Crown} label="Plans" />
              {user?.role === 'ADMIN' && <NavItem to="/admin" icon={Shield} label="Admin Panel" />}
              <div className="mt-auto pb-8">
                  <button onClick={handleLogout} className="flex items-center space-x-3 px-4 py-3 text-red-600 w-full text-left rounded-lg">
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                  </button>
              </div>
           </div>
        </div>
      )}

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-2 pb-safe z-30">
        <Link to="/dashboard" className={`flex flex-col items-center p-2 rounded-lg ${isActive('/dashboard') ? 'text-agri-600' : 'text-gray-400'}`}>
          <Home className="w-6 h-6" />
          <span className="text-[10px]">Home</span>
        </Link>
        <Link to="/browse" className={`flex flex-col items-center p-2 rounded-lg ${isActive('/browse') ? 'text-agri-600' : 'text-gray-400'}`}>
          <ShoppingBag className="w-6 h-6" />
          <span className="text-[10px]">Mandi</span>
        </Link>
        
        {/* Only show center Sell button if Farmer */}
        {user?.role === UserRole.FARMER && (
            <Link to="/post-order" className="flex flex-col items-center -mt-8">
            <div className="bg-agri-600 text-white p-4 rounded-full shadow-lg ring-4 ring-gray-50">
                <PlusCircle className="w-6 h-6" />
            </div>
            <span className="text-[10px] text-agri-700">Sell</span>
            </Link>
        )}

        <Link to="/profile" className={`flex flex-col items-center p-2 rounded-lg ${isActive('/profile') ? 'text-agri-600' : 'text-gray-400'}`}>
          <User className="w-6 h-6" />
          <span className="text-[10px]">Profile</span>
        </Link>
      </div>
      <div className="md:hidden h-20"></div>
    </div>
  );
};