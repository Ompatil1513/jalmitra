"""ML part: trend model that forecasts the farm's next 7 days of water use from its own history."""
import numpy as np
import pandas as pd
from datetime import date, timedelta
from sklearn.linear_model import LinearRegression


def forecast_usage(series):
    """series = [{'day': 'YYYY-MM-DD', 'liters': float}, ...] (daily, oldest first)."""
    df = pd.DataFrame(series)
    if (df.liters > 0).sum() < 7:
        return None  # not enough history – be honest instead of guessing
    # 7-day rolling mean removes the irrigation on/off zigzag, then a linear trend is fitted
    y = df.liters.rolling(7, min_periods=1).mean().values
    X = np.arange(len(y)).reshape(-1, 1)
    model = LinearRegression().fit(X, y)
    future = np.clip(model.predict(np.arange(len(y), len(y) + 7).reshape(-1, 1)), 0, None)
    last = date.fromisoformat(series[-1]["day"])
    return dict(r2=round(float(model.score(X, y)), 2), trend_l_per_day=round(float(model.coef_[0]), 1),
                next7=[dict(day=(last + timedelta(days=i + 1)).isoformat(), liters=round(float(v))) for i, v in enumerate(future)])
