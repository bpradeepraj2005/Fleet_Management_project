import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LogOut, Battery, Map, Navigation, Activity, TrendingUp, IndianRupee as DollarSign, Route, Sun, Moon, AlertTriangle, Gauge, Thermometer, Wind, Zap, CarFront, MonitorSmartphone } from 'lucide-react';
import { 
  ComposedChart, AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend 
} from 'recharts';

const COLORS = ['#8b5cf6', '#0ea5e9', '#34d399', '#f59e0b', '#f43f5e'];

const DriverDashboard = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('stats');
  
  // ML Predictor state
  const [mlInput, setMlInput] = useState({
    current_battery_pct: 100,
    current_speed_kmh: 60,
    outside_temperature_c: 30,
    ac_status: 1,
    vehicle_weight_kg: 1800,
    driving_mode: 'Eco',
    weather_condition: 'Sunny',
    road_type: 'City'
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
    const textFields = ['road_type', 'driving_mode', 'weather_condition'];
    setMlInput(prev => ({
      ...prev,
      [name]: textFields.includes(name) ? value : (parseFloat(value) || 0)
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
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Name: {data.driver_name}</p>
        </div>
        
        <nav className="flex-col gap-2" style={{ flex: 1, marginTop: '32px' }}>
          <button onClick={() => setActiveTab('status')} className={`nav-item ${activeTab === 'status' ? 'active' : ''}`}><MonitorSmartphone size={20} /> Live Status</button>
          <button onClick={() => setActiveTab('stats')} className={`nav-item ${activeTab === 'stats' ? 'active' : ''}`}><Activity size={20} /> My Stats</button>
          <button onClick={() => setActiveTab('ml')} className={`nav-item ${activeTab === 'ml' ? 'active' : ''}`}><Battery size={20} /> Range Predictor</button>
          <button onClick={() => setActiveTab('trips')} className={`nav-item ${activeTab === 'trips' ? 'active' : ''}`}><Map size={20} /> My Recent Trips</button>
        </nav>

        <button onClick={toggleTheme} className="nav-item">
          {theme === 'dark' ? <><Sun size={20} /> Light Mode</> : <><Moon size={20} /> Dark Mode</>}
        </button>
        <button onClick={logout} className="nav-item" style={{ marginTop: '8px' }}>
          <LogOut size={20} /> Logout
        </button>
      </aside>

      <main className="main-content">
        {activeTab === 'status' && data.current_status && (
          <div className="animate-fade-in-up" style={{
            background: 'linear-gradient(135deg, #050505 0%, #111827 100%)',
            borderRadius: '24px',
            padding: '40px',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 0 40px rgba(0,0,0,0.5) inset, 0 10px 30px rgba(0,0,0,0.5)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', background: `radial-gradient(circle, ${data.current_status.driving_mode === 'Eco' ? 'rgba(52,211,153,0.1)' : data.current_status.driving_mode === 'Sport' ? 'rgba(244,63,94,0.1)' : 'rgba(14,165,233,0.1)'} 0%, transparent 50%)`, zIndex: 0, pointerEvents: 'none' }}></div>
            
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div className="flex justify-between items-center mb-12">
                <div>
                  <h3 style={{ color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '12px', marginBottom: '4px' }}>{data.current_status.car_name || 'Vehicle'}</h3>
                  <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>{data.driver_name}</h2>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h3 style={{ color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '12px', marginBottom: '4px' }}>Odometer</h3>
                  <h2 style={{ fontSize: '24px', fontFamily: 'monospace', marginBottom: '8px' }}>{data.current_status.odometer_km?.toLocaleString()} <span style={{fontSize:'14px', color: 'rgba(255,255,255,0.5)'}}>km</span></h2>
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '12px' }}>
                      <Route size={14} /> {data.current_status.road_type || 'City'}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '12px' }}>
                      <Sun size={14} /> {data.current_status.weather_condition || 'Clear'}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ width: '25%' }}>
                  <div style={{ marginBottom: '32px' }}>
                    <div className="flex items-center gap-2 mb-2"><Zap color="#34d399" /> <span style={{ color: 'rgba(255,255,255,0.6)' }}>Battery Level</span></div>
                    <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#34d399' }}>
                      {data.current_status.current_battery_pct}%
                    </div>
                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden', marginTop: '8px' }}>
                      <div style={{ width: `${data.current_status.current_battery_pct}%`, height: '100%', background: '#34d399', boxShadow: '0 0 10px #34d399' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2"><Navigation color="#0ea5e9" /> <span style={{ color: 'rgba(255,255,255,0.6)' }}>Est. Range</span></div>
                    <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#0ea5e9' }}>
                      {data.current_status.actual_remaining_range_km?.toFixed(0)} <span style={{fontSize:'18px', color: 'rgba(255,255,255,0.5)'}}>km</span>
                    </div>
                  </div>
                </div>

                <div style={{ width: '40%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ 
                    width: '280px', height: '280px', borderRadius: '50%', 
                    border: '4px solid rgba(255,255,255,0.05)', 
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `0 0 50px ${data.current_status.driving_mode === 'Eco' ? 'rgba(52,211,153,0.2)' : data.current_status.driving_mode === 'Sport' ? 'rgba(244,63,94,0.2)' : 'rgba(14,165,233,0.2)'} inset, 0 0 20px rgba(0,0,0,0.5)`,
                    position: 'relative'
                  }}>
                    <span style={{ position: 'absolute', top: '40px', color: 'rgba(255,255,255,0.4)', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '2px' }}>Speed</span>
                    <h1 style={{ fontSize: '84px', fontWeight: '900', margin: 0, textShadow: '0 0 20px rgba(255,255,255,0.5)' }}>
                      {data.current_status.current_speed_kmh?.toFixed(0) || 0}
                    </h1>
                    <span style={{ fontSize: '20px', color: 'rgba(255,255,255,0.5)', marginTop: '-10px' }}>km/h</span>
                    
                    <div style={{ 
                      marginTop: '24px', padding: '4px 16px', borderRadius: '20px', 
                      background: data.current_status.driving_mode === 'Eco' ? 'rgba(52,211,153,0.2)' : data.current_status.driving_mode === 'Sport' ? 'rgba(244,63,94,0.2)' : 'rgba(14,165,233,0.2)',
                      color: data.current_status.driving_mode === 'Eco' ? '#34d399' : data.current_status.driving_mode === 'Sport' ? '#f43f5e' : '#0ea5e9',
                      border: `1px solid ${data.current_status.driving_mode === 'Eco' ? '#34d399' : data.current_status.driving_mode === 'Sport' ? '#f43f5e' : '#0ea5e9'}`,
                      textTransform: 'uppercase', letterSpacing: '1px', fontSize: '12px', fontWeight: 'bold'
                    }}>
                      {data.current_status.driving_mode} MODE
                    </div>
                  </div>
                </div>

                <div style={{ width: '25%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div className="flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px' }}>
                    <div className="flex items-center gap-3"><Thermometer color="#f59e0b" /> <span style={{ color: 'rgba(255,255,255,0.7)' }}>Outside</span></div>
                    <span style={{ fontWeight: 'bold', fontSize: '18px' }}>{data.current_status.outside_temperature_c}°C</span>
                  </div>
                  
                  <div className="flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px' }}>
                    <div className="flex items-center gap-3"><Activity color="#f43f5e" /> <span style={{ color: 'rgba(255,255,255,0.7)' }}>Bat Temp</span></div>
                    <span style={{ fontWeight: 'bold', fontSize: '18px' }}>{data.current_status.battery_temperature_c}°C</span>
                  </div>

                  <div className="flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px' }}>
                    <div className="flex items-center gap-3"><Wind color={data.current_status.ac_status === 1 ? '#0ea5e9' : 'rgba(255,255,255,0.3)'} /> <span style={{ color: 'rgba(255,255,255,0.7)' }}>A/C Status</span></div>
                    <span style={{ fontWeight: 'bold', fontSize: '18px', color: data.current_status.ac_status === 1 ? '#0ea5e9' : 'rgba(255,255,255,0.3)' }}>
                      {data.current_status.ac_status === 1 ? 'ON' : 'OFF'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Futuristic Route Map */}
              <div style={{ 
                marginTop: '40px', 
                background: 'rgba(0, 0, 0, 0.4)', 
                borderRadius: '16px', 
                padding: '24px', 
                border: '1px solid rgba(14, 165, 233, 0.3)',
                boxShadow: '0 0 20px rgba(14, 165, 233, 0.1) inset',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Cyberpunk Grid Background */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                  backgroundImage: 'linear-gradient(rgba(14, 165, 233, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(14, 165, 233, 0.1) 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                  opacity: 0.5,
                  zIndex: 0,
                  pointerEvents: 'none'
                }}></div>
                
                <h3 style={{ position: 'relative', zIndex: 1, color: '#0ea5e9', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '12px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Map size={16} /> GPS Navigation System
                </h3>

                <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 40px' }}>
                  
                  {/* Start City */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <div style={{ 
                      width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(52, 211, 153, 0.2)', 
                      border: '2px solid #34d399', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 0 15px #34d399'
                    }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#34d399' }}></div>
                    </div>
                    <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff', textShadow: '0 0 10px rgba(255,255,255,0.5)' }}>
                      {data.current_status.start_city || 'Origin'}
                    </span>
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Departed</span>
                  </div>

                  {/* Connecting Line / Route */}
                  <div style={{ flex: 1, margin: '0 24px', position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <div style={{ width: '100%', borderBottom: '2px dashed rgba(14, 165, 233, 0.5)', position: 'absolute' }}></div>
                    <div style={{ 
                      position: 'absolute', left: '50%', transform: 'translateX(-50%)',
                      background: '#0ea5e9', padding: '8px 16px', borderRadius: '20px',
                      boxShadow: '0 0 20px #0ea5e9', display: 'flex', alignItems: 'center', gap: '8px',
                      color: '#fff', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase'
                    }}>
                      <Navigation size={14} /> En Route
                    </div>
                  </div>

                  {/* Destination City */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <div style={{ 
                      width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(244, 63, 94, 0.2)', 
                      border: '2px solid #f43f5e', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 0 15px #f43f5e'
                    }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#f43f5e' }}></div>
                    </div>
                    <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff', textShadow: '0 0 10px rgba(255,255,255,0.5)' }}>
                      {data.current_status.destination_city || 'Destination'}
                    </span>
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Arrival</span>
                  </div>

                </div>
              </div>

            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="animate-fade-in-up">
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
            <div><p className="input-label mb-2">Total Earnings</p><h3>₹{data.total_income.toLocaleString()}</h3></div>
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

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}>
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
        </div>
        </div>
        )}

        {/* ML Range Predictor Tab */}
        {activeTab === 'ml' && (
          <div className="animate-fade-in-up">
            <h1 className="mb-8">AI Range Predictor</h1>
            <div id="ml" className="glass-card hover-scale" style={{ border: '1px solid rgba(129, 140, 248, 0.4)' }}>
            <h3 className="mb-4 gradient-text flex items-center gap-4"><Battery /> AI Range Predictor</h3>
            <form onSubmit={handlePredict} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="input-group mb-0">
                <label className="input-label">Battery (%)</label>
                <input type="number" name="current_battery_pct" value={mlInput.current_battery_pct} onChange={handleInputChange} className="glass-input" min="0" max="100" required />
              </div>
              <div className="input-group mb-0">
                <label className="input-label">Current Speed (km/h)</label>
                <input type="number" name="current_speed_kmh" value={mlInput.current_speed_kmh} onChange={handleInputChange} className="glass-input" min="0" required />
              </div>
              <div className="input-group mb-0">
                <label className="input-label">Outside Temp (°C)</label>
                <input type="number" name="outside_temperature_c" value={mlInput.outside_temperature_c} onChange={handleInputChange} className="glass-input" required />
              </div>
              <div className="input-group mb-0">
                <label className="input-label">AC Status (0/1)</label>
                <input type="number" name="ac_status" value={mlInput.ac_status} onChange={handleInputChange} className="glass-input" min="0" max="1" required />
              </div>
              <div className="input-group mb-0">
                <label className="input-label">Vehicle Weight (kg)</label>
                <input type="number" name="vehicle_weight_kg" value={mlInput.vehicle_weight_kg} onChange={handleInputChange} className="glass-input" min="1000" required />
              </div>
              <div className="input-group mb-0">
                <label className="input-label">Driving Mode</label>
                <select name="driving_mode" value={mlInput.driving_mode} onChange={handleInputChange} className="glass-input">
                  <option value="Eco">Eco</option>
                  <option value="Normal">Normal</option>
                  <option value="Sport">Sport</option>
                </select>
              </div>
              <div className="input-group mb-0">
                <label className="input-label">Weather Condition</label>
                <select name="weather_condition" value={mlInput.weather_condition} onChange={handleInputChange} className="glass-input">
                  <option value="Sunny">Sunny</option>
                  <option value="Cloudy">Cloudy</option>
                  <option value="Rainy">Rainy</option>
                  <option value="Foggy">Foggy</option>
                </select>
              </div>
              <div className="input-group mb-0">
                <label className="input-label">Road Type</label>
                <select name="road_type" value={mlInput.road_type} onChange={handleInputChange} className="glass-input">
                  <option value="City">City</option>
                  <option value="Highway">Highway</option>
                </select>
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
        )}

        {/* My Trips Table Tab */}
        {activeTab === 'trips' && (
          <div className="animate-fade-in-up">
            <h1 className="mb-8">My Recent Trips</h1>
            <div className="glass-card hover-scale">
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
                {data.trips.slice(0, 10).map((trip, i) => (
                  <tr key={i}>
                    <td>{trip.date}</td>
                    <td>{trip.vehicle_id}</td>
                    <td>{trip.predominant_location_type || 'City'}</td>
                    <td>{trip.daily_distance_km}</td>
                    <td style={{ color: 'var(--success)', fontWeight: 'bold' }}>₹{trip.daily_income}</td>
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
        </div>
        )}
      </main>
    </div>
  );
};

export default DriverDashboard;
