import axios, { AxiosInstance } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { ErrorMonitor } from './error-monitor';

// API Response types
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  message: string;
  code: string;
  statusCode: number;
  details?: Record<string, any>;
}

// Equipment types
export interface Equipment {
  id: string;
  name: string;
  model: string;
  category: string;
  dailyRate: number;
  description: string;
  specifications: Record<string, any>;
  images: string[];
  available: boolean;
  location: {
    city: string;
    region: string;
  };
}

// Booking types
export interface Booking {
  id: string;
  bookingNumber: string;
  equipmentId: string;
  userId: string;
  startDate: string;
  endDate: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  totalAmount: number;
  deliveryAddress: string;
  deliveryCity?: string;
  createdAt: string;
  updatedAt: string;
}

// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  company?: string;
  role: 'customer' | 'admin' | 'operator';
}

// Create axios instance with default configuration
class ApiClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor for correlation IDs and error context
    this.client.interceptors.request.use(
      (config) => {
        const requestId = uuidv4();
        config.headers['X-Correlation-ID'] = requestId;
        config.headers['X-Client-Version'] = process.env.NEXT_PUBLIC_APP_VERSION;

        // Store correlation ID for error context
        (window as any).__CORRELATION_ID__ = requestId;

        // Performance marking
        if (process.env.NEXT_PUBLIC_DEBUG_MODE === 'true') {
          console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        }

        return config;
      },
      (error) => {
        ErrorMonitor.captureError(error, {
          component: 'ApiClient',
          action: 'request',
        });
        return Promise.reject(error);
      }
    );

    // Response interceptor for performance and error handling
    this.client.interceptors.response.use(
      (response) => {
        if (process.env.NEXT_PUBLIC_DEBUG_MODE === 'true') {
          console.log(`✅ API Response: ${response.status}`);
        }

        return response;
      },
      (error) => {
        const errorContext = {
          component: 'ApiClient',
          action: 'response',
          state: {
            url: error.config?.url,
            method: error.config?.method,
            status: error.response?.status,
            correlationId: error.config?.headers?.['X-Correlation-ID'],
          },
        };

        ErrorMonitor.captureError(error, errorContext);
        return Promise.reject(error);
      }
    );
  }

  private getAuthToken(): string | null {
    // In a real app, this would get the token from secure storage
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private handleUnauthorized() {
    // Clear auth token and redirect to login
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
  }

  // Generic API methods
  async get<T>(url: string, config?: any): Promise<ApiResponse<T>> {
    const response = await this.client.get<ApiResponse<T>>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> {
    const response = await this.client.post<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> {
    const response = await this.client.put<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: any): Promise<ApiResponse<T>> {
    const response = await this.client.delete<ApiResponse<T>>(url, config);
    return response.data;
  }

  // Equipment API methods
  async getEquipment(id: string): Promise<ApiResponse<Equipment>> {
    return this.get<Equipment>(`/equipment/${id}`);
  }

  async getEquipmentList(params?: {
    category?: string;
    available?: boolean;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{
    equipment: Equipment[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>> {
    return this.get('/equipment', { params });
  }

  async checkAvailability(equipmentId: string, startDate: string, endDate: string): Promise<ApiResponse<{
    available: boolean;
    alternatives?: Array<{ date: string; reason: string }>;
    pricing: { dailyRate: number; currency: string };
  }>> {
    return this.get(`/equipment/${equipmentId}/availability`, {
      params: { startDate, endDate },
    });
  }

  // Booking API methods
  async createBooking(bookingData: {
    equipmentId: string;
    startDate: string;
    endDate: string;
    deliveryAddress: string;
    deliveryCity: string;
  }): Promise<ApiResponse<Booking>> {
    return this.post<Booking>('/bookings', bookingData);
  }

  async getBookings(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{
    bookings: Booking[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>> {
    return this.get('/bookings', { params });
  }

  async getBooking(id: string): Promise<ApiResponse<Booking>> {
    return this.get<Booking>(`/bookings/${id}`);
  }

  async updateBookingStatus(id: string, status: Booking['status']): Promise<ApiResponse<Booking>> {
    return this.put<Booking>(`/bookings/${id}/status`, { status });
  }

  // User API methods
  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.get<User>('/auth/me');
  }

  async updateProfile(userData: Partial<User>): Promise<ApiResponse<User>> {
    return this.put<User>('/users/profile', userData);
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    return this.get('/health');
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
