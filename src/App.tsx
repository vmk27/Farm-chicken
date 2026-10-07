import React, { useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from './theme';
import { FarmProvider, useFarm } from './context/FarmContext';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { MuiNavDrawer } from './components/MuiNavDrawer';
import { Dashboard } from './components/Dashboard';
import { ProductionView } from './components/ProductionView';
import { SalesView } from './components/SalesView';
import { StockView } from './components/StockView';
import { ProfitAllocationView } from './components/ProfitAllocationView';
import { MonthlyReportView } from './components/MonthlyReportView';
import { SettingsView } from './components/SettingsView';
import { UserManagementView } from './components/UserManagementView';
import { LoginView } from './components/LoginView';

const MainLayout: React.FC = () => {
  const { activeTab, currentUser } = useFarm();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Jika belum login, tampilkan halaman login awal sederhana
  if (!currentUser) {
    return <LoginView />;
  }

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex shrink-0">
        <Sidebar />
      </div>

      {/* Material UI Navigation Drawer */}
      <MuiNavDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Unified Material UI AppBar with Toolbar & IconButtons */}
        <TopBar onOpenMenu={() => setIsMobileMenuOpen(true)} />

        {/* Scrollable View Container */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden pb-14 md:pb-6">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'produksi' && <ProductionView />}
          {activeTab === 'penjualan' && <SalesView />}
          {activeTab === 'stok' && <StockView />}
          {activeTab === 'alokasi' && <ProfitAllocationView />}
          {activeTab === 'laporan' && <MonthlyReportView />}
          {activeTab === 'pengaturan' && <SettingsView />}
          {activeTab === 'pengguna' && <UserManagementView />}
        </main>

        {/* Minimal Material UI Bottom Navigation */}
        <MobileBottomNav />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <FarmProvider>
        <MainLayout />
      </FarmProvider>
    </ThemeProvider>
  );
}

