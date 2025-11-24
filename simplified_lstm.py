import pandas as pd
import numpy as np
import sys
import json
from datetime import datetime, timedelta
from sklearn.preprocessing import RobustScaler
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau
import warnings
import os

# Suppress warnings and logs
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
warnings.filterwarnings('ignore')

class SimplifiedRobustLSTM:
    """
    Simplified and Robust LSTM Forecaster for Cashew Prices
    Following KISS principle with focus on reliability
    """
    
    def __init__(self, 
                 lookback_days=90,      # Days to look back for normalization
                 sequence_length=30,    # Sequence length for LSTM
                 forecast_days=60,      # Maximum 60 days forecast
                 n_features=5):         # Limited features
        
        self.lookback_days = lookback_days
        self.sequence_length = sequence_length
        self.forecast_days = min(forecast_days, 90)  # Cap at 90 days
        self.n_features = n_features
        
        # Data containers
        self.data = None
        self.processed_data = None
        self.train_data = None
        
        # Scalers - using RobustScaler for outlier resistance
        self.price_scaler = RobustScaler(quantile_range=(25, 75))
        self.return_scaler = RobustScaler(quantile_range=(10, 90))
        
        # Models
        self.models = []  # Ensemble of models
        self.n_models = 3 # Reduced for speed in production
        
        # Forecast results
        self.forecasts = None
        
    def load_and_validate_data(self, df):
        """Load data with validation and cleaning"""
        try:
            # Copy and sort data
            self.data = df.copy()
            self.data['Date'] = pd.to_datetime(self.data['Date'])
            self.data = self.data.sort_values('Date').reset_index(drop=True)
            
            # Remove duplicates
            self.data = self.data.drop_duplicates(subset=['Date'], keep='last')
            
            # Fill missing dates with forward fill
            full_date_range = pd.date_range(start=self.data['Date'].min(), 
                                           end=self.data['Date'].max(), 
                                           freq='D')
            self.data = self.data.set_index('Date').reindex(full_date_range).reset_index()
            self.data.columns = ['Date', 'Price']
            self.data['Price'] = self.data['Price'].fillna(method='ffill')
            
            return True
            
        except Exception as e:
            # print(f"Error loading data: {str(e)}", file=sys.stderr)
            return False
    
    def create_simple_features(self):
        """Create simple but effective features"""
        try:
            df = self.data.copy()
            
            # 1. Log returns (for stationarity)
            df['Returns'] = np.log(df['Price'] / df['Price'].shift(1))
            df['Returns'] = df['Returns'].fillna(0)
            
            # 2. Simple moving average (30 days)
            df['MA_30'] = df['Price'].rolling(window=30, min_periods=1).mean()
            df['Price_to_MA30'] = df['Price'] / df['MA_30'] - 1
            
            # 3. Momentum (30 days)
            df['Momentum_30'] = df['Price'].pct_change(periods=30).fillna(0)
            
            # 4. Volatility (30 days realized)
            df['Volatility_30'] = df['Returns'].rolling(window=30, min_periods=1).std()
            df['Volatility_30'] = df['Volatility_30'].fillna(df['Volatility_30'].mean())
            
            # 5. Seasonal component (month effect)
            df['Month_sin'] = np.sin(2 * np.pi * df['Date'].dt.month / 12)
            df['Month_cos'] = np.cos(2 * np.pi * df['Date'].dt.month / 12)
            
            # Store processed data
            self.processed_data = df
            
            # Define feature columns (excluding Price itself for training)
            self.feature_columns = ['Returns', 'Price_to_MA30', 'Momentum_30', 
                                   'Volatility_30', 'Month_sin', 'Month_cos']
            
            return True
            
        except Exception as e:
            # print(f"Error creating features: {str(e)}", file=sys.stderr)
            return False
    
    def prepare_training_data(self, test_size=0.2):
        """Prepare data for LSTM training with proper scaling"""
        try:
            # Get feature data
            feature_data = self.processed_data[self.feature_columns].values
            prices = self.processed_data['Price'].values
            
            # Scale features using RobustScaler
            feature_data_scaled = self.return_scaler.fit_transform(feature_data)
            
            # Create sequences
            X, y_returns, y_prices = [], [], []
            
            for i in range(self.sequence_length, len(feature_data_scaled) - 1):
                # Features for sequence
                X.append(feature_data_scaled[i-self.sequence_length:i])
                
                # Target: next day return (not price)
                next_return = feature_data[i, 0]  # Returns is first column
                y_returns.append(next_return)
                
                # Also store actual next price for reference
                y_prices.append(prices[i+1])
            
            X = np.array(X)
            y_returns = np.array(y_returns)
            y_prices = np.array(y_prices)
            
            # Train/test split
            split_idx = int(len(X) * (1 - test_size))
            
            self.X_train = X[:split_idx]
            self.X_test = X[split_idx:]
            self.y_train = y_returns[:split_idx]
            self.y_test = y_returns[split_idx:]
            self.y_prices_test = y_prices[split_idx:]
            
            # Store last known data for forecasting
            self.last_sequence = feature_data_scaled[-self.sequence_length:]
            self.last_price = prices[-1]
            self.last_date = self.processed_data['Date'].iloc[-1]
            
            return True
            
        except Exception as e:
            # print(f"Error preparing training data: {str(e)}", file=sys.stderr)
            return False
    
    def build_simple_model(self):
        """Build simple but effective LSTM model"""
        model = Sequential([
            # Single LSTM layer
            LSTM(32, 
                 activation='tanh',
                 return_sequences=False,
                 input_shape=(self.sequence_length, len(self.feature_columns))),
            
            # Dropout for regularization
            Dropout(0.2),
            
            # Dense layer
            Dense(16, activation='relu'),
            
            # Output layer (predicting return, not price)
            Dense(1)
        ])
        
        # Compile with MAE loss (more robust than MSE)
        model.compile(
            optimizer=Adam(learning_rate=0.001),
            loss='mae',
            metrics=['mse']
        )
        
        return model
    
    def train_ensemble(self, epochs=30, batch_size=32):
        """Train ensemble of models for robustness"""
        try:
            self.models = []
            
            for i in range(self.n_models):
                # Build model
                model = self.build_simple_model()
                
                # Callbacks
                early_stop = EarlyStopping(
                    monitor='val_loss',
                    patience=5,
                    restore_best_weights=True,
                    verbose=0
                )
                
                reduce_lr = ReduceLROnPlateau(
                    monitor='val_loss',
                    factor=0.5,
                    patience=3,
                    min_lr=1e-5,
                    verbose=0
                )
                
                # Add small noise to training data for diversity
                X_train_noisy = self.X_train + np.random.normal(0, 0.01, self.X_train.shape)
                
                # Train model
                model.fit(
                    X_train_noisy, self.y_train,
                    epochs=epochs,
                    batch_size=batch_size,
                    validation_data=(self.X_test, self.y_test),
                    callbacks=[early_stop, reduce_lr],
                    verbose=0
                )
                
                self.models.append(model)
            
            # Validate ensemble on test set
            metrics = self.validate_ensemble()
            return metrics
            
        except Exception as e:
            # print(f"Error training ensemble: {str(e)}", file=sys.stderr)
            return None
    
    def validate_ensemble(self):
        """Validate ensemble performance"""
        # Get ensemble predictions on test set
        predictions = []
        for model in self.models:
            pred = model.predict(self.X_test, verbose=0)
            predictions.append(pred.flatten())
        
        # Ensemble prediction (median for robustness)
        ensemble_pred = np.median(predictions, axis=0)
        
        # Convert returns to prices
        last_prices = self.processed_data['Price'].iloc[self.sequence_length:-1].values
        last_prices = last_prices[-len(self.y_test)-1:-1]
        
        predicted_prices = last_prices * np.exp(ensemble_pred)
        actual_prices = self.y_prices_test
        
        # Calculate metrics
        mae = mean_absolute_error(actual_prices, predicted_prices)
        rmse = np.sqrt(mean_squared_error(actual_prices, predicted_prices))
        mape = np.mean(np.abs((actual_prices - predicted_prices) / actual_prices)) * 100
        
        return {
            "mae": float(mae),
            "rmse": float(rmse),
            "mape": float(mape)
        }
    
    def forecast_with_patterns(self):
        """Generate forecast using ensemble and historical patterns"""
        try:
            # Container for all model forecasts
            all_forecasts = []
            
            for model_idx, model in enumerate(self.models):
                # Initialize forecast
                forecast_prices = []
                
                # Current sequence
                curr_sequence = self.last_sequence.copy()
                curr_price = self.last_price
                
                # Generate forecast
                for day in range(self.forecast_days):
                    # Predict next return
                    X_pred = curr_sequence.reshape(1, self.sequence_length, -1)
                    next_return = model.predict(X_pred, verbose=0)[0, 0]
                    
                    # Add realistic noise based on historical volatility
                    historical_vol = self.processed_data['Returns'].std()
                    noise = np.random.normal(0, historical_vol * 0.3)
                    next_return += noise
                    
                    # Apply return bounds (prevent extreme predictions)
                    next_return = np.clip(next_return, -0.05, 0.05)  # Max 5% daily change
                    
                    # Calculate next price
                    next_price = curr_price * np.exp(next_return)
                    
                    forecast_prices.append(next_price)
                    
                    # Update sequence (simplified for speed)
                    new_features = self._calculate_next_features(
                        curr_price, next_price, day
                    )
                    new_features_scaled = self.return_scaler.transform([new_features])[0]
                    
                    curr_sequence = np.vstack([
                        curr_sequence[1:],
                        new_features_scaled
                    ])
                    curr_price = next_price
                
                all_forecasts.append(forecast_prices)
            
            # Combine forecasts
            all_forecasts = np.array(all_forecasts)
            
            # Calculate statistics
            median_forecast = np.median(all_forecasts, axis=0)
            
            # Apply historical pattern matching for long-term forecast
            if self.forecast_days > 30:
                median_forecast = self._apply_historical_patterns(median_forecast)
            
            # Create forecast dates
            forecast_dates = pd.date_range(
                start=self.last_date + timedelta(days=1),
                periods=self.forecast_days,
                freq='D'
            )
            
            # Store results
            self.forecasts = pd.DataFrame({
                'Date': forecast_dates,
                'Price_Median': median_forecast,
                'Price_Lower_95': np.percentile(all_forecasts, 2.5, axis=0),
                'Price_Upper_95': np.percentile(all_forecasts, 97.5, axis=0)
            })
            
            return True
            
        except Exception as e:
            # print(f"Error generating forecast: {str(e)}", file=sys.stderr)
            return False
    
    def _calculate_next_features(self, curr_price, next_price, day_ahead):
        """Calculate features for next time step"""
        # Simplified feature calculation
        next_return = np.log(next_price / curr_price)
        
        # Approximate other features
        price_to_ma30 = 0.0  # Neutral assumption
        momentum_30 = 0.0    # Neutral assumption
        volatility_30 = self.processed_data['Volatility_30'].mean()
        
        # Seasonal features based on forecast date
        forecast_date = self.last_date + timedelta(days=day_ahead+1)
        month_sin = np.sin(2 * np.pi * forecast_date.month / 12)
        month_cos = np.cos(2 * np.pi * forecast_date.month / 12)
        
        return [next_return, price_to_ma30, momentum_30, 
                volatility_30, month_sin, month_cos]
    
    def _apply_historical_patterns(self, forecast):
        """Apply historical seasonal patterns to long-term forecast"""
        # Get historical patterns for next months
        historical_patterns = []
        for i in range(len(forecast)):
            forecast_date = self.last_date + timedelta(days=i+1)
            month = forecast_date.month
            
            # Find historical prices for this month
            month_prices = self.processed_data[
                self.processed_data['Date'].dt.month == month
            ]['Price'].values
            
            if len(month_prices) > 0:
                # Calculate typical price change for this month
                month_returns = np.log(month_prices[1:] / month_prices[:-1])
                typical_return = np.median(month_returns)
                historical_patterns.append(typical_return)
            else:
                historical_patterns.append(0)
        
        # Blend forecast with historical patterns
        pattern_adjustment = 1 + np.cumsum(historical_patterns) * 0.3
        adjusted_forecast = forecast * pattern_adjustment
        
        return adjusted_forecast
    
    def run_complete_pipeline(self, data):
        """Run complete forecasting pipeline"""
        if not self.load_and_validate_data(data):
            return None, None
        
        if not self.create_simple_features():
            return None, None
        
        if not self.prepare_training_data():
            return None, None
        
        metrics = self.train_ensemble()
        if metrics is None:
            return None, None
        
        if not self.forecast_with_patterns():
            return None, None
            
        return self.forecasts, metrics

