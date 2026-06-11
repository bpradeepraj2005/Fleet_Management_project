import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Activity, Car, IndianRupee as DollarSign, AlertTriangle, LogOut, Users, TrendingUp, TrendingDown, Route, Award, ShieldAlert, Sun, Moon, Clock, BatteryCharging, Search, ChevronUp, ChevronDown } from 'lucide-react';
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
  const [brands, setBrands] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [vehicleChartType, setVehicleChartType] = useState('line');
  const [driverChartType, setDriverChartType] = useState('line');
  const [brandChartType, setBrandChartType] = useState('pie');
  const [overviewChartType, setOverviewChartType] = useState('line');
  const [vehicleMetric, setVehicleMetric] = useState('state_of_health_soh');
  const [driverMetric, setDriverMetric] = useState('performance_score');
  const [brandMetric, setBrandMetric] = useState('daily_income');
  const [timeRange, setTimeRange] = useState('3m');
  const [timeGrouping, setTimeGrouping] = useState('daily');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [filterStatus, setFilterStatus] = useState('all');

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const getSortedAndFilteredData = (dataArray, searchFields, customFilterFn) => {
    let processed = [...dataArray];
    if (customFilterFn && filterStatus !== 'all') {
      processed = processed.filter(item => customFilterFn(item, filterStatus));
    }
    if (sortConfig.key) {
      processed.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return processed;
  };

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return null;
    return sortConfig.direction === 'asc' ? <ChevronUp size={14} style={{ display: 'inline', marginLeft: '4px' }} /> : <ChevronDown size={14} style={{ display: 'inline', marginLeft: '4px' }} />;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const [dashRes, vehRes, drivRes, brandRes] = await Promise.all([
          axios.get('http://localhost:8001/admin/dashboard', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://localhost:8001/admin/vehicles', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://localhost:8001/admin/drivers', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://localhost:8001/admin/brands', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setData(dashRes.data);
        setVehicles(vehRes.data);
        setDrivers(drivRes.data);
        setBrands(brandRes.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  if (!data || !vehicles.length || !drivers.length || !brands.length) return <div className="app-container items-center justify-center">Loading...</div>;

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
    name: d.driver_name, distance: d.total_distance, income: d.total_income
  }));

  const processedVehicles = getSortedAndFilteredData(vehicles, ['vehicle_id', 'car_name'], (item, status) => {
    if (status === 'healthy') return item.initial_battery_health_pct > 93;
    if (status === 'warning') return item.initial_battery_health_pct <= 93;
    return true;
  });
  const processedDrivers = getSortedAndFilteredData(drivers, ['driver_name'], (item, status) => {
    if (status === 'good') return item.avg_performance > 80;
    if (status === 'warning') return item.avg_performance <= 80;
    return true;
  });
  const processedBrands = getSortedAndFilteredData(brands, ['car_name']);

  const vehicleSortOptions = [
    { label: 'Vehicle ID', value: 'vehicle_id' },
    { label: 'Model', value: 'car_name' },
    { label: 'Capacity', value: 'battery_capacity_kwh' },
    { label: 'Max Range', value: 'max_range_km' },
    { label: 'Health Status', value: 'initial_battery_health_pct' }
  ];
  const driverSortOptions = [
    { label: 'Driver Name', value: 'driver_name' },
    { label: 'Total Distance', value: 'total_distance' },
    { label: 'Total Revenue', value: 'total_income' },
    { label: 'Harsh Events', value: 'total_harsh_events' },
    { label: 'Avg Score', value: 'avg_performance' }
  ];
  const brandSortOptions = [
    { label: 'Car Model', value: 'car_name' },
    { label: 'Total Vehicles', value: 'total_vehicles' },
    { label: 'Total Distance', value: 'total_distance' },
    { label: 'Total Revenue', value: 'total_income' },
    { label: 'Avg Health', value: 'avg_health' }
  ];

  const renderTableControls = (sortOptions, filterType) => (
    <div style={{ display: 'flex', gap: '8px' }}>
      <select value={sortConfig.key || ''} onChange={(e) => setSortConfig({ ...sortConfig, key: e.target.value })} style={{ flex: 1, padding: '8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)', cursor: 'pointer' }}>
        <option value="" disabled>Sort By...</option>
        {sortOptions.map(opt => <option key={opt.value} value={opt.value} style={{ background: 'var(--bg-primary)' }}>{opt.label}</option>)}
      </select>
      <select value={sortConfig.direction} onChange={(e) => setSortConfig({ ...sortConfig, direction: e.target.value })} style={{ flex: 1, padding: '8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)', cursor: 'pointer' }}>
        <option value="asc" style={{ background: 'var(--bg-primary)' }}>Asc</option>
        <option value="desc" style={{ background: 'var(--bg-primary)' }}>Desc</option>
      </select>
      {filterType === 'vehicles' && (
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ flex: 1, padding: '8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)', cursor: 'pointer' }}>
          <option value="all" style={{ background: 'var(--bg-primary)' }}>All Health</option>
          <option value="healthy" style={{ background: 'var(--bg-primary)' }}>Healthy &gt;93%</option>
          <option value="warning" style={{ background: 'var(--bg-primary)' }}>Warning &lt;=93%</option>
        </select>
      )}
      {filterType === 'drivers' && (
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ flex: 1, padding: '8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)', cursor: 'pointer' }}>
          <option value="all" style={{ background: 'var(--bg-primary)' }}>All Scores</option>
          <option value="good" style={{ background: 'var(--bg-primary)' }}>Good &gt;80%</option>
          <option value="warning" style={{ background: 'var(--bg-primary)' }}>Warning &lt;=80%</option>
        </select>
      )}
    </div>
  );

  const ChartSelector = ({ value, onChange }) => (
    <select value={value} onChange={e => onChange(e.target.value)} className="glass-input" style={{ padding: '4px 8px', fontSize: '12px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)', borderRadius: '4px', cursor: 'pointer' }}>
      <option value="line" style={{ background: 'var(--bg-primary)' }}>Line Chart</option>
      <option value="bar" style={{ background: 'var(--bg-primary)' }}>Bar Chart</option>
      <option value="pie" style={{ background: 'var(--bg-primary)' }}>Pie Chart</option>
    </select>
  );

  const MetricSelector = ({ value, onChange, options }) => (
    <select value={value} onChange={e => onChange(e.target.value)} className="glass-input" style={{ padding: '4px 8px', fontSize: '12px', marginRight: '8px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)', borderRadius: '4px', cursor: 'pointer' }}>
      {options.map(o => <option key={o.value} value={o.value} style={{ background: 'var(--bg-primary)' }}>{o.label}</option>)}
    </select>
  );

  const vehicleMetricOptions = [
    { label: 'State of Health (%)', value: 'state_of_health_soh' },
    { label: 'Daily Income (₹)', value: 'daily_income' },
    { label: 'Trip Distance (km)', value: 'trip_distance_km' }
  ];
  
  const driverMetricOptions = [
    { label: 'Performance Score', value: 'performance_score' },
    { label: 'Daily Income (₹)', value: 'daily_income' },
    { label: 'Harsh Events', value: 'total_harsh_events' }
  ];
  
  const brandMetricOptions = [
    { label: 'Daily Income (₹)', value: 'daily_income' },
    { label: 'Daily Distance (km)', value: 'daily_distance' }
  ];

  const TimeControls = ({ range, setRange, grouping, setGrouping }) => (
    <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
      <select value={grouping} onChange={e => setGrouping(e.target.value)} className="glass-input" style={{ padding: '4px 8px', fontSize: '12px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)', borderRadius: '4px', cursor: 'pointer' }}>
        <option value="daily" style={{ background: 'var(--bg-primary)' }}>Daily</option>
        <option value="monthly" style={{ background: 'var(--bg-primary)' }}>Monthly</option>
        <option value="yearly" style={{ background: 'var(--bg-primary)' }}>Yearly</option>
      </select>
      <select value={range} onChange={e => setRange(e.target.value)} className="glass-input" style={{ padding: '4px 8px', fontSize: '12px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)', borderRadius: '4px', cursor: 'pointer' }}>
        <option value="3m" style={{ background: 'var(--bg-primary)' }}>Last 3 Months</option>
        <option value="6m" style={{ background: 'var(--bg-primary)' }}>Last 6 Months</option>
        <option value="1y" style={{ background: 'var(--bg-primary)' }}>Last Year</option>
        <option value="all" style={{ background: 'var(--bg-primary)' }}>All Time</option>
      </select>
    </div>
  );

  const aggregateChartData = (data, dateField, range, grouping) => {
    if (!data || !data.length) return [];
    
    const maxTime = Math.max(...data.map(d => new Date(d[dateField]).getTime()));
    const maxDate = new Date(maxTime);
    
    let cutoff = new Date(maxDate);
    if (range === '3m') cutoff.setMonth(maxDate.getMonth() - 3);
    else if (range === '6m') cutoff.setMonth(maxDate.getMonth() - 6);
    else if (range === '1y') cutoff.setFullYear(maxDate.getFullYear() - 1);
    else cutoff = new Date(0); // all

    const filtered = data.filter(d => new Date(d[dateField]) >= cutoff);

    const groups = {};
    filtered.forEach(d => {
      const dObj = new Date(d[dateField]);
      let key = dObj.toISOString().split('T')[0];
      if (grouping === 'monthly') key = key.substring(0, 7);
      if (grouping === 'yearly') key = key.substring(0, 4);

      if (!groups[key]) {
        groups[key] = { [dateField]: key, _count: 0 };
      }
      const g = groups[key];
      g._count += 1;
      
      Object.keys(d).forEach(k => {
        if (k === dateField) return;
        if (typeof d[k] === 'number') {
          if (!g[`_sum_${k}`]) g[`_sum_${k}`] = 0;
          g[`_sum_${k}`] += d[k];
        }
      });
    });

    const sumFields = ['daily_income', 'charging_cost', 'trip_distance_km', 'daily_distance', 'total_harsh_events'];
    
    const result = Object.values(groups).map(g => {
      const out = { [dateField]: g[dateField] };
      Object.keys(g).forEach(k => {
        if (k.startsWith('_sum_')) {
          const origKey = k.replace('_sum_', '');
          if (sumFields.includes(origKey)) {
            out[origKey] = Number(g[k].toFixed(2));
          } else {
            out[origKey] = Number((g[k] / g._count).toFixed(2));
          }
        }
      });
      return out;
    });

    return result.sort((a, b) => a[dateField].localeCompare(b[dateField]));
  };

  const getRangeTotal = (chartData, dateField, metricKey, range, isAverage = false) => {
    if (!chartData || !chartData.length) return 0;
    const maxTime = Math.max(...chartData.map(d => new Date(d[dateField]).getTime()));
    const maxDate = new Date(maxTime);
    let cutoff = new Date(maxDate);
    if (range === '3m') cutoff.setMonth(maxDate.getMonth() - 3);
    else if (range === '6m') cutoff.setMonth(maxDate.getMonth() - 6);
    else if (range === '1y') cutoff.setFullYear(maxDate.getFullYear() - 1);
    else cutoff = new Date(0);
    const filtered = chartData.filter(d => new Date(d[dateField]) >= cutoff);
    if (!filtered.length) return 0;
    const sum = filtered.reduce((acc, d) => acc + (Number(d[metricKey]) || 0), 0);
    return isAverage ? sum / filtered.length : sum;
  };

  const getRangeText = (range) => {
    if (range === '3m') return 'Last 3M';
    if (range === '6m') return 'Last 6M';
    if (range === '1y') return 'Last Year';
    return 'All Time';
  };

  const renderDynamicChart = (chartType, data, xAxisKey, yAxisKey, name, color, isDate = false) => {
    const commonProps = { data, margin: { top: 5, right: 20, left: 0, bottom: 5 } };
    const formatTick = (val) => {
      if (!isDate || !val) return val;
      if (val.length === 4) return val; // Yearly
      if (val.length === 7) return new Date(val + '-01').toLocaleDateString(undefined, {month: 'short', year: 'numeric'});
      return new Date(val).toLocaleDateString();
    };
    
    if (chartType === 'pie') {
      const pieColors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#14b8a6', '#f43f5e', '#84cc16'];
      return (
        <PieChart {...commonProps}>
          <Pie data={data} dataKey={yAxisKey} nameKey={xAxisKey} innerRadius={60} outerRadius={90} paddingAngle={2} animationDuration={1000} label={({ name, percent }) => `${formatTick(name)} (${(percent * 100).toFixed(0)}%)`} labelLine={{ stroke: 'var(--text-secondary)' }}>
            {data.map((entry, index) => <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />)}
          </Pie>
          <Tooltip contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid var(--glass-border)', borderRadius: '8px' }} labelStyle={{ color: '#f8fafc' }} itemStyle={{ color: '#e2e8f0' }} formatter={(value, name) => [value, formatTick(name)]} />
        </PieChart>
      );
    }
    
    const children = (
      <>
        <defs>
          <linearGradient id={`color${name.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.4}/>
            <stop offset="95%" stopColor={color} stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" vertical={false} />
        <XAxis dataKey={xAxisKey} stroke="var(--text-secondary)" tick={{fontSize: 11, angle: -45, textAnchor: 'end'}} height={60} tickFormatter={formatTick} />
        <YAxis domain={['auto', 'auto']} stroke="var(--text-secondary)" tick={{fontSize: 12}} label={{ value: name, angle: -90, position: 'insideLeft', fill: 'var(--text-secondary)' }} />
        <Tooltip contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid var(--glass-border)', borderRadius: '8px' }} labelStyle={{ color: '#f8fafc' }} itemStyle={{ color: '#e2e8f0' }} labelFormatter={formatTick} />
        {chartType === 'line' && <Line type="monotone" dataKey={yAxisKey} name={name} stroke={color} strokeWidth={2} dot={false} animationDuration={1000} />}
        {chartType === 'bar' && <Bar dataKey={yAxisKey} name={name} fill={color} radius={[4, 4, 0, 0]} animationDuration={1000} label={{ position: 'top', fill: 'var(--text-secondary)', fontSize: 11, formatter: (val) => Number(val) > 0 ? (Number.isInteger(Number(val)) ? Number(val) : Number(val).toFixed(1)) : '' }} />}
      </>
    );

    if (chartType === 'line') return <LineChart {...commonProps}>{children}</LineChart>;
    if (chartType === 'bar') return <BarChart {...commonProps}>{children}</BarChart>;
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div>
          <h2 className="sidebar-title">EV Fleet Admin</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Welcome, {user?.email}</p>
        </div>
        
        <nav className="flex-col gap-2" style={{ flex: 1, marginTop: '32px' }}>
          <button onClick={() => { setActiveTab('overview'); setSortConfig({key: null, direction: 'asc'}); setFilterStatus('all'); }} className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}>
            <Activity size={20} /> Overview
          </button>
          <button onClick={() => { setActiveTab('vehicles'); setSortConfig({key: null, direction: 'asc'}); setFilterStatus('all'); }} className={`nav-item ${activeTab === 'vehicles' ? 'active' : ''}`}>
            <Car size={20} /> Vehicles
          </button>
          <button onClick={() => { setActiveTab('drivers'); setSortConfig({key: null, direction: 'asc'}); setFilterStatus('all'); }} className={`nav-item ${activeTab === 'drivers' ? 'active' : ''}`}>
            <Users size={20} /> Drivers Analytics
          </button>
          <button onClick={() => { setActiveTab('brands'); setSortConfig({key: null, direction: 'asc'}); setFilterStatus('all'); }} className={`nav-item ${activeTab === 'brands' ? 'active' : ''}`}>
            <Award size={20} /> Brands Analytics
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
                <div><p className="input-label mb-2">Income ({getRangeText(timeRange)})</p><h3>₹{getRangeTotal(data.trend_all, 'date', 'daily_income', timeRange).toLocaleString(undefined, {maximumFractionDigits: 2})}</h3></div>
                <DollarSign size={32} color="var(--success)" />
              </div>
              <div className="glass-card flex items-center justify-between animate-fade-in-up stagger-2 hover-scale hover-glow">
                <div><p className="input-label mb-2">Charging Spent ({getRangeText(timeRange)})</p><h3>₹{getRangeTotal(data.trend_all, 'date', 'charging_cost', timeRange).toLocaleString(undefined, {maximumFractionDigits: 2})}</h3></div>
                <BatteryCharging size={32} color="var(--warning)" />
              </div>
              <div className="glass-card flex items-center justify-between animate-fade-in-up stagger-3 hover-scale hover-glow">
                <div><p className="input-label mb-2">Maintenance ({getRangeText(timeRange)})</p><h3>₹{getRangeTotal(data.trend_all, 'date', 'maintenance_charges', timeRange).toLocaleString(undefined, {maximumFractionDigits: 2})}</h3></div>
                <AlertTriangle size={32} color="#f43f5e" />
              </div>
              <div className="glass-card flex items-center justify-between animate-fade-in-up stagger-4 hover-scale hover-glow">
                <div><p className="input-label mb-2">Total Expense ({getRangeText(timeRange)})</p><h3>₹{getRangeTotal(data.trend_all, 'date', 'total_expense', timeRange).toLocaleString(undefined, {maximumFractionDigits: 2})}</h3></div>
                <TrendingDown size={32} color="var(--danger)" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '32px' }}>
              <div className="glass-card animate-fade-in-up stagger-4 hover-scale">
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><Activity color="#8b5cf6" /> Income vs Charging Spent</h3>
                  <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto', alignItems: 'center' }}>
                    <select value={overviewChartType} onChange={e => setOverviewChartType(e.target.value)} className="glass-input" style={{ padding: '4px 8px', fontSize: '12px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)', borderRadius: '4px', cursor: 'pointer' }}>
                      <option value="line" style={{ background: 'var(--bg-primary)' }}>Line Chart</option>
                      <option value="bar" style={{ background: 'var(--bg-primary)' }}>Bar Chart</option>
                    </select>
                    <TimeControls range={timeRange} setRange={setTimeRange} grouping={timeGrouping} setGrouping={setTimeGrouping} />
                  </div>
                </div>
                <div style={{ height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={aggregateChartData(data.trend_all || [], 'date', timeRange, timeGrouping)}>
                      <defs>
                        <linearGradient id="colorIncomeAll" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--success)" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="var(--success)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" vertical={false} />
                      <XAxis dataKey="date" stroke="var(--text-secondary)" tick={{fontSize: 11, angle: -45, textAnchor: 'end'}} height={60} minTickGap={20} tickFormatter={(val) => {
                        if (!val) return val;
                        if (val.length === 4) return val;
                        if (val.length === 7) return new Date(val + '-01').toLocaleDateString(undefined, {month: 'short', year: 'numeric'});
                        return new Date(val).toLocaleDateString();
                      }} />
                      <YAxis yAxisId="left" stroke="var(--text-secondary)" tick={{fontSize: 12}} label={{ value: 'Amount (₹)', angle: -90, position: 'insideLeft', fill: 'var(--text-secondary)' }} />
                      <Tooltip contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid var(--glass-border)', borderRadius: '8px' }} labelStyle={{ color: '#f8fafc' }} itemStyle={{ color: '#e2e8f0' }} />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px', color: 'var(--text-secondary)' }} />
                      {overviewChartType === 'line' ? (
                        <>
                          <Area yAxisId="left" type="monotone" dataKey="daily_income" name="Income" stroke="var(--success)" fillOpacity={1} fill="url(#colorIncomeAll)" animationDuration={1500} />
                          <Line yAxisId="left" type="monotone" dataKey="charging_cost" name="Charging Spent" stroke="var(--warning)" strokeWidth={3} dot={false} animationDuration={2000} />
                        </>
                      ) : (
                        <>
                          <Bar yAxisId="left" dataKey="daily_income" name="Income" fill="var(--success)" radius={[4, 4, 0, 0]} animationDuration={1500} label={{ position: 'top', fill: 'var(--text-secondary)', fontSize: 11, formatter: (val) => Number(val) > 0 ? (Number.isInteger(Number(val)) ? Number(val) : Number(val).toFixed(1)) : '' }} />
                          <Bar yAxisId="left" dataKey="charging_cost" name="Charging Spent" fill="var(--warning)" radius={[4, 4, 0, 0]} animationDuration={2000} label={{ position: 'top', fill: 'var(--text-secondary)', fontSize: 11, formatter: (val) => Number(val) > 0 ? (Number.isInteger(Number(val)) ? Number(val) : Number(val).toFixed(1)) : '' }} />
                        </>
                      )}
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
                      <YAxis dataKey="driver_name" type="category" stroke="var(--text-secondary)" tick={{fontSize: 12}} width={80} />
                      <Tooltip contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid var(--glass-border)', borderRadius: '8px' }} labelStyle={{ color: '#f8fafc' }} itemStyle={{ color: '#e2e8f0' }} />
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
                      <XAxis dataKey="weather_condition" stroke="var(--text-secondary)" tick={{fontSize: 11, angle: -45, textAnchor: 'end'}} height={60} interval={0} />
                      <YAxis stroke="var(--text-secondary)" tick={{fontSize: 12}} label={{ value: 'Efficiency (Wh/km)', angle: -90, position: 'insideLeft', fill: 'var(--text-secondary)' }} />
                      <Tooltip contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid var(--glass-border)', borderRadius: '8px' }} labelStyle={{ color: '#f8fafc' }} itemStyle={{ color: '#e2e8f0' }} />
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
                      <Tooltip contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid var(--glass-border)', borderRadius: '8px' }} labelStyle={{ color: '#f8fafc' }} itemStyle={{ color: '#e2e8f0' }} />
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
            
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', alignItems: 'start' }}>
              <div>
                {selectedVehicle ? (
                  <div className="glass-card mb-8 animate-fade-in-up hover-scale">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Car color="var(--accent-primary)" /> {selectedVehicle.car_name} ({selectedVehicle.vehicle_id})</h3>
                      <button onClick={() => setSelectedVehicle(null)} style={{ background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', padding: '6px 16px', borderRadius: '4px', cursor: 'pointer' }}>Close</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                      <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                        <p className="input-label mb-1">Income ({getRangeText(timeRange)})</p>
                        <h4 style={{ color: 'var(--success)' }}>₹{getRangeTotal(selectedVehicle.history, 'timestamp', 'daily_income', timeRange).toLocaleString(undefined, {maximumFractionDigits: 2})}</h4>
                      </div>
                      <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                        <p className="input-label mb-1">Maintenance ({getRangeText(timeRange)})</p>
                        <h4 style={{ color: '#f43f5e' }}>₹{getRangeTotal(selectedVehicle.history, 'timestamp', 'maintenance_charges', timeRange).toLocaleString(undefined, {maximumFractionDigits: 2})}</h4>
                      </div>
                      <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                        <p className="input-label mb-1">Charging Cost ({getRangeText(timeRange)})</p>
                        <h4 style={{ color: 'var(--warning)' }}>₹{getRangeTotal(selectedVehicle.history, 'timestamp', 'charging_cost', timeRange).toLocaleString(undefined, {maximumFractionDigits: 2})}</h4>
                      </div>
                      <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                        <p className="input-label mb-1">Current Health</p>
                        <h4 style={{ color: selectedVehicle.initial_battery_health_pct > 93 ? 'var(--success)' : 'var(--warning)' }}>{selectedVehicle.initial_battery_health_pct}%</h4>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                      <h4 style={{ color: 'var(--text-secondary)', margin: 0, flex: 1 }}>History</h4>
                      <TimeControls range={timeRange} setRange={setTimeRange} grouping={timeGrouping} setGrouping={setTimeGrouping} />
                      <MetricSelector value={vehicleMetric} onChange={setVehicleMetric} options={vehicleMetricOptions} />
                      <ChartSelector value={vehicleChartType} onChange={setVehicleChartType} />
                    </div>
                    <div style={{ height: '250px' }}>
                      <ResponsiveContainer>
                        {renderDynamicChart(vehicleChartType, aggregateChartData(selectedVehicle.history || [], 'timestamp', timeRange, timeGrouping), 'timestamp', vehicleMetric, vehicleMetricOptions.find(o => o.value === vehicleMetric)?.label || '', '#8b5cf6', true)}
                      </ResponsiveContainer>
                    </div>
                  </div>
                ) : (
                  <div className="glass-card mb-8 animate-fade-in-up stagger-3 hover-scale">
                    <h3 className="mb-4 flex items-center gap-2"><Car color="#8b5cf6" /> Fleet Distribution by Model</h3>
                    <div style={{ height: '300px' }}>
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie 
                            data={fleetDistData} 
                            innerRadius={60} 
                            outerRadius={90} 
                            paddingAngle={5} 
                            dataKey="value" 
                            nameKey="name"
                            animationDuration={1000} 
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} 
                            labelLine={{ stroke: 'var(--text-secondary)' }}
                          >
                            {fleetDistData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                          </Pie>
                          <Tooltip contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid var(--glass-border)', borderRadius: '8px' }} labelStyle={{ color: '#f8fafc' }} itemStyle={{ color: '#e2e8f0' }} />
                          <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>

              <div className="glass-card animate-fade-in-up stagger-4 hover-scale" style={{ padding: 0, display: 'flex', flexDirection: 'column', maxHeight: '600px' }}>
                <div style={{ padding: '16px', background: 'var(--bg-primary)', borderBottom: '1px solid var(--glass-border)', borderTopLeftRadius: '16px', borderTopRightRadius: '16px', zIndex: 2 }}>
                  {renderTableControls(vehicleSortOptions, 'vehicles')}
                </div>
                <div style={{ overflowY: 'auto', flex: 1 }}>
                  <div className="table-container" style={{ padding: '0 16px 16px 16px' }}>
                    <table style={{ width: '100%' }}>
                      <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-primary)', zIndex: 1 }}>
                      <tr>
                        <th onClick={() => handleSort('vehicle_id')} style={{ cursor: 'pointer' }}>Vehicle ID <SortIcon columnKey="vehicle_id" /></th>
                        <th onClick={() => handleSort('car_name')} style={{ cursor: 'pointer' }}>Model <SortIcon columnKey="car_name" /></th>
                        <th onClick={() => handleSort('battery_capacity_kwh')} style={{ cursor: 'pointer' }}>Capacity <SortIcon columnKey="battery_capacity_kwh" /></th>
                        <th onClick={() => handleSort('max_range_km')} style={{ cursor: 'pointer' }}>Max Range <SortIcon columnKey="max_range_km" /></th>
                        <th onClick={() => handleSort('initial_battery_health_pct')} style={{ cursor: 'pointer' }}>Status <SortIcon columnKey="initial_battery_health_pct" /></th>
                      </tr>
                    </thead>
                    <tbody>
                      {processedVehicles.map((v, i) => (
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
            </div>
          </div>
        )}

        {activeTab === 'drivers' && (
          <div className="animate-fade-in-up">
            <h1 className="mb-8">Driver Analytics & Performance</h1>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', alignItems: 'start' }}>
              <div>
                {selectedDriver ? (
                  <div className="glass-card mb-8 animate-fade-in-up hover-scale">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Users color="var(--accent-primary)" /> {selectedDriver.driver_name}</h3>
                      <button onClick={() => setSelectedDriver(null)} style={{ background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', padding: '6px 16px', borderRadius: '4px', cursor: 'pointer' }}>Close</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                      <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                        <p className="input-label mb-1">Income ({getRangeText(timeRange)})</p>
                        <h4 style={{ color: 'var(--success)' }}>₹{getRangeTotal(selectedDriver.history, 'timestamp', 'daily_income', timeRange).toLocaleString(undefined, {maximumFractionDigits: 2})}</h4>
                      </div>
                      <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                        <p className="input-label mb-1">Distance ({getRangeText(timeRange)})</p>
                        <h4 style={{ color: 'var(--accent-primary)' }}>{getRangeTotal(selectedDriver.history, 'timestamp', 'daily_distance_km', timeRange).toLocaleString(undefined, {maximumFractionDigits: 2})} km</h4>
                      </div>
                      <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                        <p className="input-label mb-1">Violations ({getRangeText(timeRange)})</p>
                        <h4 style={{ color: getRangeTotal(selectedDriver.history, 'timestamp', 'total_harsh_events', timeRange) > 5 ? 'var(--danger)' : 'var(--warning)' }}>{getRangeTotal(selectedDriver.history, 'timestamp', 'total_harsh_events', timeRange)}</h4>
                      </div>
                      <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                        <p className="input-label mb-1">Avg Score ({getRangeText(timeRange)})</p>
                        <h4 style={{ color: getRangeTotal(selectedDriver.history, 'timestamp', 'performance_score', timeRange, true) > 80 ? 'var(--success)' : 'var(--warning)' }}>{getRangeTotal(selectedDriver.history, 'timestamp', 'performance_score', timeRange, true).toFixed(1)}%</h4>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                      <h4 style={{ color: 'var(--text-secondary)', margin: 0, flex: 1 }}>History</h4>
                      <TimeControls range={timeRange} setRange={setTimeRange} grouping={timeGrouping} setGrouping={setTimeGrouping} />
                      <MetricSelector value={driverMetric} onChange={setDriverMetric} options={driverMetricOptions} />
                      <ChartSelector value={driverChartType} onChange={setDriverChartType} />
                    </div>
                    <div style={{ height: '250px' }}>
                      <ResponsiveContainer>
                        {renderDynamicChart(driverChartType, aggregateChartData(selectedDriver.history || [], 'timestamp', timeRange, timeGrouping), 'timestamp', driverMetric, driverMetricOptions.find(o => o.value === driverMetric)?.label || '', '#34d399', true)}
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
                          <XAxis dataKey="driver_name" stroke="var(--text-secondary)" tick={{fontSize: 11, angle: -45, textAnchor: 'end'}} interval={0} height={60} label={{ value: 'Driver Name', position: 'insideBottom', offset: -15, fill: 'var(--text-secondary)' }} />
                          <YAxis stroke="var(--text-secondary)" tick={{fontSize: 12}} label={{ value: 'Total Trips', angle: -90, position: 'insideLeft', fill: 'var(--text-secondary)', fontSize: 12, style: {textAnchor: 'middle'} }} />
                          <Tooltip contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid var(--glass-border)', borderRadius: '8px' }} labelStyle={{ color: '#f8fafc' }} itemStyle={{ color: '#e2e8f0' }} />
                          <Bar dataKey="total_trips" name="Number of Trips" fill="#34d399" radius={[4, 4, 0, 0]} animationDuration={1500} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>

              <div className="glass-card animate-fade-in-up stagger-3 hover-scale" style={{ padding: 0, display: 'flex', flexDirection: 'column', maxHeight: '600px' }}>
                <div style={{ padding: '16px', background: 'var(--bg-primary)', borderBottom: '1px solid var(--glass-border)', borderTopLeftRadius: '16px', borderTopRightRadius: '16px', zIndex: 2 }}>
                  {renderTableControls(driverSortOptions, 'drivers')}
                </div>
                <div style={{ overflowY: 'auto', flex: 1 }}>
                  <div className="table-container" style={{ padding: '0 16px 16px 16px' }}>
                    <table style={{ width: '100%' }}>
                      <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-primary)', zIndex: 1 }}>
                      <tr>
                        <th onClick={() => handleSort('driver_name')} style={{ cursor: 'pointer' }}>Driver Name <SortIcon columnKey="driver_name" /></th>
                        <th onClick={() => handleSort('total_distance')} style={{ cursor: 'pointer' }}>Total Distance <SortIcon columnKey="total_distance" /></th>
                        <th onClick={() => handleSort('total_income')} style={{ cursor: 'pointer' }}>Total Revenue <SortIcon columnKey="total_income" /></th>
                        <th onClick={() => handleSort('total_harsh_events')} style={{ cursor: 'pointer' }}>Harsh Events <SortIcon columnKey="total_harsh_events" /></th>
                        <th onClick={() => handleSort('avg_performance')} style={{ cursor: 'pointer' }}>Avg Score <SortIcon columnKey="avg_performance" /></th>
                      </tr>
                    </thead>
                    <tbody>
                      {processedDrivers.map((d, i) => (
                        <tr key={i} onClick={() => setSelectedDriver(d)} style={{ cursor: 'pointer' }} className="hover-row">
                          <td style={{ fontWeight: 'bold' }}>{d.driver_name}</td>
                          <td>{d.total_distance.toLocaleString()} km</td>
                          <td style={{ color: 'var(--success)', fontWeight: 'bold' }}>₹{d.total_income.toLocaleString()}</td>
                          <td><span style={{ color: d.total_harsh_events > 15 ? 'var(--danger)' : 'var(--text-secondary)' }}>{d.total_harsh_events}</span></td>
                          <td><span className={`badge ${d.avg_performance > 80 ? 'badge-success' : 'badge-warning'}`}>{d.avg_performance}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'brands' && (
          <div className="animate-fade-in-up">
            <h1 className="mb-8">Brand Analytics & Performance</h1>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', alignItems: 'start' }}>
              <div>
                {selectedBrand ? (
                  <div className="glass-card animate-fade-in-up hover-scale">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Award color="var(--accent-primary)" /> {selectedBrand.car_name}</h3>
                      <button onClick={() => setSelectedBrand(null)} style={{ background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', padding: '6px 16px', borderRadius: '4px', cursor: 'pointer' }}>Close</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                      <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                        <p className="input-label mb-1">Vehicles</p>
                        <h4 style={{ color: 'var(--accent-primary)' }}>{selectedBrand.total_vehicles}</h4>
                      </div>
                      <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                        <p className="input-label mb-1">Income ({getRangeText(timeRange)})</p>
                        <h4 style={{ color: 'var(--success)' }}>₹{getRangeTotal(selectedBrand.history, 'date', 'daily_income', timeRange).toLocaleString(undefined, {maximumFractionDigits: 2})}</h4>
                      </div>
                      <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                        <p className="input-label mb-1">Distance ({getRangeText(timeRange)})</p>
                        <h4 style={{ color: 'var(--text-primary)' }}>{getRangeTotal(selectedBrand.history, 'date', 'daily_distance', timeRange).toLocaleString(undefined, {maximumFractionDigits: 2})} km</h4>
                      </div>
                      <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                        <p className="input-label mb-1">Avg Health ({getRangeText(timeRange)})</p>
                        <h4 style={{ color: getRangeTotal(selectedBrand.history, 'date', 'avg_health', timeRange, true) > 93 ? 'var(--success)' : 'var(--warning)' }}>{getRangeTotal(selectedBrand.history, 'date', 'avg_health', timeRange, true).toFixed(1)}%</h4>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                      <h4 style={{ color: 'var(--text-secondary)', margin: 0, flex: 1 }}>History</h4>
                      <TimeControls range={timeRange} setRange={setTimeRange} grouping={timeGrouping} setGrouping={setTimeGrouping} />
                      <MetricSelector value={brandMetric} onChange={setBrandMetric} options={brandMetricOptions} />
                      <ChartSelector value={brandChartType} onChange={setBrandChartType} />
                    </div>
                    <div style={{ height: '250px' }}>
                      <ResponsiveContainer>
                        {renderDynamicChart(brandChartType, aggregateChartData(selectedBrand.history || [], 'date', timeRange, timeGrouping), 'date', brandMetric, brandMetricOptions.find(o => o.value === brandMetric)?.label || '', '#34d399', true)}
                      </ResponsiveContainer>
                    </div>
                  </div>
                ) : (
                  <div className="glass-card animate-fade-in-up stagger-2 hover-scale">
                    <h3 className="mb-4 flex items-center gap-2"><TrendingUp color="#8b5cf6" /> Brand Fleet Size</h3>
                    <div style={{ height: '300px' }}>
                      <ResponsiveContainer>
                        <BarChart data={brands.slice(0, 10)}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" vertical={false} />
                          <XAxis dataKey="car_name" stroke="var(--text-secondary)" tick={{fontSize: 11, angle: -45, textAnchor: 'end'}} interval={0} height={60} label={{ value: 'Car Model', position: 'insideBottom', offset: -15, fill: 'var(--text-secondary)' }} />
                          <YAxis stroke="var(--text-secondary)" tick={{fontSize: 12}} label={{ value: 'Total Vehicles', angle: -90, position: 'insideLeft', fill: 'var(--text-secondary)', fontSize: 12, style: {textAnchor: 'middle'} }} />
                          <Tooltip contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid var(--glass-border)', borderRadius: '8px' }} labelStyle={{ color: '#f8fafc' }} itemStyle={{ color: '#e2e8f0' }} />
                          <Bar dataKey="total_vehicles" name="Vehicles" fill="#8b5cf6" radius={[4, 4, 0, 0]} animationDuration={1500} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>

              <div className="glass-card animate-fade-in-up stagger-3 hover-scale" style={{ padding: 0, display: 'flex', flexDirection: 'column', maxHeight: '600px' }}>
                <div style={{ padding: '16px', background: 'var(--bg-primary)', borderBottom: '1px solid var(--glass-border)', borderTopLeftRadius: '16px', borderTopRightRadius: '16px', zIndex: 2 }}>
                  {renderTableControls(brandSortOptions, 'brands')}
                </div>
                <div style={{ overflowY: 'auto', flex: 1 }}>
                  <div className="table-container" style={{ padding: '0 16px 16px 16px' }}>
                    <table style={{ width: '100%' }}>
                      <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-primary)', zIndex: 1 }}>
                      <tr>
                        <th onClick={() => handleSort('car_name')} style={{ cursor: 'pointer' }}>Car Model <SortIcon columnKey="car_name" /></th>
                        <th onClick={() => handleSort('total_vehicles')} style={{ cursor: 'pointer' }}>Vehicles <SortIcon columnKey="total_vehicles" /></th>
                        <th onClick={() => handleSort('total_distance')} style={{ cursor: 'pointer' }}>Distance <SortIcon columnKey="total_distance" /></th>
                        <th onClick={() => handleSort('total_income')} style={{ cursor: 'pointer' }}>Revenue <SortIcon columnKey="total_income" /></th>
                        <th onClick={() => handleSort('avg_health')} style={{ cursor: 'pointer' }}>Health <SortIcon columnKey="avg_health" /></th>
                      </tr>
                    </thead>
                    <tbody>
                      {processedBrands.map((b, i) => (
                        <tr key={i} onClick={() => setSelectedBrand(b)} style={{ cursor: 'pointer' }} className="hover-row">
                          <td style={{ fontWeight: 'bold' }}>{b.car_name}</td>
                          <td>{b.total_vehicles}</td>
                          <td>{b.total_distance.toLocaleString()} km</td>
                          <td style={{ color: 'var(--success)', fontWeight: 'bold' }}>₹{b.total_income.toLocaleString()}</td>
                          <td><span className={`badge ${b.avg_health > 93 ? 'badge-success' : 'badge-warning'}`}>{b.avg_health}%</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
