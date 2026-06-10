import pandas as pd
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, 'unified_ev_fleet_dataset_final.csv')

def get_dataframe():
    df = pd.read_csv(DATA_PATH)
    
    # Fix random synthetic vehicle assignments so each vehicle_id has exactly 1 manufacturer and model
    first_assignments = df.drop_duplicates(subset=['vehicle_id'])[['vehicle_id', 'manufacturer', 'car_model']]
    df = df.drop(columns=['manufacturer', 'car_model'])
    df = pd.merge(df, first_assignments, on='vehicle_id', how='left')
    
    # Synthesize missing columns required by the UI
    if 'car_name' not in df.columns:
        df['car_name'] = df['manufacturer'] + ' ' + df['car_model']
    
    if 'daily_income' not in df.columns:
        df['daily_income'] = df['trip_distance_km'] * 1.5
        
    if 'maintenance_charges' not in df.columns:
        df['maintenance_charges'] = df['daily_income'] * 0.12
        
    if 'total_harsh_events' not in df.columns:
        df['total_harsh_events'] = df['harsh_braking_count'] + df['sharp_turn_count']
        
    # Map other columns for backward compatibility in the dashboard components
    df['performance_score'] = df['driver_behavior_score']
    df['daily_distance_km'] = df['trip_distance_km']
    df['date'] = df['timestamp']
    df['predominant_location_type'] = df['road_type']
    df['initial_battery_health_pct'] = df['state_of_health_soh']
    
    return df

def load_vehicles():
    df = get_dataframe()
    
    df['timestamp_dt'] = pd.to_datetime(df['timestamp'])
    max_date = df['timestamp_dt'].max()
    three_months_ago = max_date - pd.Timedelta(days=90)
    last_3m_df = df[df['timestamp_dt'] >= three_months_ago].copy()
    last_3m_df['charging_cost'] = (last_3m_df['trip_distance_km'] * last_3m_df['energy_efficiency_wh_per_km']) / 1000 * 0.20
    
    agg_stats = last_3m_df.groupby('vehicle_id').agg(
        income_3m=('daily_income', 'sum'),
        maintenance_3m=('maintenance_charges', 'sum'),
        charging_cost_3m=('charging_cost', 'sum')
    ).reset_index()
    
    vehicles_df = df.drop_duplicates(subset=['vehicle_id']).copy()
    vehicles_df = pd.merge(vehicles_df, agg_stats, on='vehicle_id', how='left')
    vehicles_df.fillna({'income_3m': 0, 'maintenance_3m': 0, 'charging_cost_3m': 0}, inplace=True)
    
    df['charging_cost'] = (df['trip_distance_km'] * df['energy_efficiency_wh_per_km']) / 1000 * 0.20
    history_df = df.sort_values('timestamp')[['vehicle_id', 'timestamp', 'state_of_health_soh', 'daily_income', 'trip_distance_km', 'maintenance_charges', 'charging_cost']]
    history_dict = {}
    for vid, group in history_df.groupby('vehicle_id'):
        history_dict[vid] = group[['timestamp', 'state_of_health_soh', 'daily_income', 'trip_distance_km', 'maintenance_charges', 'charging_cost']].to_dict(orient='records')
        
    vehicles_list = vehicles_df.to_dict(orient='records')
    for v in vehicles_list:
        v['history'] = history_dict.get(v['vehicle_id'], [])
        
    return vehicles_list

def load_daily_data():
    return get_dataframe().to_dict(orient='records')

def load_driver_data(driver_id=None):
    df = get_dataframe()
    if driver_id:
        df = df[df['driver_id'] == driver_id]
    return df.to_dict(orient='records')

