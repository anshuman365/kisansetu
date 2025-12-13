import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { authService, dealService } from '../services/api';
import { Card, Button, Badge, RatingStars } from '../components/UI';
import { MapPin, ShieldCheck, User, LogOut } from 'lucide-react';
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
                            <span className="text-gray-500">KYC Status</span>
                            {user.isVerified ? (
                                <span className="text-green-600 font-bold flex items-center"><ShieldCheck className="w-4 h-4 mr-1"/> Completed</span>
                            ) : (
                                <span className="text-orange-500 font-bold">Pending</span>
                            )}
                        </div>
                    </Card>
                </div>

                <div>
                    <h3 className="font-bold text-gray-800 mb-4">Past Performance</h3>
                    <Card className="p-4 space-y-4">
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-gray-500">Deals Completed</span>
                            <span className="font-medium">{myDeals?.length || 0}</span>
                        </div>
                         <div className="flex justify-between pb-2">
                            <span className="text-gray-500">Success Rate</span>
                            <span className="font-medium text-green-600">100%</span>
                        </div>
                    </Card>
                </div>
            </div>
            
            <div className="mt-8">
                 <h3 className="font-bold text-gray-800 mb-4">Reviews</h3>
                 {myDeals && myDeals.length > 0 ? (
                     <div className="space-y-3">
                         {myDeals.map(deal => (
                             <Card key={deal.id} className="p-4">
                                 <div className="flex justify-between">
                                     <span className="font-bold text-sm">Deal for {deal.variety}</span>
                                     <RatingStars rating={5} count={1} />
                                 </div>
                                 <p className="text-sm text-gray-500 mt-1">"Smooth transaction, good quality crop."</p>
                             </Card>
                         ))}
                     </div>
                 ) : (
                     <p className="text-gray-500 text-center py-8">No reviews yet.</p>
                 )}
            </div>

            <Button variant="danger" className="w-full mt-8" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
        </div>
    );
};