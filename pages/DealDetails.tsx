import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dealService, authService } from '../services/api';
import { Card, Button, Badge, Input } from '../components/UI';
import { CheckCircle, Truck, Phone, User, ShieldCheck, MapPin, CreditCard, Clock, Check, X, Box } from 'lucide-react';
import { Deal, OrderStatus } from '../types';

export const DealDetails: React.FC = () => {
    const { id } = useParams<{id: string}>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const currentUser = authService.getCurrentUser();
    
    // UI State for Modals
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showTrackingModal, setShowTrackingModal] = useState(false);
    
    const { data: deal, isLoading } = useQuery({
        queryKey: ['deal', id],
        queryFn: () => dealService.getDealById(id!),
        enabled: !!id
    });

    const finalizeMutation = useMutation({
        mutationFn: (mode: 'KISAN_SETU' | 'DIRECT_DEAL') => dealService.finalizeDealMode(id!, mode),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['deal', id] });
            alert("Deal updated! Logistics have been assigned.");
        }
    });

    // Mock Payment Handler
    const handlePayment = () => {
        // In real app, call payment gateway API
        setTimeout(() => {
            alert("Payment of ₹" + deal.totalAmount + " initiated securely via Escrow.");
            setShowPaymentModal(false);
        }, 1500);
    };

    if (isLoading || !deal) return <div className="text-center py-20 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-agri-600"></div></div>;

    const isDirectDeal = deal.status === OrderStatus.DIRECT_DEAL;
    const isTransporter = deal.transportMode === 'KISAN_SETU';
    const isBuyer = currentUser?.id === deal.buyerId;

    return (
        <div className="max-w-4xl mx-auto pb-20">
            {/* Header */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 mb-2 bg-white px-4 py-1 rounded-full shadow-sm border">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="font-bold text-gray-700">{deal.status}</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Deal Invoice #{deal.id}</h1>
                <p className="text-gray-500">Created on {new Date(deal.createdAt).toLocaleDateString()}</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                
                {/* Left Column: Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Step 1: Choose Mode (Only if LOCKED) */}
                    {deal.status === OrderStatus.LOCKED && (
                        <Card className="p-6 border-l-4 border-l-orange-500 animate-fadeIn">
                            <h2 className="text-xl font-bold mb-4">Action Required: Choose Fulfillment</h2>
                            <p className="text-gray-600 mb-6">How would you like to proceed with this deal?</p>
                            
                            <div className="grid md:grid-cols-2 gap-4">
                                <div onClick={() => finalizeMutation.mutate('KISAN_SETU')} className="border-2 border-gray-200 hover:border-agri-500 p-4 rounded-xl cursor-pointer transition-all bg-white hover:shadow-md">
                                    <Truck className="w-8 h-8 text-agri-600 mb-2" />
                                    <h3 className="font-bold">KisanSetu Transport</h3>
                                    <p className="text-sm text-gray-500 mt-1">We handle logistics. Fixed rate: ₹40/km.</p>
                                    <span className="inline-block mt-3 text-xs bg-agri-100 text-agri-800 px-2 py-1 rounded font-bold">Recommended</span>
                                </div>
                                
                                <div onClick={() => finalizeMutation.mutate('DIRECT_DEAL')} className="border-2 border-gray-200 hover:border-blue-500 p-4 rounded-xl cursor-pointer transition-all bg-white hover:shadow-md">
                                    <Phone className="w-8 h-8 text-blue-600 mb-2" />
                                    <h3 className="font-bold">Direct Deal</h3>
                                    <p className="text-sm text-gray-500 mt-1">Exchange numbers and arrange your own transport.</p>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Commodity Info */}
                    <Card className="p-0 overflow-hidden">
                        <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="font-bold text-gray-800 flex items-center"><Box className="w-4 h-4 mr-2"/> Commodity Details</h3>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                                <div>
                                    <span className="text-gray-500 text-xs uppercase tracking-wide">Crop / Variety</span>
                                    <p className="font-bold text-lg text-gray-900">{deal.variety}</p>
                                    <Badge variant="neutral">{deal.crop}</Badge>
                                </div>
                                <div>
                                    <span className="text-gray-500 text-xs uppercase tracking-wide">Quantity</span>
                                    <p className="font-bold text-lg text-gray-900">{deal.quantity} {deal.quantityUnit}</p>
                                </div>
                                <div>
                                    <span className="text-gray-500 text-xs uppercase tracking-wide">Agreed Price</span>
                                    <p className="font-bold text-lg text-agri-700">₹{deal.finalPrice}/unit</p>
                                </div>
                                <div>
                                    <span className="text-gray-500 text-xs uppercase tracking-wide">Total Value</span>
                                    <p className="font-bold text-2xl text-gray-900">₹{deal.totalAmount}</p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Contact Info - Unlocks if Direct Deal or Transport assigned */}
                    <Card className={`p-6 transition-all ${isDirectDeal || isTransporter ? 'bg-green-50 border border-green-200' : 'bg-gray-100 opacity-75'}`}>
                         <h3 className="font-bold text-gray-800 flex items-center mb-4">
                            {isDirectDeal || isTransporter ? <Phone className="w-4 h-4 mr-2 text-green-700"/> : <ShieldCheck className="w-4 h-4 mr-2 text-gray-500"/>}
                            {isDirectDeal || isTransporter ? "Contact Details (Unlocked)" : "Contact Details (Locked)"}
                        </h3>
                        
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-white p-4 rounded-lg shadow-sm">
                                <p className="text-xs text-gray-500 mb-1">Seller</p>
                                <p className="font-bold">{deal.sellerName}</p>
                                <p className="text-lg font-mono mt-1 text-gray-700">
                                    {(isDirectDeal || isTransporter) ? (deal.sellerPhone || "9876543210") : "+91 98XXX XXXXX"}
                                </p>
                            </div>
                            <div className="bg-white p-4 rounded-lg shadow-sm">
                                <p className="text-xs text-gray-500 mb-1">Buyer</p>
                                <p className="font-bold">{deal.buyerName}</p>
                                <p className="text-lg font-mono mt-1 text-gray-700">
                                    {(isDirectDeal || isTransporter) ? (deal.buyerPhone || "9876543210") : "+91 98XXX XXXXX"}
                                </p>
                            </div>
                        </div>
                        {!(isDirectDeal || isTransporter) && (
                            <p className="text-xs text-gray-500 mt-4 text-center">
                                * Contact details are hidden until deal mode is selected to prevent spam.
                            </p>
                        )}
                    </Card>
                </div>

                {/* Right Column: Actions */}
                <div className="space-y-6">
                    {/* Payment Card */}
                    <Card className="p-6">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center"><CreditCard className="w-4 h-4 mr-2"/> Payment Status</h3>
                        <div className="mb-6">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-600">Total Amount</span>
                                <span className="font-bold">₹{deal.totalAmount}</span>
                            </div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-600">Platform Fee (1%)</span>
                                <span className="font-bold">₹{Math.floor(deal.totalAmount * 0.01)}</span>
                            </div>
                            <div className="border-t pt-2 flex justify-between font-bold text-lg">
                                <span>To Pay</span>
                                <span className="text-agri-700">₹{deal.totalAmount + Math.floor(deal.totalAmount * 0.01)}</span>
                            </div>
                        </div>
                        
                        <div className="bg-yellow-50 text-yellow-800 text-xs p-3 rounded mb-4">
                            Payment is held in Escrow until delivery is confirmed.
                        </div>

                        {isBuyer ? (
                            <Button className="w-full" onClick={() => setShowPaymentModal(true)}>Pay Now Securely</Button>
                        ) : (
                            <Button variant="outline" className="w-full" disabled>Waiting for Payment</Button>
                        )}
                    </Card>

                    {/* Logistics Card */}
                    <Card className="p-6">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center"><Truck className="w-4 h-4 mr-2"/> Logistics</h3>
                        {isTransporter ? (
                            <div className="text-center">
                                <div className="bg-blue-50 text-blue-800 p-3 rounded-lg mb-4 text-sm font-medium">
                                    KisanSetu Transport Assigned
                                </div>
                                <Button variant="secondary" className="w-full" onClick={() => setShowTrackingModal(true)}>Track Shipment</Button>
                            </div>
                        ) : isDirectDeal ? (
                            <div className="text-center text-gray-500 text-sm">
                                Managed by Buyer/Seller directly.
                            </div>
                        ) : (
                            <div className="text-center text-gray-500 text-sm">
                                Pending Selection
                            </div>
                        )}
                    </Card>

                    <Button variant="outline" className="w-full" onClick={() => window.print()}>Download Invoice</Button>
                </div>
            </div>

            {/* --- MODALS --- */}

            {/* Payment Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <Card className="w-full max-w-md p-6 bg-white animate-fadeIn">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold">Secure Payment</h3>
                            <button onClick={() => setShowPaymentModal(false)}><X className="w-5 h-5 text-gray-400"/></button>
                        </div>
                        <div className="space-y-4">
                            <div className="p-4 bg-gray-50 rounded-lg border">
                                <p className="text-sm text-gray-500">Beneficiary</p>
                                <p className="font-bold">KisanSetu Escrow (A/c 88XX)</p>
                            </div>
                            <Input label="Card Number" placeholder="XXXX XXXX XXXX XXXX" />
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Expiry" placeholder="MM/YY" />
                                <Input label="CVV" placeholder="123" />
                            </div>
                            <Button className="w-full mt-4 bg-green-600 hover:bg-green-700" onClick={handlePayment}>
                                Pay ₹{deal.totalAmount}
                            </Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* Tracking Modal */}
            {showTrackingModal && (
                <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <Card className="w-full max-w-md p-6 bg-white animate-fadeIn">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold">Shipment Tracking</h3>
                            <button onClick={() => setShowTrackingModal(false)}><X className="w-5 h-5 text-gray-400"/></button>
                        </div>
                        <div className="relative border-l-2 border-gray-200 ml-4 space-y-8 my-6">
                            <div className="relative pl-6">
                                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-green-500 border-2 border-white"></div>
                                <p className="font-bold text-sm">Deal Confirmed</p>
                                <p className="text-xs text-gray-500">{new Date(deal.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div className="relative pl-6">
                                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-green-500 border-2 border-white"></div>
                                <p className="font-bold text-sm">Vehicle Assigned</p>
                                <p className="text-xs text-gray-500">Truck HR-05-AB-1234</p>
                            </div>
                            <div className="relative pl-6">
                                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-500 border-2 border-white animate-pulse"></div>
                                <p className="font-bold text-sm text-blue-600">In Transit</p>
                                <p className="text-xs text-gray-500">Expected Delivery: Tomorrow</p>
                            </div>
                             <div className="relative pl-6">
                                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-gray-300 border-2 border-white"></div>
                                <p className="font-bold text-sm text-gray-400">Delivered</p>
                            </div>
                        </div>
                        <Button className="w-full" onClick={() => setShowTrackingModal(false)}>Close</Button>
                    </Card>
                </div>
            )}
        </div>
    );
};