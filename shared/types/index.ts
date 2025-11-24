/**
 * Central export for all shared types
 */

export * from './profile';
export * from './job';
export * from './forecast';
export * from './market';
export * from './news';
export * from './ensemble';

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
}
