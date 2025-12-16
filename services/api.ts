import axios from 'axios';
import { Order, User, Bid, Deal, Notification } from '../types';

// Real Backend URL (Cloudflare Tunnel or Localhost)
const API_URL = 'https://brilliant-xhtml-dom-bull.trycloudflare.com'; 

// Axios Instance
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const toCamelCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(v => toCamelCase(v));
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce(
      (result, key) => ({
        ...result,
        [key.replace(/_([a-z])/g, (g) => g[1].toUpperCase())]: toCamelCase(obj[key]),
      }),
      {},
    );
  }
  return obj;
};

api.interceptors.response.use(
  (response) => {
    if (response.data) {
      response.data = toCamelCase(response.data);
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.hash.includes('/auth')) {
          window.location.href = '/#/auth';
      }
    }
    return Promise.reject(error);
  }
);

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Services ---

export const authService = {
  login: async (phone: string, password: string): Promise<{user: User, token: string}> => {
    const response = await api.post('/login', { phone, password });
    const { accessToken, user } = response.data;
    localStorage.setItem('token', accessToken);
    localStorage.setItem('user', JSON.stringify(user));
    return { user, accessToken } as any;
  },
  register: async (userData: any): Promise<{user: User, token: string}> => {
    const response = await api.post('/register', userData);
    const { accessToken, user } = response.data;
    localStorage.setItem('token', accessToken);
    localStorage.setItem('user', JSON.stringify(user));
    return { user, accessToken } as any;
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/#/auth';
  },
  getCurrentUser: (): User | null => {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) as User : null;
  },
  getMe: async (): Promise<User> => {
      const response = await api.get('/users/me');
      const user = response.data;
      localStorage.setItem('user', JSON.stringify(user));
      return user;
  }
};

export const orderService = {
  getOrders: async (filters?: any) => (await api.get('/orders', { params: filters })).data,
  getMyOrders: async () => (await api.get('/orders/my')).data, // Ensure backend endpoint matches
  createOrder: async (data: any) => (await api.post('/orders', data)).data,
  getOrderById: async (id: string) => (await api.get(`/orders/${id}`)).data,
  stopBidding: async (id: string) => (await api.post(`/orders/${id}/stop`)).data 
};

export const bidService = {
  placeBid: async (orderId: string, amount: number) => (await api.post(`/orders/${orderId}/bids`, { amount })).data,
  getBidsForOrder: async (orderId: string) => (await api.get(`/orders/${orderId}/bids`)).data,
  getMyBids: async () => (await api.get('/bids/my')).data,
};

export const dealService = {
    getDeals: async () => (await api.get('/deals')).data,
    getDealById: async (id: string) => (await api.get(`/deals/${id}`)).data,
    acceptBid: async (orderId: string, bidId: string) => (await api.post(`/orders/${orderId}/accept-bid`, { bidId: Number(bidId) })).data,
    finalizeDealMode: async (dealId: string, mode: 'KISAN_SETU' | 'DIRECT_DEAL') => (await api.post(`/deals/${dealId}/finalize`, { mode })).data,
    markDelivered: async (dealId: string) => (await api.patch(`/deals/${dealId}/status`, { status: 'DELIVERED' })).data
};

export const adminService = {
    getUsers: async () => (await api.get('/admin/users')).data,
    verifyUser: async (userId: string) => (await api.post(`/admin/users/${userId}/verify`)).data
};

export const utilService = {
    getVarieties: async (crop: string) => (await api.get(`/utils/varieties?crop=${crop}`)).data,
    getMarketPrice: async (crop: string, variety: string) => (await api.get(`/utils/price?crop=${crop}&variety=${variety}`)).data,
    getLocationByPincode: async (pincode: string) => (await api.get(`/utils/geo/${pincode}`)).data,
    getTransportRate: async (distance: number, weight: number) => (await api.get(`/utils/transport-rate?dist=${distance}&weight=${weight}`)).data
};

export const kycService = {
    submitKYC: async (idType: string, idNumber: string) => (await api.post('/kyc/submit', { idType, idNumber })).data,
    getStatus: async () => (await api.get('/kyc/status')).data
};

export const subscriptionService = {
    getPlans: async () => (await api.get('/subscription/plans')).data,
    purchasePlan: async (planId: string) => (await api.post('/subscription/purchase', { planId })).data
};

export const notificationService = {
    getAll: async () => (await api.get('/notifications')).data,
    markRead: async (id: string) => (await api.post(`/notifications/${id}/read`)).data
};