# Helper imports for metrics
from sklearn.metrics import mean_squared_error, mean_absolute_error

if __name__ == "__main__":
    try:
        # Read input from argument
        if len(sys.argv) < 2:
            print(json.dumps({"error": "No input provided"}))
            sys.exit(1)
            
        input_data = json.loads(sys.argv[1])
        
        # Parse historical data
        historical_data = input_data.get('historical_data', [])
        if not historical_data:
            print(json.dumps({"error": "No historical data provided"}))
            sys.exit(1)
            
        df = pd.DataFrame(historical_data)
        # Rename columns if needed (assuming input has 'date' and 'price')
        df = df.rename(columns={'date': 'Date', 'price': 'Price'})
        
        # Create forecaster
        forecaster = SimplifiedRobustLSTM(
            lookback_days=90,
            sequence_length=30,
            forecast_days=input_data.get('forecast_periods', 60),
            n_features=5
        )
        
        # Run pipeline
        forecast_df, metrics = forecaster.run_complete_pipeline(df)
        
        if forecast_df is None:
            print(json.dumps({"error": "Forecasting failed"}))
            sys.exit(1)
            
        # Format output
        output = {
            "model_name": "SimplifiedRobustLSTM_v2",
            "forecast": [],
            "backtest": {
                "accuracy": metrics
            }
        }
        
        for _, row in forecast_df.iterrows():
            output["forecast"].append({
                "ds": row['Date'].strftime('%Y-%m-%d'),
                "yhat": float(row['Price_Median']),
                "yhat_lower": float(row['Price_Lower_95']),
                "yhat_upper": float(row['Price_Upper_95'])
            })
            
        print(json.dumps(output))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
