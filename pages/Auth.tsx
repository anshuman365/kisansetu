import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { Card, Button, Input } from '../components/UI';
import { UserRole } from '../types';

export const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  
  // Form State
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.FARMER);
  const [location, setLocation] = useState('');
  
  // Auth Logic State
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleSendOtp = async () => {
    if (!phone) {
        alert("Please enter a valid phone number");
        return;
    }
    if (!isLogin && (!name || !location)) {
        alert("Please fill in all details");
        return;
    }
    
    setIsLoading(true);
    // Simulate SMS API call
    setTimeout(() => {
        setOtpSent(true);
        setIsLoading(false);
    }, 1000);
  };

  const handleVerify = async () => {
    if (!otp) {
        alert("Please enter OTP");
        return;
    }

    setIsLoading(true);
    try {
        const { user } = await (isLogin ? authService.login(phone, otp) : authService.register({ name, phone, role, location }));
        
        if (user.role === UserRole.ADMIN) {
            navigate('/admin');
        } else {
            navigate('/dashboard');
        }
    } catch(e) {
        alert('Authentication failed. Please try again.');
    } finally {
        setIsLoading(false);
    }
  };

  const toggleMode = () => {
      setIsLogin(!isLogin);
      setOtpSent(false);
      setOtp('');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
        <div className="mx-auto h-12 w-12 bg-agri-600 rounded-xl flex items-center justify-center text-white font-bold text-xl mb-4">K</div>
        <h2 className="text-3xl font-extrabold text-gray-900">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          KisanSetu - Your Digital Mandi
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            {!otpSent ? (
                <>
                    <Input 
                        label="Phone Number" 
                        placeholder="98765 43210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        type="tel"
                        maxLength={10}
                    />
                    
                    {!isLogin && (
                        <div className="space-y-4 animate-fadeIn">
                             <Input 
                                label="Full Name" 
                                placeholder="Ram Kumar" 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                             />
                             
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Select Role</label>
                                <div className="grid grid-cols-3 gap-2">
                                    <div 
                                        onClick={() => setRole(UserRole.FARMER)}
                                        className={`border rounded-lg p-2 text-center text-sm cursor-pointer transition-colors ${role === UserRole.FARMER ? 'bg-agri-600 text-white border-agri-600 ring-2 ring-agri-300' : 'bg-white hover:bg-gray-50 text-gray-700'}`}
                                    >
                                        Farmer
                                    </div>
                                    <div 
                                        onClick={() => setRole(UserRole.BUYER)}
                                        className={`border rounded-lg p-2 text-center text-sm cursor-pointer transition-colors ${role === UserRole.BUYER ? 'bg-soil-500 text-white border-soil-500 ring-2 ring-soil-300' : 'bg-white hover:bg-gray-50 text-gray-700'}`}
                                    >
                                        Buyer
                                    </div>
                                    <div 
                                        onClick={() => setRole(UserRole.ADMIN)}
                                        className={`border rounded-lg p-2 text-center text-sm cursor-pointer transition-colors ${role === UserRole.ADMIN ? 'bg-gray-800 text-white border-gray-800 ring-2 ring-gray-400' : 'bg-white hover:bg-gray-50 text-gray-700'}`}
                                    >
                                        Admin
                                    </div>
                                </div>
                             </div>

                             <Input 
                                label="Location (Village / City)" 
                                placeholder="e.g. Karnal, Haryana" 
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                             />
                        </div>
                    )}

                    <Button className="w-full" onClick={handleSendOtp} isLoading={isLoading}>
                        {isLogin ? 'Get OTP' : 'Register'}
                    </Button>
                </>
            ) : (
                <>
                    <div className="text-center mb-4">
                        <p className="text-sm text-gray-500">OTP sent to +91 {phone}</p>
                    </div>
                    <Input 
                        label="Enter OTP" 
                        placeholder="1234"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        type="text"
                        className="text-center tracking-widest text-lg font-bold"
                        maxLength={4}
                    />
                    <Button className="w-full" onClick={handleVerify} isLoading={isLoading}>
                        Verify & {isLogin ? 'Login' : 'Create Account'}
                    </Button>
                    <button onClick={() => setOtpSent(false)} className="w-full text-sm text-agri-600 mt-4 hover:underline">
                        Change Phone Number
                    </button>
                </>
            )}
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Or
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3">
               <button 
                onClick={toggleMode}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-agri-600 bg-agri-50 hover:bg-agri-100 transition-colors"
               >
                 {isLogin ? 'Create new account' : 'Login to existing account'}
               </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};