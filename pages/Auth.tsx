import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { Card, Button, Input } from '../components/UI';
import { UserRole } from '../types';

export const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  
  // Form State
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.FARMER);
  const [location, setLocation] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic Validation
    if (!phone || !password) {
        alert("Phone and Password are required");
        return;
    }
    if (!isLogin && (!name || !location)) {
        alert("Please fill in all details for registration");
        return;
    }

    setIsLoading(true);
    try {
        const { user } = await (isLogin 
            ? authService.login(phone, password) 
            : authService.register({ name, phone, password, role, location })
        );
        
        if (user.role === UserRole.ADMIN) {
            navigate('/admin');
        } else {
            navigate('/dashboard');
        }
    } catch(e: any) {
        console.error(e);
        alert(e.message || 'Authentication failed. Please check credentials.');
    } finally {
        setIsLoading(false);
    }
  };

  const toggleMode = () => {
      setIsLogin(!isLogin);
      setPassword('');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
        <div className="mx-auto h-12 w-12 bg-agri-600 rounded-xl flex items-center justify-center text-white font-bold text-xl mb-4">K</div>
        <h2 className="text-3xl font-extrabold text-gray-900">
          {isLogin ? 'Welcome Back' : 'Join KisanSetu'}
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          {isLogin ? 'Login to continue trading' : 'Create your digital mandi account'}
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            
            {!isLogin && (
                 <div className="space-y-4 animate-fadeIn">
                      <Input 
                         label="Full Name" 
                         placeholder="Ram Kumar" 
                         value={name}
                         onChange={(e) => setName(e.target.value)}
                         required
                      />
                      
                      <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Select Role</label>
                         <div className="grid grid-cols-2 gap-2">
                             <div 
                                 onClick={() => setRole(UserRole.FARMER)}
                                 className={`border rounded-lg p-2 text-center text-sm cursor-pointer transition-colors ${role === UserRole.FARMER ? 'bg-agri-600 text-white border-agri-600 ring-2 ring-agri-300' : 'bg-white hover:bg-gray-50 text-gray-700'}`}
                             >
                                 Farmer (Seller)
                             </div>
                             <div 
                                 onClick={() => setRole(UserRole.BUYER)}
                                 className={`border rounded-lg p-2 text-center text-sm cursor-pointer transition-colors ${role === UserRole.BUYER ? 'bg-soil-500 text-white border-soil-500 ring-2 ring-soil-300' : 'bg-white hover:bg-gray-50 text-gray-700'}`}
                             >
                                 Buyer (Trader)
                             </div>
                         </div>
                      </div>

                      <Input 
                         label="Location (Village / City)" 
                         placeholder="e.g. Karnal, Haryana" 
                         value={location}
                         onChange={(e) => setLocation(e.target.value)}
                         required
                      />
                 </div>
            )}

            <Input 
                label="Phone Number" 
                placeholder="98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                type="tel"
                maxLength={10}
                required
            />

            <Input 
                label="Password" 
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                required
            />

            <Button className="w-full" type="submit" isLoading={isLoading}>
                {isLogin ? 'Login' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  {isLogin ? 'New to KisanSetu?' : 'Already have an account?'}
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3">
               <button 
                onClick={toggleMode}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-agri-600 bg-agri-50 hover:bg-agri-100 transition-colors"
               >
                 {isLogin ? 'Create new account' : 'Login here'}
               </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};