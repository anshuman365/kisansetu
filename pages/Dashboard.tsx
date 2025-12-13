import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { authService, orderService, bidService, dealService } from '../services/api';
import { Card, Button, Badge } from '../components/UI';
import { ArrowRight, TrendingUp, Package, Gavel, ShoppingBag, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../types';

export const Dashboard: React.FC = () => {
  const user = authService.getCurrentUser();
  const navigate = useNavigate();

  // Redirect if not logged in
  React.useEffect(() => {
    if (!user) navigate('/auth');
  }, [user, navigate]);

  const isFarmer = user?.role === UserRole.FARMER;

  // Fetch data
  const { data: myOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ['myOrders'],
    queryFn: orderService.getMyOrders,
    enabled: !!user && isFarmer
  });

  const { data: myBids, isLoading: bidsLoading } = useQuery({
    queryKey: ['myBids'],
    queryFn: bidService.getMyBids,
    enabled: !!user && !isFarmer
  });

  const { data: myDeals, isLoading: dealsLoading } = useQuery({
      queryKey: ['myDeals'],
      queryFn: dealService.getDeals,
      enabled: !!user
  });

  if (!user) return null;

  const StatCard = ({ label, value, icon: Icon, color }: any) => (
    <Card className="p-4 flex items-center justify-between shadow-sm border-0 bg-white">
      <div>
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-bold mt-1 text-gray-900">{value}</p>
      </div>
      <div className={`p-3 rounded-full ${color} shadow-sm`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </Card>
  );

  return (
    <div className="space-y-6 pb-20">
      {/* Welcome Section */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Namaste, {user.name.split(' ')[0]} 🙏</h1>
          <p className="text-gray-500 text-sm mt-1">
            {isFarmer ? "Manage your crops and orders." : "Find the best deals in the market."}
          </p>
        </div>
        {user.isVerified && <Badge variant="success">Verified {isFarmer ? 'Farmer' : 'Buyer'}</Badge>}
      </div>

      {/* Trust Score / Main Action */}
      <div className="bg-gradient-to-r from-agri-800 to-agri-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
         <div className="absolute right-0 top-0 opacity-10 transform translate-x-10 -translate-y-10">
             <div className="w-32 h-32 rounded-full bg-white"></div>
         </div>
         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
             <div>
                <p className="text-agri-100 font-medium mb-1 text-sm uppercase tracking-wider">Trust Score</p>
                <div className="text-4xl font-bold">{user.trustScore} <span className="text-lg text-agri-200 font-normal">/ 5.0</span></div>
             </div>
             <div className="w-full sm:w-auto">
                <Button 
                    variant="secondary" 
                    className="w-full sm:w-auto font-bold shadow-lg" 
                    onClick={() => navigate(isFarmer ? '/post-order' : '/browse')}
                >
                   {isFarmer ? '+ Sell New Crop' : 'Browse Mandi'}
                </Button>
             </div>
         </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {isFarmer ? (
            <>
                <StatCard label="Active Orders" value={myOrders?.length || 0} icon={Package} color="bg-blue-500" />
                <StatCard label="Total Bids" value={myOrders?.reduce((acc: number, curr: any) => acc + curr.bidsCount, 0) || 0} icon={Gavel} color="bg-soil-500" />
            </>
        ) : (
            <>
                <StatCard label="Active Bids" value={myBids?.length || 0} icon={Gavel} color="bg-soil-500" />
                <StatCard label="Deals Won" value={myDeals?.length || 0} icon={ShoppingBag} color="bg-blue-500" />
            </>
        )}
        <div className="col-span-2 sm:col-span-1">
             <Card className="p-4 flex items-center justify-between border-0 shadow-sm bg-green-50">
                <div>
                    <p className="text-sm text-green-700 font-medium">Total Earnings</p>
                    <p className="text-2xl font-bold mt-1 text-green-900">₹ {myDeals?.reduce((acc: any, curr: any) => acc + curr.totalAmount, 0).toLocaleString() || 0}</p>
                </div>
                <div className="p-3 rounded-full bg-green-200">
                    <TrendingUp className="w-6 h-6 text-green-800" />
                </div>
            </Card>
        </div>
      </div>

      {/* Deals Section (If any) */}
      {!dealsLoading && myDeals && myDeals.length > 0 && (
          <div>
              <h2 className="text-lg font-bold text-gray-800 mb-3">Recent Deals</h2>
              <div className="space-y-3">
                  {myDeals.map((deal: any) => (
                      <Card key={deal.id} className="p-4 border-l-4 border-l-green-500" onClick={() => navigate(`/deals/${deal.id}`)}>
                          <div className="flex justify-between items-center">
                               <div>
                                   <p className="font-bold text-gray-900">{deal.variety}</p>
                                   <p className="text-sm text-gray-500">{new Date(deal.createdAt).toLocaleDateString()} • {isFarmer ? `Sold to ${deal.buyerName}` : `Bought from ${deal.sellerName}`}</p>
                               </div>
                               <div className="text-right">
                                   <span className="block font-bold text-agri-700">₹{deal.finalPrice}</span>
                                   <Badge variant="success">LOCKED</Badge>
                               </div>
                          </div>
                      </Card>
                  ))}
              </div>
          </div>
      )}

      {/* Recent Activity List */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-800">
            {isFarmer ? 'Your Active Orders' : 'Your Recent Bids'}
          </h2>
          <Button variant="outline" size="sm" onClick={() => navigate('/browse')}>
            View Market
          </Button>
        </div>
        
        {/* Loading State */}
        {(ordersLoading || bidsLoading) && (
             <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-agri-600"></div></div>
        )}

        {/* Farmer View: My Orders */}
        {isFarmer && !ordersLoading && (
            myOrders?.length === 0 ? (
                <Card className="p-8 text-center bg-white border border-dashed border-gray-300">
                    <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                        <Package className="text-gray-400" />
                    </div>
                    <p className="text-gray-500 mb-4 font-medium">No crops listed yet.</p>
                    <Button onClick={() => navigate('/post-order')}>Sell Your First Crop</Button>
                </Card>
            ) : (
                <div className="space-y-3">
                    {myOrders?.map((order: any) => (
                        <Card key={order.id} className="p-4 flex flex-col gap-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-gray-900 text-lg">{order.variety}</h3>
                                        <Badge variant="success">{order.crop}</Badge>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {order.quantity} {order.quantityUnit} • {order.location}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className="block text-xs text-gray-500">Highest Bid</span>
                                    <span className="block text-lg font-bold text-agri-600">₹{order.currentHighBid || order.minPrice}</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-1">
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                    {order.bidsCount} Bids Received
                                </span>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="text-xs h-8"
                                    onClick={() => navigate(`/orders/${order.id}`)}
                                >
                                    Manage Bids <ChevronRight className="w-3 h-3 ml-1" />
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )
        )}

        {/* Buyer View: My Bids */}
        {!isFarmer && !bidsLoading && (
             myBids?.length === 0 ? (
                <Card className="p-8 text-center bg-white border border-dashed border-gray-300">
                     <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                        <Gavel className="text-gray-400" />
                    </div>
                    <p className="text-gray-500 mb-4 font-medium">You haven't placed any bids.</p>
                    <Button onClick={() => navigate('/browse')}>Browse Mandi</Button>
                </Card>
            ) : (
                <div className="space-y-3">
                    {myBids?.map((bid: any) => (
                        <Card key={bid.id} className="p-4">
                             <div className="flex justify-between items-center mb-2">
                                <h3 className="font-bold text-gray-900">Order #{bid.orderId}</h3>
                                <Badge variant="warning">Active</Badge>
                             </div>
                             <div className="flex justify-between items-center">
                                <span className="text-gray-600 text-sm">Your Bid Amount</span>
                                <span className="text-lg font-bold text-agri-600">₹{bid.amount}</span>
                             </div>
                             <p className="text-xs text-gray-400 mt-2 text-right">Placed on {new Date(bid.timestamp).toLocaleDateString()}</p>
                        </Card>
                    ))}
                </div>
            )
        )}
      </div>
    </div>
  );
};