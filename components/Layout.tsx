import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Home, ShoppingBag, PlusCircle, User, LogOut } from 'lucide-react';
import { authService } from '../services/api';

export const Layout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  const handleLogout = () => {
    authService.logout();
    navigate('/');
  };

  const isActive = (path: string) => {
    if (path === '/dashboard' && location.pathname === '/dashboard') return true;
    if (path === '/browse' && location.pathname.startsWith('/browse')) return true;
    if (path === '/profile' && location.pathname.startsWith('/profile')) return true;
    return location.pathname === path;
  };

  const NavItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => {
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
      {/* Sticky Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/dashboard" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-agri-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  K
                </div>
                <span className="text-xl font-bold text-gray-900 tracking-tight">Kisan<span className="text-agri-600">Setu</span></span>
              </Link>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/browse" className={`font-medium transition-colors ${isActive('/browse') ? 'text-agri-600' : 'text-gray-600 hover:text-agri-600'}`}>Marketplace</Link>
              <Link to="/post-order" className={`font-medium transition-colors ${isActive('/post-order') ? 'text-agri-600' : 'text-gray-600 hover:text-agri-600'}`}>Sell Crop</Link>
              {user ? (
                 <div className="flex items-center space-x-4 ml-4 pl-4 border-l border-gray-200">
                    <Link to="/profile" className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-agri-600">
                        <div className="w-8 h-8 bg-agri-100 rounded-full flex items-center justify-center text-agri-700 font-bold">
                            {user.name.charAt(0)}
                        </div>
                        <span className="hidden lg:inline">{user.name}</span>
                    </Link>
                 </div>
              ) : (
                <Link to="/auth" className="text-agri-600 font-semibold hover:bg-agri-50 px-4 py-2 rounded-lg transition-colors">Login</Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black bg-opacity-50 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}>
           <div className="absolute right-0 top-0 bottom-0 w-72 bg-white shadow-2xl pt-20 px-4 flex flex-col space-y-2 animate-slideIn" onClick={e => e.stopPropagation()}>
              <NavItem to="/dashboard" icon={Home} label="Dashboard" />
              <NavItem to="/browse" icon={ShoppingBag} label="Browse Mandi" />
              <NavItem to="/post-order" icon={PlusCircle} label="Post Order" />
              <NavItem to="/profile" icon={User} label="My Profile" />
              <div className="mt-auto pb-8">
                  <hr className="my-4" />
                  <button onClick={handleLogout} className="flex items-center space-x-3 px-4 py-3 text-red-600 w-full text-left hover:bg-red-50 rounded-lg transition-colors">
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                  </button>
              </div>
           </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* Bottom Nav for Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-2 pb-safe z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <Link to="/dashboard" className={`flex flex-col items-center space-y-1 p-2 rounded-lg ${isActive('/dashboard') ? 'text-agri-600' : 'text-gray-400'}`}>
          <Home className="w-6 h-6" />
          <span className="text-[10px] font-medium">Home</span>
        </Link>
        <Link to="/browse" className={`flex flex-col items-center space-y-1 p-2 rounded-lg ${isActive('/browse') ? 'text-agri-600' : 'text-gray-400'}`}>
          <ShoppingBag className="w-6 h-6" />
          <span className="text-[10px] font-medium">Mandi</span>
        </Link>
        <Link to="/post-order" className="flex flex-col items-center space-y-1 -mt-8">
           <div className="bg-agri-600 text-white p-4 rounded-full shadow-lg ring-4 ring-gray-50 transform active:scale-95 transition-transform">
             <PlusCircle className="w-6 h-6" />
           </div>
           <span className="text-[10px] font-medium text-agri-700">Sell</span>
        </Link>
        <Link to="/profile" className={`flex flex-col items-center space-y-1 p-2 rounded-lg ${isActive('/profile') ? 'text-agri-600' : 'text-gray-400'}`}>
          <User className="w-6 h-6" />
          <span className="text-[10px] font-medium">Profile</span>
        </Link>
      </div>
      <div className="md:hidden h-20"></div>
    </div>
  );
};