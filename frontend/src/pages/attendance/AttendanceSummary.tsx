import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { attendanceService, staffService } from '../../services/api';
import { showAlert } from '../../lib/sweetalert';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  Card as MuiCard,
  CardContent as MuiCardContent,
  Grid,
  Button as MuiButton,
  TextField,
  MenuItem,
  Select as MuiSelect,
  FormControl,
  InputLabel,
  Avatar as MuiAvatar,
  Chip as MuiChip,
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
  Autocomplete,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  Download as DownloadIcon,
  TrendingUp as TrendingUpIcon,
  Timer as TimerIcon,
  WorkOutlined as WorkIcon,
} from '@mui/icons-material';

interface StaffMember {
  id: number;
  full_name: string;
}

interface SummaryData {
  total_days: number;
  present_days: number;
  absent_days: number;
  late_days: number;
  half_days: number;
  total_hours: number;
  average_hours_per_day: number;
}

interface ShiftInfo {
  id: number;
  name: string;
  start_time: string;
  end_time: string;
  is_night_shift: boolean;
}

interface WorkLog {
  id: number;
  staff_member_id: number;
  staff_member?: {
    full_name: string;
    staff_code?: string;
    email?: string;
    division?: { title: string };
    job_title?: { title: string };
  };
  log_date: string;
  log_date_formatted?: string;
  clock_in: string | null;
  clock_out: string | null;
  clock_in_time?: string | null;
  clock_out_time?: string | null;
  status: string;
  late_minutes: number;
  early_leave_minutes: number;
  overtime_minutes: number;
  break_minutes: number;
  notes: string | null;
  total_hours?: number;
  shift?: ShiftInfo;
}

interface UserData {
  id: number;
  name: string;
  email: string;
  role: string;
  role_display: string;
  roles: string[];
  permissions: string[];
  primary_role: string;
  primary_role_icon: string;
  primary_role_hierarchy: number;
  staff_member_id: number | null;
  dashboard?: {
    show_admin_dashboard: boolean;
    show_my_dashboard: boolean;
    default_dashboard: string;
  };
}

