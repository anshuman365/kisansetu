import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService } from '../services/api';
import { Button, Card, Input, Select } from '../components/UI';
import { CropType } from '../types';
import { CheckCircle2, ChevronLeft, Sprout, Scale, IndianRupee, MapPin } from 'lucide-react';

const STEPS = [
    { title: 'Crop', label: 'Fasal', icon: Sprout },
    { title: 'Quantity', label: 'Matra', icon: Scale },
    { title: 'Price', label: 'Daam', icon: IndianRupee },
    { title: 'Location', label: 'Jagah', icon: MapPin }
];

export const PostOrder: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    crop: CropType.DHAN,
    variety: '',
    quantity: '',
    quantityUnit: 'quintal',
    moisture: '',
    minPrice: '',
    location: '',
    pincode: ''
  });

  const createOrderMutation = useMutation({
    mutationFn: orderService.createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myOrders'] });
      navigate('/dashboard');
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const nextStep = () => {
      // Basic Validation
      if (currentStep === 0 && !formData.variety) { alert('Please enter variety name / variety ka naam batayein'); return; }
      if (currentStep === 1 && !formData.quantity) { alert('Please enter quantity / matra batayein'); return; }
      if (currentStep === 2 && !formData.minPrice) { alert('Please enter price / daam batayein'); return; }

      if (currentStep < STEPS.length - 1) setCurrentStep(c => c + 1);
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(c => c - 1);
  };

  const handleSubmit = () => {
    if (!formData.location || !formData.pincode) { alert('Location details required / Jagah ki jaankari dein'); return; }
    
    createOrderMutation.mutate({
      ...formData,
      quantity: Number(formData.quantity),
      moisture: Number(formData.moisture),
      minPrice: Number(formData.minPrice),
    } as any);
  };

  const CurrentIcon = STEPS[currentStep].icon;

  return (
    <div className="max-w-lg mx-auto pb-20">
      <div className="mb-6">
        <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 hover:text-gray-900 mb-2 p-2 -ml-2">
             <ChevronLeft className="w-5 h-5 mr-1" /> Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Sell Your Crop</h1>
        <p className="text-gray-500">Apni fasal bechein</p>
      </div>

      {/* Stepper UI */}
      <div className="flex items-center justify-between mb-8 px-2 relative">
         <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-gray-200 -z-10 rounded"></div>
         <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-agri-500 -z-10 transition-all duration-300 rounded" style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}></div>
         
         {STEPS.map((step, idx) => {
             const isCompleted = idx < currentStep;
             const isCurrent = idx === currentStep;
             return (
                 <div key={idx} className="flex flex-col items-center">
                     <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all ${isCompleted ? 'bg-agri-600 border-agri-600 text-white' : isCurrent ? 'bg-white border-agri-600 text-agri-600' : 'bg-white border-gray-300 text-gray-400'}`}>
                         {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : idx + 1}
                     </div>
                     <span className={`text-[10px] font-medium mt-1 ${isCurrent ? 'text-agri-700' : 'text-gray-400'}`}>{step.title}</span>
                 </div>
             )
         })}
      </div>

      <Card className="p-6 shadow-lg border-0">
        <div className="flex items-center space-x-3 mb-6 border-b border-gray-100 pb-4">
            <div className="bg-agri-50 p-3 rounded-full">
                <CurrentIcon className="w-6 h-6 text-agri-600" />
            </div>
            <div>
                <h2 className="text-xl font-bold text-gray-800">{STEPS[currentStep].title}</h2>
                <p className="text-sm text-gray-500">{STEPS[currentStep].label}</p>
            </div>
        </div>

        {currentStep === 0 && (
          <div className="space-y-5 animate-fadeIn">
            <Select label="Select Crop / Fasal Chunein" name="crop" value={formData.crop} onChange={handleChange} className="h-12 text-lg">
              {Object.values(CropType).map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
            <Input 
              label="Variety Name / Kism (e.g. Basmati 1121)" 
              name="variety" 
              value={formData.variety} 
              onChange={handleChange} 
              placeholder="Ex: Pusa 1121" 
              className="h-12 text-lg"
            />
          </div>
        )}

        {currentStep === 1 && (
          <div className="space-y-5 animate-fadeIn">
            <div className="flex gap-4">
                <Input 
                  className="flex-1 h-12 text-lg"
                  type="number" 
                  label="Quantity / Matra" 
                  name="quantity" 
                  value={formData.quantity} 
                  onChange={handleChange} 
                  placeholder="0"
                />
                <Select 
                  label="Unit" 
                  name="quantityUnit" 
                  value={formData.quantityUnit} 
                  onChange={handleChange}
                  className="w-32 h-12"
                >
                    <option value="quintal">Quintal</option>
                    <option value="ton">Ton</option>
                </Select>
            </div>
            <Input 
              type="number" 
              label="Moisture % / Nami" 
              name="moisture" 
              value={formData.moisture} 
              onChange={handleChange} 
              placeholder="e.g. 12"
              className="h-12" 
            />
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-5 animate-fadeIn">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-blue-800 text-sm mb-2">
               💡 <strong>Market Insight:</strong> <br/>
               Current market rate for {formData.variety || 'this crop'} is approx <strong>₹3500/qtl</strong>.
            </div>
            <Input 
              type="number" 
              label="Min Asking Price (per quintal) / Bhav" 
              name="minPrice" 
              value={formData.minPrice} 
              onChange={handleChange}
              placeholder="₹ 0.00" 
              className="h-14 text-xl font-bold text-agri-700"
            />
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-5 animate-fadeIn">
             <Input 
              label="Village or Mandi / Gaon ya Mandi" 
              name="location" 
              value={formData.location} 
              onChange={handleChange} 
              className="h-12"
            />
            <Input 
              type="number"
              label="Pincode" 
              name="pincode" 
              value={formData.pincode} 
              onChange={handleChange} 
              className="h-12"
            />
          </div>
        )}

        <div className="flex gap-4 mt-8 pt-6 border-t border-gray-100">
          {currentStep > 0 && (
            <Button variant="outline" onClick={prevStep} className="flex-1 py-3 text-lg h-12">Back</Button>
          )}
          {currentStep < STEPS.length - 1 ? (
            <Button onClick={nextStep} className="flex-1 py-3 text-lg h-12">Next</Button>
          ) : (
            <Button onClick={handleSubmit} isLoading={createOrderMutation.isPending} className="flex-1 py-3 text-lg h-12 shadow-md bg-agri-600 hover:bg-agri-700">
               Confirm & Post
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};