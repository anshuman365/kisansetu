import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService, bidService, dealService } from '../services/api';
import { Card, Button, Badge } from '../components/UI';
import { ChevronLeft, Gavel, Clock, MapPin, User, ArrowRight } from 'lucide-react';
import { OrderStatus } from '../types';

export const OrderDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: order, isLoading: orderLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => orderService.getOrderById(id!),
    enabled: !!id
  });

  const { data: bids, isLoading: bidsLoading } = useQuery({
    queryKey: ['bids', id],
    queryFn: () => bidService.getBidsForOrder(id!),
    enabled: !!id
  });

  const acceptBidMutation = useMutation({
      mutationFn: ({ orderId, bidId }: { orderId: string, bidId: string }) => dealService.acceptBid(orderId, bidId),
      onSuccess: (data) => {
          queryClient.invalidateQueries({ queryKey: ['orders'] });
          navigate(`/deals/${data.id}`);
      }
  });

  if (orderLoading || !order) return <div className="flex justify-center pt-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-agri-600"></div></div>;

  return (
    <div className="pb-20">
      <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 hover:text-gray-900 mb-4">
          <ChevronLeft className="w-5 h-5 mr-1" /> Back
      </button>

      <div className="flex justify-between items-start mb-6">
        <div>
           <div className="flex items-center gap-2 mb-1">
             <h1 className="text-2xl font-bold text-gray-900">{order.variety}</h1>
             <Badge variant={order.status === OrderStatus.OPEN ? 'success' : 'neutral'}>{order.status}</Badge>
           </div>
           <p className="text-gray-500">{order.quantity} {order.quantityUnit} • {order.crop}</p>
        </div>
        <div className="text-right hidden sm:block">
            <p className="text-sm text-gray-500">Listed Price</p>
            <p className="text-xl font-bold text-gray-900">₹{order.minPrice}/qtl</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
          {/* Order Info */}
          <div className="md:col-span-2 space-y-6">
             <Card className="p-6">
                <h3 className="text-lg font-bold mb-4 border-b pb-2">Crop Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="block text-gray-500">Moisture</span>
                        <span className="font-medium">{order.moisture}%</span>
                    </div>
                    <div>
                        <span className="block text-gray-500">Location</span>
                        <span className="font-medium">{order.location}</span>
                    </div>
                    <div>
                        <span className="block text-gray-500">Listed Date</span>
                        <span className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div>
                        <span className="block text-gray-500">Expires In</span>
                        <span className="font-medium text-orange-600">2 Days</span>
                    </div>
                </div>
             </Card>

             {/* Bids Section */}
             <div>
                <h3 className="text-xl font-bold mb-4 flex items-center">
                    <Gavel className="w-5 h-5 mr-2 text-agri-600" />
                    Bids Received ({bids?.length || 0})
                </h3>
                
                {bidsLoading ? (
                    <div className="p-4 text-center text-gray-500">Loading bids...</div>
                ) : bids?.length === 0 ? (
                    <Card className="p-8 text-center border-dashed">
                        <p className="text-gray-500">No bids received yet. Share your order to get more visibility.</p>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {bids?.map((bid, index) => (
                            <Card key={bid.id} className={`p-4 border-l-4 ${index === 0 ? 'border-l-agri-500 bg-agri-50' : 'border-l-gray-300'}`}>
                                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                                    <div className="flex items-center gap-3 w-full sm:w-auto">
                                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-500 font-bold border">
                                            {bid.bidderName.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">{bid.bidderName}</p>
                                            <p className="text-xs text-gray-500 flex items-center">
                                                <Clock className="w-3 h-3 mr-1" /> {new Date(bid.timestamp).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between w-full sm:w-auto gap-6">
                                        <div className="text-right">
                                            <p className="text-xs text-gray-500">Bid Amount</p>
                                            <p className="text-xl font-bold text-agri-700">₹{bid.amount}</p>
                                        </div>
                                        {order.status === OrderStatus.OPEN && (
                                            <Button 
                                                size="sm" 
                                                onClick={() => acceptBidMutation.mutate({ orderId: order.id, bidId: bid.id })}
                                                isLoading={acceptBidMutation.isPending}
                                            >
                                                Accept Offer
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                {index === 0 && <div className="mt-2 inline-block px-2 py-0.5 bg-green-200 text-green-800 text-[10px] font-bold rounded">HIGHEST BID</div>}
                            </Card>
                        ))}
                    </div>
                )}
             </div>
          </div>

          {/* Sidebar */}
          <div>
            <Card className="p-6 sticky top-24">
                <h3 className="font-bold text-gray-900 mb-4">Market Trends</h3>
                <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Avg Market Price</span>
                        <span className="font-medium">₹3500/qtl</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Demand</span>
                        <span className="text-green-600 font-medium flex items-center"><ArrowRight className="w-3 h-3 rotate-[-45deg]"/> High</span>
                    </div>
                    <hr />
                    <div className="bg-yellow-50 p-3 rounded text-xs text-yellow-800">
                        Wait for a few more hours, prices are expected to rise by evening.
                    </div>
                </div>
            </Card>
          </div>
      </div>
    </div>
  );
};