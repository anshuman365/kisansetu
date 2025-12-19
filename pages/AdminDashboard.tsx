
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService, authService } from '../services/api';
import { Card, Button, Badge } from '../components/UI';
import { ShieldCheck, UserCheck, AlertCircle, LogOut, Ban, Eye, FileText, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const user = authService.getCurrentUser();
    const [activeTab, setActiveTab] = useState<'USERS' | 'KYC' | 'TRANSACTIONS'>('USERS');
    const [selectedKycUser, setSelectedKycUser] = useState<any>(null);

    React.useEffect(() => {
        if(user?.role !== 'ADMIN') navigate('/');
    }, [user, navigate]);

    const { data: users } = useQuery({ queryKey: ['adminUsers'], queryFn: adminService.getUsers });
    const { data: transactions } = useQuery({ queryKey: ['adminTx'], queryFn: adminService.getAllTransactions });

    const verifyMutation = useMutation({
        mutationFn: ({id, status}: {id: string, status: 'APPROVED' | 'REJECTED'}) => adminService.verifyUser(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
            setSelectedKycUser(null);
        }
    });

    const blockMutation = useMutation({
        mutationFn: ({id, isBlocked}: {id: string, isBlocked: boolean}) => adminService.blockUser(id, isBlocked),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminUsers'] })
    });

    return (
        <div className="pb-20">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm border">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Admin Control Center</h1>
                    <p className="text-gray-500 text-sm">Monitor platform activity and security</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => { authService.logout(); navigate('/auth'); }}>
                    <LogOut className="w-4 h-4 mr-2" /> Logout
                </Button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                 <Card className="p-4 bg-blue-50 border-0 flex items-center justify-between">
                     <div>
                         <p className="text-blue-800 font-medium">Total Users</p>
                         <p className="text-3xl font-bold text-blue-900">{users?.length || 0}</p>
                     </div>
                     <UserCheck className="w-8 h-8 text-blue-400" />
                 </Card>
                 <Card className="p-4 bg-orange-50 border-0 flex items-center justify-between">
                     <div>
                         <p className="text-orange-800 font-medium">Pending KYC</p>
                         <p className="text-3xl font-bold text-orange-900">{users?.filter((u:any) => u.kycStatus === 'PENDING').length || 0}</p>
                     </div>
                     <ShieldCheck className="w-8 h-8 text-orange-400" />
                 </Card>
                 <Card className="p-4 bg-green-50 border-0 flex items-center justify-between">
                     <div>
                         <p className="text-green-800 font-medium">Platform Volume</p>
                         <p className="text-3xl font-bold text-green-900">₹{transactions?.reduce((acc:number, t:any) => acc + t.amount, 0).toLocaleString() || 0}</p>
                     </div>
                     <FileText className="w-8 h-8 text-green-400" />
                 </Card>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6">
                <button onClick={() => setActiveTab('USERS')} className={`pb-3 px-6 font-medium ${activeTab === 'USERS' ? 'border-b-2 border-agri-600 text-agri-600' : 'text-gray-500'}`}>User Management</button>
                <button onClick={() => setActiveTab('KYC')} className={`pb-3 px-6 font-medium ${activeTab === 'KYC' ? 'border-b-2 border-agri-600 text-agri-600' : 'text-gray-500'}`}>KYC Requests</button>
                <button onClick={() => setActiveTab('TRANSACTIONS')} className={`pb-3 px-6 font-medium ${activeTab === 'TRANSACTIONS' ? 'border-b-2 border-agri-600 text-agri-600' : 'text-gray-500'}`}>Transactions</button>
            </div>

            {/* USER MANAGEMENT TAB */}
            {activeTab === 'USERS' && (
                <div className="space-y-4">
                    {users?.map((u: any) => (
                        <Card key={u.id} className={`p-4 flex flex-col sm:flex-row justify-between items-center gap-4 ${u.isBlocked ? 'bg-red-50' : 'bg-white'}`}>
                            <div className="flex items-center gap-4 w-full sm:w-auto">
                                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold">
                                    {u.name.charAt(0)}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-bold text-gray-900">{u.name}</p>
                                        <Badge variant="neutral">{u.role}</Badge>
                                        {u.isBlocked && <Badge variant="danger">BLOCKED</Badge>}
                                    </div>
                                    <p className="text-sm text-gray-500">{u.phone} • {u.location}</p>
                                </div>
                            </div>
                            <Button 
                                variant={u.isBlocked ? 'secondary' : 'danger'} 
                                size="sm"
                                onClick={() => blockMutation.mutate({ id: u.id, isBlocked: !u.isBlocked })}
                            >
                                {u.isBlocked ? 'Unblock User' : 'Block User'}
                            </Button>
                        </Card>
                    ))}
                </div>
            )}

            {/* KYC REQUESTS TAB */}
            {activeTab === 'KYC' && (
                <div className="space-y-4">
                    {users?.filter((u:any) => u.kycStatus === 'PENDING').length === 0 && <p className="text-gray-500 text-center py-10">No pending requests.</p>}
                    
                    {users?.filter((u:any) => u.kycStatus === 'PENDING').map((u: any) => (
                        <Card key={u.id} className="p-4 flex justify-between items-center">
                            <div>
                                <p className="font-bold">{u.name}</p>
                                <p className="text-sm text-gray-500">ID: {u.kycData?.idType || 'N/A'}</p>
                            </div>
                            <Button size="sm" onClick={() => setSelectedKycUser(u)}>Review Application</Button>
                        </Card>
                    ))}
                </div>
            )}

            {/* TRANSACTIONS TAB */}
            {activeTab === 'TRANSACTIONS' && (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {transactions?.map((t: any) => (
                                <tr key={t.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{t.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{t.amount}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <Badge variant={t.status === 'SUCCESS' ? 'success' : 'warning'}>{t.status}</Badge>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(t.date).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* KYC Review Modal */}
            {selectedKycUser && (
                <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center p-4">
                    <Card className="w-full max-w-lg bg-white p-6 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">KYC Review: {selectedKycUser.name}</h2>
                        
                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="text-sm text-gray-500">ID Type & Number</label>
                                <p className="font-medium">{selectedKycUser.kycData?.idType} - {selectedKycUser.kycData?.idNumber}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-gray-500">ID Document</label>
                                    <div className="h-32 bg-gray-100 rounded flex items-center justify-center border text-xs text-gray-400">
                                        [Image Placeholder]
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500">Live Photo</label>
                                    <div className="h-32 bg-gray-100 rounded flex items-center justify-center border text-xs text-gray-400">
                                         [Image Placeholder]
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 p-3 rounded text-sm">
                                <p><strong>Bank:</strong> {selectedKycUser.bankDetails?.bankName}</p>
                                <p><strong>Acc:</strong> {selectedKycUser.bankDetails?.accountNumber}</p>
                                <p><strong>IFSC:</strong> {selectedKycUser.bankDetails?.ifscCode}</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <Button 
                                variant="danger" 
                                className="flex-1"
                                onClick={() => verifyMutation.mutate({ id: selectedKycUser.id, status: 'REJECTED' })}
                            >
                                Reject
                            </Button>
                            <Button 
                                className="flex-1 bg-green-600 hover:bg-green-700"
                                onClick={() => verifyMutation.mutate({ id: selectedKycUser.id, status: 'APPROVED' })}
                            >
                                Approve
                            </Button>
                        </div>
                        <button onClick={() => setSelectedKycUser(null)} className="w-full mt-4 text-gray-500 text-sm">Close</button>
                    </Card>
                </div>
            )}
        </div>
    );
};
