import React from 'react';
import { 
  LayoutDashboard, 
  Shirt, 
  Scissors, 
  Calculator, 
  Boxes, 
  ShoppingBag, 
  Factory, 
  FileText, 
  RotateCcw, 
  DollarSign, 
  BarChart3, 
  Settings,
  Layers,
  ShoppingCart
} from 'lucide-react';

export const Sidebar = ({ activeTab, setActiveTab, lowStockCount = 0 }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, shortcut: 'F1' },
    { id: 'products', label: 'Product Master', icon: Shirt, shortcut: 'F2' },
    { id: 'bom', label: 'BOM & Costing', icon: Calculator, shortcut: 'F3' },
    { id: 'stock', label: 'Stock Ledger (S-3XL)', icon: Boxes, shortcut: 'F4', badge: lowStockCount },
    { id: 'purchases', label: 'Purchase Entry', icon: ShoppingBag, shortcut: 'F5' },
    { id: 'materials', label: 'Material Inventory', icon: Scissors, shortcut: 'F6' },
    { id: 'production', label: 'Production Entry', icon: Factory, shortcut: 'F7' },
    { id: 'invoices', label: 'Sales Invoices', icon: FileText, shortcut: 'F8' },
    { id: 'sales-orders', label: 'Sales Orders', icon: ShoppingCart, shortcut: 'F8.5' },
    { id: 'returns', label: 'Sales Returns', icon: RotateCcw, shortcut: 'F9' },
    { id: 'expenses', label: 'Expenses', icon: DollarSign, shortcut: 'F10' },
    { id: 'reports', label: 'Reports Hub', icon: BarChart3, shortcut: 'F11' },
    { id: 'settings', label: 'Settings & Backup', icon: Settings, shortcut: 'F12' }
  ];

  return (
    <aside className="no-print" style={{
      width: '240px',
      backgroundColor: '#090d12',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflowY: 'auto',
      flexShrink: 0
    }}>
      {/* Tally ERP Navigation Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--border-color)',
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <span style={{ fontSize: '0.725rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', fontWeight: '700' }}>
          GATEWAY OF ALISTON
        </span>
        <span style={{ fontSize: '0.675rem', color: 'var(--accent-gold)', fontWeight: '700' }}>ERP 9</span>
      </div>

      <nav style={{ padding: '12px 8px', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '9px 12px',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: isActive ? '700' : '500',
                color: isActive ? '#0b0f19' : 'var(--text-primary)',
                backgroundColor: isActive ? 'var(--accent-gold)' : 'transparent',
                textAlign: 'left',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Icon size={17} color={isActive ? '#0b0f19' : 'var(--accent-gold)'} />
                <span>{item.label}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {item.badge > 0 && (
                  <span style={{
                    backgroundColor: isActive ? '#0b0f19' : '#da3633',
                    color: isActive ? 'var(--accent-gold)' : '#ffffff',
                    fontSize: '0.675rem',
                    fontWeight: '800',
                    padding: '1px 6px',
                    borderRadius: '10px'
                  }}>
                    {item.badge}
                  </span>
                )}
                <span style={{
                  fontSize: '0.675rem',
                  opacity: isActive ? 0.9 : 0.4,
                  fontFamily: 'var(--font-mono)'
                }}>
                  [{item.shortcut}]
                </span>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid var(--border-color)',
        fontSize: '0.725rem',
        color: 'var(--text-muted)'
      }}>
        <div>Shree Ram Enterprise</div>
        <div style={{ color: 'var(--accent-gold)' }}>ALISTON v2.5 ERP</div>
      </div>
    </aside>
  );
};
