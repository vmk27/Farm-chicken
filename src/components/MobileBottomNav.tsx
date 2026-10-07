import React from 'react';
import { useFarm } from '../context/FarmContext';
import { ActiveTab } from '../types';
import {
  Paper,
  BottomNavigation,
  BottomNavigationAction,
} from '@mui/material';
import {
  LayoutDashboard,
  Egg,
  ShoppingBag,
  Layers,
} from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const { activeTab, setActiveTab } = useFarm();

  // Keep it minimal: only 4 core items, no floating clutter
  const currentTab = ['dashboard', 'produksi', 'penjualan', 'stok'].includes(activeTab)
    ? activeTab
    : false;

  return (
    <Paper
      elevation={3}
      sx={{
        display: { xs: 'block', md: 'none' },
        position: 'sticky',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 20,
        borderTop: '1px solid #e2e8f0',
        bgcolor: '#ffffff',
      }}
    >
      <BottomNavigation
        showLabels
        value={currentTab}
        onChange={(_, newValue: ActiveTab) => {
          if (newValue) {
            setActiveTab(newValue);
          }
        }}
        sx={{
          height: 54,
          '& .MuiBottomNavigationAction-root': {
            minWidth: 0,
            py: 0.5,
            px: 1,
            color: '#64748b',
            '&.Mui-selected': {
              color: '#d97706',
              fontWeight: 700,
            },
          },
          '& .MuiBottomNavigationAction-label': {
            fontSize: '0.68rem',
            '&.Mui-selected': {
              fontSize: '0.72rem',
              fontWeight: 700,
            },
          },
        }}
      >
        <BottomNavigationAction
          label="Dashboard"
          value="dashboard"
          icon={<LayoutDashboard className="w-4 h-4" />}
        />
        <BottomNavigationAction
          label="Panen"
          value="produksi"
          icon={<Egg className="w-4 h-4" />}
        />
        <BottomNavigationAction
          label="Jual"
          value="penjualan"
          icon={<ShoppingBag className="w-4 h-4" />}
        />
        <BottomNavigationAction
          label="Stok"
          value="stok"
          icon={<Layers className="w-4 h-4" />}
        />
      </BottomNavigation>
    </Paper>
  );
};
