import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { payrollService } from '../../services/api';
import { showAlert } from '../../lib/sweetalert';
import SalarySlipModal from './SalarySlipModal';
import LateFineDetailsModal from './LateFineDetailsModal';
import {
  Grid,
  Button as MuiButton,
  TextField,
  MenuItem,
  Select as MuiSelect,
  FormControl,
  InputLabel,
  Avatar as MuiAvatar,
  Box,
  Typography,
  Skeleton as MuiSkeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Pagination as MuiPagination,
  IconButton,
  InputAdornment,
} from '@mui/material';
import {
  CurrencyRupee as IndianRupeeIcon,
  Download as DownloadIcon,
  Visibility as EyeIcon,
  People as PeopleIcon,
  CheckCircle as PaidIcon,
  HourglassEmpty as PendingIcon,
  Assignment as SlipIcon,
  Add as AddIcon,
  Search as SearchIcon,
} from '@mui/icons-material';

interface SalarySlip {
  id: number;
  slip_reference: string;
  staff_member: {
    full_name: string;
    staff_code: string;
    personal_email: string | null;
    mobile_number: string | null;
    bank_account_name: string | null;
    bank_account_number: string | null;
    bank_name: string | null;
    job_title?: {
      title: string;
    };
  };
  salary_period: string;
  basic_salary: string;
  benefits_breakdown: Array<{ name: string; amount: string }>;
  deductions_breakdown: Array<{ name: string; amount: string; details?: Array<{ date: string; late_minutes: number; penalty_amount: number; note: string }> }>;
  attendance_summary?: Record<string, number | string | unknown[]>;
  total_earnings: string;
  total_deductions: string;
  net_payable: string;
  status: string;
  generated_at: string;
  paid_at: string | null;
  created_at: string;
}

