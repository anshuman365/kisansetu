import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { authService, dealService } from '../services/api';
import { Card, Button, Badge, RatingStars } from '../components/UI';
import { MapPin, ShieldCheck, User, LogOut, ChevronRight, Crown, FileText, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Profile: React.FC = () => {
    const user = authService.getCurrentUser();
    const navigate = useNavigate();

    const { data: myDeals } = useQuery({
        queryKey: ['myDeals'],
        queryFn: dealService.getDeals,
        enabled: !!user
    });

    if (!user) return null;

    const handleLogout = () => {
        authService.logout();
        navigate('/auth');
    };

    return (
        <div className="pb-20">
            <h1 className="text-2xl font-bold mb-6">My Profile</h1>

            <Card className="p-6 mb-6 border-t-4 border-t-agri-600">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="w-20 h-20 bg-agri-100 rounded-full flex items-center justify-center text-3xl font-bold text-agri-700">
                        {user.name.charAt(0)}
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                        <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                            <h2 className="text-xl font-bold">{user.name}</h2>
                            {user.isVerified && <Badge variant="success">Verified</Badge>}
                        </div>
                        <p className="text-gray-500 flex items-center justify-center sm:justify-start mb-2">
                            <MapPin className="w-4 h-4 mr-1" /> {user.location}
                        </p>
                        <p className="text-sm font-medium text-gray-600">{user.role}</p>
                    </div>
                    <div className="text-center sm:text-right p-4 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 uppercase font-bold">Trust Score</p>
                        <div className="text-3xl font-bold text-agri-600">{user.trustScore}</div>
                        <RatingStars rating={user.trustScore} count={myDeals?.length || 5} />
                    </div>
                </div>
            </Card>

            {/* Quick Actions / Important Links */}
            <h3 className="font-bold text-gray-800 mb-3 px-1">Account & Security</h3>
            <Card className="mb-6 divide-y divide-gray-100">
                <div 
                    onClick={() => navigate('/kyc')} 
                    className="p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${user.isVerified ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">KYC Verification</p>
                            <p className="text-xs text-gray-500">
                                {user.isVerified ? 'Verification Completed' : 'Complete verification to boost trust'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center">
                        {!user.isVerified && <Badge variant="warning" className="mr-2">Pending</Badge>}
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                </div>

                <div 
                    onClick={() => navigate('/subscription')} 
                    className="p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                            <Crown className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">Subscription & Plans</p>
                            <p className="text-xs text-gray-500">Manage your premium features</p>
                        </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h3 className="font-bold text-gray-800 mb-4">Personal Information</h3>
                    <Card className="p-4 space-y-4">
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-gray-500">Phone Number</span>
                            <span className="font-medium">{user.phone}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-gray-500">Member Since</span>
                            <span className="font-medium">Jan 2024</span>
                        </div>
                        <div className="flex justify-between pb-2">
                            <span className="text-gray-500">Status</span>
                            <span className="text-green-600 font-bold">Active</span>
                        </div>
                    </Card>
                </div>

                <div>
                    <h3 className="font-bold text-gray-800 mb-4">Performance Stats</h3>
                    <Card className="p-4 space-y-4">
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-gray-500">Deals Completed</span>
                            <span className="font-medium">{myDeals?.length || 0}</span>
                        </div>
                        <div className="flex justify-between pb-2">
                            <span className="text-gray-500">Total Volume</span>
                            <span className="font-medium">
                                {myDeals?.reduce((acc: number, curr: any) => acc + (curr.quantity || 0), 0) || 0} Quintals
                            </span>
                        </div>
                    </Card>
                </div>
            </div>
            
            <div className="mt-8">
                 <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-800">Recent Reviews</h3>
                    <span className="text-xs text-agri-600 font-medium cursor-pointer">View All</span>
                 </div>
                 
                 {myDeals && myDeals.length > 0 ? (
                     <div className="space-y-3">
                         {myDeals.slice(0, 3).map(deal => (
                             <Card key={deal.id} className="p-4">
                                 <div className="flex justify-between items-start">
                                     <div>
                                         <p className="font-bold text-sm text-gray-900">Deal #{deal.id} - {deal.variety}</p>
                                         <p className="text-xs text-gray-500 mt-0.5">{new Date(deal.createdAt).toLocaleDateString()}</p>
                                     </div>
                                     <RatingStars rating={5} count={1} />
                                 </div>
                                 <p className="text-sm text-gray-600 mt-2 italic">"Smooth transaction. Payment was on time."</p>
                             </Card>
                         ))}
                     </div>
                 ) : (
                     <Card className="p-8 text-center bg-gray-50 border-dashed">
                        <p className="text-gray-500">No reviews yet. Complete deals to earn ratings.</p>
                     </Card>
                 )}
            </div>

            <Button variant="danger" className="w-full mt-10" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
        </div>
    );
};