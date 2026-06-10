import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.get('http://localhost:8001/me', {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
        setUser(res.data);
      }).catch(err => {
        console.error(err);
        localStorage.removeItem('token');
      }).finally(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    const res = await axios.post('http://localhost:8001/token', formData);
    localStorage.setItem('token', res.data.access_token);
    
    // fetch user
    const userRes = await axios.get('http://localhost:8001/me', {
      headers: { Authorization: `Bearer ${res.data.access_token}` }
    });
    setUser(userRes.data);
  };

  const register = async (userData) => {
    await axios.post('http://localhost:8001/register', userData);
    await login(userData.email, userData.password);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