export default function AttendanceSummary() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const [staffSearchQuery, setStaffSearchQuery] = useState('');

  // Pagination for Work Logs
  const [logs, setLogs] = useState<WorkLog[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [isLogsLoading, setIsLogsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Local Toolbar Filters
  const [branchFilter, setBranchFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Load user data from localStorage on component mount
  useEffect(() => {
    const loadUserData = () => {
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const userData: UserData = JSON.parse(userStr);
          setCurrentUser(userData);

          const hasAdminRole = userData?.dashboard?.show_admin_dashboard ?? false;
          setIsAdminUser(hasAdminRole);

          if (!hasAdminRole && userData.staff_member_id) {
            setSelectedStaff(userData.staff_member_id.toString());
          }
        }
      } catch (error) {
        console.error('Failed to parse user data from localStorage:', error);
      }
    };

    loadUserData();
  }, []);

  // Fetch staff list dynamically for admin users
  useEffect(() => {
    const fetchStaff = async () => {
      if (!isAdminUser) return;
      setIsLoadingStaff(true);
      try {
        const params: Record<string, unknown> = { per_page: 50 };
        if (staffSearchQuery.trim()) {
          params.name = staffSearchQuery.trim();
        }
        const response = await staffService.getAllForAttendance(params);
        setStaff(response.data.data || []);
      } catch (error) {
        console.error('Failed to fetch staff:', error);
      } finally {
        setIsLoadingStaff(false);
      }
    };

    const timeoutId = setTimeout(() => {
      if (isAdminUser) fetchStaff();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [isAdminUser, staffSearchQuery]);

  // Set default date range (current month)
  useEffect(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  }, []);

  const safeNumberFormat = (value: any, decimals: number = 1): string => {
    if (value === undefined || value === null || isNaN(Number(value))) {
      return '0.0';
    }
    return Number(value).toFixed(decimals);
  };

  const getStatusBadge = (status: string) => {
    const cleanStatus = status?.toLowerCase() || 'absent';
    switch (cleanStatus) {
      case 'present':
        return { label: 'Present', color: '#16A34A', bg: 'rgba(34, 197, 94, 0.1)' };
      case 'late':
        return { label: 'Late', color: '#CA8A04', bg: 'rgba(234, 179, 8, 0.1)' };
      case 'absent':
        return { label: 'Absent', color: '#DC2626', bg: 'rgba(220, 38, 38, 0.1)' };
      case 'half_day':
        return { label: 'Half Day', color: '#EA580C', bg: 'rgba(234, 88, 12, 0.1)' };
      case 'leave':
      case 'on_leave':
        return { label: 'Leave', color: '#2563EB', bg: 'rgba(37, 99, 235, 0.1)' };
      default:
        return { label: status, color: '#475569', bg: 'rgba(100, 116, 139, 0.1)' };
    }
  };

  const formatTime = (time: string | null, formattedTime?: string | null): string => {
    if (formattedTime) return formattedTime;
    if (!time) return '--:--';
    try {
      if (time.match(/^\d{2}:\d{2}:\d{2}$/)) {
        return time.substring(0, 5);
      }
      if (time.includes('T')) {
        const date = new Date(time);
        return date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
      }
      return time;
    } catch (error) {
      console.error('Error formatting time:', error);
      return time;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  const calculateTotalHours = (clockIn: string | null, clockOut: string | null): number => {
    if (!clockIn || !clockOut) return 0;
    try {
      const inTime = new Date(clockIn);
      const outTime = new Date(clockOut);
      const diffMs = outTime.getTime() - inTime.getTime();
      return diffMs / (1000 * 60 * 60);
    } catch (error) {
      console.error('Error calculating total hours:', error);
      return 0;
    }
  };

  const fetchSummary = async () => {
    if (!startDate || !endDate) return;
    setIsLoading(true);
    try {
      const params: Record<string, unknown> = {
        start_date: startDate,
        end_date: endDate,
      };

      if (isAdminUser && selectedStaff) {
        params.staff_member_id = Number(selectedStaff);
      }

      const response = await attendanceService.getSummary(params);
      setSummary(response.data.data);

      setPage(1);
      fetchLogs();
    } catch (error: any) {
      console.error('Failed to fetch summary:', error);
      if (error.response?.data?.message) {
        showAlert('error', 'Error', error.response.data.message);
      } else {
        showAlert('error', 'Error', 'Failed to fetch attendance summary');
      }
      setSummary(null);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLogs = useCallback(async () => {
    if (!startDate || !endDate) return;
    setIsLogsLoading(true);
    try {
      const params: any = {
        page,
        per_page: perPage,
        paginate: true,
        start_date: startDate,
        end_date: endDate,
      };

      let response;
      if (isAdminUser) {
        if (selectedStaff) params.staff_member_id = Number(selectedStaff);
        response = await attendanceService.getWorkLogs(params);
      } else {
        response = await attendanceService.getMyWorkLogs(params);
      }

      const { data, meta } = response.data;
      setLogs(data || []);
      setTotalRows(meta?.total || 0);
    } catch (error) {
      console.error('Failed to fetch work logs:', error);
      setLogs([]);
      setTotalRows(0);
    } finally {
      setIsLogsLoading(false);
    }
  }, [page, perPage, startDate, endDate, selectedStaff, isAdminUser]);

  // Load initial logs
  useEffect(() => {
    if ((!isAdminUser || selectedStaff || startDate) && startDate && endDate) {
      fetchLogs();
    }
  }, [page, perPage, startDate, endDate, fetchLogs]);

  // Dynamic filter lists from logs
  const departments = useMemo(() => {
    const depts = new Set<string>();
    logs.forEach((log) => {
      if (log.staff_member?.division?.title) {
        depts.add(log.staff_member.division.title);
      }
    });
    return Array.from(depts).sort();
  }, [logs]);

  const branches = useMemo(() => {
    return ['Headquarters', 'MUM Office', 'BLR Hub'];
  }, []);

  // Filtered logs list for search and visual filters
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const empName = log.staff_member?.full_name?.toLowerCase() || '';
      const matchesSearch = searchQuery === '' || empName.includes(searchQuery.toLowerCase());
      const matchesDept = deptFilter === 'all' || log.staff_member?.division?.title === deptFilter;
      return matchesSearch && matchesDept;
    });
  }, [logs, searchQuery]);

  // Computedstats for present/absent/late/leave/wfh
  const computedStats = useMemo(() => {
    let present = summary?.present_days ?? 0;
    let absent = summary?.absent_days ?? 0;
    let late = summary?.late_days ?? 0;
    let leave = summary?.half_days ?? 0;
    let wfh = 0;

    // If summary is null/not selected, compute summary metrics from current fetched logs
    if (!summary && logs.length > 0) {
      present = logs.filter(l => l.status?.toLowerCase() === 'present' || l.status?.toLowerCase() === 'late').length;
      late = logs.filter(l => l.status?.toLowerCase() === 'late').length;
      absent = logs.filter(l => l.status?.toLowerCase() === 'absent').length;
      leave = logs.filter(l => l.status?.toLowerCase() === 'leave' || l.status?.toLowerCase() === 'on_leave').length;
      wfh = logs.filter(l => l.status?.toLowerCase() === 'wfh' || l.status?.toLowerCase() === 'work_from_home').length;
    }
    return { present, absent, late, leave, wfh };
  }, [summary, logs]);

  const chartData = useMemo(() => {
    return [
      { name: 'Present', value: computedStats.present, fill: '#16A34A' },
      { name: 'Absent', value: computedStats.absent, fill: '#DC2626' },
      { name: 'Late', value: computedStats.late, fill: '#CA8A04' },
      { name: 'Leave', value: computedStats.leave, fill: '#2563EB' },
    ];
  }, [computedStats]);

  const handleExportCSV = () => {
    if (logs.length === 0) {
      showAlert('warning', 'No data', 'There is no attendance data to export.');
      return;
    }
    const headers = ['Employee', 'Employee ID', 'Department', 'Shift', 'Clock In', 'Clock Out', 'Working Hours', 'Break Time', 'Overtime', 'Status'];
    const rows = logs.map((row) => {
      let totalHours = row.total_hours;
      if (totalHours === undefined || totalHours === null) {
        totalHours = calculateTotalHours(row.clock_in, row.clock_out);
      }
      return [
        row.staff_member?.full_name || 'Unknown',
        row.staff_member?.staff_code || row.staff_member_id,
        row.staff_member?.division?.title || 'N/A',
        row.shift?.name || 'N/A',
        row.clock_in ? formatTime(row.clock_in, row.clock_in_time) : '--:--',
        row.clock_out ? formatTime(row.clock_out, row.clock_out_time) : '--:--',
        safeNumberFormat(totalHours, 1),
        row.break_minutes || 0,
        row.overtime_minutes || 0,
        row.status || 'absent',
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Attendance_Report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pb: 4 }}>
      {/* Page Title Header */}
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#1E293B', fontFamily: 'Inter, sans-serif' }}>
          {isAdminUser ? 'Attendance Summary' : 'My Attendance Summary'}
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5, fontFamily: 'Inter, sans-serif' }}>
          {isAdminUser
            ? 'View attendance statistics and reports'
            : 'View your attendance statistics and summary'}
        </Typography>
      </Box>

      {/* Stats Summary Cards */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Paper
            elevation={0}
            sx={{
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              p: 3,
              display: 'flex',
              gap: 2,
              alignItems: 'center',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              }
            }}
          >
            <Box sx={{ width: 46, height: 46, borderRadius: '50%', backgroundColor: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16A34A' }}>
              <CheckCircleIcon />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>Present</Typography>
              <Typography variant="h6" sx={{ fontWeight: 750, color: '#0F172A', fontFamily: 'Inter, sans-serif' }}>{computedStats.present}</Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Paper
            elevation={0}
            sx={{
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              p: 3,
              display: 'flex',
              gap: 2,
              alignItems: 'center',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              }
            }}
          >
            <Box sx={{ width: 46, height: 46, borderRadius: '50%', backgroundColor: 'rgba(220, 38, 38, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626' }}>
              <CancelIcon />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>Absent</Typography>
              <Typography variant="h6" sx={{ fontWeight: 750, color: '#0F172A', fontFamily: 'Inter, sans-serif' }}>{computedStats.absent}</Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Paper
            elevation={0}
            sx={{
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              p: 3,
              display: 'flex',
              gap: 2,
              alignItems: 'center',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              }
            }}
          >
            <Box sx={{ width: 46, height: 46, borderRadius: '50%', backgroundColor: 'rgba(234, 179, 8, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#CA8A04' }}>
              <WarningIcon />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>Late</Typography>
              <Typography variant="h6" sx={{ fontWeight: 750, color: '#0F172A', fontFamily: 'Inter, sans-serif' }}>{computedStats.late}</Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Paper
            elevation={0}
            sx={{
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              p: 3,
              display: 'flex',
              gap: 2,
              alignItems: 'center',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              }
            }}
          >
            <Box sx={{ width: 46, height: 46, borderRadius: '50%', backgroundColor: 'rgba(37, 99, 235, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
              <WorkIcon sx={{ fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>Leave</Typography>
              <Typography variant="h6" sx={{ fontWeight: 750, color: '#0F172A', fontFamily: 'Inter, sans-serif' }}>{computedStats.leave}</Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Paper
            elevation={0}
            sx={{
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              p: 3,
              display: 'flex',
              gap: 2,
              alignItems: 'center',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              }
            }}
          >
            <Box sx={{ width: 46, height: 46, borderRadius: '50%', backgroundColor: 'rgba(14, 165, 233, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0EA5E9' }}>
              <TimerIcon />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>Work From Home</Typography>
              <Typography variant="h6" sx={{ fontWeight: 750, color: '#0F172A', fontFamily: 'Inter, sans-serif' }}>{computedStats.wfh}</Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Toolbar and Settings */}
      <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: '12px', p: 3, backgroundColor: '#FFFFFF', boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.02)' }}>
        <Grid container spacing={2.5} sx={{ alignItems: 'flex-end' }}>
          {isAdminUser && (
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Autocomplete
                size="small"
                options={staff}
                getOptionLabel={(option) => option.full_name}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                value={staff.find((s) => s.id.toString() === selectedStaff) || null}
                onChange={(_, newValue) => {
                  setSelectedStaff(newValue ? newValue.id.toString() : '');
                }}
                onInputChange={(_, newInputValue) => {
                  setStaffSearchQuery(newInputValue);
                }}
                disabled={isLoadingStaff && staff.length === 0}
                loading={isLoadingStaff}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    label="Search Employee" 
                    placeholder="Type to search..."
                    sx={{
                      '& .MuiOutlinedInput-root': { borderRadius: '10px' }
                    }}
                  />
                )}
              />
            </Grid>
          )}

          <Grid size={{ xs: 12, sm: 6, md: 2.2 }}>
            <TextField
              id="start_date"
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              size="small"
              fullWidth
              slotProps={{
                input: { sx: { borderRadius: '10px' } },
                inputLabel: { shrink: true }
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2.2 }}>
            <TextField
              id="end_date"
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              size="small"
              fullWidth
              slotProps={{
                input: { sx: { borderRadius: '10px' } },
                inputLabel: { shrink: true }
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <FormControl size="small" fullWidth>
              <InputLabel id="branch-select-label">Branch</InputLabel>
              <MuiSelect
                labelId="branch-select-label"
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                label="Branch"
                sx={{ borderRadius: '10px' }}
              >
                <MenuItem value="all">All Branches</MenuItem>
                {branches.map(b => <MenuItem key={b} value={b}>{b}</MenuItem>)}
              </MuiSelect>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
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
                {departments.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
              </MuiSelect>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 'grow' }} sx={{ minWidth: 150 }}>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <MuiButton
                onClick={fetchSummary}
                disabled={isLoading}
                variant="contained"
                sx={{
                  backgroundColor: '#2563EB',
                  '&:hover': { backgroundColor: '#1D4ED8' },
                  borderRadius: '10px',
                  fontWeight: 650,
                  textTransform: 'none',
                  flexGrow: 1,
                  fontFamily: 'Inter, sans-serif',
                  height: '40px'
                }}
              >
                {isLoading ? 'Loading...' : 'Generate'}
              </MuiButton>

              <MuiButton
                onClick={handleExportCSV}
                variant="outlined"
                startIcon={<DownloadIcon />}
                disabled={logs.length === 0}
                sx={{
                  color: '#475569',
                  borderColor: '#CBD5E1',
                  borderRadius: '10px',
                  fontWeight: 600,
                  textTransform: 'none',
                  fontFamily: 'Inter, sans-serif',
                  '&:hover': { borderColor: '#94A3B8' },
                  height: '40px'
                }}
              >
                Export
              </MuiButton>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Main Charts & Table Grid */}
      <Grid container spacing={3}>
        {/* Attendance breakdown Chart */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: '12px', p: 3, height: '100%' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B', mb: 2, fontFamily: 'Inter, sans-serif' }}>
              Attendance Breakdown
            </Typography>
            <Box sx={{ height: 280, width: '100%' }}>
              {logs.length === 0 ? (
                <Box sx={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 1 }}>
                  <TrendingUpIcon sx={{ color: '#94A3B8' }} />
                  <Typography variant="body2" sx={{ color: '#94A3B8' }}>No breakdown statistics loaded</Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
                    <YAxis stroke="#64748B" fontSize={11} />
                    <Tooltip cursor={{ fill: 'rgba(241, 149, 149, 0.05)' }} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={45} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Dynamic Attendance Logs Table */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: '12px', p: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B', mb: 2, fontFamily: 'Inter, sans-serif' }}>
              Recent Work Logs
            </Typography>

            <TableContainer sx={{ maxHeight: 310, overflowY: 'auto' }}>
              {isLogsLoading ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 2 }}>
                  {[...Array(4)].map((_, i) => (
                    <MuiSkeleton key={i} variant="rectangular" height={36} sx={{ borderRadius: '6px' }} />
                  ))}
                </Box>
              ) : filteredLogs.length === 0 ? (
                <Box sx={{ py: 6, textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#94A3B8', fontFamily: 'Inter' }}>
                    No work logs found. Click generate or adjust filters.
                  </Typography>
                </Box>
              ) : (
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 650, color: '#475569', backgroundColor: '#F8FAFC' }}>Employee</TableCell>
                      <TableCell sx={{ fontWeight: 650, color: '#475569', backgroundColor: '#F8FAFC' }}>Employee ID</TableCell>
                      <TableCell sx={{ fontWeight: 650, color: '#475569', backgroundColor: '#F8FAFC' }}>Department</TableCell>
                      <TableCell sx={{ fontWeight: 650, color: '#475569', backgroundColor: '#F8FAFC' }}>Shift</TableCell>
                      <TableCell sx={{ fontWeight: 650, color: '#475569', backgroundColor: '#F8FAFC' }}>Check In</TableCell>
                      <TableCell sx={{ fontWeight: 650, color: '#475569', backgroundColor: '#F8FAFC' }}>Check Out</TableCell>
                      <TableCell sx={{ fontWeight: 650, color: '#475569', backgroundColor: '#F8FAFC' }}>Hours</TableCell>
                      <TableCell sx={{ fontWeight: 650, color: '#475569', backgroundColor: '#F8FAFC' }}>Break</TableCell>
                      <TableCell sx={{ fontWeight: 650, color: '#475569', backgroundColor: '#F8FAFC' }}>Overtime</TableCell>
                      <TableCell sx={{ fontWeight: 650, color: '#475569', backgroundColor: '#F8FAFC' }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredLogs.map((row) => {
                      let totalHours = row.total_hours;
                      if (totalHours === undefined || totalHours === null) {
                        totalHours = calculateTotalHours(row.clock_in, row.clock_out);
                      }
                      const badgeInfo = getStatusBadge(row.status);
                      return (
                        <TableRow key={row.id} hover sx={{ '&td': { py: 1.2 } }}>
                          <TableCell sx={{ fontWeight: 600, color: '#0F172A' }}>
                            {row.staff_member?.full_name || 'Generic Employee'}
                          </TableCell>
                          <TableCell sx={{ color: '#64748B' }}>
                            {row.staff_member?.staff_code || `#EMP-${row.staff_member_id}`}
                          </TableCell>
                          <TableCell sx={{ color: '#64748B' }}>
                            {row.staff_member?.division?.title || 'Not Assigned'}
                          </TableCell>
                          <TableCell sx={{ color: '#475569' }}>
                            {row.shift?.name || 'Not Assigned'}
                          </TableCell>
                          <TableCell>
                            {formatTime(row.clock_in, row.clock_in_time)}
                          </TableCell>
                          <TableCell>
                            {formatTime(row.clock_out, row.clock_out_time)}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 550 }}>
                            {safeNumberFormat(totalHours, 1)}h
                          </TableCell>
                          <TableCell>
                            {row.break_minutes || 0}m
                          </TableCell>
                          <TableCell sx={{ color: row.overtime_minutes > 0 ? '#16A34A' : '#64748B' }}>
                            {row.overtime_minutes || 0}m
                          </TableCell>
                          <TableCell>
                            <Box
                              sx={{
                                color: badgeInfo.color,
                                backgroundColor: badgeInfo.bg,
                                fontSize: '0.70rem',
                                fontWeight: 700,
                                px: 1,
                                py: 0.35,
                                borderRadius: '6px',
                                display: 'inline-block',
                                textAlign: 'center',
                                textTransform: 'uppercase'
                              }}
                            >
                              {badgeInfo.label}
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </TableContainer>

            {/* Table pagination */}
            {totalRows > perPage && (
              <Box
                sx={{
                  pt: 2.5,
                  borderTop: '1px solid #F1F5F9',
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 2
                }}
              >
                <Typography variant="caption" sx={{ color: '#64748B', fontFamily: 'Inter, sans-serif' }}>
                  Showing page {page} of {Math.ceil(totalRows / perPage)} ({totalRows} items)
                </Typography>
                <MuiPagination
                  count={Math.ceil(totalRows / perPage)}
                  page={page}
                  onChange={(_, val) => setPage(val)}
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
        </Grid>
      </Grid>
    </Box>
  );
}
