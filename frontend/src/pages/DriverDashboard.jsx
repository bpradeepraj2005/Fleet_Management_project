import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LogOut, Battery, Map, Navigation, Activity, TrendingUp, DollarSign, Route, Sun, Moon, AlertTriangle } from 'lucide-react';
import { 
  ComposedChart, AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend 
} from 'recharts';

const COLORS = ['#8b5cf6', '#0ea5e9', '#34d399', '#f59e0b', '#f43f5e'];

const DriverDashboard = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [data, setData] = useState(null);
  
  // ML Predictor state
  const [mlInput, setMlInput] = useState({
    current_battery_percent: 100,
    current_speed_kmph: 60,
    air_conditioning_usage: 1,
    outside_temperature_c: 30,
    avg_gradient_percent: 0,
    road_type: 'City',
    driver_behavior_score: 85
  });
  const [prediction, setPrediction] = useState(null);
  const [mlLoading, setMlLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:8001/driver/dashboard', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setData(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const handlePredict = async (e) => {
    e.preventDefault();
    setMlLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:8001/predict_range', mlInput, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPrediction(res.data.predicted_range_km);
    } catch (err) {
      console.error(err);
      alert('Prediction failed. Model might not be trained yet.');
    } finally {
      setMlLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setMlInput(prev => ({
      ...prev,
      [name]: (name === 'road_type') ? value : parseFloat(value) || 0
    }));
  };

  if (!data) return <div className="app-container items-center justify-center">Loading...</div>;

  // Process data for new charts
  const routeDistMap = data.trips.reduce((acc, t) => {
    const loc = t.predominant_location_type || 'Unknown';
    acc[loc] = (acc[loc] || 0) + 1;
    return acc;
  }, {});
  const routeDistData = Object.keys(routeDistMap).map(k => ({ name: k, value: routeDistMap[k] }));

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div>
          <h2 className="sidebar-title">Driver Portal</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>ID: {user?.driver_id}</p>
        </div>
        
        <nav className="flex-col gap-2" style={{ flex: 1, marginTop: '32px' }}>
          <a href="#" className="nav-item active"><Activity size={20} /> My Stats</a>
          <a href="#ml" className="nav-item"><Battery size={20} /> Range Predictor</a>
        </nav>

        <button onClick={toggleTheme} className="nav-item">
          {theme === 'dark' ? <><Sun size={20} /> Light Mode</> : <><Moon size={20} /> Dark Mode</>}
        </button>
        <button onClick={logout} className="nav-item" style={{ marginTop: '8px' }}>
          <LogOut size={20} /> Logout
        </button>
      </aside>

      <main className="main-content">
        <h1 className="mb-8">My Performance Overview</h1>
        
        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '32px' }}>
          <div className="glass-card flex items-center justify-between animate-fade-in-up stagger-1 hover-scale hover-glow">
            <div><p className="input-label mb-2">Total Distance</p><h3>{data.total_distance.toLocaleString()} km</h3></div>
            <Map size={32} color="var(--accent-primary)" />
          </div>
          <div className="glass-card flex items-center justify-between animate-fade-in-up stagger-2 hover-scale hover-glow">
            <div><p className="input-label mb-2">Avg Performance Score</p><h3>{data.avg_performance}%</h3></div>
            <Activity size={32} color={data.avg_performance > 80 ? 'var(--success)' : 'var(--warning)'} />
          </div>
          <div className="glass-card flex items-center justify-between animate-fade-in-up stagger-3 hover-scale hover-glow">
            <div><p className="input-label mb-2">Total Earnings</p><h3>${data.total_income.toLocaleString()}</h3></div>
            <DollarSign size={32} color="var(--success)" />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
          {/* Efficiency Trend Chart */}
          <div className="glass-card animate-fade-in-up stagger-4 hover-scale">
            <h3 className="mb-4 flex items-center gap-2"><Activity color="#8b5cf6" /> Energy Efficiency Trend</h3>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.efficiency_trend}>
                  <defs>
                    <linearGradient id="colorEff" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" vertical={false} />
                  <XAxis dataKey="date" stroke="var(--text-secondary)" tick={{fontSize: 12}} />
                  <YAxis stroke="var(--text-secondary)" tick={{fontSize: 12}} label={{ value: 'Efficiency (Wh/km)', angle: -90, position: 'insideLeft', fill: 'var(--text-secondary)', style: {textAnchor: 'middle'} }} />
                  <Tooltip contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid var(--glass-border)', borderRadius: '8px' }} />
                  <Area type="monotone" dataKey="energy_efficiency_wh_per_km" name="Efficiency (Wh/km)" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorEff)" animationDuration={1500} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Safety & Harsh Events Chart */}
          <div className="glass-card animate-fade-in-up stagger-5 hover-scale">
            <h3 className="mb-4 flex items-center gap-2"><AlertTriangle color="#f43f5e" /> Harsh Driving Events</h3>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.harsh_events_breakdown} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" horizontal={false} />
                  <XAxis type="number" stroke="var(--text-secondary)" tick={{fontSize: 12}} />
                  <YAxis dataKey="name" type="category" stroke="var(--text-secondary)" tick={{fontSize: 12}} width={100} />
                  <Tooltip contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid var(--glass-border)', borderRadius: '8px' }} />
                  <Bar dataKey="count" fill="#f43f5e" name="Instances" radius={[0, 4, 4, 0]} animationDuration={1500} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '24px', marginBottom: '32px' }}>
          {/* Trip Route Distribution */}
          <div className="glass-card animate-fade-in-up stagger-1 hover-scale">
            <h3 className="mb-4 flex items-center gap-2"><Route color="#0ea5e9" /> Route Distribution</h3>
            <div style={{ height: '250px' }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={routeDistData} innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value" animationDuration={1000} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={{ stroke: 'var(--text-secondary)' }}>
                    {routeDistData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid var(--glass-border)', borderRadius: '8px' }} />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Driving Mode Distribution */}
          <div className="glass-card animate-fade-in-up stagger-1 hover-scale">
            <h3 className="mb-4 flex items-center gap-2"><Navigation color="#34d399" /> Mode Selection</h3>
            <div style={{ height: '250px' }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={data.mode_distribution} innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="count" nameKey="driving_mode" animationDuration={1000} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={{ stroke: 'var(--text-secondary)' }}>
                    {data.mode_distribution.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid var(--glass-border)', borderRadius: '8px' }} />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ML Range Predictor */}
          <div id="ml" className="glass-card animate-fade-in-up stagger-2 hover-scale" style={{ border: '1px solid rgba(129, 140, 248, 0.4)' }}>
            <h3 className="mb-4 gradient-text flex items-center gap-4"><Battery /> AI Range Predictor</h3>
            <form onSubmit={handlePredict} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="input-group mb-0">
                <label className="input-label">Current Battery %</label>
                <input type="number" name="current_battery_percent" value={mlInput.current_battery_percent} onChange={handleInputChange} className="glass-input" required />
              </div>
              <div className="input-group mb-0">
                <label className="input-label">Current Speed (km/h)</label>
                <input type="number" name="current_speed_kmph" value={mlInput.current_speed_kmph} onChange={handleInputChange} className="glass-input" required />
              </div>
              <div className="input-group mb-0">
                <label className="input-label">AC Status (0/1)</label>
                <input type="number" name="air_conditioning_usage" value={mlInput.air_conditioning_usage} onChange={handleInputChange} className="glass-input" min="0" max="1" required />
              </div>
              <div className="input-group mb-0">
                <label className="input-label">Outside Temp (°C)</label>
                <input type="number" name="outside_temperature_c" value={mlInput.outside_temperature_c} onChange={handleInputChange} className="glass-input" required />
              </div>
              <div className="input-group mb-0">
                <label className="input-label">Avg Gradient (%)</label>
                <input type="number" step="0.1" name="avg_gradient_percent" value={mlInput.avg_gradient_percent} onChange={handleInputChange} className="glass-input" required />
              </div>
              <div className="input-group mb-0">
                <label className="input-label">Road Type</label>
                <select name="road_type" value={mlInput.road_type} onChange={handleInputChange} className="glass-input">
                  <option value="City">City</option>
                  <option value="Highway">Highway</option>
                </select>
              </div>
              <div className="input-group mb-0">
                <label className="input-label">Efficiency Score (0 - 100)</label>
                <input type="number" name="driver_behavior_score" value={mlInput.driver_behavior_score} onChange={handleInputChange} className="glass-input" required />
              </div>
              
              <div className="flex items-center" style={{ gridColumn: '1 / -1', marginTop: '16px' }}>
                <button type="submit" className="btn btn-primary" disabled={mlLoading}>
                  {mlLoading ? 'Predicting...' : 'Predict Remaining Range'}
                </button>
                
                {prediction !== null && (
                  <div style={{ marginLeft: 'auto', padding: '12px 24px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px' }}>
                    <span className="text-secondary">Estimated Range:</span> <strong style={{ fontSize: '1.25rem', color: 'var(--success)', marginLeft: '8px' }}>{prediction.toFixed(1)} km</strong>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* My Trips Table */}
        <div className="glass-card animate-fade-in-up stagger-3 hover-scale">
          <h3 className="mb-4">My Recent Trips</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Vehicle</th>
                  <th>Route Type</th>
                  <th>Distance (km)</th>
                  <th>Earnings</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {data.trips.map((trip, i) => (
                  <tr key={i}>
                    <td>{trip.date}</td>
                    <td>{trip.car_name}</td>
                    <td>{trip.predominant_location_type || 'City'}</td>
                    <td>{trip.daily_distance_km}</td>
                    <td style={{ color: 'var(--success)', fontWeight: 'bold' }}>${trip.daily_income}</td>
                    <td>
                      <span className={`badge ${trip.performance_score > 80 ? 'badge-success' : 'badge-warning'}`}>
                        {trip.performance_score}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DriverDashboard;
