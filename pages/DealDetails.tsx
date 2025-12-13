
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dealService, authService } from '../services/api';
import { Card, Button, Badge } from '../components/UI';
import { CheckCircle, Truck, Phone, User, ShieldCheck, MapPin } from 'lucide-react';
import { Deal } from '../types';

export const DealDetails: React.FC = () => {
    const { id } = useParams<{id: string}>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const currentUser = authService.getCurrentUser();
    const [modeSelection, setModeSelection] = useState<'NONE' | 'TRANSPORT' | 'DIRECT'>('NONE');
    
    const { data: deal, isLoading } = useQuery({
        queryKey: ['deal', id],
        queryFn: () => dealService.getDealById(id!),
        enabled: !!id
    });

    const finalizeMutation = useMutation({
        mutationFn: (mode: 'KISAN_SETU' | 'DIRECT_DEAL') => dealService.finalizeDealMode(id!, mode),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['deal', id] });
            alert("Deal updated!");
        }
    });

    if (isLoading || !deal) return <div className="text-center py-20">Loading...</div>;

    const isDirectDeal = deal.status === 'DIRECT_DEAL';
    const isTransporter = deal.transportMode === 'KISAN_SETU';
    const isBuyer = currentUser?.id === deal.buyerId;

    return (
        <div className="max-w-3xl mx-auto pb-20">
            <div className="text-center mb-8">
                <Badge variant="success" className="mb-2 text-lg px-4 py-1">{deal.status}</Badge>
                <h1 className="text-3xl font-bold text-gray-900">Deal #{deal.id}</h1>
            </div>

            {/* Step 1: Choose Mode (If not chosen yet) */}
            {deal.status === 'LOCKED' && (
                <Card className="p-6 mb-6 border-l-4 border-l-orange-500">
                    <h2 className="text-xl font-bold mb-4">Action Required: Choose Fulfillment</h2>
                    <p className="text-gray-600 mb-6">How would you like to proceed with this deal?</p>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                        <div onClick={() => finalizeMutation.mutate('KISAN_SETU')} className="border-2 border-gray-200 hover:border-agri-500 p-4 rounded-xl cursor-pointer transition-all">
                            <Truck className="w-8 h-8 text-agri-600 mb-2" />
                            <h3 className="font-bold">KisanSetu Transport</h3>
                            <p className="text-sm text-gray-500">We handle logistics. Fixed rate: ₹40/km.</p>
                            <span className="inline-block mt-2 text-xs bg-agri-100 text-agri-800 px-2 py-1 rounded">Recommended</span>
                        </div>
                        
                        <div onClick={() => finalizeMutation.mutate('DIRECT_DEAL')} className="border-2 border-gray-200 hover:border-blue-500 p-4 rounded-xl cursor-pointer transition-all">
                            <Phone className="w-8 h-8 text-blue-600 mb-2" />
                            <h3 className="font-bold">Direct Deal</h3>
                            <p className="text-sm text-gray-500">Exchange numbers and arrange your own transport.</p>
                        </div>
                    </div>
                </Card>
            )}

            {/* Step 2: Deal Details & Contacts */}
            <Card className="overflow-hidden shadow-lg">
                <div className="p-6 space-y-6">
                    {/* Contact Info - Only if Direct Deal or Transport assigned */}
                    {(isDirectDeal || isTransporter) && (
                        <div className="bg-green-50 p-4 rounded-xl border border-green-200 animate-fadeIn">
                            <h3 className="font-bold text-green-800 flex items-center mb-3">
                                <Phone className="w-4 h-4 mr-2" /> Contact Details Revealed
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-gray-500">Seller ({deal.sellerName})</p>
                                    <p className="font-bold text-lg">{deal.sellerPhone || "+91 98XXX XXXXX"}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Buyer ({deal.buyerName})</p>
                                    <p className="font-bold text-lg">{deal.buyerPhone || "+91 98XXX XXXXX"}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Commodity Info */}
                    <div>
                        <h3 className="font-bold text-gray-900 mb-3">Order Summary</h3>
                        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                            <div>
                                <span className="text-gray-500 text-sm">Crop</span>
                                <p className="font-medium">{deal.variety} ({deal.crop})</p>
                            </div>
                            <div>
                                <span className="text-gray-500 text-sm">Quantity</span>
                                <p className="font-medium">{deal.quantity} {deal.quantityUnit}</p>
                            </div>
                            <div>
                                <span className="text-gray-500 text-sm">Final Price</span>
                                <p className="font-bold text-agri-700">₹{deal.finalPrice}/unit</p>
                            </div>
                            <div>
                                <span className="text-gray-500 text-sm">Total Value</span>
                                <p className="font-bold text-xl">₹{deal.totalAmount}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <Button variant="outline" className="flex-1" onClick={() => navigate('/dashboard')}>Back to Home</Button>
                        <Button className="flex-1" onClick={() => window.print()}>Download Invoice</Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};