def get_admin_dashboard_stats():
    df = get_dataframe()
    
    total_vehicles = df['vehicle_id'].nunique()
    total_income = float(df['daily_income'].sum())
    total_maintenance = float(df['maintenance_charges'].sum())
    total_distance = float(df['daily_distance_km'].sum())
    avg_fleet_performance = float(df['performance_score'].mean())
    total_harsh_events = int(df['total_harsh_events'].sum())
    
    # 3 Months data
    df['timestamp_dt'] = pd.to_datetime(df['timestamp'])
    max_date = df['timestamp_dt'].max()
    three_months_ago = max_date - pd.Timedelta(days=90)
    last_3m_df = df[df['timestamp_dt'] >= three_months_ago].copy()
    
    last_3m_df['charging_cost'] = (last_3m_df['trip_distance_km'] * last_3m_df['energy_efficiency_wh_per_km']) / 1000 * 0.20
    
    income_last_3m = float(last_3m_df['daily_income'].sum())
    charging_spent_last_3m = float(last_3m_df['charging_cost'].sum())
    violations_last_3m = int(last_3m_df['total_harsh_events'].sum())
    
    df['charging_cost'] = (df['trip_distance_km'] * df['energy_efficiency_wh_per_km']) / 1000 * 0.20
    trend_df = df.groupby('date').agg({'daily_income': 'sum', 'charging_cost': 'sum', 'total_harsh_events': 'sum', 'maintenance_charges': 'sum'}).reset_index()
    trend_df['total_expense'] = trend_df['charging_cost'] + trend_df['maintenance_charges']
    trend_all = trend_df.sort_values('date').to_dict(orient='records')
    
    viol_df = last_3m_df.groupby('driver_id')['total_harsh_events'].sum().reset_index()
    top_violations_3m = viol_df.sort_values('total_harsh_events', ascending=False).head(5).to_dict(orient='records')
    
    # Get last 10 trips
    recent_trips = df.sort_values('date', ascending=False).head(10).to_dict(orient='records')

    # Weather vs Efficiency
    weather_eff = df.groupby('weather_condition')['energy_efficiency_wh_per_km'].mean().round(1).reset_index()
    weather_eff.columns = ['weather_condition', 'avg_efficiency']
    weather_eff = weather_eff.to_dict(orient='records')
    
    # Mode Distribution
    mode_dist = df['driving_mode'].value_counts().reset_index()
    mode_dist.columns = ['driving_mode', 'count']
    mode_dist = mode_dist.to_dict(orient='records')

    # Alerts (e.g. initial_battery_health_pct < 93)
    alerts = []
    vehicles_df = df.drop_duplicates(subset=['vehicle_id'])
    for _, row in vehicles_df.iterrows():
        if row['initial_battery_health_pct'] < 93:
            alerts.append({"type": "Battery Health", "message": f"{row['car_name']} ({row['vehicle_id']}) battery health is degrading ({row['initial_battery_health_pct']}%)."})
            
    return {
        "total_vehicles": total_vehicles,
        "total_income": total_income,
        "total_maintenance": total_maintenance,
        "total_distance": round(total_distance, 1),
        "avg_fleet_performance": round(avg_fleet_performance, 1),
        "total_harsh_events": total_harsh_events,
        "recent_trips": recent_trips,
        "efficiency_by_weather": weather_eff,
        "fleet_mode_distribution": mode_dist,
        "alerts": alerts,
        "income_last_3m": round(income_last_3m, 2),
        "charging_spent_last_3m": round(charging_spent_last_3m, 2),
        "violations_last_3m": violations_last_3m,
        "trend_all": trend_all,
        "top_violations_3m": top_violations_3m
    }

def get_admin_drivers_stats():
    df = get_dataframe()
    
    # All-time stats
    grouped = df.groupby('driver_id').agg(
        total_trips=('trip_id', 'count'),
        total_distance=('daily_distance_km', 'sum'),
        total_income=('daily_income', 'sum'),
        avg_performance=('performance_score', 'mean'),
        total_harsh_braking=('harsh_braking_count', 'sum'),
        total_harsh_acceleration=('sharp_turn_count', 'sum')
    ).reset_index()
    
    grouped['total_harsh_events'] = grouped['total_harsh_braking'] + grouped['total_harsh_acceleration']
    grouped['total_distance'] = grouped['total_distance'].round(1)
    grouped['total_income'] = grouped['total_income'].round(2)
    grouped['avg_performance'] = grouped['avg_performance'].round(1)
    
    # 3-Month stats
    df['timestamp_dt'] = pd.to_datetime(df['timestamp'])
    max_date = df['timestamp_dt'].max()
    three_months_ago = max_date - pd.Timedelta(days=90)
    last_3m_df = df[df['timestamp_dt'] >= three_months_ago]
    
    last_3m_df['total_harsh_events'] = last_3m_df['harsh_braking_count'] + last_3m_df['sharp_turn_count']
    
    agg_3m = last_3m_df.groupby('driver_id').agg(
        income_3m=('daily_income', 'sum'),
        distance_3m=('daily_distance_km', 'sum'),
        violations_3m=('total_harsh_events', 'sum'),
        avg_performance_3m=('performance_score', 'mean')
    ).reset_index()
    
    # Merge 3M stats with all-time stats
    merged = pd.merge(grouped, agg_3m, on='driver_id', how='left')
    merged.fillna({'income_3m': 0, 'distance_3m': 0, 'violations_3m': 0, 'avg_performance_3m': 0}, inplace=True)
    
    merged['distance_3m'] = merged['distance_3m'].round(1)
    merged['income_3m'] = merged['income_3m'].round(2)
    merged['avg_performance_3m'] = merged['avg_performance_3m'].round(1)
    
    history_df = df.sort_values('timestamp')[['driver_id', 'timestamp', 'performance_score', 'daily_income', 'total_harsh_events', 'daily_distance_km']]
    history_dict = {}
    for did, group in history_df.groupby('driver_id'):
        history_dict[did] = group[['timestamp', 'performance_score', 'daily_income', 'total_harsh_events', 'daily_distance_km']].to_dict(orient='records')
        
    drivers_list = merged.sort_values('total_income', ascending=False).to_dict(orient='records')
    for d in drivers_list:
        d['history'] = history_dict.get(d['driver_id'], [])
        
    return drivers_list

