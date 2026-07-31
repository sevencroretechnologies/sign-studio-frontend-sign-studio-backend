import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { staffBankDetailService, StaffBankDetail } from '../../services/staffBankDetailService';
import { showAlert, showConfirmDialog, getErrorMessage } from '../../lib/sweetalert';
import { useAuth } from '../../context/AuthContext';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button as MuiButton,
  TextField,
  Avatar as MuiAvatar,
  Chip as MuiChip,
  IconButton,
  Menu,
  MenuItem as MuiMenuItem,
  Pagination as MuiPagination,
  Box,
  Typography,
  Skeleton as MuiSkeleton,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AccountBalance as BankIcon,
} from '@mui/icons-material';

export default function StaffBankDetailsList() {
  const { hasPermission } = useAuth();
  const [bankDetails, setBankDetails] = useState<StaffBankDetail[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [totalRows, setTotalRows] = useState(0);

  // Menu Anchors for Actions
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [activeRowId, setActiveRowId] = useState<null | number>(null);

  const fetchBankDetails = useCallback(
    async (currentPage: number = 1) => {
      setIsLoading(true);
      try {
        const params: Record<string, unknown> = {
          page: currentPage,
          per_page: perPage,
        };

        if (search.trim()) {
          params.search = search.trim();
        }

        const response = await staffBankDetailService.getAll(params);
        const { data, meta } = response.data;

        if (Array.isArray(data)) {
          setBankDetails(data);
          setTotalRows(meta?.total ?? 0);
        } else {
          setBankDetails([]);
          setTotalRows(0);
        }
      } catch (error) {
        console.error('Failed to fetch bank details:', error);
        showAlert('error', 'Error', getErrorMessage(error, 'Failed to fetch bank details'));
        setBankDetails([]);
        setTotalRows(0);
      } finally {
        setIsLoading(false);
      }
    },
    [perPage, search]
  );

  useEffect(() => {
    fetchBankDetails(page);
  }, [page, fetchBankDetails]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setSearch('');
    setPage(1);
  };

  const handleDelete = async (id: number) => {
    handleMenuClose();
    const result = await showConfirmDialog(
      'Are you sure?',
      'You want to delete this staff bank details record?'
    );

    if (!result.isConfirmed) return;

    try {
      await staffBankDetailService.delete(id);
      showAlert('success', 'Deleted!', 'Staff bank details deleted successfully', 2000);
      fetchBankDetails(page);
    } catch (error) {
      showAlert('error', 'Error', getErrorMessage(error, 'Failed to delete bank details'));
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'verified':
        return 'success';
      case 'unverified':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'ST';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const totalPages = Math.ceil(totalRows / perPage);

  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>, id: number) => {
    setAnchorEl(event.currentTarget);
    setActiveRowId(id);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setActiveRowId(null);
  };

  const API_BASE_URL = 'http://127.0.0.1:8000';

  const getProfileImageUrl = (path?: string) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pb: 4 }}>
      {/* Header section */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1E293B', fontFamily: 'Inter, sans-serif' }}>
            Staff Bank Details
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5, fontFamily: 'Inter, sans-serif' }}>
            Manage and view bank accounts and verification status for all employees
          </Typography>
        </Box>
        {hasPermission('edit_staff') && (
          <Link to="/staff-bank-details/create" style={{ textDecoration: 'none' }}>
            <MuiButton
              variant="contained"
              startIcon={<AddIcon />}
              sx={{
                backgroundColor: '#2563EB',
                '&:hover': { backgroundColor: '#1D4ED8' },
                borderRadius: '10px',
                px: 3,
                py: 1.2,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
                fontFamily: 'Inter, sans-serif',
                boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
              }}
            >
              Add Bank Details
            </MuiButton>
          </Link>
        )}
      </Box>

      {/* Filter and Table container */}
      <Paper
        elevation={0}
        sx={{
          border: '1px solid #E2E8F0',
          borderRadius: '12px',
          backgroundColor: '#FFFFFF',
          boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.03)',
          overflow: 'hidden'
        }}
      >
        {/* Filters bar */}
        <Box
          component="form"
          onSubmit={handleSearchSubmit}
          sx={{
            p: 3,
            borderBottom: '1px solid #F1F5F9',
            display: 'flex',
            flexFlow: 'row wrap',
            gap: 2,
            alignItems: 'center'
          }}
        >
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexGrow: 1 }}>
            <TextField
              placeholder="Search by staff name, bank, or account number..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              variant="outlined"
              size="small"
              sx={{ width: { xs: '100%', sm: 360 } }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#94A3B8' }} />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: '10px', backgroundColor: '#F8FAFC' }
                }
              }}
            />
            <MuiButton
              type="submit"
              variant="contained"
              sx={{
                backgroundColor: '#2563EB',
                '&:hover': { backgroundColor: '#1D4ED8' },
                borderRadius: '10px',
                px: 2.5,
                height: '40px',
                textTransform: 'none',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                fontFamily: 'Inter, sans-serif'
              }}
            >
              Search
            </MuiButton>
            <MuiButton
              variant="outlined"
              onClick={handleResetFilters}
              sx={{
                borderColor: '#CBD5E1',
                color: '#64748B',
                '&:hover': { backgroundColor: '#F8FAFC', borderColor: '#94A3B8' },
                borderRadius: '10px',
                px: 2.5,
                height: '40px',
                textTransform: 'none',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                fontFamily: 'Inter, sans-serif'
              }}
            >
              Reset
            </MuiButton>
          </Box>
        </Box>

        {/* Directory Table */}
        <TableContainer sx={{ minHeight: 300, maxHeight: 600 }}>
          {isLoading ? (
            <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[...Array(5)].map((_, idx) => (
                <Box key={idx} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <MuiSkeleton variant="circular" width={40} height={40} />
                    <Box>
                      <MuiSkeleton variant="text" width={120} height={20} />
                      <MuiSkeleton variant="text" width={180} height={15} />
                    </Box>
                  </Box>
                  <MuiSkeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: '6px' }} />
                </Box>
              ))}
            </Box>
          ) : bankDetails.length === 0 ? (
            <Box sx={{ py: 8, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <BankIcon sx={{ fontSize: 48, color: '#94A3B8' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#475569', fontFamily: 'Inter, sans-serif' }}>
                No bank details records found
              </Typography>
              <Typography variant="body2" sx={{ color: '#94A3B8', fontFamily: 'Inter, sans-serif' }}>
                Try resetting your search query or add a new record.
              </Typography>
            </Box>
          ) : (
            <Table stickyHeader aria-label="bank details table" sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ backgroundColor: '#F8FAFC', fontWeight: 600, color: '#475569', fontFamily: 'Inter, sans-serif' }}>Avatar</TableCell>
                  <TableCell sx={{ backgroundColor: '#F8FAFC', fontWeight: 600, color: '#475569', fontFamily: 'Inter, sans-serif' }}>Staff Name</TableCell>
                  <TableCell sx={{ backgroundColor: '#F8FAFC', fontWeight: 600, color: '#475569', fontFamily: 'Inter, sans-serif' }}>Designation</TableCell>
                  <TableCell sx={{ backgroundColor: '#F8FAFC', fontWeight: 600, color: '#475569', fontFamily: 'Inter, sans-serif' }}>Bank Name</TableCell>
                  <TableCell sx={{ backgroundColor: '#F8FAFC', fontWeight: 600, color: '#475569', fontFamily: 'Inter, sans-serif' }}>Account Holder</TableCell>
                  <TableCell sx={{ backgroundColor: '#F8FAFC', fontWeight: 600, color: '#475569', fontFamily: 'Inter, sans-serif' }}>Account Number</TableCell>
                  <TableCell sx={{ backgroundColor: '#F8FAFC', fontWeight: 600, color: '#475569', fontFamily: 'Inter, sans-serif' }}>IFSC Code</TableCell>
                  <TableCell sx={{ backgroundColor: '#F8FAFC', fontWeight: 600, color: '#475569', fontFamily: 'Inter, sans-serif' }}>Status</TableCell>
                  <TableCell align="right" sx={{ backgroundColor: '#F8FAFC', fontWeight: 600, color: '#475569', fontFamily: 'Inter, sans-serif' }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bankDetails.map((row) => (
                  <TableRow
                    key={row.id}
                    hover
                    sx={{
                      '&:hover': { backgroundColor: '#F8FAFC !important' },
                      transition: 'background-color 0.2s ease',
                      '& td': { borderBottom: '1px solid #F1F5F9' }
                    }}
                  >
                    <TableCell>
                      <MuiAvatar
                        src={getProfileImageUrl(row.profile_image)}
                        sx={{ bgcolor: 'rgba(37, 99, 235, 0.08)', color: '#2563EB', fontWeight: 700, fontSize: '0.875rem', width: 40, height: 40 }}
                      >
                        {getInitials(row.staff_name)}
                      </MuiAvatar>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#0F172A', fontFamily: 'Inter, sans-serif' }}>
                      {row.staff_name}
                    </TableCell>
                    <TableCell sx={{ color: '#475569', fontFamily: 'Inter, sans-serif' }}>
                      {row.designation || '-'}
                    </TableCell>
                    <TableCell sx={{ color: '#475569', fontFamily: 'Inter, sans-serif' }}>
                      {row.bank_name}
                    </TableCell>
                    <TableCell sx={{ color: '#475569', fontFamily: 'Inter, sans-serif' }}>
                      {row.account_holder_name}
                    </TableCell>
                    <TableCell sx={{ color: '#475569', fontFamily: 'Inter, sans-serif', fontWeight: 550 }}>
                      {row.account_number}
                    </TableCell>
                    <TableCell sx={{ color: '#475569', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase' }}>
                      {row.ifsc_code}
                    </TableCell>
                    <TableCell>
                      <MuiChip
                        label={row.verification_status}
                        color={getStatusColor(row.verification_status)}
                        size="small"
                        sx={{
                          textTransform: 'capitalize',
                          fontWeight: 600,
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          height: '24px'
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton onClick={(e) => handleMenuClick(e, row.id)}>
                        <MoreVertIcon sx={{ color: '#64748B' }} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TableContainer>

        {/* Pagination Section */}
        {totalPages > 1 && (
          <Box sx={{ p: 3, borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'flex-end' }}>
            <MuiPagination
              count={totalPages}
              page={page}
              onChange={(_, value) => setPage(value)}
              color="primary"
              shape="rounded"
              sx={{
                '& .MuiPaginationItem-root': {
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 550
                }
              }}
            />
          </Box>
        )}
      </Paper>

      {/* Actions dropdown menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        slotProps={{
          paper: {
            elevation: 0,
            sx: {
              overflow: 'visible',
              filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.08))',
              mt: 1.5,
              border: '1px solid #E2E8F0',
              borderRadius: '10px',
              minWidth: 150,
              '& .MuiMenuItem-root': {
                fontSize: '0.875rem',
                fontFamily: 'Inter, sans-serif',
                display: 'flex',
                gap: 1.5,
                py: 1,
                px: 2
              }
            }
          }
        }}
      >
        <MuiMenuItem
          component={Link}
          to={`/staff-bank-details/${activeRowId}`}
          onClick={handleMenuClose}
        >
          <VisibilityIcon sx={{ fontSize: 18, color: '#64748B' }} />
          View
        </MuiMenuItem>
        {hasPermission('edit_staff') && (
          <MuiMenuItem
            component={Link}
            to={`/staff-bank-details/${activeRowId}/edit`}
            onClick={handleMenuClose}
          >
            <EditIcon sx={{ fontSize: 18, color: '#64748B' }} />
            Edit
          </MuiMenuItem>
        )}
        {hasPermission('edit_staff') && (
          <MuiMenuItem
            onClick={() => activeRowId && handleDelete(activeRowId)}
            sx={{ color: '#EF4444', '&:hover': { backgroundColor: '#FEF2F2' } }}
          >
            <DeleteIcon sx={{ fontSize: 18, color: '#EF4444' }} />
            Delete
          </MuiMenuItem>
        )}
      </Menu>
    </Box>
  );
}
