/**
 * API Client
 * Centralized API communication
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for authentication
    this.client.interceptors.request.use(
      (config) => {
        // Add JWT token if available
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized - redirect to login
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  private getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  // Generic request method
  async request<T>(config: AxiosRequestConfig): Promise<T> {
    const response = await this.client.request<T>(config);
    return response.data;
  }

  // Profiles
  async getProfiles() {
    return this.request({
      method: 'GET',
      url: '/profiles',
    });
  }

  async getProfile(id: string) {
    return this.request({
      method: 'GET',
      url: `/profiles/${id}`,
    });
  }

  async createProfile(data: any) {
    return this.request({
      method: 'POST',
      url: '/profiles',
      data,
    });
  }

  async updateProfile(id: string, data: any) {
    return this.request({
      method: 'PUT',
      url: `/profiles/${id}`,
      data,
    });
  }

  async deleteProfile(id: string) {
    return this.request({
      method: 'DELETE',
      url: `/profiles/${id}`,
    });
  }

  // Forecast Run
  async triggerForecast(profileId: string) {
    return this.request({
      method: 'POST',
      url: '/run',
      data: {
        profileId,
        requestTime: new Date().toISOString(),
      },
    });
  }

  // Data endpoints
  async getForecastData(profileId: string, options?: { startDate?: string; endDate?: string }) {
    return this.request({
      method: 'GET',
      url: `/data/forecast/${profileId}`,
      params: options,
    });
  }

  async getMarketData(profileId: string) {
    return this.request({
      method: 'GET',
      url: `/data/market/${profileId}`,
    });
  }

  async getNewsData(profileId: string) {
    return this.request({
      method: 'GET',
      url: `/data/news/${profileId}`,
    });
  }

  async getEnsembleData(profileId: string) {
    return this.request({
      method: 'GET',
      url: `/data/ensemble/${profileId}`,
    });
  }

  async getDashboardOverview(profileId: string) {
    return this.request({
      method: 'GET',
      url: `/data/overview/${profileId}`,
    });
  }

  // Job status
  async getJobStatus(bundleId: string) {
    return this.request({
      method: 'GET',
      url: `/jobs/${bundleId}/status`,
    });
  }

  // Freshness check
  async checkFreshness(profileId: string) {
    return this.request({
      method: 'GET',
      url: `/freshness/${profileId}`,
    });
  }
}

export const apiClient = new ApiClient();
export default apiClient;
