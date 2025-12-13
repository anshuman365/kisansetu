import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService, bidService, authService } from '../services/api';
import { Card, Button, Badge, Input, Select } from '../components/UI';
import { Filter, MapPin, Clock, Scale, Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CropType } from '../types';

const BidModal = ({ isOpen, onClose, order, onBidPlace }: any) => {
    const [amount, setAmount] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    if (!isOpen || !order) return null;

    const minBid = (order.currentHighBid || order.minPrice) + 1;

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            await onBidPlace(order.id, Number(amount));
            onClose();
            setAmount('');
        } catch(e) {
            alert('Error placing bid');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center p-4 backdrop-blur-sm">
            <Card className="w-full max-w-md bg-white p-6 relative animate-slideUp sm:animate-fadeIn">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">✕</button>
                <h2 className="text-xl font-bold mb-4">Place a Bid</h2>
                <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-100">
                    <div className="flex justify-between mb-2">
                        <span className="text-gray-500">Current Highest</span>
                        <span className="font-bold text-gray-900">₹{order.currentHighBid || order.minPrice}/qtl</span>
                    </div>
                    <div className="flex justify-between">
                         <span className="text-gray-500">Min Bid Required</span>
                         <span className="font-bold text-agri-600">₹{minBid}/qtl</span>
                    </div>
                </div>
                
                <Input 
                    type="number"
                    label="Your Offer (₹ per quintal)"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={`Enter more than ${minBid}`}
                    min={minBid}
                    className="mb-6 font-bold text-lg"
                />

                <Button className="w-full" onClick={handleSubmit} isLoading={isLoading}>
                    Confirm Bid
                </Button>
            </Card>
        </div>
    );
};

export const Marketplace: React.FC = () => {
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [showFilters, setShowFilters] = useState(false);
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const user = authService.getCurrentUser();

    // Filters State (Mock)
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCrop, setSelectedCrop] = useState('');

    const { data: orders, isLoading } = useQuery({
        queryKey: ['orders'],
        queryFn: () => orderService.getOrders()
    });

    const bidMutation = useMutation({
        mutationFn: ({orderId, amount}: {orderId: string, amount: number}) => bidService.placeBid(orderId, amount),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            // Show toast or alert
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'); // Subtle success sound
            audio.play().catch(() => {});
            alert('Bid Placed Successfully!');
        }
    });

    const handleBid = (orderId: string, amount: number) => {
        if(!user) {
            navigate('/auth');
            return;
        }
        return bidMutation.mutateAsync({ orderId, amount });
    };

    const filteredOrders = orders?.filter((o: any) => {
        const matchesSearch = o.variety.toLowerCase().includes(searchTerm.toLowerCase()) || o.location.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCrop = selectedCrop ? o.crop === selectedCrop : true;
        return matchesSearch && matchesCrop;
    });

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Live Mandi</h1>
                    <p className="text-gray-500">Browse active listings from farmers</p>
                </div>
                <div className="w-full md:w-auto flex gap-2">
                    <div className="relative flex-1 md:w-64">
                         <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                         <input 
                            type="text" 
                            placeholder="Search crop, variety or location..." 
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-agri-500 focus:outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                         />
                    </div>
                    <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className={showFilters ? 'bg-agri-50 border-agri-500 text-agri-700' : ''}>
                        <Filter className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Filters Area */}
            {showFilters && (
                <Card className="mb-6 p-4 animate-fadeIn bg-gray-50 border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-700">Refine Results</h3>
                        <button onClick={() => setShowFilters(false)}><X className="w-4 h-4 text-gray-500"/></button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Select label="Crop Type" value={selectedCrop} onChange={(e) => setSelectedCrop(e.target.value)}>
                            <option value="">All Crops</option>
                            {Object.values(CropType).map(c => <option key={c} value={c}>{c}</option>)}
                        </Select>
                        <Select label="Sort By">
                            <option>Newest Listed</option>
                            <option>Price: Low to High</option>
                            <option>Price: High to Low</option>
                            <option>Expiring Soon</option>
                        </Select>
                         <Select label="Distance">
                            <option>Anywhere</option>
                            <option>Within 50 km</option>
                            <option>Within 100 km</option>
                        </Select>
                    </div>
                </Card>
            )}

            {/* List */}
            {isLoading ? (
                <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-agri-600"></div></div>
            ) : filteredOrders?.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-dashed">
                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <Search className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">No crops found</h3>
                    <p className="text-gray-500">Try adjusting your filters or search term.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredOrders?.map((order: any) => (
                        <Card key={order.id} className="flex flex-col h-full hover:shadow-lg transition-all duration-200">
                            <div className="p-5 flex-1">
                                <div className="flex justify-between items-start mb-3">
                                    <Badge variant="success">{order.crop}</Badge>
                                    <span className="text-xs text-orange-600 font-medium bg-orange-50 px-2 py-1 rounded flex items-center">
                                        <Clock className="w-3 h-3 mr-1" /> 2d left
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-1 leading-tight">{order.variety}</h3>
                                <div className="flex items-center text-sm text-gray-500 mb-4">
                                    <MapPin className="w-4 h-4 mr-1 text-gray-400" /> {order.location}
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 py-3 border-t border-b border-gray-100 mb-4 bg-gray-50 -mx-5 px-5">
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Quantity</p>
                                        <p className="font-semibold flex items-center text-gray-800">
                                            <Scale className="w-3 h-3 mr-1" />
                                            {order.quantity} {order.quantityUnit}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Current Bid</p>
                                        <p className="font-bold text-agri-600 text-lg">
                                            ₹{order.currentHighBid || order.minPrice}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex justify-between text-xs text-gray-400">
                                    <span>Moisture: {order.moisture}%</span>
                                    <span>{order.bidsCount} bids</span>
                                </div>
                            </div>
                            <div className="p-4 border-t border-gray-100">
                                <Button className="w-full shadow-md" onClick={() => setSelectedOrder(order)}>
                                    Place Bid Now
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <BidModal 
                isOpen={!!selectedOrder} 
                order={selectedOrder} 
                onClose={() => setSelectedOrder(null)} 
                onBidPlace={handleBid}
            />
        </div>
    );
};