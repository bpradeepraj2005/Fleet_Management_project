import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Activity, Car, DollarSign, AlertTriangle, LogOut, Users, TrendingUp, Route, Award, ShieldAlert, Sun, Moon, Clock, BatteryCharging } from 'lucide-react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  ComposedChart, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter, ZAxis, RadialBarChart, RadialBar
} from 'recharts';

const COLORS = ['#0ea5e9', '#8b5cf6', '#34d399', '#f43f5e', '#f59e0b'];

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [data, setData] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const [dashRes, vehRes, drivRes] = await Promise.all([
          axios.get('http://localhost:8001/admin/dashboard', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://localhost:8001/admin/vehicles', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://localhost:8001/admin/drivers', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setData(dashRes.data);
        setVehicles(vehRes.data);
        setDrivers(drivRes.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  if (!data || !vehicles.length || !drivers.length) return <div className="app-container items-center justify-center">Loading...</div>;

  // Visual Processing
  const topDrivers = [...drivers].sort((a, b) => b.total_income - a.total_income).slice(0, 5);
  const fleetDistMap = vehicles.reduce((acc, v) => { acc[v.car_name] = (acc[v.car_name] || 0) + 1; return acc; }, {});
  const fleetDistData = Object.keys(fleetDistMap).map(k => ({ name: k, value: fleetDistMap[k] }));

  const topRiskVehicles = [...vehicles].sort((a, b) => b.failure_risk_score - a.failure_risk_score).slice(0, 5);
  const topDowntimeVehicles = [...vehicles].sort((a, b) => b.downtime_hours - a.downtime_hours).slice(0, 5);
  
  const chargingStatusMap = vehicles.reduce((acc, v) => {
    const status = v.charging_status === 1 ? 'Charging' : 'Idle';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
  const chargingData = Object.keys(chargingStatusMap).map(k => ({ name: k, value: chargingStatusMap[k] }));

  const modelHealth = vehicles.reduce((acc, v) => {
    if (!acc[v.car_name]) acc[v.car_name] = { name: v.car_name, total: 0, count: 0 };
    acc[v.car_name].total += v.initial_battery_health_pct;
    acc[v.car_name].count += 1;
    return acc;
  }, {});
  const radialData = Object.values(modelHealth).map((m, i) => ({
    name: m.name, health: Math.round(m.total / m.count), fill: COLORS[i % COLORS.length]
  }));

  const scatterData = vehicles.map(v => ({
    name: v.car_name, capacity: v.battery_capacity_kwh, range: v.max_range_km, age: v.vehicle_age_years
  }));

  const effortRewardData = drivers.map(d => ({
    id: d.driver_id, distance: d.total_distance, income: d.total_income
  }));

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div>
          <h2 className="sidebar-title">EV Fleet Admin</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Welcome, {user?.email}</p>
        </div>
        
        <nav className="flex-col gap-2" style={{ flex: 1, marginTop: '32px' }}>
          <button onClick={() => setActiveTab('overview')} className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}>
            <Activity size={20} /> Overview
          </button>
          <button onClick={() => setActiveTab('vehicles')} className={`nav-item ${activeTab === 'vehicles' ? 'active' : ''}`}>
            <Car size={20} /> Vehicles
          </button>
          <button onClick={() => setActiveTab('drivers')} className={`nav-item ${activeTab === 'drivers' ? 'active' : ''}`}>
            <Users size={20} /> Drivers Analytics
          </button>
        </nav>
        <button onClick={toggleTheme} className="nav-item">
          {theme === 'dark' ? <><Sun size={20} /> Light Mode</> : <><Moon size={20} /> Dark Mode</>}
        </button>
        <button onClick={logout} className="nav-item" style={{ marginTop: '8px' }}>
          <LogOut size={20} /> Logout
        </button>
      </aside>

      <main className="main-content">
        {activeTab === 'overview' && (
          <div className="animate-fade-in-up">
            <h1 className="mb-8">Fleet Command Center</h1>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '32px' }}>
              <div className="glass-card flex items-center justify-between animate-fade-in-up stagger-1 hover-scale hover-glow">
                <div><p className="input-label mb-2">Income (Last 3M)</p><h3>${data.income_last_3m.toLocaleString()}</h3></div>
                <DollarSign size={32} color="var(--success)" />
              </div>
              <div className="glass-card flex items-center justify-between animate-fade-in-up stagger-2 hover-scale hover-glow">
                <div><p className="input-label mb-2">Charging Spent (Last 3M)</p><h3>${data.charging_spent_last_3m.toLocaleString()}</h3></div>
                <BatteryCharging size={32} color="var(--warning)" />
              </div>
              <div className="glass-card flex items-center justify-between animate-fade-in-up stagger-3 hover-scale hover-glow">
                <div><p className="input-label mb-2">Fleet Violations (Last 3M)</p><h3>{data.violations_last_3m}</h3></div>
                <AlertTriangle size={32} color="var(--danger)" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '32px' }}>
              <div className="glass-card animate-fade-in-up stagger-4 hover-scale">
                <h3 className="mb-4 flex items-center gap-2"><Activity color="#8b5cf6" /> Income vs Charging Spent (Last 3M)</h3>
                <div style={{ height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data.trend_3m}>
                      <defs>
                        <linearGradient id="colorIncome3m" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--success)" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="var(--success)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" vertical={false} />
                      <XAxis dataKey="date" stroke="var(--text-secondary)" tick={{fontSize: 12}} minTickGap={20} />
                      <YAxis yAxisId="left" stroke="var(--text-secondary)" tick={{fontSize: 12}} label={{ value: 'Amount ($)', angle: -90, position: 'insideLeft', fill: 'var(--text-secondary)' }} />
                      <Tooltip contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid var(--glass-border)', borderRadius: '8px' }} />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px', color: 'var(--text-secondary)' }} />
                      <Area yAxisId="left" type="monotone" dataKey="daily_income" name="Income" stroke="var(--success)" fillOpacity={1} fill="url(#colorIncome3m)" animationDuration={1500} />
                      <Line yAxisId="left" type="monotone" dataKey="charging_cost" name="Charging Spent" stroke="var(--warning)" strokeWidth={3} dot={false} animationDuration={2000} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass-card animate-fade-in-up stagger-5 hover-scale">
                <h3 className="mb-4 flex items-center gap-2"><AlertTriangle color="#f43f5e" /> Top Violators (Last 3M)</h3>
                <div style={{ height: '300px' }}>
                  <ResponsiveContainer>
                    <BarChart data={data.top_violations_3m} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" horizontal={false} />
                      <XAxis type="number" stroke="var(--text-secondary)" tick={{fontSize: 12}} />
                      <YAxis dataKey="driver_id" type="category" stroke="var(--text-secondary)" tick={{fontSize: 12}} width={80} />
                      <Tooltip contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid var(--glass-border)', borderRadius: '8px' }} />
                      <Bar dataKey="total_harsh_events" fill="#f43f5e" name="Violations" radius={[0, 4, 4, 0]} animationDuration={1500} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
              <div className="glass-card animate-fade-in-up stagger-4 hover-scale">
                <h3 className="mb-4 flex items-center gap-2"><Sun color="#f59e0b" /> Weather Impact on Efficiency</h3>
                <div style={{ height: '300px' }}>
                  <ResponsiveContainer>
                    <BarChart data={data.efficiency_by_weather}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" vertical={false} />
                      <XAxis dataKey="weather_condition" stroke="var(--text-secondary)" tick={{fontSize: 12}} />
                      <YAxis stroke="var(--text-secondary)" tick={{fontSize: 12}} label={{ value: 'Efficiency (Wh/km)', angle: -90, position: 'insideLeft', fill: 'var(--text-secondary)' }} />
                      <Tooltip contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid var(--glass-border)', borderRadius: '8px' }} />
                      <Bar dataKey="avg_efficiency" name="Avg Efficiency" fill="#0ea5e9" radius={[4, 4, 0, 0]} animationDuration={1500} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass-card flex-col items-center justify-center animate-fade-in-up stagger-5 hover-scale">
                <h3 className="mb-4 w-full text-left flex items-center gap-2"><Car color="#34d399" /> Driving Mode Distribution</h3>
                <div style={{ height: '300px', width: '100%' }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={data.fleet_mode_distribution} innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="count" nameKey="driving_mode" animationDuration={1000} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={{ stroke: 'var(--text-secondary)' }}>
                        {data.fleet_mode_distribution.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
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

        {activeTab === 'vehicles' && (
          <div className="animate-fade-in-up">
            <h1 className="mb-8">Vehicles Telemetry</h1>
            
            {selectedVehicle ? (
              <div className="glass-card mb-8 animate-fade-in-up hover-scale">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Car color="var(--accent-primary)" /> {selectedVehicle.car_name} ({selectedVehicle.vehicle_id})</h3>
                  <button onClick={() => setSelectedVehicle(null)} style={{ background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', padding: '6px 16px', borderRadius: '4px', cursor: 'pointer' }}>Close</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                  <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                    <p className="input-label mb-1">Income (Last 3M)</p>
                    <h4 style={{ color: 'var(--success)' }}>${selectedVehicle.income_3m?.toLocaleString() || 0}</h4>
                  </div>
                  <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                    <p className="input-label mb-1">Maintenance (Last 3M)</p>
                    <h4 style={{ color: '#f43f5e' }}>${selectedVehicle.maintenance_3m?.toLocaleString() || 0}</h4>
                  </div>
                  <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                    <p className="input-label mb-1">Charging Cost (Last 3M)</p>
                    <h4 style={{ color: 'var(--warning)' }}>${selectedVehicle.charging_cost_3m?.toFixed(2) || 0}</h4>
                  </div>
                  <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                    <p className="input-label mb-1">Current Battery Health</p>
                    <h4 style={{ color: selectedVehicle.initial_battery_health_pct > 93 ? 'var(--success)' : 'var(--warning)' }}>{selectedVehicle.initial_battery_health_pct}%</h4>
                  </div>
                </div>
                
                <h4 className="mb-4" style={{ color: 'var(--text-secondary)' }}>Battery Degradation History</h4>
                <div style={{ height: '250px' }}>
                  <ResponsiveContainer>
                    <LineChart data={selectedVehicle.battery_history || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" vertical={false} />
                      <XAxis dataKey="timestamp" stroke="var(--text-secondary)" tick={{fontSize: 12}} tickFormatter={(val) => new Date(val).toLocaleDateString()} />
                      <YAxis domain={['auto', 'auto']} stroke="var(--text-secondary)" tick={{fontSize: 12}} label={{ value: 'State of Health (%)', angle: -90, position: 'insideLeft', fill: 'var(--text-secondary)' }} />
                      <Tooltip contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid var(--glass-border)', borderRadius: '8px' }} labelFormatter={(val) => new Date(val).toLocaleDateString()} />
                      <Line type="monotone" dataKey="state_of_health_soh" name="SoH (%)" stroke="#8b5cf6" strokeWidth={2} dot={false} animationDuration={1000} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="glass-card mb-8 animate-fade-in-up stagger-3 hover-scale">
                <h3 className="mb-4">Fleet Battery Degradation Analysis</h3>
                <div style={{ height: '300px' }}>
                  <ResponsiveContainer>
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" />
                      <XAxis type="number" dataKey="vehicle_age_years" name="Age" unit=" yrs" stroke="var(--text-secondary)" tick={{fontSize: 12}} label={{ value: 'Vehicle Age (Years)', position: 'insideBottom', offset: -10, fill: 'var(--text-secondary)', fontSize: 12 }} />
                      <YAxis type="number" dataKey="initial_battery_health_pct" name="SoH" unit="%" domain={['dataMin - 2', 'dataMax + 2']} stroke="var(--text-secondary)" tick={{fontSize: 12}} label={{ value: 'State of Health (%)', angle: -90, position: 'insideLeft', fill: 'var(--text-secondary)', fontSize: 12, style: {textAnchor: 'middle'} }} />
                      <ZAxis type="category" dataKey="vehicle_id" name="Vehicle ID" />
                      <Tooltip cursor={{strokeDasharray: '3 3'}} contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid var(--glass-border)', borderRadius: '8px' }} />
                      <Scatter name="Battery Health" data={vehicles} fill="#8b5cf6" animationDuration={1500} />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            <div className="glass-card animate-fade-in-up stagger-4 hover-scale">
              <div className="table-container">
                <table>
                  <thead>
                    <tr><th>Vehicle ID</th><th>Model</th><th>Capacity</th><th>Max Range</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {vehicles.map((v, i) => (
                      <tr key={i} onClick={() => setSelectedVehicle(v)} style={{ cursor: 'pointer' }} className="hover-row">
                        <td style={{ fontWeight: 'bold' }}>{v.vehicle_id}</td>
                        <td>{v.car_name}</td>
                        <td>{v.battery_capacity_kwh} kWh</td>
                        <td>{v.max_range_km} km</td>
                        <td><span className={`badge ${v.initial_battery_health_pct > 93 ? 'badge-success' : 'badge-warning'}`}>{v.initial_battery_health_pct}% Health</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'drivers' && (
          <div className="animate-fade-in-up">
            <h1 className="mb-8">Driver Analytics & Performance</h1>
            
            {selectedDriver ? (
              <div className="glass-card mb-8 animate-fade-in-up hover-scale">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Users color="var(--accent-primary)" /> {selectedDriver.driver_id}</h3>
                  <button onClick={() => setSelectedDriver(null)} style={{ background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', padding: '6px 16px', borderRadius: '4px', cursor: 'pointer' }}>Close</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                  <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                    <p className="input-label mb-1">Income (Last 3M)</p>
                    <h4 style={{ color: 'var(--success)' }}>${selectedDriver.income_3m?.toLocaleString() || 0}</h4>
                  </div>
                  <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                    <p className="input-label mb-1">Distance (Last 3M)</p>
                    <h4 style={{ color: 'var(--accent-primary)' }}>{selectedDriver.distance_3m?.toLocaleString() || 0} km</h4>
                  </div>
                  <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                    <p className="input-label mb-1">Violations (Last 3M)</p>
                    <h4 style={{ color: selectedDriver.violations_3m > 5 ? 'var(--danger)' : 'var(--warning)' }}>{selectedDriver.violations_3m || 0}</h4>
                  </div>
                  <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                    <p className="input-label mb-1">Avg Performance (Last 3M)</p>
                    <h4 style={{ color: selectedDriver.avg_performance_3m > 80 ? 'var(--success)' : 'var(--warning)' }}>{selectedDriver.avg_performance_3m || 0}%</h4>
                  </div>
                </div>

                <h4 className="mb-4" style={{ color: 'var(--text-secondary)' }}>Driver Performance History</h4>
                <div style={{ height: '250px' }}>
                  <ResponsiveContainer>
                    <LineChart data={selectedDriver.history || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" vertical={false} />
                      <XAxis dataKey="timestamp" stroke="var(--text-secondary)" tick={{fontSize: 12}} tickFormatter={(val) => new Date(val).toLocaleDateString()} />
                      <YAxis domain={[0, 100]} stroke="var(--text-secondary)" tick={{fontSize: 12}} label={{ value: 'Performance Score', angle: -90, position: 'insideLeft', fill: 'var(--text-secondary)' }} />
                      <Tooltip contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid var(--glass-border)', borderRadius: '8px' }} labelFormatter={(val) => new Date(val).toLocaleDateString()} />
                      <Line type="monotone" dataKey="performance_score" name="Performance Score" stroke="#34d399" strokeWidth={2} dot={false} animationDuration={1000} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="glass-card mb-8 animate-fade-in-up stagger-2 hover-scale">
                <h3 className="mb-4 flex items-center gap-2"><TrendingUp color="#34d399" /> Fleet Driver Trip Volume Analysis</h3>
                <div style={{ height: '300px' }}>
                  <ResponsiveContainer>
                    <BarChart data={drivers.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" vertical={false} />
                      <XAxis dataKey="driver_id" stroke="var(--text-secondary)" tick={{fontSize: 12}} label={{ value: 'Driver ID', position: 'insideBottom', offset: -10, fill: 'var(--text-secondary)' }} />
                      <YAxis stroke="var(--text-secondary)" tick={{fontSize: 12}} label={{ value: 'Total Trips', angle: -90, position: 'insideLeft', fill: 'var(--text-secondary)', fontSize: 12, style: {textAnchor: 'middle'} }} />
                      <Tooltip contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid var(--glass-border)', borderRadius: '8px' }} />
                      <Bar dataKey="total_trips" name="Number of Trips" fill="#34d399" radius={[4, 4, 0, 0]} animationDuration={1500} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            <div className="glass-card animate-fade-in-up stagger-3 hover-scale">
              <div className="table-container">
                <table>
                  <thead>
                    <tr><th>Driver ID</th><th>Total Distance</th><th>Total Revenue</th><th>Harsh Events</th><th>Avg Performance</th></tr>
                  </thead>
                  <tbody>
                    {drivers.map((d, i) => (
                      <tr key={i} onClick={() => setSelectedDriver(d)} style={{ cursor: 'pointer' }} className="hover-row">
                        <td style={{ fontWeight: 'bold' }}>{d.driver_id}</td>
                        <td>{d.total_distance.toLocaleString()} km</td>
                        <td style={{ color: 'var(--success)', fontWeight: 'bold' }}>${d.total_income.toLocaleString()}</td>
                        <td><span style={{ color: d.total_harsh_events > 15 ? 'var(--danger)' : 'var(--text-secondary)' }}>{d.total_harsh_events}</span></td>
                        <td><span className={`badge ${d.avg_performance > 80 ? 'badge-success' : 'badge-warning'}`}>{d.avg_performance}</span></td>
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

export default AdminDashboard;
