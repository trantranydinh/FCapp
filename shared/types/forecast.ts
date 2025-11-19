/**
 * Forecast Data Types
 * Price forecasting results
 */

export interface PriceForecast {
  id: string;
  profileId: string;
  forecastDate: Date;
  forecastValue: number;
  confidenceLower: number;
  confidenceUpper: number;
  modelName: string;
  accuracy?: number;
  createdAt: Date;
}

export interface ForecastPoint {
  date: string;
  value: number;
  lower: number;
  upper: number;
}

export interface PriceForecastResult {
  profileId: string;
  modelName: string;
  forecastHorizon: number; // days
  predictions: ForecastPoint[];
  accuracy: {
    mape: number; // Mean Absolute Percentage Error
    rmse: number; // Root Mean Square Error
    mae: number;  // Mean Absolute Error
  };
  metadata: {
    trainStart: string;
    trainEnd: string;
    featuresUsed: string[];
    hyperparameters?: Record<string, any>;
  };
}
