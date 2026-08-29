import React, { useState, useEffect } from 'react';
import { initDB, getCurrentUser, logoutUser, getData, saveData } from './db/storage';
import { useConnectivity } from './hooks/useConnectivity';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { LoginScreen } from './components/LoginScreen';
import { OfflineScreen } from './components/OfflineScreen';
import { DashboardView } from './components/DashboardView';
import { ProductMasterView } from './components/ProductMasterView';
import { BomCostingView } from './components/BomCostingView';
import { StockManagementView } from './components/StockManagementView';
import { PurchaseView } from './components/PurchaseView';
import { MaterialInventoryView } from './components/MaterialInventoryView';
import { ProductionView } from './components/ProductionView';
import { SalesInvoiceView } from './components/SalesInvoiceView';
import { SalesOrderView } from './components/SalesOrderView';
import { SalesReturnView } from './components/SalesReturnView';
import { ExpenseView } from './components/ExpenseView';
import { ReportsView } from './components/ReportsView';
import { GSTLedgerView } from './components/GSTLedgerView';
import { BarcodeModal } from './components/BarcodeModal';
import { BackupSettingsView } from './components/BackupSettingsView';
import { AlertOctagon, RefreshCw } from 'lucide-react';
import './styles/index.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ALISTON ERP ErrorBoundary caught an error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '32px', textAlign: 'center' }}>
          <div className="card" style={{ maxWidth: '520px', margin: '40px auto', border: '1px solid #da3633', background: 'var(--bg-card)' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#f85149', marginBottom: '10px' }}>
              ⚠️ View Render Warning
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              An unexpected error occurred while rendering this section ({this.state.error?.message || 'Render Error'}).
            </p>
            <button 
              className="btn btn-primary"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                if (this.props.onReset) this.props.onReset();
              }}
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const { isOnline, isChecking, checkConnectionNow } = useConnectivity();

  // Initialize Database seed on first launch
  useEffect(() => {
    initDB();
  }, []);

  const [user, setUser] = useState(() => getCurrentUser());
  const [activeTab, setActiveTab] = useState('dashboard');
  const [tallyTheme, setTallyTheme] = useState('dark');
  const [allowNegativeStock, setAllowNegativeStock] = useState(() => {
    const settings = getData('SETTINGS');
    return settings ? settings.allowNegativeStock : false;
  });
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [reloadCounter, setReloadCounter] = useState(0);

  // Compute Low Stock Alerts Count
  const stockList = getData('STOCK') || [];
  let lowStockCount = 0;
  stockList.forEach(s => {
    if (s.sizes) {
      Object.values(s.sizes).forEach(qty => {
        if (qty < 10) lowStockCount++;
      });
    }
  });

  // Tally-style Keyboard Shortcut listener (F1 to F12)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
        return;
      }
      const shortcuts = {
        'F1': 'dashboard',
        'F2': 'products',
        'F3': 'bom',
        'F4': 'stock',
        'F5': 'purchases',
        'F6': 'materials',
        'F7': 'production',
        'F8': 'invoices',
        'F9': 'returns',
        'F10': 'expenses',
        'F11': 'reports',
        'F12': 'settings'
      };
      if (shortcuts[e.key]) {
        e.preventDefault();
        setActiveTab(shortcuts[e.key]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = () => {
    logoutUser();
    setUser(null);
  };

  const handleToggleTheme = () => {
    const newTheme = tallyTheme === 'dark' ? 'classic' : 'dark';
    setTallyTheme(newTheme);
    if (newTheme === 'classic') {
      document.body.classList.add('tally-theme-classic');
    } else {
      document.body.classList.remove('tally-theme-classic');
    }
  };

  const handleToggleNegativeStock = () => {
    const newVal = !allowNegativeStock;
    setAllowNegativeStock(newVal);
    const settings = getData('SETTINGS') || {};
    settings.allowNegativeStock = newVal;
    saveData('SETTINGS', settings);
  };

  const handleGlobalSearch = (query) => {
    setGlobalSearchQuery(query);
    if (query.trim()) {
      if (query.toLowerCase().includes('inv') || query.toLowerCase().includes('al/')) {
        setActiveTab('invoices');
      } else if (query.toLowerCase().includes('mat') || query.toLowerCase().includes('linen') || query.toLowerCase().includes('cotton')) {
        setActiveTab('materials');
      } else {
        setActiveTab('products');
      }
    }
  };

  // 1. Initial Load Offline Protection
  if (!isOnline && !user) {
    return <OfflineScreen onRetry={checkConnectionNow} isChecking={isChecking} />;
  }

  // 2. Login Screen
  if (!user) {
    return <LoginScreen onLoginSuccess={(u) => setUser(u)} />;
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: 'var(--bg-main)' }}>
      {/* Top Header */}
      <Header
        onLogout={handleLogout}
        onOpenBarcodeModal={() => setShowBarcodeModal(true)}
        onSearch={handleGlobalSearch}
        tallyTheme={tallyTheme}
        onToggleTheme={handleToggleTheme}
        allowNegativeStock={allowNegativeStock}
        onToggleNegativeStock={handleToggleNegativeStock}
        lowStockCount={lowStockCount}
        isOnline={isOnline}
        onRetryConnection={checkConnectionNow}
      />

      {/* Sticky Offline Alert Banner when disconnected while logged in */}
      {!isOnline && (
        <div style={{
          backgroundColor: '#da3633',
          color: '#ffffff',
          padding: '8px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.825rem',
          fontWeight: '700',
          zIndex: 999,
          boxShadow: '0 4px 12px rgba(218, 54, 51, 0.4)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertOctagon size={18} />
            <span>
              🔴 OFFLINE MODE: Connection to ALISTON Server lost (GET /api/health failed). Transaction operations (Invoice creation, Stock edits, Purchases, Production) are locked until connection returns.
            </span>
          </div>
          <button 
            onClick={checkConnectionNow}
            disabled={isChecking}
            style={{
              backgroundColor: '#ffffff',
              color: '#da3633',
              border: 'none',
              borderRadius: '4px',
              padding: '4px 10px',
              fontWeight: '800',
              cursor: isChecking ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.775rem'
            }}
          >
            <RefreshCw size={14} className={isChecking ? 'spin' : ''} />
            {isChecking ? 'Rechecking...' : 'Retry Connection'}
          </button>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          lowStockCount={lowStockCount}
        />

        <main style={{ flex: 1, minWidth: 0, overflowY: 'auto', backgroundColor: 'var(--bg-main)', height: '100%' }}>
          <ErrorBoundary key={activeTab} onReset={() => setActiveTab('dashboard')}>
            {activeTab === 'dashboard' && (
              <DashboardView
                onNavigate={setActiveTab}
                onOpenAddProduct={() => setActiveTab('products')}
                onOpenAddStock={() => setActiveTab('stock')}
                onOpenInvoice={() => setActiveTab('invoices')}
              />
            )}

            {activeTab === 'products' && (
              <ProductMasterView searchQuery={globalSearchQuery} />
            )}

            {activeTab === 'bom' && (
              <BomCostingView />
            )}

            {activeTab === 'stock' && (
              <StockManagementView />
            )}

            {activeTab === 'purchases' && (
              <PurchaseView />
            )}

            {activeTab === 'materials' && (
              <MaterialInventoryView />
            )}

            {activeTab === 'production' && (
              <ProductionView />
            )}

            {activeTab === 'invoices' && (
              <SalesInvoiceView />
            )}

            {activeTab === 'sales-orders' && (
              <SalesOrderView />
            )}

            {activeTab === 'returns' && (
              <SalesReturnView />
            )}

            {activeTab === 'expenses' && (
              <ExpenseView />
            )}

            {activeTab === 'reports' && (
              <ReportsView />
            )}

            {activeTab === 'gst' && (
              <GSTLedgerView />
            )}

            {activeTab === 'settings' && (
              <BackupSettingsView
                onReloadData={() => setReloadCounter(prev => prev + 1)}
                allowNegativeStock={allowNegativeStock}
                onToggleNegativeStock={handleToggleNegativeStock}
              />
            )}
          </ErrorBoundary>
        </main>
      </div>

      {/* Barcode Quick Modal */}
      {showBarcodeModal && (
        <BarcodeModal 
          onClose={() => setShowBarcodeModal(false)}
          onSelectProduct={(p) => setActiveTab('products')}
        />
      )}
    </div>
  );
}
