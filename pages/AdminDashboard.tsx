import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService, authService } from '../services/api';
import { Card, Button, Badge } from '../components/UI';
import { ShieldCheck, UserCheck, AlertCircle, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const user = authService.getCurrentUser();

    React.useEffect(() => {
        if(user?.role !== 'ADMIN') navigate('/');
    }, [user, navigate]);

    const { data: users, isLoading } = useQuery({
        queryKey: ['adminUsers'],
        queryFn: adminService.getUsers
    });

    const verifyMutation = useMutation({
        mutationFn: adminService.verifyUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
        }
    });

    return (
        <div className="pb-20">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
                    <p className="text-gray-500">Manage users and verification</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => { authService.logout(); navigate('/auth'); }}>
                    <LogOut className="w-4 h-4 mr-2" /> Logout
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                 <Card className="p-4 bg-blue-50 border-0 flex items-center justify-between">
                     <div>
                         <p className="text-blue-800 font-medium">Total Users</p>
                         <p className="text-3xl font-bold text-blue-900">{users?.length || 0}</p>
                     </div>
                     <UserCheck className="w-8 h-8 text-blue-400" />
                 </Card>
                 <Card className="p-4 bg-orange-50 border-0 flex items-center justify-between">
                     <div>
                         <p className="text-orange-800 font-medium">Pending Verification</p>
                         <p className="text-3xl font-bold text-orange-900">{users?.filter(u => !u.isVerified).length || 0}</p>
                     </div>
                     <AlertCircle className="w-8 h-8 text-orange-400" />
                 </Card>
            </div>

            <h2 className="text-lg font-bold mb-4">User Verification Queue</h2>
            {isLoading ? (
                <div className="text-center py-10">Loading...</div>
            ) : (
                <div className="space-y-4">
                    {users?.map(u => (
                        <Card key={u.id} className="p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div className="flex items-center gap-4 w-full sm:w-auto">
                                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold">
                                    {u.name.charAt(0)}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-bold text-gray-900">{u.name}</p>
                                        <Badge variant="neutral">{u.role}</Badge>
                                    </div>
                                    <p className="text-sm text-gray-500">{u.location} • {u.phone}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
                                {u.isVerified ? (
                                    <span className="text-green-600 font-bold flex items-center text-sm">
                                        <ShieldCheck className="w-4 h-4 mr-1" /> Verified
                                    </span>
                                ) : (
                                    <Button 
                                        size="sm" 
                                        onClick={() => verifyMutation.mutate(u.id)}
                                        isLoading={verifyMutation.isPending}
                                    >
                                        Verify User
                                    </Button>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};