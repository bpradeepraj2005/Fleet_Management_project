import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { Shield, Car, ArrowLeft, Zap, Sun, Moon } from 'lucide-react';

const Login = () => {
  const [selectedRole, setSelectedRole] = useState(null); // 'admin' or 'driver'
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [driverId, setDriverId] = useState('');
  const [error, setError] = useState('');
  
  const { login, register } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register({ email, password, role: selectedRole, driver_id: selectedRole === 'driver' ? driverId : null });
      }
    } catch (err) {
      let errMsg = 'An error occurred';
      if (err.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
          errMsg = err.response.data.detail.map(d => `${d.loc[d.loc.length - 1]}: ${d.msg}`).join(', ');
        } else {
          errMsg = err.response.data.detail;
        }
      }
      setError(errMsg);
    }
  };

  const resetSelection = () => {
    setSelectedRole(null);
    setError('');
    setEmail('');
    setPassword('');
    setDriverId('');
  };

  return (
    <div className="app-container items-center justify-center" style={{ position: 'relative', overflow: 'hidden', backgroundImage: 'radial-gradient(circle at top right, var(--bg-secondary) 0%, var(--bg-primary) 100%)' }}>
      
      <button onClick={toggleTheme} className="btn btn-secondary" style={{ position: 'absolute', top: '24px', right: '24px', zIndex: 50, padding: '12px' }}>
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>
      
      {/* Animated background elements */}
      <div className="animate-float" style={{ position: 'absolute', top: '80px', left: '80px', width: '256px', height: '256px', backgroundColor: '#0ea5e9', borderRadius: '50%', mixBlendMode: 'screen', filter: 'blur(100px)', opacity: 0.2, animationDuration: '8s' }}></div>
      <div className="animate-float" style={{ position: 'absolute', bottom: '80px', right: '80px', width: '320px', height: '320px', backgroundColor: '#8b5cf6', borderRadius: '50%', mixBlendMode: 'screen', filter: 'blur(120px)', opacity: 0.2, animationDuration: '10s', animationDelay: '1s' }}></div>

      <div className="glass-panel" style={{ position: 'relative', zIndex: 10, width: '450px', padding: '40px', minHeight: '500px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        
        {!selectedRole ? (
          <div className="animate-fade-in-up">
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div className="animate-float" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)', marginBottom: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <Zap size={32} color="#34d399" />
              </div>
              <h2 className="gradient-text" style={{ fontSize: '2.5rem', lineHeight: 1.2 }}>Welcome to<br/>EV Fleet System</h2>
              <p className="text-secondary" style={{ marginTop: '12px' }}>Select your portal to continue</p>
            </div>

            <div style={{ display: 'flex', gap: '16px', width: '100%' }}>
              <div className="role-card admin animate-slide-left" style={{ flex: 1 }} onClick={() => setSelectedRole('admin')}>
                <div className="role-icon-container">
                  <Shield size={32} />
                </div>
                <h3 style={{ marginBottom: '8px' }}>Admin</h3>
                <p className="text-secondary" style={{ fontSize: '0.75rem' }}>Fleet Manager</p>
              </div>

              <div className="role-card driver animate-slide-right" style={{ flex: 1 }} onClick={() => setSelectedRole('driver')}>
                <div className="role-icon-container">
                  <Car size={32} />
                </div>
                <h3 style={{ marginBottom: '8px' }}>Driver</h3>
                <p className="text-secondary" style={{ fontSize: '0.75rem' }}>Vehicle Operator</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="form-container">
            <button 
              onClick={resetSelection} 
              className="text-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.875rem', marginBottom: '24px', transition: 'color 0.3s' }}
              onMouseOver={(e) => e.currentTarget.style.color = 'white'}
              onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
              <ArrowLeft size={16} /> Back to roles
            </button>

            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)', marginBottom: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                {selectedRole === 'admin' ? <Shield color="#38bdf8" /> : <Car color="#a78bfa" />}
              </div>
              <h2 style={{ color: 'var(--text-primary)', marginBottom: '8px', fontSize: '1.75rem' }}>
                {isLogin ? `Sign In as ${selectedRole === 'admin' ? 'Admin' : 'Driver'}` : `Register as ${selectedRole === 'admin' ? 'Admin' : 'Driver'}`}
              </h2>
              <p className="text-secondary" style={{ fontSize: '0.875rem' }}>
                {selectedRole === 'admin' ? 'Manage your entire EV fleet' : 'Access your daily trip analytics'}
              </p>
            </div>
            
            {error && <div className="badge badge-danger animate-fade-in-up" style={{ marginBottom: '16px', textAlign: 'center', width: '100%', boxSizing: 'border-box' }}>{error}</div>}
            
            <form onSubmit={handleSubmit} className="flex-col" style={{ width: '100%' }}>
              <div className="input-group">
                <label className="input-label">Email Address</label>
                <input 
                  type="email" 
                  className="glass-input" 
                  style={{ transition: 'transform 0.3s' }}
                  onFocus={(e) => e.target.style.transform = 'scale(1.02)'}
                  onBlur={(e) => e.target.style.transform = 'scale(1)'}
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  placeholder="name@example.com"
                  required 
                />
              </div>
              
              <div className="input-group">
                <label className="input-label">Password</label>
                <input 
                  type="password" 
                  className="glass-input" 
                  style={{ transition: 'transform 0.3s' }}
                  onFocus={(e) => e.target.style.transform = 'scale(1.02)'}
                  onBlur={(e) => e.target.style.transform = 'scale(1)'}
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  placeholder="••••••••"
                  required 
                />
              </div>

              {!isLogin && selectedRole === 'driver' && (
                <div className="input-group animate-fade-in-up">
                  <label className="input-label">Driver ID</label>
                  <input 
                    type="text" 
                    className="glass-input" 
                    style={{ transition: 'transform 0.3s' }}
                    onFocus={(e) => e.target.style.transform = 'scale(1.02)'}
                    onBlur={(e) => e.target.style.transform = 'scale(1)'}
                    value={driverId} 
                    onChange={e => setDriverId(e.target.value)} 
                    placeholder="e.g., USR_DRV_01"
                    required 
                  />
                </div>
              )}

              <button type="submit" className="btn btn-primary" style={{ 
                width: '100%',
                marginTop: '16px',
                background: selectedRole === 'admin' ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)'
              }}>
                {isLogin ? 'Sign In' : 'Create Account'}
              </button>
            </form>
            
            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <button 
                className="btn btn-secondary" 
                style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                onClick={() => { setIsLogin(!isLogin); setError(''); }}
              >
                {isLogin ? "Don't have an account? Register" : "Already have an account? Sign In"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
