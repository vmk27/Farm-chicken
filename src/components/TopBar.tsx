import React, { useState } from 'react';
import { useFarm } from '../context/FarmContext';
import { formatRupiah, formatDateIndo } from '../utils/formatters';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Tooltip,
  Chip,
  Button,
  Box,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import {
  Egg,
  ShoppingBag,
  Receipt,
  TrendingUp,
  LogOut,
  User,
  Database,
} from 'lucide-react';
import { NewProductionModal } from './modals/NewProductionModal';
import { NewSaleModal } from './modals/NewSaleModal';
import { NewExpenseModal } from './modals/NewExpenseModal';
import { SaleRecord } from '../types';
import { InvoiceModal } from './modals/InvoiceModal';
import { AutoDbSetupModal } from './modals/AutoDbSetupModal';

interface TopBarProps {
  onOpenMenu?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onOpenMenu }) => {
  const {
    activeTab,
    todayDate,
    settings,
    currentUser,
    logout,
  } = useFarm();

  const [isProdModalOpen, setIsProdModalOpen] = useState(false);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isAutoDbOpen, setIsAutoDbOpen] = useState(false);
  const [lastCreatedSale, setLastCreatedSale] = useState<SaleRecord | null>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Dashboard Monitoring';
      case 'produksi':
        return 'Pencatatan Panen Telur';
      case 'penjualan':
        return 'Kasir Penjualan Telur';
      case 'stok':
        return 'Manajemen Gudang & Stok';
      case 'alokasi':
        return 'Konversi Laba ke Modal';
      case 'laporan':
        return 'Laporan & Grafik Finansial';
      case 'pengaturan':
        return 'Pengaturan & Master Data';
      case 'pengguna':
        return 'Manajemen Pengguna & Otorisasi';
      default:
        return 'Sistem Peternakan Telur';
    }
  };

  const handleSaleSuccess = (sale: SaleRecord) => {
    setLastCreatedSale(sale);
    setIsInvoiceOpen(true);
  };

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: '#ffffff',
          color: '#0f172a',
          borderBottom: '1px solid #e2e8f0',
          zIndex: 30,
        }}
      >
        <Toolbar
          variant="dense"
          sx={{
            minHeight: { xs: 56, sm: 64 },
            px: { xs: 1.5, sm: 3 },
            justifyContent: 'space-between',
            gap: 1,
          }}
        >
          {/* Left: Mobile Menu IconButton & Title */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 }, minWidth: 0 }}>
            {onOpenMenu && (
              <IconButton
                color="inherit"
                aria-label="buka menu navigasi"
                onClick={onOpenMenu}
                edge="start"
                sx={{
                  bgcolor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  p: { xs: 0.8, sm: 1 },
                  '&:hover': { bgcolor: '#f1f5f9' },
                }}
              >
                <MenuIcon sx={{ fontSize: { xs: 20, sm: 22 } }} />
              </IconButton>
            )}

            <Box sx={{ minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 700,
                    color: '#0f172a',
                    fontSize: { xs: '0.85rem', sm: '1rem' },
                    lineHeight: 1.2,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {getTabTitle()}
                </Typography>
              </Box>

              <Typography
                variant="caption"
                sx={{
                  color: '#64748b',
                  fontSize: { xs: '0.68rem', sm: '0.75rem' },
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                <span>{settings.farmName}</span>
                <span>•</span>
                <span>{formatDateIndo(todayDate)}</span>
              </Typography>
            </Box>
          </Box>

          {/* Right: Actions & Material IconButtons */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.8, sm: 1.5 } }}>
            {/* Market Price Chip */}
            <Chip
              icon={<TrendingUp className="w-3.5 h-3.5 text-emerald-600" />}
              label={`Pasar: ${formatRupiah(settings.currentMarketPricePerKg)}/kg`}
              size="small"
              sx={{
                display: { xs: 'none', lg: 'inline-flex' },
                bgcolor: '#f8fafc',
                border: '1px solid #e2e8f0',
                fontWeight: 600,
                fontSize: '0.75rem',
                color: '#334155',
              }}
            />

            {/* Database Auto Setup Button */}
            <Tooltip title="Buat Tabel Database Otomatis & Status Supabase">
              <IconButton
                onClick={() => setIsAutoDbOpen(true)}
                size="small"
                sx={{
                  border: '1px solid #a7f3d0',
                  bgcolor: '#ecfdf5',
                  color: '#047857',
                  p: 1,
                  '&:hover': { bgcolor: '#d1fae5' },
                }}
              >
                <Database className="w-4 h-4 text-emerald-600" />
              </IconButton>
            </Tooltip>

            {/* Action 1: + Panen Telur (MUI IconButton on mobile, Button on tablet/desktop) */}
            <Tooltip title="Catat Panen Telur Hari Ini">
              <Box>
                {/* Mobile: MUI IconButton */}
                <IconButton
                  onClick={() => setIsProdModalOpen(true)}
                  aria-label="catat panen telur"
                  sx={{
                    display: { xs: 'inline-flex', sm: 'none' },
                    bgcolor: '#fef3c7',
                    color: '#92400e',
                    border: '1px solid #fde68a',
                    p: 1,
                    '&:hover': { bgcolor: '#fde68a' },
                  }}
                >
                  <Egg className="w-4 h-4 fill-amber-300 text-amber-800" />
                </IconButton>

                {/* Desktop: MUI Button */}
                <Button
                  variant="contained"
                  onClick={() => setIsProdModalOpen(true)}
                  startIcon={<Egg className="w-4 h-4" />}
                  sx={{
                    display: { xs: 'none', sm: 'inline-flex' },
                    bgcolor: '#fef3c7',
                    color: '#92400e',
                    border: '1px solid #fcd34d',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    px: 1.8,
                    py: 0.7,
                    '&:hover': { bgcolor: '#fde68a' },
                  }}
                >
                  + Panen
                </Button>
              </Box>
            </Tooltip>

            {/* Action 2: + Jual Telur (MUI IconButton on mobile, Button on tablet/desktop) */}
            <Tooltip title="Buka Kasir Penjualan Telur">
              <Box>
                {/* Mobile: MUI IconButton */}
                <IconButton
                  onClick={() => setIsSaleModalOpen(true)}
                  aria-label="kasir jual telur"
                  sx={{
                    display: { xs: 'inline-flex', sm: 'none' },
                    bgcolor: '#059669',
                    color: '#ffffff',
                    p: 1,
                    '&:hover': { bgcolor: '#047857' },
                  }}
                >
                  <ShoppingBag className="w-4 h-4" />
                </IconButton>

                {/* Desktop: MUI Button */}
                <Button
                  variant="contained"
                  onClick={() => setIsSaleModalOpen(true)}
                  startIcon={<ShoppingBag className="w-4 h-4" />}
                  sx={{
                    display: { xs: 'none', sm: 'inline-flex' },
                    bgcolor: '#059669',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    px: 2,
                    py: 0.7,
                    '&:hover': { bgcolor: '#047857' },
                  }}
                >
                  + Jual Telur
                </Button>
              </Box>
            </Tooltip>

            {/* Action 3: + Biaya (MUI IconButton on tablet, Button on desktop) */}
            <Tooltip title="Catat Pengeluaran / Biaya">
              <Box>
                <IconButton
                  onClick={() => setIsExpenseModalOpen(true)}
                  aria-label="catat biaya operasional"
                  sx={{
                    display: { xs: 'none', md: 'inline-flex', lg: 'none' },
                    bgcolor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    color: '#475569',
                    p: 1,
                    '&:hover': { bgcolor: '#f8fafc' },
                  }}
                >
                  <Receipt className="w-4 h-4" />
                </IconButton>

                <Button
                  variant="outlined"
                  onClick={() => setIsExpenseModalOpen(true)}
                  startIcon={<Receipt className="w-4 h-4 text-slate-500" />}
                  sx={{
                    display: { xs: 'none', lg: 'inline-flex' },
                    borderColor: '#cbd5e1',
                    color: '#334155',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    px: 1.5,
                    py: 0.7,
                    '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' },
                  }}
                >
                  + Biaya
                </Button>
              </Box>
            </Tooltip>

            {/* Current User Badge & Logout */}
            {currentUser && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pl: { xs: 0.5, sm: 1 }, borderLeft: '1px solid #e2e8f0' }}>
                <Box sx={{ display: { xs: 'none', md: 'flex' }, flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.75rem' }}>
                    {currentUser.fullName}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.65rem', textTransform: 'capitalize' }}>
                    {currentUser.role}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 2,
                    bgcolor: '#f59e0b',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                  }}
                  title={`${currentUser.fullName} (@${currentUser.username})`}
                >
                  {currentUser.fullName.charAt(0).toUpperCase()}
                </Box>

                <Tooltip title="Keluar / Logout">
                  <IconButton
                    onClick={logout}
                    size="small"
                    sx={{
                      color: '#64748b',
                      p: 0.8,
                      '&:hover': { color: '#e11d48', bgcolor: '#ffe4e6' },
                    }}
                  >
                    <LogOut className="w-4 h-4" />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Modals */}
      <NewProductionModal
        isOpen={isProdModalOpen}
        onClose={() => setIsProdModalOpen(false)}
      />
      <NewSaleModal
        isOpen={isSaleModalOpen}
        onClose={() => setIsSaleModalOpen(false)}
        onSuccessCreated={handleSaleSuccess}
      />
      <NewExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
      />
      <InvoiceModal
        sale={lastCreatedSale}
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
      />
      <AutoDbSetupModal
        isOpen={isAutoDbOpen}
        onClose={() => setIsAutoDbOpen(false)}
      />
    </>
  );
};
