import axios from 'axios';
import { Order, User, UserRole, OrderStatus, Bid, Deal } from '../types';

// Real Backend URL (Cloudflare Tunnel)
const API_URL = 'https://choice-logging-budapest-flavor.trycloudflare.com';

// Axios Instance
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper: Convert snake_case to camelCase recursively
// This ensures frontend code (minPrice) matches backend (min_price)
// AND converts access_token -> accessToken
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

// Response Interceptor: Handle Token & Transform Data
api.interceptors.response.use(
  (response) => {
    if (response.data) {
      // Automatically converts access_token to accessToken
      response.data = toCamelCase(response.data);
    }
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      console.warn("Session expired or unauthorized. Redirecting to login.");
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirect to login (using HashRouter format)
      if (!window.location.hash.includes('/auth')) {
          window.location.href = '/#/auth';
      }
    }
    return Promise.reject(error);
  }
);

// Request Interceptor: Add Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  login: async (phone: string, password: string): Promise<{user: User, token: string}> => {
    try {
        // Backend returns { access_token: "...", token_type: "bearer", user: {...} }
        const response = await api.post('/login', { phone, password });
        
        // Data is already converted to camelCase by interceptor
        // access_token -> accessToken
        const data = response.data;
        const token = data.accessToken; 
        const user = data.user;

        if (!token) throw new Error("No access token received");

        localStorage.setItem('token', token);
        if (user) {
            localStorage.setItem('user', JSON.stringify(user));
        }

        return { user, token };
    } catch (error) {
        throw error;
    }
  },

  register: async (userData: { name: string, phone: string, password: string, role: UserRole, location: string }): Promise<{user: User, token: string}> => {
    try {
        const response = await api.post('/register', userData);
        
        const data = response.data;
        const token = data.accessToken;
        const user = data.user;

        if (!token) throw new Error("No access token received");

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
    window.location.href = '/#/auth';
  },

  getCurrentUser: (): User | null => {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) as User : null;
  }
};

export const orderService = {
  getOrders: async (filters?: any): Promise<Order[]> => {
    try {
        const response = await api.get('/orders', { params: filters });
        return response.data || [];
    } catch (error) {
        console.warn("API Error (getOrders):", error);
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
            const response = await api.post(`/orders/${orderId}/accept-bid`, { bidId: Number(bidId) });
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