import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dealService, authService } from '../services/api';
import { Card, Button, Badge, Input, RatingStars } from '../components/UI';
import { Truck, Phone, ShieldCheck, MapPin, CreditCard, X, Box, Star, ArrowRight } from 'lucide-react';
import { OrderStatus } from '../types';

export const DealDetails: React.FC = () => {
    const { id } = useParams<{id: string}>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const currentUser = authService.getCurrentUser();
    
    // UI State for Modals
    const [showReviewModal, setShowReviewModal] = useState(false);
    
    // Form States
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState('');
    
    const { data: deal, isLoading } = useQuery({
        queryKey: ['deal', id],
        queryFn: () => dealService.getDealById(id!),
        enabled: !!id
    });

    const finalizeMutation = useMutation({
        mutationFn: (mode: 'KISAN_SETU' | 'DIRECT_DEAL') => dealService.finalizeDealMode(id!, mode),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['deal', id] });
            if (variables === 'KISAN_SETU') {
                // Navigate to the new dedicated Transport Page
                navigate(`/transport/${id}`);
            }
        }
    });

    const reviewMutation = useMutation({
        mutationFn: () => dealService.submitReview(id!, reviewRating, reviewComment),
        onSuccess: () => {
            setShowReviewModal(false);
            alert("Review Submitted!");
        }
    });

    if (isLoading || !deal) return <div className="text-center py-20 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-agri-600"></div></div>;

    const isDirectDeal = deal.status === OrderStatus.DIRECT_DEAL;
    const isTransporter = deal.transportMode === 'KISAN_SETU';
    const isPaid = deal.paymentStatus === 'PAID';
    
    // Logic for Phone Visibility
    const showPhone = isDirectDeal || (isTransporter && isPaid);

    return (
        <div className="max-w-4xl mx-auto pb-20">
            {/* Header */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 mb-2 bg-white px-4 py-1 rounded-full shadow-sm border">
                    <span className={`w-2 h-2 rounded-full ${deal.status === 'CANCELLED' ? 'bg-red-500' : 'bg-green-500'} animate-pulse`}></span>
                    <span className="font-bold text-gray-700">{deal.status.replace('_', ' ')}</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Deal Invoice #{deal.id}</h1>
                <p className="text-gray-500">Created on {new Date(deal.createdAt).toLocaleDateString()}</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                
                {/* Left Column: Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Action Required: Choose Fulfillment */}
                    {deal.status === OrderStatus.LOCKED && (
                        <Card className="p-6 border-l-4 border-l-orange-500 animate-fadeIn bg-gradient-to-r from-orange-50 to-white">
                            <h2 className="text-xl font-bold mb-4">Action Required: Choose Fulfillment</h2>
                            
                            <div className="grid md:grid-cols-2 gap-4">
                                <div onClick={() => finalizeMutation.mutate('KISAN_SETU')} className="border-2 border-gray-200 hover:border-agri-500 p-4 rounded-xl cursor-pointer transition-all bg-white hover:shadow-lg transform hover:-translate-y-1">
                                    <div className="bg-agri-100 w-12 h-12 rounded-full flex items-center justify-center mb-3">
                                        <Truck className="w-6 h-6 text-agri-600" />
                                    </div>
                                    <h3 className="font-bold text-lg">KisanSetu Transport</h3>
                                    <p className="text-sm text-gray-500 mt-1">Full Service: Logistics + Escrow Payment.</p>
                                    <ul className="text-xs text-gray-500 mt-2 space-y-1 list-disc pl-4">
                                        <li>Real-time Tracking</li>
                                        <li>Secure Payment</li>
                                        <li>Verified Drivers</li>
                                    </ul>
                                </div>
                                
                                <div onClick={() => finalizeMutation.mutate('DIRECT_DEAL')} className="border-2 border-gray-200 hover:border-blue-500 p-4 rounded-xl cursor-pointer transition-all bg-white hover:shadow-lg transform hover:-translate-y-1">
                                    <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mb-3">
                                        <Phone className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <h3 className="font-bold text-lg">Direct Deal</h3>
                                    <p className="text-sm text-gray-500 mt-1">Exchange numbers and handle logistics yourself.</p>
                                    <p className="text-xs text-red-500 mt-2 font-medium">No Payment Protection</p>
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

                    {/* Contact Info */}
                    <Card className={`p-6 transition-all ${showPhone ? 'bg-green-50 border border-green-200' : 'bg-gray-100 opacity-75'}`}>
                         <h3 className="font-bold text-gray-800 flex items-center mb-4">
                            {showPhone ? <Phone className="w-4 h-4 mr-2 text-green-700"/> : <ShieldCheck className="w-4 h-4 mr-2 text-gray-500"/>}
                            {showPhone ? "Contact Details (Unlocked)" : "Contact Details (Locked)"}
                        </h3>
                        
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-white p-4 rounded-lg shadow-sm">
                                <p className="text-xs text-gray-500 mb-1">Seller</p>
                                <p className="font-bold">{deal.sellerName}</p>
                                <p className="text-lg font-mono mt-1 text-gray-700">
                                    {showPhone ? (deal.sellerPhone || "9876543210") : "+91 98XXX XXXXX"}
                                </p>
                            </div>
                            <div className="bg-white p-4 rounded-lg shadow-sm">
                                <p className="text-xs text-gray-500 mb-1">Buyer</p>
                                <p className="font-bold">{deal.buyerName}</p>
                                <p className="text-lg font-mono mt-1 text-gray-700">
                                    {showPhone ? (deal.buyerPhone || "9876543210") : "+91 98XXX XXXXX"}
                                </p>
                            </div>
                        </div>
                        {!showPhone && (
                            <p className="text-xs text-gray-500 mt-4 text-center">
                                * Numbers hidden until {isTransporter ? "payment is completed" : "deal mode is selected"} to prevent spam and ensure security.
                            </p>
                        )}
                    </Card>
                </div>

                {/* Right Column: Actions */}
                <div className="space-y-6">
                    {/* Transport Status Card */}
                    {isTransporter && (
                        <Card className="p-6 border-agri-200 shadow-md">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-gray-900 flex items-center"><Truck className="w-4 h-4 mr-2"/> KisanSetu Transport</h3>
                                <Badge variant={isPaid ? 'success' : 'warning'}>{deal.trackingStatus || 'Pending'}</Badge>
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-4">
                                {isPaid 
                                    ? "Vehicle is assigned and in transit." 
                                    : "Payment pending for vehicle dispatch."}
                            </p>
                            
                            <Button className="w-full" onClick={() => navigate(`/transport/${id}`)}>
                                {isPaid ? "Track Vehicle" : "Manage Logistics & Pay"} <ArrowRight className="w-4 h-4 ml-2"/>
                            </Button>
                        </Card>
                    )}

                    {/* Review Section */}
                    {deal.status === OrderStatus.DELIVERED && (
                        <Card className="p-6">
                            <h3 className="font-bold mb-3">Rate Experience</h3>
                            <Button variant="outline" className="w-full" onClick={() => setShowReviewModal(true)}>
                                Write a Review
                            </Button>
                        </Card>
                    )}

                    <Button variant="outline" className="w-full" onClick={() => window.print()}>Download Invoice</Button>
                </div>
            </div>

            {/* --- REVIEW MODAL --- */}
            {showReviewModal && (
                <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center p-4 backdrop-blur-sm">
                    <Card className="w-full max-w-md p-6 bg-white animate-fadeIn">
                        <h2 className="text-xl font-bold mb-4">Rate this Deal</h2>
                        <div className="flex justify-center mb-6">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star 
                                    key={star} 
                                    className={`w-8 h-8 cursor-pointer ${star <= reviewRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                    onClick={() => setReviewRating(star)}
                                />
                            ))}
                        </div>
                        <Input 
                            label="Your Feedback" 
                            placeholder="How was your experience?" 
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                        />
                        <div className="flex gap-4 mt-4">
                            <Button variant="outline" className="flex-1" onClick={() => setShowReviewModal(false)}>Cancel</Button>
                            <Button className="flex-1" onClick={() => reviewMutation.mutate()}>Submit</Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};