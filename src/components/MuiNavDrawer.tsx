import React from 'react';
import { useFarm } from '../context/FarmContext';
import { ActiveTab } from '../types';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Chip,
  Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import {
  LayoutDashboard,
  Egg,
  ShoppingBag,
  Layers,
  PieChart,
  BarChart3,
  Settings,
  Flame,
  Users,
  LogOut,
} from 'lucide-react';
import { formatKg, formatRupiah } from '../utils/formatters';

interface MuiNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MuiNavDrawer: React.FC<MuiNavDrawerProps> = ({ isOpen, onClose }) => {
  const {
    activeTab,
    setActiveTab,
    totalStockKg,
    settings,
    todayProfit,
    currentUser,
    logout,
  } = useFarm();

  const navItems: {
    id: ActiveTab;
    label: string;
    icon: React.FC<{ className?: string }>;
    badge?: string;
    iconColor: string;
    iconBg: string;
  }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard Utama',
      icon: LayoutDashboard,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50',
    },
    {
      id: 'produksi',
      label: 'Produksi Telur',
      icon: Egg,
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-50',
    },
    {
      id: 'penjualan',
      label: 'Telur Terjual',
      icon: ShoppingBag,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50',
    },
    {
      id: 'stok',
      label: 'Sisa Stok Telur',
      icon: Layers,
      badge: formatKg(totalStockKg, 0),
      iconColor: 'text-sky-600',
      iconBg: 'bg-sky-50',
    },
    {
      id: 'alokasi',
      label: 'Alokasi Modal (63%)',
      icon: PieChart,
      iconColor: 'text-purple-600',
      iconBg: 'bg-purple-50',
    },
    {
      id: 'laporan',
      label: 'Laporan & Grafik',
      icon: BarChart3,
      iconColor: 'text-cyan-600',
      iconBg: 'bg-cyan-50',
    },
    {
      id: 'pengaturan',
      label: 'Pengaturan & Harga',
      icon: Settings,
      iconColor: 'text-slate-600',
      iconBg: 'bg-slate-100',
    },
    {
      id: 'pengguna',
      label: 'Manajemen User',
      icon: Users,
      iconColor: 'text-indigo-600',
      iconBg: 'bg-indigo-50',
    },
  ];

  const handleItemClick = (id: ActiveTab) => {
    setActiveTab(id);
    onClose();
  };

  return (
    <Drawer
      anchor="left"
      open={isOpen}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: { xs: 280, sm: 320 },
          bgcolor: '#ffffff',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #f1f5f9',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 2.5,
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 2px 4px rgba(217, 119, 6, 0.2)',
              flexShrink: 0,
            }}
          >
            <Egg className="w-5 h-5 fill-amber-100" />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              noWrap
              sx={{ fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}
            >
              {settings.farmName}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              Menu Manajemen Peternakan
            </Typography>
          </Box>
        </Box>

        <IconButton
          onClick={onClose}
          size="small"
          aria-label="tutup menu"
          sx={{
            color: '#64748b',
            bgcolor: '#f8fafc',
            border: '1px solid #e2e8f0',
            '&:hover': { bgcolor: '#f1f5f9' },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Navigation List */}
      <List sx={{ px: 1.5, py: 2, flex: 1, overflowY: 'auto' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isSelected = activeTab === item.id;

          return (
            <ListItemButton
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              selected={isSelected}
              sx={{
                mb: 0.8,
                borderRadius: 2,
                px: 1.5,
                py: 1.2,
                '&.Mui-selected': {
                  bgcolor: '#0f172a',
                  color: '#ffffff',
                  '&:hover': {
                    bgcolor: '#1e293b',
                  },
                  '& .MuiListItemIcon-root': {
                    color: '#fcd34d',
                  },
                  '& .MuiTypography-root': {
                    color: '#ffffff',
                    fontWeight: 700,
                  },
                },
                '&:hover': {
                  bgcolor: '#f8fafc',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: isSelected ? '#1e293b' : undefined,
                    color: isSelected ? '#fcd34d' : undefined,
                  }}
                  className={!isSelected ? `${item.iconBg} ${item.iconColor}` : ''}
                >
                  <Icon className="w-4 h-4" />
                </Box>
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography
                    sx={{
                      fontSize: '0.85rem',
                      fontWeight: isSelected ? 700 : 500,
                      color: isSelected ? '#ffffff' : '#334155',
                    }}
                  >
                    {item.label}
                  </Typography>
                }
              />
              {item.badge && (
                <Chip
                  label={item.badge}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    bgcolor: isSelected ? '#334155' : '#f1f5f9',
                    color: isSelected ? '#fef08a' : '#475569',
                  }}
                />
              )}
            </ListItemButton>
          );
        })}
      </List>

      <Divider />

      {/* Mini Status Footer */}
      <Box sx={{ p: 2, bgcolor: '#f8fafc' }}>
        {currentUser && (
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: '#ffffff',
              border: '1px solid #e2e8f0',
              mb: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: 1.5,
                  bgcolor: '#d97706',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {currentUser.fullName.charAt(0).toUpperCase()}
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography noWrap variant="caption" sx={{ fontWeight: 700, color: '#0f172a', display: 'block', lineHeight: 1.2 }}>
                  {currentUser.fullName}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.65rem', textTransform: 'capitalize' }}>
                  {currentUser.role}
                </Typography>
              </Box>
            </Box>
            <IconButton
              size="small"
              onClick={() => {
                logout();
                onClose();
              }}
              title="Keluar / Logout"
              sx={{ color: '#94a3b8', '&:hover': { color: '#e11d48', bgcolor: '#ffe4e6' } }}
            >
              <LogOut className="w-3.5 h-3.5" />
            </IconButton>
          </Box>
        )}

        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            bgcolor: '#ffffff',
            border: '1px solid #e2e8f0',
            mb: 1.5,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Flame className="w-3.5 h-3.5 text-amber-600" />
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#92400e' }}>
              Alokasi Laba Hari Ini
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ fontWeight: 700, color: '#059669', fontFamily: 'monospace' }}>
            {formatRupiah(todayProfit)}
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.68rem', display: 'block' }}>
            63% Pakan • 20% Ayam • 12% Upah
          </Typography>
        </Box>

        <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem', display: 'block', textAlign: 'center' }}>
          TelurPro System • Material MUI
        </Typography>
      </Box>
    </Drawer>
  );
};
