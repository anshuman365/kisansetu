
import React from 'react';
import { subscriptionService } from '../services/api';
import { Card, Button, Badge } from '../components/UI';
import { Check, Crown, Zap } from 'lucide-react';

export const Subscription: React.FC = () => {
    const plans = [
        { id: 'FREE', name: 'Free Trial', price: 0, duration: '15 Days', features: ['Post 1 Crop', 'View 5 Bids', 'Basic Support'] },
        { id: 'PREMIUM', name: 'Kisan Plus', price: 499, duration: '1 Year', features: ['Unlimited Posts', 'Unlimited Bids', 'Direct Contacts', 'Priority Support'], recommended: true },
        { id: 'ENTERPRISE', name: 'Trader Pro', price: 2999, duration: '1 Year', features: ['Bulk Bidding', 'API Access', 'Dedicated Manager', 'Export Data'] }
    ];

    const handlePurchase = async (planId: string) => {
        try {
            await subscriptionService.purchasePlan(planId);
            alert("Plan Activated!");
            window.location.reload();
        } catch(e) {
            alert("Payment Gateway Integration Pending");
        }
    };

    return (
        <div className="py-10">
            <div className="text-center mb-10">
                <h1 className="text-3xl font-bold text-gray-900">Choose your Plan</h1>
                <p className="text-gray-500 mt-2">Unlock the full potential of your business.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {plans.map(plan => (
                    <Card key={plan.id} className={`p-6 relative flex flex-col ${plan.recommended ? 'border-2 border-agri-500 shadow-xl scale-105' : ''}`}>
                        {plan.recommended && <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-agri-500 text-white px-3 py-1 rounded-b-lg text-sm font-bold">Recommended</div>}
                        <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                        <div className="text-4xl font-bold mb-4">₹{plan.price}<span className="text-lg text-gray-500 font-normal">/{plan.duration}</span></div>
                        
                        <div className="flex-1 space-y-3 mb-8">
                            {plan.features.map((f, i) => (
                                <div key={i} className="flex items-center text-sm text-gray-600">
                                    <Check className="w-4 h-4 text-green-500 mr-2" /> {f}
                                </div>
                            ))}
                        </div>
                        
                        <Button 
                            variant={plan.recommended ? 'primary' : 'outline'} 
                            onClick={() => handlePurchase(plan.id)}
                            className="w-full"
                        >
                            Choose {plan.name}
                        </Button>
                    </Card>
                ))}
            </div>
        </div>
    );
};
