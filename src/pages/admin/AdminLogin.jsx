import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { authService } from '../../services/db';
import { Shield } from 'lucide-react';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.loginAdmin(username, password);
      navigate('/admin/dashboard');
    } catch (err) {
      setError('Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      
      {/* Background Glow */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(0,0,0,0) 70%)', zIndex: -1 }}></div>

      <Card style={{ 
        width: '100%', 
        maxWidth: '450px',
        padding: '2.5rem',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)',
        background: 'rgba(20, 20, 31, 0.7)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(99,102,241,0.1)', borderRadius: '50%', marginBottom: '1rem' }}>
            <Shield size={32} color="var(--accent-primary)" />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '0.5rem' }}>Admin Portal</h2>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.95rem' }}>Enter your credentials to manage tournaments</p>
        </div>
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: '500', color: 'var(--text-secondary)', marginLeft: '0.25rem' }}>Username</label>
            <Input 
              placeholder="e.g. admin_user" 
              value={username}
              onChange={(e) => { setUsername(e.target.value.trim()); setError(''); }}
              style={{ padding: '1rem' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: '500', color: 'var(--text-secondary)', marginLeft: '0.25rem' }}>Password</label>
            <Input 
              type="password"
              placeholder="••••••••" 
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              error={error}
              style={{ padding: '1rem' }}
            />
          </div>
          <Button type="submit" disabled={loading} style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', marginTop: '1rem' }}>
            {loading ? 'Authenticating...' : 'Secure Login'}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default AdminLogin;
