
import React, { useState } from 'react';
import { kycService, authService } from '../services/api';
import { Card, Button, Input, Select } from '../components/UI';
import { ShieldCheck, Upload, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const KYC: React.FC = () => {
    const user = authService.getCurrentUser();
    const navigate = useNavigate();
    const [idType, setIdType] = useState('AADHAAR');
    const [idNumber, setIdNumber] = useState('');
    const [status, setStatus] = useState(user?.kycStatus || 'NOT_SUBMITTED');

    const handleSubmit = async () => {
        try {
            await kycService.submitKYC(idType, idNumber);
            setStatus('PENDING');
            alert("KYC Submitted for Verification");
        } catch(e) {
            alert("Submission failed");
        }
    };

    if (status === 'APPROVED') {
        return (
            <div className="text-center py-20">
                <ShieldCheck className="w-20 h-20 text-green-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold">You are Verified!</h1>
                <p className="text-gray-500">Your trust score has been boosted.</p>
                <Button onClick={() => navigate('/dashboard')} className="mt-6">Go to Dashboard</Button>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto py-10">
            <Card className="p-6">
                <div className="text-center mb-6">
                    <ShieldCheck className="w-12 h-12 text-agri-600 mx-auto mb-2" />
                    <h1 className="text-2xl font-bold">KYC Verification</h1>
                    <p className="text-gray-500">Verify identity to unlock full features.</p>
                </div>

                {status === 'PENDING' ? (
                    <div className="bg-yellow-50 p-4 rounded text-center text-yellow-800">
                        Verification in progress. Usually takes 24 hours.
                    </div>
                ) : (
                    <div className="space-y-4">
                        <Select label="ID Type" value={idType} onChange={e => setIdType(e.target.value)}>
                            <option value="AADHAAR">Aadhaar Card</option>
                            <option value="PAN">PAN Card</option>
                            <option value="VOTER">Voter ID</option>
                        </Select>
                        <Input 
                            label="ID Number" 
                            placeholder="XXXX XXXX XXXX" 
                            value={idNumber} 
                            onChange={e => setIdNumber(e.target.value)} 
                        />
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50">
                            <Upload className="w-6 h-6 mx-auto text-gray-400 mb-2" />
                            <p className="text-sm text-gray-500">Upload Photo of ID</p>
                        </div>
                        <Button className="w-full" onClick={handleSubmit}>Submit for Verification</Button>
                    </div>
                )}
            </Card>
        </div>
    );
};
