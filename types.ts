
export enum UserRole {
  FARMER = 'FARMER',
  BUYER = 'BUYER',
  TRADER = 'TRADER',
  ADMIN = 'ADMIN'
}

export enum CropType {
  DHAN = 'Dhan (Paddy)',
  RICE = 'Rice',
  WHEAT = 'Wheat',
  MAIZE = 'Maize'
}

export enum OrderStatus {
  OPEN = 'OPEN',
  LOCKED = 'LOCKED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

export interface User {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  location: string;
  isVerified: boolean;
  trustScore: number;
}

export interface Order {
  id: string;
  farmerId: string;
  farmerName: string;
  crop: CropType;
  variety: string;
  quantity: number; // in quintals
  quantityUnit: 'quintal' | 'ton';
  moisture: number;
  brokenPercentage?: number;
  minPrice: number;
  currentHighBid?: number;
  location: string;
  pincode: string;
  status: OrderStatus;
  createdAt: string;
  expiresAt: string;
  bidsCount: number;
}

export interface Bid {
  id: string;
  orderId: string;
  bidderId: string;
  bidderName: string;
  amount: number;
  timestamp: string;
}

export interface Deal {
  id: string;
  orderId: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  crop: string;
  variety: string;
  finalPrice: number;
  quantity: number;
  quantityUnit: string;
  totalAmount: number;
  status: 'LOCKED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
  createdAt: string;
  deliveryDate?: string;
}
