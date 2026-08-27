import React, { useState } from 'react';
import { 
  Building2, 
  Search, 
  Barcode, 
  User, 
  LogOut, 
  ShieldCheck, 
  Sun, 
  Moon, 
  Key,
  AlertTriangle
} from 'lucide-react';
import { getCurrentUser, logoutUser, updatePassword } from '../db/storage';

export const Header = ({ 
  onLogout, 
  onOpenBarcodeModal, 
  onSearch, 
  tallyTheme, 
  onToggleTheme,
  allowNegativeStock,
  onToggleNegativeStock,
  lowStockCount = 0,
  isOnline = true,
  onRetryConnection
}) => {
  const user = getCurrentUser() || { email: 'studioaliston@gmail.com', name: 'Aliston Studio Admin' };
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });

  const handleChangePassword = (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (newPassword.length < 4) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 4 characters long.' });
      return;
    }

    const res = updatePassword(user.email, currentPassword, newPassword);
    if (res.then) {
      res.then(r => {
        if (r.success) {
          setPasswordMsg({ type: 'success', text: 'Password changed successfully!' });
          setTimeout(() => {
            setShowChangePasswordModal(false);
            setPasswordMsg({ type: '', text: '' });
          }, 1500);
        } else {
          setPasswordMsg({ type: 'error', text: r.message });
        }
      });
    } else if (res.success) {
      setPasswordMsg({ type: 'success', text: 'Password changed successfully!' });
      setTimeout(() => {
        setShowChangePasswordModal(false);
        setPasswordMsg({ type: '', text: '' });
      }, 1500);
    } else {
      setPasswordMsg({ type: 'error', text: res.message });
    }
  };

  return (
    <header className="no-print" style={{
      backgroundColor: '#090d12',
      borderBottom: '1px solid var(--border-color)',
      padding: '0 24px',
      height: '64px',
      minHeight: '64px',
      maxHeight: '64px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexShrink: 0,
      zIndex: 1000,
      position: 'relative',
      overflow: 'visible'
    }}>
      {/* Brand & Tally Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <img 
          src="/aliston-logo.jpg" 
          alt="ALISTON Logo" 
          style={{
            height: '44px',
            objectFit: 'contain',
            borderRadius: '6px',
            boxShadow: '0 0 10px rgba(229, 185, 92, 0.25)',
            backgroundColor: '#ffffff',
            padding: '2px 6px',
            flexShrink: 0
          }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', lineHeight: 1.1 }}>
            <h1 style={{ fontSize: '1.1rem', fontWeight: '800', letterSpacing: '0.5px', color: 'var(--text-primary)', margin: 0 }}>
              ALISTON
            </h1>
            <span className="badge badge-gold" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>TALLY ERP EDITION</span>
          </div>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0, marginTop: '2px', lineHeight: 1.1 }}>
            Men's Garment Inventory, Costing, Stock & Invoice ERP
          </p>
        </div>
      </div>

      {/* Global Search Bar */}
      <div style={{ flex: '1', maxWidth: '360px', margin: '0 16px', position: 'relative' }}>
        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input 
          type="text" 
          placeholder="Global Search (Product, SKU, Barcode, Invoice #)..."
          onChange={(e) => onSearch && onSearch(e.target.value)}
          style={{
            width: '100%',
            paddingLeft: '36px',
            backgroundColor: 'var(--bg-main)',
            borderRadius: '20px',
            fontSize: '0.825rem'
          }}
        />
      </div>

      {/* Right Controls & User Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* CONNECTION STATUS BADGE: 🟢 Online / 🔴 Offline */}
        <div
          onClick={onRetryConnection}
          title={isOnline ? 'Server Connected (GET /api/health OK)' : 'Server Unreachable! Click to retry connection'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 12px',
            borderRadius: '20px',
            fontSize: '0.775rem',
            fontWeight: '800',
            cursor: 'pointer',
            backgroundColor: isOnline ? 'rgba(46, 160, 67, 0.15)' : 'rgba(218, 54, 51, 0.15)',
            color: isOnline ? '#3fb950' : '#f85149',
            border: isOnline ? '1px solid rgba(46, 160, 67, 0.3)' : '1px solid rgba(218, 54, 51, 0.4)',
            transition: 'all 0.2s ease'
          }}
        >
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: isOnline ? '#3fb950' : '#f85149',
            boxShadow: isOnline ? '0 0 8px #3fb950' : '0 0 8px #f85149'
          }} />
          <span>{isOnline ? '🟢 Online' : '🔴 Offline (Retry)'}</span>
        </div>
        {/* Low Stock Alert Button */}
        {lowStockCount > 0 && (
          <div 
            title={`${lowStockCount} item size(s) below minimum threshold`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(218, 54, 51, 0.15)',
              color: '#f85149',
              border: '1px solid rgba(218, 54, 51, 0.3)',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '0.775rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            <AlertTriangle size={14} />
            <span>{lowStockCount} Low Stock</span>
          </div>
        )}

        {/* Negative Stock Toggle Status */}
        <label 
          title="Toggle whether negative stock is allowed during invoice creation"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.775rem',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            backgroundColor: 'var(--bg-card)',
            padding: '6px 10px',
            borderRadius: '6px',
            border: '1px solid var(--border-color)'
          }}
        >
          <input 
            type="checkbox" 
            checked={allowNegativeStock} 
            onChange={onToggleNegativeStock}
            style={{ width: '14px', height: '14px', cursor: 'pointer' }}
          />
          <span>Allow Negative Stock</span>
        </label>

        {/* Barcode Quick Scan Button */}
        <button 
          className="btn btn-secondary btn-sm"
          onClick={onOpenBarcodeModal}
          title="Scan / Generate Barcode"
        >
          <Barcode size={16} />
          <span>Barcode</span>
        </button>

        {/* Theme Toggle */}
        <button 
          className="btn btn-secondary btn-sm"
          onClick={onToggleTheme}
          title="Toggle Tally ERP / Modern Dark Theme"
          style={{ width: '36px', padding: '0' }}
        >
          {tallyTheme === 'dark' ? <Sun size={16} color="#f1c40f" /> : <Moon size={16} color="#38bdf8" />}
        </button>

        {/* User Profile Dropdown */}
        <div style={{ position: 'relative' }}>
          <button 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              padding: '4px 10px',
              borderRadius: '20px',
              color: 'var(--text-primary)',
              fontSize: '0.8rem'
            }}
          >
            <div style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-teal)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
              fontSize: '0.75rem'
            }}>
              A
            </div>
            <span style={{ fontWeight: '600' }}>Studio Admin</span>
          </button>

          {showProfileMenu && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: '42px',
              width: '230px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              boxShadow: '0 12px 30px rgba(0, 0, 0, 0.7)',
              zIndex: 99999,
              padding: '8px 0'
            }}>
              <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border-color)' }}>
                <p style={{ fontSize: '0.825rem', fontWeight: '700', color: 'var(--text-primary)' }}>Aliston Admin</p>
                <p style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>studioaliston@gmail.com</p>
              </div>

              <button 
                onClick={() => { setShowProfileMenu(false); setShowChangePasswordModal(true); }}
                style={{
                  width: '100%',
                  padding: '8px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.8rem',
                  color: 'var(--text-primary)',
                  backgroundColor: 'transparent',
                  textAlign: 'left'
                }}
              >
                <Key size={14} />
                <span>Change Password</span>
              </button>

              <button 
                onClick={() => { setShowProfileMenu(false); onLogout(); }}
                style={{
                  width: '100%',
                  padding: '8px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.8rem',
                  color: '#f85149',
                  backgroundColor: 'transparent',
                  textAlign: 'left'
                }}
              >
                <LogOut size={14} />
                <span>Logout Session</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Key size={18} color="var(--accent-gold)" />
                Change Password
              </h3>
              <button onClick={() => setShowChangePasswordModal(false)} style={{ background: 'none', color: 'var(--text-muted)' }}>✕</button>
            </div>
            <form onSubmit={handleChangePassword}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {passwordMsg.text && (
                  <div style={{
                    padding: '8px 12px',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    backgroundColor: passwordMsg.type === 'error' ? 'rgba(218,54,51,0.2)' : 'rgba(35,134,54,0.2)',
                    color: passwordMsg.type === 'error' ? '#f85149' : '#3fb950'
                  }}>
                    {passwordMsg.text}
                  </div>
                )}
                <div>
                  <label style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Current Password</label>
                  <input 
                    type="password"
                    required
                    style={{ width: '100%', marginTop: '4px' }}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>New Password</label>
                  <input 
                    type="password"
                    required
                    style={{ width: '100%', marginTop: '4px' }}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Confirm New Password</label>
                  <input 
                    type="password"
                    required
                    style={{ width: '100%', marginTop: '4px' }}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowChangePasswordModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Update Password</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
