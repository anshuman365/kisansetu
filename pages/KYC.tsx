
import React, { useState, useRef } from 'react';
import { kycService, authService } from '../services/api';
import { Card, Button, Input, Select } from '../components/UI';
import { ShieldCheck, Upload, Camera, CheckCircle, RefreshCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const KYC: React.FC = () => {
    const user = authService.getCurrentUser();
    const navigate = useNavigate();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [step, setStep] = useState(1);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    
    // Form State
    const [idType, setIdType] = useState('AADHAAR');
    const [idNumber, setIdNumber] = useState('');
    const [idFile, setIdFile] = useState<File | null>(null);
    const [livePhoto, setLivePhoto] = useState<string | null>(null);
    
    const [bankDetails, setBankDetails] = useState({
        accountNumber: '',
        bankName: '',
        branchName: '',
        ifscCode: ''
    });

    // Camera Logic
    const startCamera = async () => {
        setIsCameraOpen(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (err) {
            alert("Could not access camera");
            setIsCameraOpen(false);
        }
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            if (context) {
                context.drawImage(videoRef.current, 0, 0, 320, 240);
                const dataUrl = canvasRef.current.toDataURL('image/jpeg');
                setLivePhoto(dataUrl);
                
                // Stop Stream
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
                setIsCameraOpen(false);
            }
        }
    };

    const handleSubmit = async () => {
        const formData = new FormData();
        formData.append('idType', idType);
        formData.append('idNumber', idNumber);
        if (idFile) formData.append('idDocument', idFile);
        if (livePhoto) formData.append('livePhoto', livePhoto); // Backend needs to decode base64
        
        formData.append('bankAccountNumber', bankDetails.accountNumber);
        formData.append('bankName', bankDetails.bankName);
        formData.append('bankIfsc', bankDetails.ifscCode);

        try {
            await kycService.submitKYC(formData);
            alert("KYC Submitted Successfully! Admin will verify shortly.");
            navigate('/profile');
        } catch (e) {
            alert("Failed to submit KYC. Please try again.");
        }
    };

    if (user?.isVerified) {
        return (
            <div className="text-center py-20 animate-fadeIn">
                <ShieldCheck className="w-24 h-24 text-green-500 mx-auto mb-6" />
                <h1 className="text-3xl font-bold text-gray-900">Verified Member</h1>
                <p className="text-gray-500 mt-2">Your documents have been approved. You have full access.</p>
                <Button onClick={() => navigate('/dashboard')} className="mt-8">Go to Dashboard</Button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto py-10 px-4">
            <div className="mb-8 text-center">
                <h1 className="text-2xl font-bold mb-2">Complete Your KYC</h1>
                <p className="text-gray-500">Step {step} of 3</p>
                <div className="flex gap-2 justify-center mt-4">
                    <div className={`h-2 w-16 rounded-full ${step >= 1 ? 'bg-agri-600' : 'bg-gray-200'}`} />
                    <div className={`h-2 w-16 rounded-full ${step >= 2 ? 'bg-agri-600' : 'bg-gray-200'}`} />
                    <div className={`h-2 w-16 rounded-full ${step >= 3 ? 'bg-agri-600' : 'bg-gray-200'}`} />
                </div>
            </div>

            <Card className="p-6">
                {step === 1 && (
                    <div className="space-y-6 animate-fadeIn">
                        <h2 className="text-xl font-bold flex items-center"><ShieldCheck className="mr-2"/> Identity Proof</h2>
                        <Select label="Select ID Type" value={idType} onChange={e => setIdType(e.target.value)}>
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
                        
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                            <input 
                                type="file" 
                                id="fileUpload" 
                                className="hidden" 
                                onChange={e => setIdFile(e.target.files ? e.target.files[0] : null)}
                            />
                            <label htmlFor="fileUpload" className="cursor-pointer block">
                                {idFile ? (
                                    <div className="text-green-600 font-bold flex flex-col items-center">
                                        <CheckCircle className="w-8 h-8 mb-2"/>
                                        {idFile.name}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center text-gray-500">
                                        <Upload className="w-8 h-8 mb-2" />
                                        <span>Click to Upload ID Photo</span>
                                    </div>
                                )}
                            </label>
                        </div>
                        <Button className="w-full" onClick={() => setStep(2)} disabled={!idNumber || !idFile}>Next Step</Button>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6 animate-fadeIn">
                        <h2 className="text-xl font-bold flex items-center"><Camera className="mr-2"/> Live Verification</h2>
                        <p className="text-sm text-gray-500">Please capture a live photo of yourself for verification.</p>
                        
                        <div className="bg-gray-100 h-64 rounded-lg overflow-hidden relative flex items-center justify-center">
                            {livePhoto ? (
                                <img src={livePhoto} alt="Captured" className="h-full w-full object-cover" />
                            ) : isCameraOpen ? (
                                <video ref={videoRef} autoPlay className="h-full w-full object-cover" />
                            ) : (
                                <Button variant="secondary" onClick={startCamera}>Open Camera</Button>
                            )}
                            <canvas ref={canvasRef} width="320" height="240" className="hidden" />
                        </div>

                        {isCameraOpen && (
                            <Button className="w-full" onClick={capturePhoto}>Capture Photo</Button>
                        )}
                        {livePhoto && (
                            <div className="flex gap-4">
                                <Button variant="outline" className="flex-1" onClick={() => { setLivePhoto(null); startCamera(); }}>
                                    <RefreshCcw className="w-4 h-4 mr-2"/> Retake
                                </Button>
                                <Button className="flex-1" onClick={() => setStep(3)}>Next Step</Button>
                            </div>
                        )}
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6 animate-fadeIn">
                        <h2 className="text-xl font-bold flex items-center">🏦 Bank Details</h2>
                        <p className="text-sm text-gray-500">For secure payments and transfers.</p>
                        
                        <Input 
                            label="Account Number" 
                            value={bankDetails.accountNumber}
                            onChange={e => setBankDetails({...bankDetails, accountNumber: e.target.value})}
                        />
                        <Input 
                            label="Bank Name" 
                            value={bankDetails.bankName}
                            onChange={e => setBankDetails({...bankDetails, bankName: e.target.value})}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <Input 
                                label="IFSC Code" 
                                value={bankDetails.ifscCode}
                                onChange={e => setBankDetails({...bankDetails, ifscCode: e.target.value})}
                            />
                            <Input 
                                label="Branch" 
                                value={bankDetails.branchName}
                                onChange={e => setBankDetails({...bankDetails, branchName: e.target.value})}
                            />
                        </div>

                        <div className="flex gap-4 mt-6">
                            <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                            <Button className="flex-1" onClick={handleSubmit}>Submit KYC</Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
};
