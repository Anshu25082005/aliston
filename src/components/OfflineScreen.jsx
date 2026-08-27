import React, { useState } from 'react';
import { WifiOff, RefreshCw, ShieldAlert, Server } from 'lucide-react';

export const OfflineScreen = ({ onRetry, isChecking }) => {
  const [loading, setLoading] = useState(false);

  const handleRetryClick = async () => {
    setLoading(true);
    await onRetry();
    setTimeout(() => setLoading(false), 500);
  };

  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      backgroundColor: '#090d12',
      color: '#f0f4f8',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <div style={{
        maxWidth: '520px',
        width: '100%',
        backgroundColor: '#111822',
        border: '1px solid #da3633',
        borderRadius: '12px',
        padding: '40px 32px',
        textAlign: 'center',
        boxShadow: '0 20px 50px rgba(218, 54, 51, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px'
      }}>
        {/* Offline Icon */}
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          backgroundColor: 'rgba(218, 54, 51, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid #da3633'
        }}>
          <WifiOff size={36} color="#f85149" />
        </div>

        <div>
          <span style={{
            fontSize: '0.7rem',
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            color: '#f85149',
            fontWeight: '800'
          }}>
            SYSTEM ACCESS LOCKED
          </span>
          <h1 style={{
            fontSize: '1.6rem',
            fontWeight: '800',
            marginTop: '6px',
            color: '#ffffff'
          }}>
            Internet Connection Required
          </h1>
          <p style={{
            fontSize: '0.9rem',
            color: '#8b949e',
            marginTop: '10px',
            lineHeight: '1.5'
          }}>
            ALISTON ERP requires an active internet connection to operate. Server health check failed to reach <code style={{ color: '#e5b95c' }}>GET /api/health</code>.
          </p>
        </div>

        {/* Info box */}
        <div style={{
          width: '100%',
          padding: '14px 16px',
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid #30363d',
          borderRadius: '8px',
          fontSize: '0.8rem',
          color: '#8b949e',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          textAlign: 'left'
        }}>
          <Server size={20} color="#e5b95c" style={{ flexShrink: 0 }} />
          <div>
            <strong>Online Cloud Architecture Enabled:</strong> Database synchronization and inventory calculations are processed on the server to prevent data corruption.
          </div>
        </div>

        {/* Retry Button */}
        <button
          onClick={handleRetryClick}
          disabled={loading || isChecking}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '8px',
            backgroundColor: '#e5b95c',
            color: '#090d12',
            fontWeight: '800',
            fontSize: '0.95rem',
            border: 'none',
            cursor: loading || isChecking ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            transition: 'all 0.15s ease',
            boxShadow: '0 4px 14px rgba(229, 185, 92, 0.25)'
          }}
        >
          <RefreshCw size={18} className={loading || isChecking ? 'spin' : ''} />
          {loading || isChecking ? 'Checking Connection...' : 'Retry Connection'}
        </button>

        <div style={{ fontSize: '0.725rem', color: '#484f58' }}>
          ALISTON v2.5 Online-Only ERP • Studio Aliston
        </div>
      </div>
    </div>
  );
};