def get_driver_dashboard_stats(driver_id):
    df = get_dataframe()
    driver_trips = df[df['driver_id'] == driver_id]
    
    total_distance = driver_trips['daily_distance_km'].sum()
    avg_performance = driver_trips['performance_score'].mean() if not driver_trips.empty else 0
    total_income = driver_trips['daily_income'].sum()
    
    trips = driver_trips.sort_values('date', ascending=False).to_dict(orient='records')
    
    recent_10 = driver_trips.sort_values('date', ascending=False).head(10).iloc[::-1]
    efficiency_trend = recent_10[['date', 'energy_efficiency_wh_per_km']].to_dict(orient='records')
    
    harsh_events_breakdown = [
        {"name": "Harsh Braking", "count": int(driver_trips['harsh_braking_count'].sum())},
        {"name": "Sharp Turns", "count": int(driver_trips['sharp_turn_count'].sum())}
    ]
    
    mode_dist = driver_trips['driving_mode'].value_counts().reset_index()
    mode_dist.columns = ['driving_mode', 'count']
    mode_dist = mode_dist.to_dict(orient='records')
    
    return {
        "total_distance": total_distance,
        "avg_performance": round(avg_performance, 2),
        "total_income": round(total_income, 2),
        "trips": trips,
        "efficiency_trend": efficiency_trend,
        "harsh_events_breakdown": harsh_events_breakdown,
        "mode_distribution": mode_dist
    }

def get_admin_brands_stats():
    df = get_dataframe()
    
    # 3-Month stats for income history
    df['timestamp_dt'] = pd.to_datetime(df['timestamp'])
    max_date = df['timestamp_dt'].max()
    three_months_ago = max_date - pd.Timedelta(days=90)
    last_3m_df = df[df['timestamp_dt'] >= three_months_ago].copy()
    
    # Aggregate by car_name (brand + model)
    grouped = df.groupby('car_name').agg(
        total_vehicles=('vehicle_id', 'nunique'),
        total_income=('daily_income', 'sum'),
        total_distance=('daily_distance_km', 'sum'),
        avg_health=('initial_battery_health_pct', 'mean')
    ).reset_index()
    
    grouped['total_income'] = grouped['total_income'].round(2)
    grouped['total_distance'] = grouped['total_distance'].round(1)
    grouped['avg_health'] = grouped['avg_health'].round(1)
    
    # Calculate daily history per brand
    history_df = df.groupby(['car_name', 'date']).agg(
        daily_income=('daily_income', 'sum'),
        daily_distance=('daily_distance_km', 'sum'),
        avg_health=('initial_battery_health_pct', 'mean')
    ).reset_index()
    history_df['daily_income'] = history_df['daily_income'].round(2)
    history_df['daily_distance'] = history_df['daily_distance'].round(2)
    history_df['avg_health'] = history_df['avg_health'].round(1)
    history_dict = {}
    for brand, group in history_df.groupby('car_name'):
        history_dict[brand] = group[['date', 'daily_income', 'daily_distance', 'avg_health']].sort_values('date').to_dict(orient='records')
        
    brands_list = grouped.sort_values('total_vehicles', ascending=False).to_dict(orient='records')
    for b in brands_list:
        b['history'] = history_dict.get(b['car_name'], [])
        
    return brands_list
