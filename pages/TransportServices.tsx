import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dealService, authService, utilService } from '../services/api';
import { Card, Button, Input, Badge } from '../components/UI';
import { Truck, MapPin, Navigation, IndianRupee, CheckCircle2, Box, CreditCard, X, Clock, ShieldCheck, AlertTriangle } from 'lucide-react';

const STEPS = {
    LOCATION: 1,
    PAYMENT: 2,
    TRACKING: 3
};

export const TransportServices: React.FC = () => {
    const { dealId } = useParams<{dealId: string}>();
    const navigate = useNavigate();
    const user = authService.getCurrentUser();
    const queryClient = useQueryClient();

    const { data: deal } = useQuery({
        queryKey: ['deal', dealId],
        queryFn: () => dealService.getDealById(dealId!),
        enabled: !!dealId
    });

    // Mock States for flow
    const [step, setStep] = useState(STEPS.LOCATION);
    const [pickupAddress, setPickupAddress] = useState('');
    const [dropAddress, setDropAddress] = useState('');
    const [distance, setDistance] = useState<number | null>(null);
    const [isCalculating, setIsCalculating] = useState(false);
    
    // Payment State
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentType, setPaymentType] = useState<'ADVANCE' | 'FULL'>('ADVANCE');

    // Derived Values
    const cropValue = deal?.totalAmount || 0;
    const transportRatePerKm = 40;
    const transportCost = distance ? distance * transportRatePerKm : 0;
    const advanceAmount = transportCost + (cropValue * 0.05); // Transport + 5%
    const remainingAmount = cropValue - (cropValue * 0.05);

    // Initial Effect to set step based on deal status
    React.useEffect(() => {
        if(deal) {
            if(deal.paymentStatus === 'PAID') setStep(STEPS.TRACKING);
            else if(deal.status === 'TRANSIT') setStep(STEPS.TRACKING);
        }
    }, [deal]);

    const calculateLogistics = () => {
        setIsCalculating(true);
        // Mock distance calculation
        setTimeout(() => {
            setDistance(250); // Mock 250km
            setIsCalculating(false);
            setStep(STEPS.PAYMENT);
        }, 1500);
    };

    const handlePayment = () => {
        const amountToPay = paymentType === 'ADVANCE' ? advanceAmount : (cropValue + transportCost);
        
        // Simulate Razorpay
        const btn = document.getElementById('payBtn');
        if(btn) btn.innerHTML = "Processing...";
        
        setTimeout(() => {
            dealService.initiatePayment(dealId!, amountToPay).then(() => {
                queryClient.invalidateQueries({ queryKey: ['deal', dealId] });
                setShowPaymentModal(false);
                setStep(STEPS.TRACKING);
                alert("Advance Paid! Logistics Started.");
            });
        }, 2000);
    };

    const handleFinalDelivery = async () => {
        // Simulate final payment check
        const confirm = window.confirm(`Confirm delivery? You must pay the remaining ₹${remainingAmount} now.`);
        if(confirm) {
            await dealService.markDelivered(dealId!);
            alert("Deal Completed! Crop Handed Over.");
            navigate('/dashboard');
        }
    };

    if (!deal) return <div className="text-center py-20">Loading...</div>;

    return (
        <div className="max-w-3xl mx-auto pb-20">
            {/* Header */}
            <div className="bg-agri-900 text-white p-6 rounded-b-3xl mb-8 -mx-4 sm:rounded-xl sm:mx-0 shadow-xl">
                <div className="flex items-center gap-3 mb-2">
                    <Truck className="w-8 h-8 text-yellow-400" />
                    <h1 className="text-2xl font-bold">KisanSetu Logistics</h1>
                </div>
                <p className="text-agri-200">Secure Transport • Live Tracking • Escrow Payment</p>
                
                {/* Stepper */}
                <div className="flex items-center mt-6 text-sm">
                    <div className={`flex items-center gap-2 ${step >= 1 ? 'text-white font-bold' : 'text-agri-400'}`}>
                        <div className="w-6 h-6 rounded-full border flex items-center justify-center">1</div> Location
                    </div>
                    <div className="w-12 h-px bg-agri-600 mx-2"></div>
                    <div className={`flex items-center gap-2 ${step >= 2 ? 'text-white font-bold' : 'text-agri-400'}`}>
                        <div className="w-6 h-6 rounded-full border flex items-center justify-center">2</div> Payment
                    </div>
                    <div className="w-12 h-px bg-agri-600 mx-2"></div>
                    <div className={`flex items-center gap-2 ${step >= 3 ? 'text-white font-bold' : 'text-agri-400'}`}>
                        <div className="w-6 h-6 rounded-full border flex items-center justify-center">3</div> Track
                    </div>
                </div>
            </div>

            {/* STEP 1: LOCATIONS */}
            {step === STEPS.LOCATION && (
                <Card className="p-6 animate-fadeIn">
                    <h2 className="text-xl font-bold mb-4 flex items-center"><MapPin className="mr-2"/> Confirm Logistics Details</h2>
                    <p className="text-sm text-gray-500 mb-6">Both parties must verify pickup and drop locations to calculate accurate transport charges.</p>
                    
                    <div className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300">
                            <label className="text-xs font-bold text-gray-500 uppercase">Pickup Location (Seller)</label>
                            <div className="flex gap-2 mt-1">
                                <Navigation className="w-5 h-5 text-agri-600 mt-2" />
                                <Input 
                                    value={pickupAddress || deal.location || "Karnal, Haryana (Detected)"} 
                                    onChange={e => setPickupAddress(e.target.value)}
                                    placeholder="Seller's Farm Address"
                                />
                            </div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300">
                            <label className="text-xs font-bold text-gray-500 uppercase">Drop Location (Buyer)</label>
                            <div className="flex gap-2 mt-1">
                                <MapPin className="w-5 h-5 text-red-600 mt-2" />
                                <Input 
                                    value={dropAddress} 
                                    onChange={e => setDropAddress(e.target.value)}
                                    placeholder="Enter Warehouse / Mandi Address"
                                />
                            </div>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800 flex items-start gap-2">
                             <ShieldCheck className="w-5 h-5 flex-shrink-0" />
                             <p>Distance will be calculated via Google Maps API. Transport charges are fixed at ₹40/km for 10-ton trucks.</p>
                        </div>

                        <Button className="w-full h-12 text-lg" onClick={calculateLogistics} isLoading={isCalculating} disabled={!dropAddress}>
                            Calculate Transport Cost
                        </Button>
                    </div>
                </Card>
            )}

            {/* STEP 2: COST & PAYMENT */}
            {step === STEPS.PAYMENT && (
                <div className="space-y-6 animate-fadeIn">
                    <Card className="p-6 bg-white">
                        <h2 className="text-xl font-bold mb-4">Cost Breakdown</h2>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Total Distance</span>
                                <span className="font-bold">{distance} km</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Transport Charge (₹40/km)</span>
                                <span className="font-bold">₹{transportCost.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Crop Value</span>
                                <span className="font-bold">₹{cropValue.toLocaleString()}</span>
                            </div>
                            <div className="h-px bg-gray-200 my-2"></div>
                            <div className="flex justify-between text-lg font-bold">
                                <span>Grand Total</span>
                                <span>₹{(cropValue + transportCost).toLocaleString()}</span>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6 border-l-4 border-l-agri-600">
                        <h2 className="text-xl font-bold mb-2">Pay Advance to Start</h2>
                        <p className="text-sm text-gray-600 mb-4">
                            To dispatch the truck, you must pay the Transport Fee + 5% Security Deposit. The remaining crop value is paid upon delivery.
                        </p>

                        <div className="bg-gray-100 p-4 rounded-lg mb-6">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-gray-600">Transport Fee</span>
                                <span className="font-mono">₹{transportCost.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-gray-600">5% Security Deposit</span>
                                <span className="font-mono">₹{(cropValue * 0.05).toLocaleString()}</span>
                            </div>
                            <div className="border-t border-gray-300 pt-2 flex justify-between items-center font-bold text-agri-700 text-xl">
                                <span>Payable Now</span>
                                <span>₹{advanceAmount.toLocaleString()}</span>
                            </div>
                        </div>

                        <Button className="w-full h-12 text-lg shadow-lg" onClick={() => setShowPaymentModal(true)}>
                            Pay ₹{advanceAmount.toLocaleString()} & Dispatch Truck
                        </Button>
                        <p className="text-center text-xs text-gray-400 mt-2">Secured by Razorpay • Refundable if seller cancels</p>
                    </Card>
                </div>
            )}

            {/* STEP 3: TRACKING & DELIVERY */}
            {step === STEPS.TRACKING && (
                <div className="space-y-6 animate-fadeIn">
                    <Card className="p-6 bg-gradient-to-r from-blue-50 to-white border-blue-100">
                        <div className="flex justify-between items-start">
                             <div>
                                 <h2 className="text-xl font-bold text-gray-900 mb-1">In Transit</h2>
                                 <p className="text-gray-500 text-sm">Estimated Delivery: Tomorrow, 4 PM</p>
                             </div>
                             <Badge variant="success" className="text-lg px-3 py-1">TRUCK ASSIGNED</Badge>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <h3 className="font-bold text-gray-800 mb-6">Shipment Timeline</h3>
                        <div className="relative pl-8 space-y-8 border-l-2 border-gray-200 ml-3">
                            {/* Timeline Items */}
                            <div className="relative">
                                <div className="absolute -left-[41px] bg-green-500 rounded-full p-1.5 text-white">
                                    <CheckCircle2 className="w-4 h-4" />
                                </div>
                                <h4 className="font-bold text-gray-900">Order Confirmed & Advance Paid</h4>
                                <p className="text-xs text-gray-500">{new Date().toLocaleDateString()} 10:30 AM</p>
                            </div>
                            
                            <div className="relative">
                                <div className="absolute -left-[41px] bg-green-500 rounded-full p-1.5 text-white">
                                    <Truck className="w-4 h-4" />
                                </div>
                                <h4 className="font-bold text-gray-900">Vehicle Dispatched</h4>
                                <p className="text-xs text-gray-500">Vehicle HR-05-AB-1234 assigned.</p>
                            </div>

                            <div className="relative">
                                <div className="absolute -left-[41px] bg-blue-500 rounded-full p-1.5 text-white animate-pulse">
                                    <Clock className="w-4 h-4" />
                                </div>
                                <h4 className="font-bold text-blue-700">In Transit</h4>
                                <p className="text-xs text-gray-500">Crossing Panipat Toll Plaza...</p>
                            </div>

                            <div className="relative opacity-50">
                                <div className="absolute -left-[41px] bg-gray-300 rounded-full p-1.5 text-white">
                                    <Box className="w-4 h-4" />
                                </div>
                                <h4 className="font-bold text-gray-900">Out for Delivery</h4>
                            </div>
                        </div>
                    </Card>

                    {/* Final Payment Card */}
                    <Card className="p-6 border-t-4 border-t-red-500">
                        <div className="flex items-start gap-4">
                            <AlertTriangle className="w-8 h-8 text-red-500 flex-shrink-0" />
                            <div>
                                <h3 className="font-bold text-gray-900 text-lg">Pending on Delivery</h3>
                                <p className="text-sm text-gray-600 mt-1">
                                    Upon delivery, you must pay the remaining balance. If rejected, the advance (Transport + 5%) is non-refundable to cover logistics costs.
                                </p>
                                <div className="mt-4 bg-red-50 p-3 rounded font-bold text-red-700 text-xl text-center">
                                    Remaining: ₹{remainingAmount.toLocaleString()}
                                </div>
                                <Button className="w-full mt-4 bg-green-600 hover:bg-green-700" onClick={handleFinalDelivery}>
                                    Confirm Receipt & Pay Remaining
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Payment Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center p-4 backdrop-blur-sm">
                    <Card className="w-full max-w-md bg-white p-0 overflow-hidden animate-slideUp">
                         <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <span className="font-bold">Razorpay Secure</span>
                            </div>
                            <button onClick={() => setShowPaymentModal(false)} className="text-white hover:opacity-80"><X className="w-5 h-5"/></button>
                        </div>
                        <div className="p-6">
                            <p className="text-gray-500 text-sm mb-1">Paying Advance Amount</p>
                            <p className="text-3xl font-bold text-gray-900 mb-6">₹{advanceAmount.toLocaleString()}</p>
                            
                            <Button className="w-full h-12 text-lg bg-blue-600" id="payBtn" onClick={handlePayment}>
                                Pay Securely
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};