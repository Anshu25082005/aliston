import React, { useState } from 'react';
import { Lock, Mail, Key, ShieldCheck, Eye, EyeOff, Building2 } from 'lucide-react';
import { loginUser } from '../db/storage';

export const LoginScreen = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await loginUser(email, password, remember);
      if (res.success) {
        onLoginSuccess(res.user);
      } else {
        setErrorMsg(res.message);
      }
    } catch (err) {
      setErrorMsg('Server unreachable. Active internet connection required to log in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      backgroundColor: '#070a0e',
      backgroundImage: 'radial-gradient(circle at 50% 30%, #162032 0%, #070a0e 70%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden'
      }}>
        {/* Top Header Branding */}
        <div style={{
          backgroundColor: '#002b36',
          borderBottom: '2px solid var(--accent-gold)',
          padding: '24px',
          textAlign: 'center'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #e5b95c 0%, #b45309 100%)',
            color: '#090d12',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            fontWeight: '800',
            marginBottom: '12px',
            fontFamily: 'var(--font-heading)',
            boxShadow: '0 0 20px rgba(229, 185, 92, 0.4)'
          }}>
            A
          </div>
          <h2 style={{ fontSize: '1.5rem', color: '#ffffff', letterSpacing: '1px', fontWeight: '800' }}>
            ALISTON ERP
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>
            Men's Garment Inventory, Costing & Invoice Management System
          </p>
          <div style={{ display: 'inline-block', marginTop: '8px' }}>
            <span className="badge badge-gold">SHREE RAM ENTERPRISE</span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '28px 24px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '20px', textAlign: 'center', color: 'var(--text-primary)' }}>
            Authorized Studio Login
          </h3>

          {errorMsg && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '6px',
              backgroundColor: 'rgba(218, 54, 51, 0.2)',
              border: '1px solid rgba(218, 54, 51, 0.4)',
              color: '#f85149',
              fontSize: '0.825rem',
              marginBottom: '16px',
              textAlign: 'center'
            }}>
              {errorMsg}
            </div>
          )}

          {/* Login ID Input */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Login ID / Email
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="studioaliston@gmail.com"
                style={{ width: '100%', paddingLeft: '36px' }}
              />
            </div>
          </div>

          {/* Password Input */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ width: '100%', paddingLeft: '36px', paddingRight: '36px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  color: 'var(--text-muted)'
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Remember me & Helper */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                style={{ width: '14px', height: '14px' }}
              />
              <span>Remember Login</span>
            </label>
            <span style={{ fontSize: '0.75rem', color: 'var(--accent-gold)' }}>
              Tally Protected
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '0.95rem', fontWeight: '700' }}
          >
            {loading ? 'Authenticating...' : 'Login to ALISTON ERP'}
          </button>
        </form>
      </div>
    </div>
  );
};
