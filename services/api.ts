import axios from 'axios';
import { Order, User, UserRole, OrderStatus, Bid, CropType, Deal } from '../types';

// In a real app, this would be your backend URL
const API_URL = 'https://api.kisansetu.com/v1';

// Axios Instance
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// JWT Interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- MOCK DATA STORE (For Demo Purposes Only) ---
const MOCK_USER: User = {
  id: 'u1',
  name: 'Rajesh Kumar',
  phone: '9876543210',
  role: UserRole.FARMER,
  location: 'Karnal, Haryana',
  isVerified: true,
  trustScore: 4.8,
};

// Store users in memory for the session to support Admin verification
let MOCK_USERS: User[] = [MOCK_USER];

let MOCK_ORDERS: Order[] = [
  {
    id: 'o1',
    farmerId: 'u1',
    farmerName: 'Rajesh Kumar',
    crop: CropType.DHAN,
    variety: 'Basmati 1121',
    quantity: 50,
    quantityUnit: 'quintal',
    moisture: 12,
    minPrice: 3500,
    currentHighBid: 3650,
    location: 'Karnal Mandi',
    pincode: '132001',
    status: OrderStatus.OPEN,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 86400000 * 2).toISOString(),
    bidsCount: 2,
  },
  {
    id: 'o2',
    farmerId: 'u2',
    farmerName: 'Suresh Singh',
    crop: CropType.RICE,
    variety: 'Sona Masoori',
    quantity: 100,
    quantityUnit: 'quintal',
    moisture: 10,
    brokenPercentage: 5,
    minPrice: 2800,
    currentHighBid: 0,
    location: 'Raipur, CG',
    pincode: '492001',
    status: OrderStatus.OPEN,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 86400000 * 5).toISOString(),
    bidsCount: 0,
  }
];

let MOCK_BIDS: Bid[] = [
    { id: 'b1', orderId: 'o1', bidderId: 'u3', bidderName: 'Agro Traders Ltd', amount: 3600, timestamp: new Date(Date.now() - 10000000).toISOString() },
    { id: 'b2', orderId: 'o1', bidderId: 'u4', bidderName: 'Jai Kisan Rice Mill', amount: 3650, timestamp: new Date().toISOString() }
];

let MOCK_DEALS: Deal[] = [];

// --- MOCK API HANDLERS ---
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const authService = {
  login: async (phone: string, otp: string) => {
    await delay(1000);
    // For demo, allow admin login with specific number
    if (phone === '0000000000') {
       const adminUser: User = { ...MOCK_USER, id: 'admin1', name: 'Admin User', role: UserRole.ADMIN, isVerified: true };
       localStorage.setItem('user', JSON.stringify(adminUser));
       localStorage.setItem('token', 'admin-token');
       return { user: adminUser, token: 'admin-token' };
    }

    localStorage.setItem('token', 'fake-jwt-token');
    // Try to find in memory mock users, else fallback to default mock
    const user = MOCK_USERS.find(u => u.phone === phone) || MOCK_USER;
    localStorage.setItem('user', JSON.stringify(user));
    return { user: user, token: 'fake-jwt-token' };
  },
  register: async (userData: { name: string, phone: string, role: UserRole, location: string }) => {
    await delay(1000);
    const newUser: User = {
      id: `u${Date.now()}`,
      name: userData.name,
      phone: userData.phone,
      role: userData.role,
      location: userData.location,
      isVerified: false, 
      trustScore: 3.0, 
    };
    MOCK_USERS.push(newUser);
    localStorage.setItem('token', 'fake-jwt-token-new');
    localStorage.setItem('user', JSON.stringify(newUser));
    return { user: newUser, token: 'fake-jwt-token-new' };
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  getCurrentUser: () => {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) as User : null;
  }
};

export const orderService = {
  getOrders: async (filters?: any) => {
    await delay(800);
    return MOCK_ORDERS.filter(o => o.status === OrderStatus.OPEN);
  },
  getMyOrders: async () => {
    await delay(600);
    const user = authService.getCurrentUser();
    if (!user) return [];
    return MOCK_ORDERS.filter(o => o.farmerId === user.id || (user.id === 'u1' && o.farmerId === 'u1')); 
  },
  createOrder: async (orderData: Partial<Order>) => {
    await delay(1200);
    const user = authService.getCurrentUser();
    const newOrder: Order = {
      ...orderData as Order,
      id: `o${Math.random().toString(36).substr(2, 9)}`,
      farmerId: user?.id || 'unknown',
      farmerName: user?.name || 'Unknown',
      status: OrderStatus.OPEN,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 86400000 * 3).toISOString(), 
      bidsCount: 0,
      currentHighBid: 0
    };
    MOCK_ORDERS.unshift(newOrder);
    return newOrder;
  },
  getOrderById: async (id: string) => {
    await delay(500);
    return MOCK_ORDERS.find(o => o.id === id);
  }
};

