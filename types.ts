
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
  MAIZE = 'Maize',
  COTTON = 'Cotton',
  SUGARCANE = 'Sugarcane',
  PULSES = 'Pulses (Dal)',
  MUSTARD = 'Mustard',
  OTHER = 'Other'
}

export enum OrderStatus {
  OPEN = 'OPEN',
  LOCKED = 'LOCKED', // Offer accepted
  TRANSIT = 'TRANSIT', // Using KisanSetu Transport
  DIRECT_DEAL = 'DIRECT_DEAL', // Numbers exchanged
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

export interface Subscription {
  plan: 'FREE' | 'PREMIUM' | 'ENTERPRISE';
  expiryDate: string; // ISO Date
  isActive: boolean;
}

export interface BankDetails {
  accountNumber: string;
  bankName: string;
  branchName: string;
  ifscCode: string;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  location: string;
  isVerified: boolean;
  isBlocked: boolean; // New field
  kycStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NOT_SUBMITTED';
  kycData?: {
    idType: string;
    idNumber: string;
    idImageUrl?: string;
    livePhotoUrl?: string;
  };
  bankDetails?: BankDetails;
  trustScore: number;
  subscription: Subscription;
}

export interface Order {
  id: string;
  farmerId: string;
  farmerName: string;
  crop: string;
  variety: string;
  quantity: number; 
  quantityUnit: string;
  moisture: number;
  minPrice: number;
  currentHighBid?: number;
  location: string;
  pincode: string;
  status: OrderStatus;
  createdAt: string;
  expiresAt: string;
  bidsCount: number;
  coordinates?: { lat: number; lng: number };
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
  buyerPhone?: string; // Only visible if status is DIRECT_DEAL
  sellerId: string;
  sellerName: string;
  sellerPhone?: string; // Only visible if status is DIRECT_DEAL
  crop: string;
  variety: string;
  finalPrice: number;
  quantity: number;
  quantityUnit: string;
  totalAmount: number;
  status: OrderStatus;
  transportMode?: 'KISAN_SETU' | 'SELF';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED';
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  type: 'BID' | 'DEAL' | 'SYSTEM';
  isRead: boolean;
  timestamp: string;
}
