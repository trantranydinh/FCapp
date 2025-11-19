"""
RCN Price Forecaster using Prophet
Facebook's Prophet for time series forecasting
"""

import pandas as pd
import numpy as np
from prophet import Prophet
from datetime import datetime, timedelta
import json
import sys

class ProphetForecaster:
    def __init__(self):
        self.model = None
        self.trained = False

    def prepare_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Prepare data for Prophet
        Requires columns: date, price
        """
        # Prophet expects 'ds' (datestamp) and 'y' (value) columns
        prophet_df = df[['date', 'price']].copy()
        prophet_df.columns = ['ds', 'y']
        prophet_df['ds'] = pd.to_datetime(prophet_df['ds'])
        prophet_df = prophet_df.sort_values('ds')

        return prophet_df

    def train(self, df: pd.DataFrame, params: dict = None):
        """
        Train Prophet model
        """
        if params is None:
            params = {
                'seasonality_mode': 'multiplicative',
                'yearly_seasonality': True,
                'weekly_seasonality': False,
                'daily_seasonality': False,
                'changepoint_prior_scale': 0.05,
            }

        # Initialize model
        self.model = Prophet(**params)

        # Add custom seasonalities if needed
        self.model.add_seasonality(name='monthly', period=30.5, fourier_order=5)

        # Prepare and fit data
        prophet_df = self.prepare_data(df)
        self.model.fit(prophet_df)

        self.trained = True
        print(f"Prophet model trained on {len(prophet_df)} data points")

    def forecast(self, periods: int = 30) -> pd.DataFrame:
        """
        Generate forecast for specified periods (days)
        Returns DataFrame with ds, yhat, yhat_lower, yhat_upper
        """
        if not self.trained:
            raise ValueError("Model must be trained before forecasting")

        # Create future dataframe
        future = self.model.make_future_dataframe(periods=periods)

        # Generate forecast
        forecast = self.model.predict(future)

        # Return only future predictions
        forecast = forecast.tail(periods)[['ds', 'yhat', 'yhat_lower', 'yhat_upper']]

        return forecast

    def calculate_accuracy(self, actual: pd.DataFrame, predicted: pd.DataFrame) -> dict:
        """
        Calculate forecast accuracy metrics
        """
        # Merge actual and predicted
        merged = pd.merge(
            actual[['date', 'price']],
            predicted,
            left_on='date',
            right_on='ds',
            how='inner'
        )

        if len(merged) == 0:
            return {'mape': None, 'rmse': None, 'mae': None}

        actual_values = merged['price'].values
        predicted_values = merged['yhat'].values

        # Calculate metrics
        mape = np.mean(np.abs((actual_values - predicted_values) / actual_values)) * 100
        rmse = np.sqrt(np.mean((actual_values - predicted_values) ** 2))
        mae = np.mean(np.abs(actual_values - predicted_values))

        return {
            'mape': float(mape),
            'rmse': float(rmse),
            'mae': float(mae)
        }

    def backtest(self, df: pd.DataFrame, test_periods: int = 30) -> dict:
        """
        Perform backtesting
        """
        # Split data
        train_df = df[:-test_periods]
        test_df = df[-test_periods:]

        # Train on historical data
        self.train(train_df)

        # Forecast
        forecast = self.forecast(periods=test_periods)

        # Calculate accuracy
        accuracy = self.calculate_accuracy(test_df, forecast)

        return {
            'accuracy': accuracy,
            'predictions': forecast.to_dict('records')
        }


def main():
    """
    Main execution function
    Usage: python prophet_forecaster.py <input_json>
    """
    if len(sys.argv) < 2:
        print("Error: Input JSON required")
        sys.exit(1)

    try:
        # Parse input
        input_data = json.loads(sys.argv[1])

        # Load data
        df = pd.DataFrame(input_data['historical_data'])
        df['date'] = pd.to_datetime(df['date'])

        # Initialize forecaster
        forecaster = ProphetForecaster()

        # Train model
        forecaster.train(df, params=input_data.get('params'))

        # Generate forecast
        forecast_periods = input_data.get('forecast_periods', 30)
        forecast = forecaster.forecast(periods=forecast_periods)

        # Perform backtest if requested
        backtest_result = None
        if input_data.get('backtest', False):
            backtest_result = forecaster.backtest(df, test_periods=input_data.get('backtest_periods', 30))

        # Prepare output
        output = {
            'model_name': 'prophet',
            'forecast': forecast.to_dict('records'),
            'backtest': backtest_result
        }

        print(json.dumps(output))

    except Exception as e:
        print(json.dumps({'error': str(e)}), file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