export const bidService = {
  placeBid: async (orderId: string, amount: number) => {
    await delay(1000);
    const order = MOCK_ORDERS.find(o => o.id === orderId);
    if (!order) throw new Error("Order not found");
    
    if (amount <= (order.currentHighBid || order.minPrice)) {
        throw new Error("Bid must be higher than current price");
    }

    const user = authService.getCurrentUser();
    const newBid: Bid = {
        id: `b${Date.now()}`,
        orderId,
        bidderId: user?.id || 'guest',
        bidderName: user?.name || 'Guest',
        amount,
        timestamp: new Date().toISOString()
    };
    
    MOCK_BIDS.push(newBid);
    order.currentHighBid = amount;
    order.bidsCount += 1;
    
    return newBid;
  },
  getBidsForOrder: async (orderId: string) => {
      await delay(600);
      return MOCK_BIDS.filter(b => b.orderId === orderId).sort((a,b) => b.amount - a.amount);
  },
  getMyBids: async () => {
      await delay(600);
      const user = authService.getCurrentUser();
      if (!user) return [];
      const userBids = MOCK_BIDS.filter(b => b.bidderId === user.id);
      if (userBids.length === 0 && user.role !== UserRole.FARMER) {
          // Demo data for fresh buyers
          return [{
              id: 'b_demo',
              orderId: 'o1',
              bidderId: user.id,
              bidderName: user.name,
              amount: 3600,
              timestamp: new Date().toISOString()
          }];
      }
      return userBids;
  }
};

export const dealService = {
    getDeals: async () => {
        await delay(700);
        const user = authService.getCurrentUser();
        if(!user) return [];
        return MOCK_DEALS.filter(d => d.buyerId === user.id || d.sellerId === user.id);
    },
    getDealById: async (id: string) => {
        await delay(500);
        return MOCK_DEALS.find(d => d.id === id);
    },
    acceptBid: async (orderId: string, bidId: string) => {
        await delay(1500);
        const orderIndex = MOCK_ORDERS.findIndex(o => o.id === orderId);
        if (orderIndex === -1) throw new Error("Order not found");
        
        const bid = MOCK_BIDS.find(b => b.id === bidId);
        if (!bid) throw new Error("Bid not found");

        // Create Deal
        const order = MOCK_ORDERS[orderIndex];
        const newDeal: Deal = {
            id: `d${Date.now()}`,
            orderId: order.id,
            buyerId: bid.bidderId,
            buyerName: bid.bidderName,
            sellerId: order.farmerId,
            sellerName: order.farmerName,
            crop: order.crop,
            variety: order.variety,
            quantity: order.quantity,
            quantityUnit: order.quantityUnit,
            finalPrice: bid.amount,
            totalAmount: bid.amount * order.quantity,
            status: 'LOCKED',
            createdAt: new Date().toISOString()
        };

        // Update Order Status
        MOCK_ORDERS[orderIndex] = { ...order, status: OrderStatus.LOCKED };
        MOCK_DEALS.unshift(newDeal);
        
        return newDeal;
    },
    updateStatus: async (dealId: string, status: 'LOCKED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED') => {
        await delay(1000);
        const deal = MOCK_DEALS.find(d => d.id === dealId);
        if(deal) {
            deal.status = status;
            return deal;
        }
        throw new Error("Deal not found");
    }
};

export const adminService = {
    getUsers: async () => {
        await delay(800);
        return MOCK_USERS;
    },
    verifyUser: async (userId: string) => {
        await delay(800);
        const user = MOCK_USERS.find(u => u.id === userId);
        if(user) {
            user.isVerified = true;
            user.trustScore = 5.0; // Boost score on verification
            // Update local storage if it's the current user
            const currentUser = authService.getCurrentUser();
            if(currentUser && currentUser.id === userId) {
                localStorage.setItem('user', JSON.stringify(user));
            }
        }
        return user;
    }
}