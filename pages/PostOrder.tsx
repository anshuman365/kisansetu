
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { orderService, utilService, authService } from '../services/api';
import { Button, Card, Input, Select, Badge } from '../components/UI';
import { CropType } from '../types';
import { CheckCircle2, ChevronLeft, Sprout, Scale, IndianRupee, MapPin, Search, Loader2 } from 'lucide-react';

const STEPS = [
    { title: 'Crop', label: 'Fasal', icon: Sprout },
    { title: 'Details', label: 'Jankari', icon: Scale },
    { title: 'Price', label: 'Daam', icon: IndianRupee },
    { title: 'Location', label: 'Jagah', icon: MapPin },
    { title: 'Review', label: 'Tasdeek', icon: CheckCircle2 }
];

export const PostOrder: React.FC = () => {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const [currentStep, setCurrentStep] = useState(0);
  
  // Subscription Check
  if (user && !user.subscription.isActive && new Date(user.subscription.expiryDate) < new Date()) {
      return (
          <div className="text-center py-20">
              <h2 className="text-xl font-bold mb-4">Trial Expired</h2>
              <p className="mb-6">Please upgrade your plan to continue selling.</p>
              <Button onClick={() => navigate('/subscription')}>View Plans</Button>
          </div>
      );
  }

  const [formData, setFormData] = useState({
    crop: '',
    variety: '',
    otherVariety: '', // For manual input
    quantity: '',
    quantityUnit: 'quintal', // Default
    moisture: '',
    minPrice: '',
    location: '',
    pincode: '',
    coordinates: null as {lat: number, lng: number} | null
  });

  // Dynamic Data Fetching
  const { data: varieties } = useQuery({
      queryKey: ['varieties', formData.crop],
      queryFn: () => utilService.getVarieties(formData.crop),
      enabled: !!formData.crop
  });

  const { data: marketPrice } = useQuery({
      queryKey: ['price', formData.crop, formData.variety],
      queryFn: () => utilService.getMarketPrice(formData.crop, formData.variety),
      enabled: !!formData.crop && !!formData.variety
  });

  const createOrderMutation = useMutation({
    mutationFn: orderService.createOrder,
    onSuccess: () => {
      navigate('/dashboard');
    }
  });

  // GPS Handler
  const handleGPS = () => {
      if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(async (position) => {
              setFormData(prev => ({
                  ...prev, 
                  coordinates: { lat: position.coords.latitude, lng: position.coords.longitude }
              }));
              // Mock Pincode lookup (In real app, use Google Maps API or Backend)
              setFormData(prev => ({ ...prev, location: "Detected via GPS", pincode: "132001" }));
              alert("Location detected successfully!");
          }, () => alert("GPS failed. Please enter pincode manually."));
      } else {
          alert("GPS not supported");
      }
  };

  const handlePincodeBlur = async () => {
      if(formData.pincode.length === 6) {
          try {
              const city = await utilService.getLocationByPincode(formData.pincode);
              setFormData(prev => ({ ...prev, location: city }));
          } catch(e) { }
      }
  };

  const nextStep = () => {
      // Validation Logic
      if (currentStep === 0 && !formData.crop) return alert("Select a crop");
      if (currentStep === 0 && !formData.variety && !formData.otherVariety) return alert("Select variety");
      if (currentStep === 1 && !formData.quantity) return alert("Enter quantity");
      if (currentStep === 2 && !formData.minPrice) return alert("Enter price");
      if (currentStep === 3 && !formData.location) return alert("Enter location");

      if (currentStep < STEPS.length - 1) setCurrentStep(c => c + 1);
  };

  const handleSubmit = () => {
    createOrderMutation.mutate({
      ...formData,
      variety: formData.variety === 'Other' ? formData.otherVariety : formData.variety,
      quantity: Number(formData.quantity),
      moisture: Number(formData.moisture),
      minPrice: Number(formData.minPrice),
    } as any);
  };

  const CurrentIcon = STEPS[currentStep].icon;

  return (
    <div className="max-w-lg mx-auto pb-20">
      <div className="mb-6 flex items-center justify-between">
        <button onClick={() => currentStep === 0 ? navigate(-1) : setCurrentStep(c => c-1)} className="flex items-center text-gray-500">
             <ChevronLeft className="w-5 h-5 mr-1" /> Back
        </button>
        <span className="text-sm font-medium text-gray-500">Step {currentStep + 1} of 5</span>
      </div>

      {/* Progress Bar */}
      <div className="flex gap-1 mb-8">
         {STEPS.map((_, idx) => (
             <div key={idx} className={`h-1.5 flex-1 rounded-full transition-colors ${idx <= currentStep ? 'bg-agri-600' : 'bg-gray-200'}`} />
         ))}
      </div>

      <Card className="p-6 shadow-lg border-0 min-h-[400px] flex flex-col">
        <div className="flex items-center space-x-3 mb-6">
            <div className="bg-agri-50 p-3 rounded-full">
                <CurrentIcon className="w-6 h-6 text-agri-600" />
            </div>
            <div>
                <h2 className="text-xl font-bold text-gray-800">{STEPS[currentStep].title}</h2>
                <p className="text-sm text-gray-500">{STEPS[currentStep].label}</p>
            </div>
        </div>

        <div className="flex-1">
            {currentStep === 0 && (
            <div className="space-y-5 animate-fadeIn">
                <Select label="Select Crop / Fasal" value={formData.crop} onChange={e => setFormData({...formData, crop: e.target.value})} className="h-12 text-lg">
                <option value="">-- Choose Crop --</option>
                {Object.values(CropType).map(c => <option key={c} value={c}>{c}</option>)}
                </Select>
                
                {formData.crop && (
                    <>
                        <Select label="Variety / Kism" value={formData.variety} onChange={e => setFormData({...formData, variety: e.target.value})} className="h-12 text-lg">
                            <option value="">-- Choose Variety --</option>
                            {varieties?.map((v: string) => <option key={v} value={v}>{v}</option>)}
                        </Select>
                        {formData.variety === 'Other' && (
                            <Input label="Enter Variety Name" value={formData.otherVariety} onChange={e => setFormData({...formData, otherVariety: e.target.value})} />
                        )}
                    </>
                )}
            </div>
            )}

            {currentStep === 1 && (
            <div className="space-y-5 animate-fadeIn">
                <div className="flex gap-4">
                    <Input 
                        className="flex-1 h-12 text-lg"
                        type="number" label="Quantity" name="quantity" 
                        value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} 
                    />
                    <Select label="Unit" value={formData.quantityUnit} onChange={e => setFormData({...formData, quantityUnit: e.target.value})} className="w-32 h-12">
                        <option value="quintal">Quintal</option>
                        <option value="ton">Ton</option>
                        <option value="maund">Maund (Mann)</option>
                        <option value="acre">Acre Yield</option>
                    </Select>
                </div>
                <Input type="number" label="Moisture % (Nami)" value={formData.moisture} onChange={e => setFormData({...formData, moisture: e.target.value})} />
            </div>
            )}

            {currentStep === 2 && (
            <div className="space-y-5 animate-fadeIn">
                {marketPrice && (
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-blue-800 text-sm mb-2 flex items-center justify-between">
                        <div>
                            <strong>Market Rate:</strong> ₹{marketPrice.min} - ₹{marketPrice.max}
                        </div>
                        <Badge variant="neutral">Live</Badge>
                    </div>
                )}
                <Input 
                    type="number" label="Your Asking Price (per unit)" 
                    value={formData.minPrice} onChange={e => setFormData({...formData, minPrice: e.target.value})}
                    className="h-14 text-xl font-bold text-agri-700"
                />
            </div>
            )}

            {currentStep === 3 && (
            <div className="space-y-5 animate-fadeIn">
                <div className="flex gap-2 mb-4">
                    <Button type="button" variant="outline" onClick={handleGPS} className="w-full flex items-center justify-center">
                        <MapPin className="w-4 h-4 mr-2" /> Use GPS Location
                    </Button>
                </div>
                <Input 
                    type="number" label="Pincode" 
                    value={formData.pincode} onChange={e => setFormData({...formData, pincode: e.target.value})}
                    onBlur={handlePincodeBlur}
                    placeholder="Enter Pincode to fetch City"
                />
                <Input label="Village / City" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
            </div>
            )}

            {currentStep === 4 && (
                <div className="space-y-4 animate-fadeIn bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-bold border-b pb-2">Review Summary</h3>
                    <div className="grid grid-cols-2 gap-y-4 text-sm">
                        <span className="text-gray-500">Crop:</span> <span className="font-bold">{formData.crop} ({formData.variety})</span>
                        <span className="text-gray-500">Quantity:</span> <span className="font-bold">{formData.quantity} {formData.quantityUnit}</span>
                        <span className="text-gray-500">Price:</span> <span className="font-bold text-agri-700">₹{formData.minPrice}</span>
                        <span className="text-gray-500">Location:</span> <span>{formData.location}</span>
                    </div>
                    <div className="pt-4 text-xs text-gray-500">
                        By clicking "Post", you agree to our Terms of Service.
                    </div>
                </div>
            )}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <Button 
            onClick={currentStep === 4 ? handleSubmit : nextStep} 
            isLoading={createOrderMutation.isPending} 
            className="w-full py-3 text-lg h-12 shadow-md"
          >
             {currentStep === 4 ? 'Confirm & Post' : 'Next'}
          </Button>
        </div>
      </Card>
    </div>
  );
};
