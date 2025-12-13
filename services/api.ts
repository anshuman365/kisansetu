import axios from 'axios';
import { Order, User, UserRole, OrderStatus, Bid, Deal } from '../types';

// Real Backend URL
const API_URL = 'https://choice-logging-budapest-flavor.trycloudflare.com';

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

// Global Error Handler Helper
const handleApiError = (error: any) => {
    if (error.response) {
        console.error("API Error:", error.response.data);
        throw new Error(error.response.data.message || "Server Error");
    } else if (error.request) {
        console.error("Network Error");
        throw new Error("Network Error - Check your connection");
    } else {
        throw new Error(error.message);
    }
};

export const authService = {
  login: async (phone: string, password: string): Promise<{user: User, token: string}> => {
    try {
        const response = await api.post('/login', { phone, password });
        const { user, token } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        return { user, token };
    } catch (error) {
        throw error;
    }
  },

  register: async (userData: { name: string, phone: string, password: string, role: UserRole, location: string }): Promise<{user: User, token: string}> => {
    try {
        const response = await api.post('/register', userData);
        const { user, token } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        return { user, token };
    } catch (error) {
        throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: (): User | null => {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) as User : null;
  }
};

export const orderService = {
  getOrders: async (filters?: any): Promise<Order[]> => {
    try {
        // Backend should handle filtering via query params
        const response = await api.get('/orders', { params: filters });
        return response.data || [];
    } catch (error) {
        console.warn("Failed to fetch orders, returning empty list", error);
        return [];
    }
  },

  getMyOrders: async (): Promise<Order[]> => {
    try {
        const response = await api.get('/orders/my');
        return response.data || [];
    } catch (error) {
        return [];
    }
  },

  createOrder: async (orderData: Partial<Order>): Promise<Order> => {
    try {
        const response = await api.post('/orders', orderData);
        return response.data;
    } catch (error) {
        throw error;
    }
  },

  getOrderById: async (id: string): Promise<Order | undefined> => {
    try {
        const response = await api.get(`/orders/${id}`);
        return response.data;
    } catch (error) {
        return undefined;
    }
  }
};

export const bidService = {
  placeBid: async (orderId: string, amount: number): Promise<Bid> => {
    try {
        const response = await api.post(`/orders/${orderId}/bids`, { amount });
        return response.data;
    } catch (error) {
        throw error;
    }
  },

  getBidsForOrder: async (orderId: string): Promise<Bid[]> => {
    try {
        const response = await api.get(`/orders/${orderId}/bids`);
        return response.data || [];
    } catch (error) {
        return [];
    }
  },

  getMyBids: async (): Promise<Bid[]> => {
    try {
        const response = await api.get('/bids/my');
        return response.data || [];
    } catch (error) {
        return [];
    }
  }
};

export const dealService = {
    getDeals: async (): Promise<Deal[]> => {
        try {
            const response = await api.get('/deals');
            return response.data || [];
        } catch (error) {
            return [];
        }
    },

    getDealById: async (id: string): Promise<Deal | undefined> => {
        try {
            const response = await api.get(`/deals/${id}`);
            return response.data;
        } catch (error) {
            return undefined;
        }
    },

    acceptBid: async (orderId: string, bidId: string): Promise<Deal> => {
        try {
            const response = await api.post(`/orders/${orderId}/accept-bid`, { bidId });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    updateStatus: async (dealId: string, status: 'LOCKED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED'): Promise<Deal> => {
        try {
            const response = await api.patch(`/deals/${dealId}/status`, { status });
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};

export const adminService = {
    getUsers: async (): Promise<User[]> => {
        try {
            const response = await api.get('/admin/users');
            return response.data || [];
        } catch (error) {
            return [];
        }
    },

    verifyUser: async (userId: string): Promise<User> => {
        try {
            const response = await api.post(`/admin/users/${userId}/verify`);
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};
