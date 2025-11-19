/**
 * Forecast Profile Types
 * Shared across frontend and backend
 */

export interface ForecastProfile {
  id: string;
  name: string;
  userId: string;
  keywords: string[];
  entities: ProfileEntity[];
  region: string;
  mode: 'quantity' | 'quality';
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProfileEntity {
  type: 'RCN' | 'commodity' | 'market';
  value: string;
}

export interface CreateProfileInput {
  name: string;
  keywords: string[];
  entities: ProfileEntity[];
  region: string;
  mode: 'quantity' | 'quality';
}

export interface UpdateProfileInput extends Partial<CreateProfileInput> {
  active?: boolean;
}
