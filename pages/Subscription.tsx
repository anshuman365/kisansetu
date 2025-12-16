import React, { useState } from 'react';
import { subscriptionService, authService } from '../services/api';
import { Card, Button, Input } from '../components/UI';
import { Check, Crown, X, CreditCard, ShieldCheck, Loader2 } from 'lucide-react';
import { useToast } from '../components/Toast';
import { useNavigate } from 'react-router-dom';

export const Subscription: React.FC = () => {
    const { showToast } = useToast();
    const navigate = useNavigate();
    const user = authService.getCurrentUser();
    
    const [selectedPlan, setSelectedPlan] = useState<any>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    
    // Mock Form State
    const [cardName, setCardName] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');

    const plans = [
        { id: 'FREE', name: 'Free Trial', price: 0, duration: '15 Days', features: ['Post 1 Crop', 'View 5 Bids', 'Basic Support'] },
        { id: 'PREMIUM', name: 'Kisan Plus', price: 499, duration: '1 Year', features: ['Unlimited Posts', 'Unlimited Bids', 'Direct Contacts', 'Priority Support'], recommended: true },
        { id: 'ENTERPRISE', name: 'Trader Pro', price: 2999, duration: '1 Year', features: ['Bulk Bidding', 'API Access', 'Dedicated Manager', 'Export Data'] }
    ];

    const handleSelectPlan = (plan: any) => {
        if (plan.id === 'FREE') {
            // Free plan activates immediately
            processPurchase(plan);
        } else {
            // Paid plans open modal
            setSelectedPlan(plan);
        }
    };

    const processPurchase = async (plan: any) => {
        setIsProcessing(true);
        try {
            // Simulate API latency / Gateway processing
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            await subscriptionService.purchasePlan(plan.id);
            
            // Refresh user profile locally to reflect changes immediately
            await authService.getMe();
            
            showToast(`${plan.name} Activated Successfully!`, "success");
            setSelectedPlan(null);
            
            // Redirect to dashboard after success
            setTimeout(() => navigate('/dashboard'), 1000);
            
        } catch(e) {
            showToast("Transaction Failed. Please try again.", "error");
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePaymentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!cardName || !cardNumber || !expiry || !cvv) {
            showToast("Please fill in all card details.", "error");
            return;
        }
        processPurchase(selectedPlan);
    };

    const currentPlanId = user?.subscription?.plan || 'FREE';

    return (
        <div className="py-10 relative">
            <div className="text-center mb-10">
                <h1 className="text-3xl font-bold text-gray-900">Choose your Plan</h1>
                <p className="text-gray-500 mt-2">Unlock the full potential of your business.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {plans.map(plan => {
                    const isCurrent = currentPlanId === plan.id;
                    return (
                        <Card key={plan.id} className={`p-6 relative flex flex-col transition-all duration-200 ${plan.recommended ? 'border-2 border-agri-500 shadow-xl scale-105 z-10' : 'border border-gray-200 hover:shadow-lg'}`}>
                            {plan.recommended && <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-agri-500 text-white px-3 py-1 rounded-b-lg text-sm font-bold">Recommended</div>}
                            
                            <h3 className="text-xl font-bold mb-2 mt-4">{plan.name}</h3>
                            <div className="text-4xl font-bold mb-4">
                                {plan.price === 0 ? 'Free' : `₹${plan.price}`}
                                {plan.price > 0 && <span className="text-lg text-gray-500 font-normal">/{plan.duration}</span>}
                            </div>
                            
                            <div className="flex-1 space-y-3 mb-8">
                                {plan.features.map((f, i) => (
                                    <div key={i} className="flex items-center text-sm text-gray-600">
                                        <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" /> {f}
                                    </div>
                                ))}
                            </div>
                            
                            <Button 
                                variant={isCurrent ? 'outline' : (plan.recommended ? 'primary' : 'secondary')} 
                                onClick={() => handleSelectPlan(plan)}
                                className="w-full"
                                disabled={isCurrent}
                            >
                                {isCurrent ? 'Current Plan' : `Choose ${plan.name}`}
                            </Button>
                        </Card>
                    );
                })}
            </div>

            {/* Payment Modal */}
            {selectedPlan && (
                <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
                    <Card className="w-full max-w-md bg-white overflow-hidden shadow-2xl animate-slideUp">
                        {/* Modal Header */}
                        <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
                            <h3 className="font-bold text-gray-800 flex items-center">
                                <ShieldCheck className="w-5 h-5 mr-2 text-agri-600"/> Secure Payment
                            </h3>
                            <button onClick={() => !isProcessing && setSelectedPlan(null)} disabled={isProcessing} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5"/>
                            </button>
                        </div>

                        {/* Order Summary */}
                        <div className="p-4 bg-blue-50 border-b border-blue-100 flex justify-between items-center">
                            <div>
                                <p className="text-xs text-blue-600 font-bold uppercase">Purchasing</p>
                                <p className="font-bold text-blue-900">{selectedPlan.name}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xl font-bold text-blue-900">₹{selectedPlan.price}</p>
                                <p className="text-xs text-blue-600">Includes Taxes</p>
                            </div>
                        </div>

                        {/* Payment Form */}
                        <form onSubmit={handlePaymentSubmit} className="p-6 space-y-4">
                            <Input 
                                label="Card Holder Name" 
                                placeholder="Name on card"
                                value={cardName}
                                onChange={e => setCardName(e.target.value)}
                                disabled={isProcessing}
                            />
                            
                            <div className="relative">
                                <Input 
                                    label="Card Number" 
                                    placeholder="0000 0000 0000 0000"
                                    maxLength={16}
                                    value={cardNumber}
                                    onChange={e => setCardNumber(e.target.value)}
                                    disabled={isProcessing}
                                />
                                <CreditCard className="absolute right-3 top-9 text-gray-400 w-5 h-5" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Input 
                                    label="Expiry Date" 
                                    placeholder="MM/YY"
                                    maxLength={5}
                                    value={expiry}
                                    onChange={e => setExpiry(e.target.value)}
                                    disabled={isProcessing}
                                />
                                <Input 
                                    label="CVV" 
                                    placeholder="123"
                                    maxLength={3}
                                    type="password"
                                    value={cvv}
                                    onChange={e => setCvv(e.target.value)}
                                    disabled={isProcessing}
                                />
                            </div>

                            <div className="pt-4">
                                <Button className="w-full h-12 text-lg" isLoading={isProcessing}>
                                    {isProcessing ? 'Processing Payment...' : `Pay ₹${selectedPlan.price}`}
                                </Button>
                                <p className="text-center text-xs text-gray-400 mt-3 flex items-center justify-center">
                                    <ShieldCheck className="w-3 h-3 mr-1"/> 128-bit SSL Encrypted Transaction
                                </p>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
};