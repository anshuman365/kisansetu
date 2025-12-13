import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dealService, authService } from '../services/api';
import { Card, Button, Badge } from '../components/UI';
import { CheckCircle, Download, FileText, Truck, ShieldCheck, Phone } from 'lucide-react';

export const DealDetails: React.FC = () => {
    const { id } = useParams<{id: string}>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const currentUser = authService.getCurrentUser();
    
    const { data: deal, isLoading } = useQuery({
        queryKey: ['deal', id],
        queryFn: () => dealService.getDealById(id!),
        enabled: !!id
    });

    const updateStatusMutation = useMutation({
        mutationFn: (status: 'DELIVERED') => dealService.updateStatus(id!, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['deal', id] });
            queryClient.invalidateQueries({ queryKey: ['myDeals'] });
        }
    });

    if (isLoading || !deal) return <div className="flex justify-center pt-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-agri-600"></div></div>;

    const isBuyer = currentUser?.id === deal.buyerId;
    const isSeller = currentUser?.id === deal.sellerId;
    const canMarkDelivered = (isBuyer || isSeller) && deal.status === 'LOCKED';

    return (
        <div className="max-w-3xl mx-auto pb-20">
            {/* Header */}
            <div className="text-center mb-8">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${deal.status === 'DELIVERED' ? 'bg-agri-100' : 'bg-blue-100'}`}>
                    <CheckCircle className={`w-8 h-8 ${deal.status === 'DELIVERED' ? 'text-agri-600' : 'text-blue-600'}`} />
                </div>
                <h1 className="text-3xl font-bold text-gray-900">
                    {deal.status === 'DELIVERED' ? 'Deal Completed' : 'Deal Confirmed'}
                </h1>
                <p className="text-gray-500 mt-2">Order ID: #{deal.orderId.toUpperCase()}</p>
            </div>

            <Card className={`overflow-hidden border-t-4 shadow-xl mb-6 ${deal.status === 'DELIVERED' ? 'border-t-agri-600' : 'border-t-blue-600'}`}>
                <div className="bg-gray-50 p-4 flex justify-between items-center border-b">
                     <h2 className="font-bold flex items-center text-gray-800">
                        <FileText className="w-5 h-5 mr-2 text-agri-600" /> Digital Contract
                     </h2>
                     <Badge variant={deal.status === 'DELIVERED' ? 'success' : 'warning'}>{deal.status}</Badge>
                </div>
                
                <div className="p-6 md:p-8 space-y-8">
                    {/* Parties */}
                    <div className="flex flex-col md:flex-row justify-between gap-8">
                        <div className="flex-1">
                            <p className="text-xs text-gray-500 uppercase tracking-wide font-bold mb-2">Seller (Farmer)</p>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-agri-100 rounded-full flex items-center justify-center text-agri-700 font-bold">
                                    {deal.sellerName.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">{deal.sellerName}</p>
                                    <p className="text-sm text-gray-500 flex items-center"><Phone className="w-3 h-3 mr-1"/> +91 XXXXX XXXXX</p>
                                </div>
                            </div>
                        </div>
                        <div className="hidden md:block w-px bg-gray-200"></div>
                        <div className="flex-1 md:text-right">
                             <p className="text-xs text-gray-500 uppercase tracking-wide font-bold mb-2">Buyer</p>
                             <div className="flex items-center gap-3 md:flex-row-reverse">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold">
                                    {deal.buyerName.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">{deal.buyerName}</p>
                                    <p className="text-sm text-gray-500">Verified Trader</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <hr className="border-dashed" />

                    {/* Commodity Details */}
                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide font-bold mb-4">Commodity Details</p>
                        <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 gap-4">
                            <div>
                                <span className="block text-gray-500 text-sm">Crop</span>
                                <span className="font-medium text-gray-900">{deal.crop}</span>
                            </div>
                            <div>
                                <span className="block text-gray-500 text-sm">Variety</span>
                                <span className="font-medium text-gray-900">{deal.variety}</span>
                            </div>
                             <div>
                                <span className="block text-gray-500 text-sm">Quantity</span>
                                <span className="font-medium text-gray-900">{deal.quantity} {deal.quantityUnit}</span>
                            </div>
                             <div>
                                <span className="block text-gray-500 text-sm">Rate</span>
                                <span className="font-bold text-agri-700">₹{deal.finalPrice}/qtl</span>
                            </div>
                        </div>
                    </div>

                    {/* Totals */}
                    <div className="flex justify-between items-center bg-agri-50 p-4 rounded-xl border border-agri-100">
                        <span className="text-agri-800 font-medium">Total Deal Value</span>
                        <span className="text-2xl font-bold text-agri-700">₹{deal.totalAmount.toLocaleString()}</span>
                    </div>

                    {/* Terms */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                         <div className="flex items-start gap-2">
                             <ShieldCheck className="w-5 h-5 text-gray-400 mt-0.5" />
                             <p className="text-gray-600">Payment secured via KisanSetu Escrow until delivery.</p>
                         </div>
                          <div className="flex items-start gap-2">
                             <Truck className="w-5 h-5 text-gray-400 mt-0.5" />
                             <p className="text-gray-600">Buyer arranges transport within 48 hours.</p>
                         </div>
                    </div>
                </div>
            </Card>

            <div className="flex flex-col gap-4">
                {canMarkDelivered && (
                    <Button 
                        size="lg" 
                        variant="primary" 
                        onClick={() => updateStatusMutation.mutate('DELIVERED')}
                        isLoading={updateStatusMutation.isPending}
                        className="w-full bg-green-600 hover:bg-green-700"
                    >
                        <Truck className="w-5 h-5 mr-2" /> Mark as Delivered / Received
                    </Button>
                )}
                
                <div className="flex gap-4">
                    <Button variant="outline" className="flex-1" onClick={() => window.print()}>
                        <Download className="w-4 h-4 mr-2" /> Download PDF
                    </Button>
                    <Button className="flex-1" onClick={() => navigate('/dashboard')}>
                        Return to Dashboard
                    </Button>
                </div>
            </div>
        </div>
    );
};