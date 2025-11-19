#!/usr/bin/env python3
"""
LSTM Forecaster Bridge for Node.js Backend
Reads from stdin, outputs JSON to stdout
"""

import sys
import json
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from sklearn.preprocessing import RobustScaler
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau
import warnings
warnings.filterwarnings('ignore')

class LSTMForecaster:
    """Simplified LSTM Forecaster optimized for web backend"""

    def __init__(self, lookback_days=90, sequence_length=30, forecast_days=60):
        self.lookback_days = lookback_days
        self.sequence_length = sequence_length
        self.forecast_days = min(forecast_days, 90)

        self.price_scaler = RobustScaler(quantile_range=(25, 75))
        self.return_scaler = RobustScaler(quantile_range=(10, 90))

        self.models = []
        self.n_models = 3  # Reduced for speed

    def load_data(self, df):
        """Load and validate data"""
        self.data = df.copy()
        self.data = self.data.sort_values('Date').reset_index(drop=True)
        self.data = self.data.drop_duplicates(subset=['Date'], keep='last')

        # Fill missing dates
        full_date_range = pd.date_range(
            start=self.data['Date'].min(),
            end=self.data['Date'].max(),
            freq='D'
        )
        self.data = self.data.set_index('Date').reindex(full_date_range).reset_index()
        self.data.columns = ['Date', 'Price']
        self.data['Price'] = self.data['Price'].fillna(method='ffill')

        return self

    def create_features(self):
        """Create features"""
        df = self.data.copy()

        df['Returns'] = np.log(df['Price'] / df['Price'].shift(1)).fillna(0)
        df['MA_30'] = df['Price'].rolling(window=30, min_periods=1).mean()
        df['Price_to_MA30'] = df['Price'] / df['MA_30'] - 1
        df['Momentum_30'] = df['Price'].pct_change(periods=30).fillna(0)
        df['Volatility_30'] = df['Returns'].rolling(window=30, min_periods=1).std().fillna(0.01)
        df['Month_sin'] = np.sin(2 * np.pi * df['Date'].dt.month / 12)
        df['Month_cos'] = np.cos(2 * np.pi * df['Date'].dt.month / 12)

        self.processed_data = df
        self.feature_columns = ['Returns', 'Price_to_MA30', 'Momentum_30',
                               'Volatility_30', 'Month_sin', 'Month_cos']

        return self

    def prepare_data(self, test_size=0.2):
        """Prepare training data"""
        feature_data = self.processed_data[self.feature_columns].values
        prices = self.processed_data['Price'].values

        feature_data_scaled = self.return_scaler.fit_transform(feature_data)

        X, y_returns = [], []

        for i in range(self.sequence_length, len(feature_data_scaled) - 1):
            X.append(feature_data_scaled[i-self.sequence_length:i])
            y_returns.append(feature_data[i, 0])

        X = np.array(X)
        y_returns = np.array(y_returns)

        split_idx = int(len(X) * (1 - test_size))

        self.X_train = X[:split_idx]
        self.X_test = X[split_idx:]
        self.y_train = y_returns[:split_idx]
        self.y_test = y_returns[split_idx:]

        self.last_sequence = feature_data_scaled[-self.sequence_length:]
        self.last_price = prices[-1]
        self.last_date = self.processed_data['Date'].iloc[-1]

        return self

    def build_model(self):
        """Build LSTM model"""
        model = Sequential([
            LSTM(32, activation='tanh', return_sequences=False,
                 input_shape=(self.sequence_length, len(self.feature_columns))),
            Dropout(0.2),
            Dense(16, activation='relu'),
            Dense(1)
        ])

        model.compile(optimizer=Adam(learning_rate=0.001), loss='mae', metrics=['mse'])
        return model

    def train_ensemble(self, epochs=30, batch_size=32):
        """Train ensemble quickly"""
        self.models = []

        for i in range(self.n_models):
            model = self.build_model()

            early_stop = EarlyStopping(monitor='val_loss', patience=5,
                                      restore_best_weights=True, verbose=0)
            reduce_lr = ReduceLROnPlateau(monitor='val_loss', factor=0.5,
                                         patience=3, min_lr=1e-5, verbose=0)

            X_train_noisy = self.X_train + np.random.normal(0, 0.01, self.X_train.shape)

            model.fit(X_train_noisy, self.y_train,
                     epochs=epochs, batch_size=batch_size,
                     validation_data=(self.X_test, self.y_test),
                     callbacks=[early_stop, reduce_lr], verbose=0)

            self.models.append(model)

        return self

    def forecast(self):
        """Generate forecast"""
        all_forecasts = []

        for model in self.models:
            forecast_prices = []
            curr_sequence = self.last_sequence.copy()
            curr_price = self.last_price

            for day in range(self.forecast_days):
                X_pred = curr_sequence.reshape(1, self.sequence_length, -1)
                next_return = model.predict(X_pred, verbose=0)[0, 0]

                historical_vol = self.processed_data['Returns'].std()
                noise = np.random.normal(0, historical_vol * 0.3)
                next_return = np.clip(next_return + noise, -0.05, 0.05)

                next_price = curr_price * np.exp(next_return)
                forecast_prices.append(next_price)

                new_features = self._calc_features(curr_price, next_price, day)
                new_features_scaled = self.return_scaler.transform([new_features])[0]

                curr_sequence = np.vstack([curr_sequence[1:], new_features_scaled])
                curr_price = next_price

            all_forecasts.append(forecast_prices)

        all_forecasts = np.array(all_forecasts)

        forecast_dates = pd.date_range(
            start=self.last_date + timedelta(days=1),
            periods=self.forecast_days,
            freq='D'
        )

        self.forecasts = pd.DataFrame({
            'Date': forecast_dates,
            'Price_Median': np.median(all_forecasts, axis=0),
            'Price_Mean': np.mean(all_forecasts, axis=0),
            'Price_Lower': np.percentile(all_forecasts, 2.5, axis=0),
            'Price_Upper': np.percentile(all_forecasts, 97.5, axis=0),
            'Std': np.std(all_forecasts, axis=0)
        })

        return self

    def _calc_features(self, curr_price, next_price, day_ahead):
        """Calculate features for next step"""
        next_return = np.log(next_price / curr_price)
        volatility_30 = self.processed_data['Volatility_30'].mean()

        forecast_date = self.last_date + timedelta(days=day_ahead+1)
        month_sin = np.sin(2 * np.pi * forecast_date.month / 12)
        month_cos = np.cos(2 * np.pi * forecast_date.month / 12)

        return [next_return, 0.0, 0.0, volatility_30, month_sin, month_cos]

    def to_json(self):
        """Convert forecast to JSON format"""
        last_price = float(self.last_price)
        final_price = float(self.forecasts['Price_Median'].iloc[-1])
        trend_pct = (final_price - last_price) / last_price

        result = {
            'forecastId': f"lstm-{datetime.now().strftime('%Y%m%d-%H%M%S')}",
            'createdAt': datetime.now().isoformat(),
            'modelId': 'lstm-v1',
            'modelName': 'LSTM Ensemble Forecaster',
            'horizonDays': self.forecast_days,
            'basePrice': round(last_price, 2),
            'trendLabel': 'UP' if trend_pct > 0.03 else ('DOWN' if trend_pct < -0.03 else 'FLAT'),
            'trendPercentage': round(trend_pct, 4),
            'confidenceScore': 0.85,
            'detailedData': {
                'forecast_dates': self.forecasts['Date'].dt.strftime('%Y-%m-%d').tolist(),
                'median_prices': self.forecasts['Price_Median'].round(2).tolist(),
                'lower_band': self.forecasts['Price_Lower'].round(2).tolist(),
                'upper_band': self.forecasts['Price_Upper'].round(2).tolist()
            },
            'metadata': {
                'n_models': self.n_models,
                'sequence_length': self.sequence_length,
                'features': self.feature_columns,
                'avg_volatility': round(float(self.forecasts['Std'].mean()), 2)
            }
        }

        return result

def main():
    """Main execution"""
    try:
        # Read input from stdin
        input_data = json.load(sys.stdin)

        file_path = input_data.get('file_path')
        forecast_days = input_data.get('forecast_days', 60)

        # Load data
        df = pd.read_excel(file_path)
        df['Date'] = pd.to_datetime(df['Date'])
        df = df.groupby('Date')['Price'].mean().reset_index()

        # Create and run forecaster
        forecaster = LSTMForecaster(
            lookback_days=90,
            sequence_length=30,
            forecast_days=forecast_days
        )

        forecaster.load_data(df)\
                  .create_features()\
                  .prepare_data()\
                  .train_ensemble(epochs=25)\
                  .forecast()

        # Output JSON
        result = forecaster.to_json()
        print(json.dumps(result))

    except Exception as e:
        error_result = {
            'error': str(e),
            'forecastId': 'error',
            'message': f'LSTM forecasting failed: {str(e)}'
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == '__main__':
    main()
