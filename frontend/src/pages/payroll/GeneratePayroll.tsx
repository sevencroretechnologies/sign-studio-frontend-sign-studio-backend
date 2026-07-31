import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { payrollService, staffService } from '../../services/api';
import { showAlert, getErrorMessage } from '../../lib/sweetalert';
import {
  Grid,
  Button as MuiButton,
  TextField,
  Checkbox,
  Box,
  Typography,
  Skeleton as MuiSkeleton,
  Paper,
  Alert as MuiAlert,
  AlertTitle,
  Divider,
  List,
  ListItem,
  Avatar,
  InputAdornment,
} from '@mui/material';
import {
  People as PeopleIcon,
  Search as SearchIcon,
  CalendarToday as CalendarIcon,
  Send as SendIcon,
  ErrorOutlined as ErrorIcon,
} from '@mui/icons-material';

interface StaffMember {
  id: number;
  full_name: string;
  ctc: number;
  job_title?: { title: string };
  division?: { title: string };
}

export default function GeneratePayroll() {
  const navigate = useNavigate();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<number[]>([]);
  const [salaryPeriod, setSalaryPeriod] = useState('');
  const [month, setMonth] = useState<number>(0);
  const [year, setYear] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const response = await staffService.getAll({ per_page: 100 });
        setStaff(response.data.data || []);
      } catch (error) {
        console.error('Failed to fetch staff:', error);
        showAlert('error', 'Error', 'Failed to fetch staff');
      } finally {
        setIsLoading(false);
      }
    };
    fetchStaff();

    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    setMonth(currentMonth);
    setYear(currentYear);
    setSalaryPeriod(`${currentYear}-${String(currentMonth).padStart(2, '0')}`);
  }, []);

  const handleSalaryPeriodChange = (period: string) => {
    setSalaryPeriod(period);
    if (period) {
      const [yearStr, monthStr] = period.split('-');
      setYear(parseInt(yearStr, 10));
      setMonth(parseInt(monthStr, 10));
    }
  };

  const handleSelectAll = () => {
    if (selectedStaff.length === filteredStaff.length) {
      // Clear selected that are in current filter
      const filteredIds = filteredStaff.map(s => s.id);
      setSelectedStaff(selectedStaff.filter(id => !filteredIds.includes(id)));
    } else {
      // Add all currently filtered ids
      const filteredIds = filteredStaff.map(s => s.id);
      const newSelection = Array.from(new Set([...selectedStaff, ...filteredIds]));
      setSelectedStaff(newSelection);
    }
  };

  const handleSelectStaff = (id: number) => {
    if (selectedStaff.includes(id)) {
      setSelectedStaff(selectedStaff.filter((s) => s !== id));
    } else {
      setSelectedStaff([...selectedStaff, id]);
    }
  };

  const handleGenerate = async () => {
    if (selectedStaff.length === 0) {
      setError('Please select at least one employee');
      return;
    }

    if (!month || !year) {
      setError('Please select a valid salary period');
      return;
    }

    setError('');
    setSuccess('');
    setIsGenerating(true);

    try {
      const payload = {
        employee_ids: selectedStaff,
        month: month,
        year: year,
      };

      await payrollService.bulkGenerate(payload);
      setSuccess(`Successfully generated payroll for ${selectedStaff.length} employees`);

      setTimeout(() => navigate('/payroll/slips'), 2000);
    } catch (err: unknown) {
      console.error('Generation error:', err);
      let errorMessage = getErrorMessage(err, 'Failed to generate payroll. Please try again.');

      if (typeof err === 'object' && err !== null && 'response' in err) {
        const response = (err as any).response;
        if (response?.data?.message?.includes('Duplicate entry') ||
          response?.data?.message?.includes('already exists') ||
          JSON.stringify(response?.data).includes('Integrity constraint violation')) {
          errorMessage = 'Salary slips for this period have already been generated. Please check the Salary Slips page.';
        }
      }
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount || 0);
  };

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  // Filter staff by search box
  const filteredStaff = useMemo(() => {
    return staff.filter(s =>
      s.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.job_title?.title?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [staff, searchQuery]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pb: 4 }}>
      {/* Page Title */}
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#1E293B', fontFamily: 'Inter, sans-serif' }}>
          Generate Payroll Slip
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5, fontFamily: 'Inter, sans-serif' }}>
          Calculate and issue monthly salary slip registers for employees
        </Typography>
      </Box>

      {/* Notifications */}
      {error && (
        <MuiAlert severity="error" sx={{ borderRadius: '10px' }} icon={<ErrorIcon />}>
          <AlertTitle>Execution Error</AlertTitle>
          {error}
        </MuiAlert>
      )}

      {success && (
        <MuiAlert severity="success" sx={{ borderRadius: '10px' }}>
          <AlertTitle>Success</AlertTitle>
          {success}
        </MuiAlert>
      )}

      {/* Generation Workspace Container Grid */}
      <Grid container spacing={3}>
        {/* Left Side: Select Employee list table */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#FFFFFF' }}>
            {/* Toolbar for Selection card */}
            <Box sx={{ p: 3, borderBottom: '1px solid #F1F5F9', display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: 2 }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B', fontFamily: 'Inter, sans-serif' }}>
                  Select Employees
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.25 }}>
                  Matched {filteredStaff.length} employees of {staff.length}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <TextField
                  placeholder="Filter by name..."
                  size="small"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: '#94A3B8', fontSize: 18 }} />
                        </InputAdornment>
                      ),
                      sx: { borderRadius: '10px', width: { xs: '100%', sm: 220 } }
                    }
                  }}
                />
                <MuiButton
                  onClick={handleSelectAll}
                  disabled={filteredStaff.length === 0}
                  variant="outlined"
                  sx={{
                    borderRadius: '10px',
                    borderColor: '#E2E8F0',
                    color: '#475569',
                    fontWeight: 600,
                    textTransform: 'none',
                    fontFamily: 'Inter',
                    '&:hover': { borderColor: '#CBD5E1', backgroundColor: '#F8FAFC' }
                  }}
                >
                  {selectedStaff.length === filteredStaff.length && filteredStaff.length > 0 ? 'Clear Selection' : 'Select Shown'}
                </MuiButton>
              </Box>
            </Box>

            {/* List block */}
            <Box sx={{ p: 2, maxHeight: 460, overflowY: 'auto' }}>
              {isLoading ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2 }}>
                  {[...Array(5)].map((_, i) => (
                    <MuiSkeleton key={i} variant="rectangular" height={52} sx={{ borderRadius: '8px' }} />
                  ))}
                </Box>
              ) : filteredStaff.length === 0 ? (
                <Box sx={{ p: 6, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
                  <PeopleIcon sx={{ fontSize: 44, color: '#94A3B8' }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 650, color: '#475569' }}>
                    No staff members loaded
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                    Add employee records before running payroll slips.
                  </Typography>
                </Box>
              ) : (
                <List disablePadding>
                  {filteredStaff.map((member) => {
                    const isChecked = selectedStaff.includes(member.id);
                    return (
                      <ListItem
                        key={member.id}
                        onClick={() => handleSelectStaff(member.id)}
                        sx={{
                          mb: 1.5,
                          borderRadius: '10px',
                          border: isChecked ? '1px solid #BFDBFE' : '1px solid #E2E8F0',
                          backgroundColor: isChecked ? 'rgba(37, 99, 235, 0.03)' : '#FFFFFF',
                          transition: 'all 0.2s ease',
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: isChecked ? 'rgba(37, 99, 235, 0.04)' : '#F8FAFC',
                            borderColor: isChecked ? '#93C5FD' : '#CBD5E1'
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.2 }}>
                            <Checkbox
                              checked={isChecked}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectStaff(member.id);
                              }}
                              color="primary"
                              sx={{ p: 0 }}
                            />
                            <Avatar sx={{ bgcolor: 'rgba(37, 99, 235, 0.08)', color: '#2563EB', fontWeight: 700, fontSize: '0.8rem', width: 36, height: 36 }}>
                              {getInitials(member.full_name)}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 650, color: '#0F172A', fontFamily: 'Inter' }}>
                                {member.full_name}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                                {member.division?.title || 'No Job Designation'}
                              </Typography>
                            </Box>
                          </Box>
                          <Box sx={{ textAlign: 'right' }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#10B981', textAlign: 'right' }}>
                                {formatCurrency(member.ctc)}
                              </Typography>
                            <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                              Base Basic
                            </Typography>
                          </Box>
                        </Box>
                      </ListItem>
                    );
                  })}
                </List>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Right Side: Payroll Settings & Summary Cards */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Period Settings */}
            <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: '12px', p: 3.5, backgroundColor: '#FFFFFF' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B', mb: 2.5, fontFamily: 'Inter, sans-serif' }}>
                Payroll Settings
              </Typography>
              <TextField
                id="salary_period"
                label="Salary Period"
                type="month"
                value={salaryPeriod}
                onChange={(e) => handleSalaryPeriodChange(e.target.value)}
                fullWidth
                size="small"
                slotProps={{
                  input: { sx: { borderRadius: '10px' } },
                  inputLabel: { shrink: true }
                }}
              />
              {salaryPeriod && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mt: 1.5, color: '#64748B' }}>
                  <CalendarIcon sx={{ fontSize: 16, color: '#2563EB' }} />
                  <Typography variant="caption" sx={{ fontWeight: 600, fontFamily: 'Inter' }}>
                    Target Pay Month: {month}/{year}
                  </Typography>
                </Box>
              )}
            </Paper>

            {/* Selection Summary */}
            <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: '12px', p: 3.5, backgroundColor: '#FFFFFF' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B', mb: 3, fontFamily: 'Inter, sans-serif' }}>
                Generation Summary
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500 }}>Selected employees</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#2563EB', fontFamily: 'Inter' }}>{selectedStaff.length}</Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500 }}>Total Base Salary</Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A', fontFamily: 'Inter' }}>
                    {formatCurrency(
                      selectedStaff
                        .map((id) => staff.find((s) => s.id === id))
                        .filter(Boolean)
                        .reduce((sum, s) => sum + (Number(s?.ctc) || 0), 0)
                    )}
                  </Typography>
                </Box>

                <Divider sx={{ my: 1 }} />

                <MuiButton
                  onClick={handleGenerate}
                  disabled={isGenerating || selectedStaff.length === 0 || !salaryPeriod}
                  variant="contained"
                  size="large"
                  startIcon={<SendIcon sx={{ fontSize: 16 }} />}
                  sx={{
                    py: 1.8,
                    borderRadius: '10px',
                    backgroundColor: '#10B981',
                    fontWeight: 650,
                    textTransform: 'none',
                    fontFamily: 'Inter',
                    boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)',
                    '&:hover': { backgroundColor: '#059669', boxShadow: 'none' },
                    '&.Mui-disabled': { backgroundColor: '#E2E8F0', color: '#94A3B8' }
                  }}
                >
                  {isGenerating ? 'Generating Register...' : 'Generate Payroll'}
                </MuiButton>

                {!salaryPeriod && (
                  <Typography variant="caption" sx={{ color: '#DC2626', display: 'block', textAlign: 'center', mt: 1, fontWeight: 550 }}>
                    Please pick a target salary period first
                  </Typography>
                )}
              </Box>
            </Paper>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
