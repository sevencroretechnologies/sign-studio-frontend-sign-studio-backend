import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { staffService, settingsService } from '../../services/api';
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
  MenuItem,
  Select as MuiSelect,
  FormControl,
  InputLabel,
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
  People as PeopleIcon,
} from '@mui/icons-material';

interface StaffMember {
  id: number;
  full_name: string;
  personal_email: string;
  work_email: string;
  mobile_number: string;
  designation: string | null;
  division: { title: string } | null;
  office_location: { title: string } | null;
  employment_status: string;
  hire_date: string;
  profile_image?: string | null;
}

export default function StaffList() {
  const { hasPermission } = useAuth();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [perPage] = useState(5);
  const [totalRows, setTotalRows] = useState(0);

  // Filter States
  const [deptFilter, setDeptFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Dropdown options
  const [branchOptions, setBranchOptions] = useState<{ id: number; title: string }[]>([]);
  const [deptOptions, setDeptOptions] = useState<{ id: number; title: string }[]>([]);

  // Menu Anchors for Actions
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [activeRowId, setActiveRowId] = useState<null | number>(null);

  // Fetch branch and department options on mount
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const [branchRes, deptRes] = await Promise.all([
          settingsService.getOfficeLocations({ paginate: 'false' }),
          settingsService.getDivisions({ paginate: 'false' }),
        ]);
        setBranchOptions(branchRes.data?.data ?? []);
        setDeptOptions(deptRes.data?.data ?? []);
      } catch (error) {
        console.error('Failed to load branch/department filter options:', error);
      }
    };
    loadFilterOptions();
  }, []);

  const fetchStaff = useCallback(
    async (currentPage: number = 1) => {
      setIsLoading(true);
      try {
        const params: Record<string, unknown> = {
          page: currentPage,
          per_page: perPage,
        };

        if (search.trim()) {
          params.name = search.trim();
        }
        if (branchFilter !== 'all') {
          params.branch_id = Number(branchFilter);
        }
        if (deptFilter !== 'all') {
          params.department_id = Number(deptFilter);
        }
        if (statusFilter !== 'all') {
          params.status = statusFilter;
        }

        const response = await staffService.getAll(params);
        const { data, meta } = response.data;

        if (Array.isArray(data)) {
          // Filter out the primary Super Admin system account (typically user ID 1)
          const filteredData = data.filter((s: any) => s.user?.id !== 1);
          setStaff(filteredData);
          setTotalRows((meta?.total ?? 0) - (data.length - filteredData.length));
        } else {
          setStaff([]);
          setTotalRows(0);
        }
      } catch (error) {
        console.error('Failed to fetch staff:', error);
        showAlert('error', 'Error', getErrorMessage(error, 'Failed to fetch staff'));
        setStaff([]);
        setTotalRows(0);
      } finally {
        setIsLoading(false);
      }
    },
    [perPage, search, branchFilter, deptFilter, statusFilter]
  );

  useEffect(() => {
    fetchStaff(page);
  }, [page, fetchStaff]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setSearch('');
    setBranchFilter('all');
    setDeptFilter('all');
    setStatusFilter('all');
    setPage(1);
  };

  const handleDelete = async (id: number) => {
    handleMenuClose();
    const result = await showConfirmDialog(
      'Are you sure?',
      'You want to delete this staff member?'
    );

    if (!result.isConfirmed) return;

    try {
      await staffService.delete(id);
      showAlert('success', 'Deleted!', 'Staff member deleted successfully', 2000);
      fetchStaff(page);
    } catch (error) {
      showAlert('error', 'Error', getErrorMessage(error, 'Failed to delete staff'));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'success';
      case 'on_leave':
        return 'warning';
      case 'terminated':
        return 'error';
      case 'resigned':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  const totalPages = Math.ceil(totalRows / perPage);



  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>, id: number) => {
    setAnchorEl(event.currentTarget);
    setActiveRowId(id);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setActiveRowId(null);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pb: 4 }}>
      {/* Header section */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1E293B', fontFamily: 'Inter, sans-serif' }}>
            Staff Directory
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5, fontFamily: 'Inter, sans-serif' }}>
            Manage and view all employee details and statuses
          </Typography>
        </Box>
        {hasPermission('create_staff') && (
          <Link to="/staff/create" style={{ textDecoration: 'none' }}>
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
              Add Employee
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
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexGrow: { xs: 1, sm: 0 }, width: { xs: '100%', sm: 'auto' } }}>
            <TextField
              placeholder="Search by Employee Name..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              variant="outlined"
              size="small"
              sx={{ width: { xs: '100%', sm: 260 } }}
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
           
          </Box>

          <FormControl size="small" sx={{ minWidth: 160, flexGrow: { xs: 1, sm: 0 } }}>
            <InputLabel id="branch-filter-label" sx={{ fontSize: '0.875rem' }}>Branch</InputLabel>
            <MuiSelect
              labelId="branch-filter-label"
              value={branchFilter}
              onChange={(e) => {
                setBranchFilter(e.target.value as string);
                setPage(1);
              }}
              label="Branch"
              sx={{ borderRadius: '10px' }}
            >
              <MenuItem value="all">All Branches</MenuItem>
              {branchOptions.map((b) => (
                <MenuItem key={b.id} value={b.id}>{b.title}</MenuItem>
              ))}
            </MuiSelect>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 160, flexGrow: { xs: 1, sm: 0 } }}>
            <InputLabel id="dept-filter-label" sx={{ fontSize: '0.875rem' }}>Department</InputLabel>
            <MuiSelect
              labelId="dept-filter-label"
              value={deptFilter}
              onChange={(e) => {
                setDeptFilter(e.target.value as string);
                setPage(1);
              }}
              label="Department"
              sx={{ borderRadius: '10px' }}
            >
              <MenuItem value="all">All Departments</MenuItem>
              {deptOptions.map((d) => (
                <MenuItem key={d.id} value={d.id}>{d.title}</MenuItem>
              ))}
            </MuiSelect>
          </FormControl>

          {/* <FormControl size="small" sx={{ minWidth: 160, flexGrow: { xs: 1, sm: 0 } }}>
            <InputLabel id="status-filter-label" sx={{ fontSize: '0.875rem' }}>Status</InputLabel>
            <MuiSelect
              labelId="status-filter-label"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as string);
                setPage(1);
              }}
              label="Status"
              sx={{ borderRadius: '10px' }}
            >
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="on_leave">On Leave</MenuItem>
              <MenuItem value="terminated">Terminated</MenuItem>
              <MenuItem value="resigned">Resigned</MenuItem>
            </MuiSelect>
          </FormControl> */}
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
            Reset Filters
          </MuiButton>
        </Box>

        {/* Directory Table */}
        <TableContainer sx={{ minHeight: 300, maxHeight: 600 }}>
          {isLoading ? (
            <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[...Array(4)].map((_, idx) => (
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
          ) : staff.length === 0 ? (
            <Box sx={{ py: 8, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <PeopleIcon sx={{ fontSize: 48, color: '#94A3B8' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#475569', fontFamily: 'Inter, sans-serif' }}>
                No staff members found
              </Typography>
              <Typography variant="body2" sx={{ color: '#94A3B8', fontFamily: 'Inter, sans-serif' }}>
                Try resetting your search parameter or filter choices.
              </Typography>
            </Box>
          ) : (
            <Table stickyHeader aria-label="staff table" sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ backgroundColor: '#F8FAFC', fontWeight: 600, color: '#475569', fontFamily: 'Inter, sans-serif' }}>Avatar</TableCell>
                  <TableCell sx={{ backgroundColor: '#F8FAFC', fontWeight: 600, color: '#475569', fontFamily: 'Inter, sans-serif' }}>Employee ID</TableCell>
                  <TableCell sx={{ backgroundColor: '#F8FAFC', fontWeight: 600, color: '#475569', fontFamily: 'Inter, sans-serif' }}>Employee Name</TableCell>
                  <TableCell sx={{ backgroundColor: '#F8FAFC', fontWeight: 600, color: '#475569', fontFamily: 'Inter, sans-serif' }}>Department</TableCell>
                  <TableCell sx={{ backgroundColor: '#F8FAFC', fontWeight: 600, color: '#475569', fontFamily: 'Inter, sans-serif' }}>Office Location</TableCell>
                  <TableCell sx={{ backgroundColor: '#F8FAFC', fontWeight: 600, color: '#475569', fontFamily: 'Inter, sans-serif' }}>Designation</TableCell>
                  <TableCell sx={{ backgroundColor: '#F8FAFC', fontWeight: 600, color: '#475569', fontFamily: 'Inter, sans-serif' }}>Email</TableCell>
                  <TableCell sx={{ backgroundColor: '#F8FAFC', fontWeight: 600, color: '#475569', fontFamily: 'Inter, sans-serif' }}>Mobile</TableCell>
                  <TableCell sx={{ backgroundColor: '#F8FAFC', fontWeight: 600, color: '#475569', fontFamily: 'Inter, sans-serif' }}>Status</TableCell>
                  <TableCell align="right" sx={{ backgroundColor: '#F8FAFC', fontWeight: 600, color: '#475569', fontFamily: 'Inter, sans-serif' }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {staff.map((row) => (
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
                        src={row.profile_image ? (row.profile_image.startsWith('http') ? row.profile_image : `http://127.0.0.1:8000${row.profile_image.startsWith('/') ? '' : '/'}${row.profile_image}`) : undefined}
                        sx={{ bgcolor: 'rgba(37, 99, 235, 0.08)', color: '#2563EB', fontWeight: 700, fontSize: '0.875rem', width: 40, height: 40 }}
                      >
                        {getInitials(row.full_name)}
                      </MuiAvatar>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 550, color: '#475569', fontFamily: 'Inter, sans-serif' }}>
                      #EMP-{row.id}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#0F172A', fontFamily: 'Inter, sans-serif' }}>
                      {row.full_name}
                    </TableCell>
                    <TableCell sx={{ color: '#475569', fontFamily: 'Inter, sans-serif' }}>
                      {row.division?.title || '-'}
                    </TableCell>
                    <TableCell sx={{ color: '#475569', fontFamily: 'Inter, sans-serif' }}>
                      {row.office_location?.title || '-'}
                    </TableCell>
                    <TableCell sx={{ color: '#475569', fontFamily: 'Inter, sans-serif' }}>
                      {row.designation || '-'}
                    </TableCell>
                    <TableCell sx={{ color: '#475569', fontFamily: 'Inter, sans-serif' }}>
                      {row.work_email || row.personal_email || '-'}
                    </TableCell>
                    <TableCell sx={{ color: '#475569', fontFamily: 'Inter, sans-serif' }}>
                      {row.mobile_number|| '-'}
                    </TableCell>
                    <TableCell>
                      <MuiChip
                        label={row.employment_status?.replace('_', ' ') || 'Unknown'}
                        color={getStatusColor(row.employment_status)}
                        size="small"
                        variant="filled"
                        sx={{
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          textTransform: 'capitalize',
                          backgroundColor:
                            row.employment_status === 'active'
                              ? 'rgba(34, 197, 94, 0.1)'
                              : row.employment_status === 'on_leave'
                              ? 'rgba(234, 179, 8, 0.1)'
                              : 'rgba(100, 116, 139, 0.1)',
                          color:
                            row.employment_status === 'active'
                              ? '#16A34A'
                              : row.employment_status === 'on_leave'
                              ? '#CA8A04'
                              : '#475569',
                          borderRadius: '8px',
                          border: 'none',
                          px: 0.5
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={(e) => handleMenuClick(e, row.id)}>
                        <MoreVertIcon sx={{ color: '#94A3B8' }} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TableContainer>

        {/* Menu Actions for Row */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          elevation={1}
          slotProps={{
            paper: {
              sx: {
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                minWidth: 130
              }
            }
          }}
        >
          {activeRowId && (
            <>
              <MuiMenuItem component={Link} to={`/staff/${activeRowId}`} onClick={handleMenuClose} sx={{ gap: 1.5, fontSize: '0.85rem' }}>
                <VisibilityIcon fontSize="small" sx={{ color: '#64748B' }} /> View
              </MuiMenuItem>
              {hasPermission('edit_staff') && (
                <MuiMenuItem component={Link} to={`/staff/${activeRowId}/edit`} onClick={handleMenuClose} sx={{ gap: 1.5, fontSize: '0.85rem' }}>
                  <EditIcon fontSize="small" sx={{ color: '#64748B' }} /> Edit
                </MuiMenuItem>
              )}
              {hasPermission('delete_staff') && (
                <MuiMenuItem
                  onClick={() => handleDelete(activeRowId)}
                  sx={{ gap: 1.5, color: '#EF4444', fontSize: '0.85rem', '&:hover': { backgroundColor: 'rgba(239, 68, 68, 0.05)' } }}
                >
                  <DeleteIcon fontSize="small" sx={{ color: '#EF4444' }} /> Delete
                </MuiMenuItem>
              )}
            </>
          )}
        </Menu>

        {/* Pagination */}
        {totalPages > 1 && (
          <Box
            sx={{
              p: 3,
              borderTop: '1px solid #F1F5F9',
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 2
            }}
          >
            <Typography variant="caption" sx={{ color: '#64748B', fontFamily: 'Inter, sans-serif' }}>
              Showing page {page} of {totalPages} ({totalRows} items)
            </Typography>
            <MuiPagination
              count={totalPages}
              page={page}
              onChange={(_, value) => setPage(value)}
              variant="outlined"
              shape="rounded"
              sx={{
                '& .MuiPaginationItem-root': {
                  borderRadius: '8px',
                  fontFamily: 'Inter, sans-serif',
                  '&.Mui-selected': {
                    backgroundColor: '#2563EB',
                    color: '#FFFFFF',
                    border: '1px solid #2563EB',
                    '&:hover': {
                      backgroundColor: '#1D4ED8'
                    }
                  }
                }
              }}
            />
          </Box>
        )}
      </Paper>
    </Box>
  );
}