export default function SalarySlips() {
  const [slips, setSlips] = useState<SalarySlip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [salaryPeriod, setSalaryPeriod] = useState('');
  const [month, setMonth] = useState<number>(0);
  const [year, setYear] = useState<number>(0);

  // Pagination
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalRows, setTotalRows] = useState(0);

  // Search & Filter local states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');

  // Modal details
  const [selectedSlip, setSelectedSlip] = useState<SalarySlip | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Late Fine Details Modal
  const [lateFineSlip, setLateFineSlip] = useState<SalarySlip | null>(null);
  const [isLateFineModalOpen, setIsLateFineModalOpen] = useState(false);

  const handleLateFineClick = (slip: SalarySlip) => {
    setLateFineSlip(slip);
    setIsLateFineModalOpen(true);
  };

  useEffect(() => {
    if (salaryPeriod) {
      const [yearStr, monthStr] = salaryPeriod.split('-');
      setYear(parseInt(yearStr, 10));
      setMonth(parseInt(monthStr, 10));
    } else {
      setMonth(0);
      setYear(0);
    }
  }, [salaryPeriod]);

  const fetchSlips = useCallback(
    async (currentPage: number = 1) => {
      setIsLoading(true);
      try {
        const params: Record<string, unknown> = {
          page: currentPage,
          per_page: perPage,
        };

        if (month && year) {
          params.month = month;
          params.year = year;
        }

        const response = await payrollService.getSalarySlips(params);
        const { data, meta } = response.data;

        setSlips(data || []);
        setTotalRows(meta?.total || 0);
      } catch (error) {
        console.error('Failed to fetch salary slips:', error);
        showAlert('error', 'Error', 'Failed to fetch salary slips');
        setSlips([]);
        setTotalRows(0);
      } finally {
        setIsLoading(false);
      }
    },
    [month, year, perPage]
  );

  useEffect(() => {
    fetchSlips(page);
  }, [page, fetchSlips]);

  const handleDownload = async (id: number) => {
    try {
      const response = await payrollService.downloadSlip(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `salary-slip-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to download slip:', error);
      showAlert('error', 'Error', 'PDF download not available yet');
    }
  };

  const handleViewDetails = (slip: SalarySlip) => {
    setSelectedSlip(slip);
    setIsModalOpen(true);
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(num || 0);
  };

  const handleFilter = () => {
    setPage(1);
    fetchSlips(1);
  };

  const handleClearFilter = () => {
    setSalaryPeriod('');
    setPage(1);
    if (page === 1) fetchSlips(1);
  };

  // Calculations for top statistics cards
  const statsMetrics = useMemo(() => {
    const slipList = slips || [];
    const uniqueEmployeesCount = new Set(slipList.map((s) => s.staff_member?.staff_code || '')).size;
    const monthlySum = slipList.reduce((sum, s) => sum + parseFloat(s.net_payable || '0'), 0);
    const pendingSum = slipList
      .filter((s) => s.status?.toLowerCase() !== 'paid')
      .reduce((sum, s) => sum + parseFloat(s.net_payable || '0'), 0);
    const processedSum = slipList
      .filter((s) => s.status?.toLowerCase() === 'paid')
      .reduce((sum, s) => sum + parseFloat(s.net_payable || '0'), 0);

    return {
      employees: totalRows > uniqueEmployeesCount ? totalRows : uniqueEmployeesCount,
      payrollTotal: monthlySum,
      pendingTotal: pendingSum,
      processedTotal: processedSum,
    };
  }, [slips, totalRows]);

  const getStatusBadge = (status: string) => {
    const clean = status?.toLowerCase() || 'pending';
    switch (clean) {
      case 'paid':
        return { label: 'Paid', color: '#16A34A', bg: 'rgba(34, 197, 94, 0.1)' };
      case 'processing':
      case 'generated':
        return { label: 'Processing', color: '#D97706', bg: 'rgba(217, 119, 6, 0.1)' };
      default:
        return { label: 'Pending', color: '#DC2626', bg: 'rgba(220, 38, 38, 0.1)' };
    }
  };

  const getSumOfItems = (items: Array<{ name: string; amount: string }> | undefined) => {
    if (!items) return 0;
    return items.reduce((sum, s) => sum + parseFloat(s.amount || '0'), 0);
  };

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  // Client-side filtering on table rows
  const filteredSlips = useMemo(() => {
    return slips.filter((s) => {
      const empName = s.staff_member?.full_name?.toLowerCase() || '';
      const matchesSearch = searchQuery === '' || empName.includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || s.status?.toLowerCase() === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [slips, searchQuery, statusFilter]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pb: 4 }}>
      {/* Top Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1E293B', fontFamily: 'Inter, sans-serif' }}>
            Salary Slip Ledger
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5, fontFamily: 'Inter, sans-serif' }}>
            View, audit and download generated payroll slips
          </Typography>
        </Box>
        <Link to="/payroll/generate" style={{ textDecoration: 'none' }}>
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
            Generate Payroll
          </MuiButton>
        </Link>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: '12px', p: 3, display: 'flex', gap: 2, alignItems: 'center', backgroundColor: '#FFFFFF' }}>
            <Box sx={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: 'rgba(37, 99, 235, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
              <PeopleIcon />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 500 }}>Total Employees</Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A' }}>{statsMetrics.employees}</Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: '12px', p: 3, display: 'flex', gap: 2, alignItems: 'center', backgroundColor: '#FFFFFF' }}>
            <Box sx={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
              <IndianRupeeIcon />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 500 }}>Monthly Payroll</Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A' }}>{formatCurrency(statsMetrics.payrollTotal)}</Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: '12px', p: 3, display: 'flex', gap: 2, alignItems: 'center', backgroundColor: '#FFFFFF' }}>
            <Box sx={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444' }}>
              <PendingIcon />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 500 }}>Pending Salary</Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A' }}>{formatCurrency(statsMetrics.pendingTotal)}</Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: '12px', p: 3, display: 'flex', gap: 2, alignItems: 'center', backgroundColor: '#FFFFFF' }}>
            <Box sx={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
              <PaidIcon />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 500 }}>Processed Salary</Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A' }}>{formatCurrency(statsMetrics.processedTotal)}</Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Modern Filter Toolkit */}
      <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: '12px', p: 3, backgroundColor: '#FFFFFF' }}>
        <Grid container spacing={2.5} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, md: 3.5 }}>
            <TextField
              placeholder="Search employee by name..."
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              fullWidth
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#94A3B8', fontSize: 18 }} />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: '10px' }
                }
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3.5 }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                id="salary_period"
                type="month"
                value={salaryPeriod}
                onChange={(e) => setSalaryPeriod(e.target.value)}
                label="Salary Period (YYYY-MM)"
                size="small"
                fullWidth
                slotProps={{
                  input: { sx: { borderRadius: '10px' } },
                  inputLabel: { shrink: true }
                }}
              />
              <MuiButton
                onClick={handleFilter}
                variant="contained"
                sx={{
                  backgroundColor: '#2563EB',
                  '&:hover': { backgroundColor: '#1D4ED8' },
                  borderRadius: '10px',
                  fontWeight: 600,
                  textTransform: 'none',
                  px: 2.5,
                  height: '40px'
                }}
              >
                Apply
              </MuiButton>
              {salaryPeriod && (
                <MuiButton
                  onClick={handleClearFilter}
                  variant="outlined"
                  sx={{
                    borderRadius: '10px',
                    borderColor: '#CBD5E1',
                    color: '#475569',
                    height: '40px'
                  }}
                >
                  Clear
                </MuiButton>
              )}
            </Box>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
            <FormControl size="small" fullWidth>
              <InputLabel id="status-select-label">Status</InputLabel>
              <MuiSelect
                labelId="status-select-label"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
                sx={{ borderRadius: '10px' }}
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="paid">Paid</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="processing">Processing</MenuItem>
              </MuiSelect>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
            <FormControl size="small" fullWidth>
              <InputLabel id="dept-select-label">Department</InputLabel>
              <MuiSelect
                labelId="dept-select-label"
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                label="Department"
                sx={{ borderRadius: '10px' }}
              >
                <MenuItem value="all">All Departments</MenuItem>
                <MenuItem value="Engineering">Engineering</MenuItem>
                <MenuItem value="Product">Product</MenuItem>
                <MenuItem value="Design">Design</MenuItem>
                <MenuItem value="People Operations">People Operations</MenuItem>
              </MuiSelect>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Salary slips list table */}
      <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden' }}>
        <TableContainer sx={{ minHeight: 320, maxHeight: 580 }}>
          {isLoading ? (
            <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[...Array(5)].map((_, i) => (
                <MuiSkeleton key={i} variant="rectangular" height={42} sx={{ borderRadius: '8px' }} />
              ))}
            </Box>
          ) : filteredSlips.length === 0 ? (
            <Box sx={{ py: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <SlipIcon sx={{ fontSize: 44, color: '#94A3B8' }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 650, color: '#475569', fontFamily: 'Inter' }}>
                No salary slips found
              </Typography>
              <Typography variant="body2" sx={{ color: '#94A3B8', fontFamily: 'Inter' }}>
                {salaryPeriod ? 'No slips for the selected month.' : 'Generate payroll to issue salary slips.'}
              </Typography>
            </Box>
          ) : (
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ backgroundColor: '#F8FAFC', fontWeight: 600, color: '#475569' }}>Reference ID</TableCell>
                  <TableCell sx={{ backgroundColor: '#F8FAFC', fontWeight: 600, color: '#475569' }}>Employee</TableCell>
                  <TableCell sx={{ backgroundColor: '#F8FAFC', fontWeight: 600, color: '#475569' }}>Salary Period</TableCell>
                  <TableCell sx={{ backgroundColor: '#F8FAFC', fontWeight: 600, color: '#475569' }}>Basic Salary</TableCell>
                  <TableCell sx={{ backgroundColor: '#F8FAFC', fontWeight: 600, color: '#475569' }}>Allowances</TableCell>
                  <TableCell sx={{ backgroundColor: '#F8FAFC', fontWeight: 600, color: '#475569' }}>Deductions</TableCell>
                  <TableCell sx={{ backgroundColor: '#F8FAFC', fontWeight: 600, color: '#475569' }}>Net Payable</TableCell>
                  <TableCell sx={{ backgroundColor: '#F8FAFC', fontWeight: 600, color: '#475569' }}>Status</TableCell>
                  <TableCell align="right" sx={{ backgroundColor: '#F8FAFC', fontWeight: 600, color: '#475569' }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredSlips.map((row) => {
                  const badge = getStatusBadge(row.status);
                  const allowanceAmt = getSumOfItems(row.benefits_breakdown);
                  const deductionAmt = getSumOfItems(row.deductions_breakdown);
                  return (
                    <TableRow key={row.id} hover sx={{ '& td': { py: 1.5 } }}>
                      <TableCell sx={{ fontWeight: 600, color: '#334155' }}>
                        {row.slip_reference}
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }}
                          onClick={() => handleLateFineClick(row)}
                          title="Click to view late fine details"
                        >
                          <MuiAvatar sx={{ bgcolor: 'rgba(37, 99, 235, 0.08)', color: '#2563EB', width: 32, height: 32, fontSize: '0.75rem', fontWeight: 700 }}>
                            {getInitials(row.staff_member?.full_name || 'U')}
                          </MuiAvatar>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 650, color: '#2563EB', fontSize: '0.85rem', '&:hover': { textDecoration: 'underline' } }}>
                              {row.staff_member?.full_name || 'Unknown'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748B' }}>
                              ID: {row.staff_member?.staff_code || '-'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ color: '#475569' }}>
                        {row.salary_period}
                      </TableCell>
                      <TableCell sx={{ color: '#475569' }}>
                        {formatCurrency(row.basic_salary)}
                      </TableCell>
                      <TableCell sx={{ color: '#10B981' }}>
                        +{formatCurrency(allowanceAmt)}
                      </TableCell>
                      <TableCell sx={{ color: '#EF4444' }}>
                        -{formatCurrency(deductionAmt)}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#0F172A' }}>
                        {formatCurrency(row.net_payable)}
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{
                            color: badge.color,
                            backgroundColor: badge.bg,
                            fontWeight: 700,
                            fontSize: '0.7rem',
                            borderRadius: '6px',
                            px: 1.2,
                            py: 0.35,
                            display: 'inline-block',
                            textTransform: 'uppercase',
                          }}
                        >
                          {badge.label}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                          <IconButton size="small" onClick={() => handleViewDetails(row)} title="View Details">
                            <EyeIcon fontSize="small" sx={{ color: '#64748B' }} />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleDownload(row.id)} title="Download Payslip">
                            <DownloadIcon fontSize="small" sx={{ color: '#64748B' }} />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </TableContainer>

        {/* Table Pagination */}
        {totalRows > perPage && (
          <Box sx={{ p: 2.5, borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" sx={{ color: '#64748B' }}>
              Showing page {page} of {Math.ceil(totalRows / perPage)} ({totalRows} records)
            </Typography>
            <MuiPagination
              count={Math.ceil(totalRows / perPage)}
              page={page}
              onChange={(_, value) => setPage(value)}
              shape="rounded"
              size="small"
            />
          </Box>
        )}
      </Paper>

      {/* Salary Slip detail modal */}
      <SalarySlipModal
        slip={selectedSlip}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedSlip(null);
        }}
      />

      {/* Late Fine Details Modal */}
      <LateFineDetailsModal
        isOpen={isLateFineModalOpen}
        onClose={() => {
          setIsLateFineModalOpen(false);
          setLateFineSlip(null);
        }}
        employeeName={lateFineSlip?.staff_member?.full_name || ''}
        details={
          lateFineSlip?.deductions_breakdown
            ?.find((d) => d.name?.toLowerCase().includes('late'))
            ?.details || []
        }
      />
    </Box>
  );
}
