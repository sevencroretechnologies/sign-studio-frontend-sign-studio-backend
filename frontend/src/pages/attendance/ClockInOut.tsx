import React, { useState, useEffect, useCallback } from 'react';
import { attendanceService, staffService } from '../../services/api';
import { showAlert, getErrorMessage } from '../../lib/sweetalert';
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
  Paper,
  Alert as MuiAlert,
  AlertTitle,
} from '@mui/material';
import {
  Schedule as ClockIcon,
  Login as LogInIcon,
  Logout as LogOutIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  CalendarToday as CalendarIcon,
  AccountCircle as UserIcon,
  People as UsersIcon,
  WatchLater as WatchIcon,
  MyLocation as LocationIcon,
} from '@mui/icons-material';

interface StaffMember {
  id: number;
  full_name: string;
  staff_code: string;
  email?: string;
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

interface ShiftInfo {
  id: number;
  name: string;
  start_time: string;
  end_time: string;
  is_night_shift: boolean;
}

interface CurrentStatus {
  status: string;
  clock_in: string | null;
  clock_out: string | null;
  total_hours: number | null;
  late_minutes: number;
  early_leave_minutes: number;
  overtime_minutes: number;
  break_minutes: number;
  shift: ShiftInfo | null;
  current_time: string;
  on_leave?: boolean;
  leave_details?: any;
}

export default function ClockInOut() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentStatus, setCurrentStatus] = useState<CurrentStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string>('');
  const [ipAddress, setIpAddress] = useState<string>('');
  const [location, setLocation] = useState<string>('');

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

    fetch('https://api.ipify.org?format=json')
      .then(response => response.json())
      .then(data => setIpAddress(data.ip))
      .catch(() => setIpAddress('Unknown'));
  }, []);

  // Fetch staff list for admin users
  useEffect(() => {
    const fetchStaffMembers = async () => {
      if (!isAdminUser) return;

      setIsLoadingStaff(true);
      try {
        const response = await staffService.getAllForAttendance({ per_page: 100 });
        setStaffMembers(response.data.data || []);

        if (response.data.data?.length > 0 && !selectedStaff) {
          setSelectedStaff(response.data.data[0].id.toString());
        }
      } catch (error) {
        console.error('Failed to fetch staff members:', error);
        showAlert('error', 'Error', 'Failed to load staff members');
      } finally {
        setIsLoadingStaff(false);
      }
    };

    if (isAdminUser) {
      fetchStaffMembers();
    }
  }, [isAdminUser]);

  const fetchCurrentStatus = useCallback(async () => {
    if (!selectedStaff && isAdminUser) return;

    setIsLoadingStatus(true);
    try {
      const params: Record<string, unknown> = {};

      if (isAdminUser && selectedStaff) {
        params.staff_member_id = Number(selectedStaff);
      } else if (!isAdminUser && currentUser?.staff_member_id) {
        params.staff_member_id = currentUser.staff_member_id;
      }

      const response = await attendanceService.getCurrentStatus(params);

      const statusData = response.data.data || {};
      setCurrentStatus({
        status: statusData.status || 'not_clocked_in',
        clock_in: statusData.clock_in || null,
        clock_out: statusData.clock_out || null,
        total_hours: statusData.total_hours || null,
        late_minutes: statusData.late_minutes || 0,
        early_leave_minutes: statusData.early_leave_minutes || 0,
        overtime_minutes: statusData.overtime_minutes || 0,
        break_minutes: statusData.break_minutes || 0,
        shift: statusData.shift || null,
        current_time: statusData.current_time || new Date().toLocaleTimeString(),
        on_leave: statusData.on_leave || false,
        leave_details: statusData.leave_details || null,
      });
    } catch (error) {
      console.error('Failed to refresh status:', error);
      setCurrentStatus({
        status: 'not_clocked_in',
        clock_in: null,
        clock_out: null,
        total_hours: null,
        late_minutes: 0,
        early_leave_minutes: 0,
        overtime_minutes: 0,
        break_minutes: 0,
        shift: null,
        current_time: new Date().toLocaleTimeString(),
        on_leave: false,
      });
    } finally {
      setIsLoadingStatus(false);
    }
  }, [selectedStaff, isAdminUser, currentUser]);

  useEffect(() => {
    const fetchStatus = async () => {
      if (isAdminUser && staffMembers.length === 0) return;
      if (!isAdminUser && !currentUser?.staff_member_id) return;
      if (isAdminUser && !selectedStaff) return;

      await fetchCurrentStatus();
    };

    fetchStatus();
  }, [selectedStaff, isAdminUser, currentUser, staffMembers.length, fetchCurrentStatus]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTimeString = (timeString: string | null | undefined) => {
    if (!timeString) return '--:--';

    try {
      // Check if it's a datetime string from backend
      // Format: "YYYY-MM-DD HH:MM:SS" or ISO format
      if (timeString.includes(' ') || timeString.includes('T')) {
        // Replace space with T for valid ISO string. No 'Z' added, parses as local time.
        const isoString = (timeString.includes('T') ? timeString : timeString.replace(' ', 'T'));
        const date = new Date(isoString);

        return date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        });
      }

      // Handle time-only strings (fallback for legacy format)
      const timeParts = timeString.split(':');

      if (timeParts.length >= 2) {
        const hours = parseInt(timeParts[0], 10);
        const minutes = parseInt(timeParts[1], 10);
        const seconds = timeParts.length >= 3 ? parseInt(timeParts[2], 10) : 0;

        // Format as HH:MM:SS AM/PM
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12; // Convert 0 to 12
        const displayMinutes = minutes.toString().padStart(2, '0');
        const displaySeconds = seconds.toString().padStart(2, '0');

        return `${displayHours}:${displayMinutes}:${displaySeconds} ${period}`;
      }

      return timeString;
    } catch (error) {
      console.error('Error formatting time:', error, timeString);
      return timeString;
    }
  };

  const formatTotalHours = (totalHours: number | string | null | undefined) => {
    if (!totalHours || totalHours === 0) return '0h 0m';

    const hours = typeof totalHours === 'string' ? parseFloat(totalHours) : totalHours;
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);

    if (h === 0 && m === 0) return '0h 0m';
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  const handleClockIn = async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      const data: Record<string, unknown> = {
        ip_address: ipAddress || 'Unknown',
        location: location || 'Office',
      };

      if (isAdminUser && selectedStaff) {
        data.staff_member_id = Number(selectedStaff);
      }

      await attendanceService.clockIn(data);
      await fetchCurrentStatus();
      setMessage({ type: 'success', text: 'Successfully clocked in!' });
      showAlert('success', 'Success!', 'Successfully clocked in!', 2000);
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, 'Failed to clock in');
      setMessage({ type: 'error', text: errorMessage });
      showAlert('error', 'Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClockOut = async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      const data: Record<string, unknown> = {
        ip_address: ipAddress || 'Unknown',
        location: location || 'Office',
      };

      if (isAdminUser && selectedStaff) {
        data.staff_member_id = Number(selectedStaff);
      }

      await attendanceService.clockOut(data);
      await fetchCurrentStatus();
      setMessage({ type: 'success', text: 'Successfully clocked out!' });
      showAlert('success', 'Success!', 'Successfully clocked out!', 2000);
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, 'Failed to clock out');
      setMessage({ type: 'error', text: errorMessage });
      showAlert('error', 'Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentStaffName = () => {
    if (!selectedStaff) return '';
    if (!isAdminUser) {
      return currentUser?.name || 'You';
    }
    const staffMember = staffMembers.find(s => s.id.toString() === selectedStaff);
    return staffMember?.full_name || 'Selected Staff';
  };

  const getCurrentStaffCode = () => {
    if (!selectedStaff) return '';
    if (!isAdminUser) {
      return currentUser?.staff_member_id ? `ID: ${currentUser.staff_member_id}` : '';
    }
    const staffMember = staffMembers.find(s => s.id.toString() === selectedStaff);
    return staffMember?.staff_code ? `Code: ${staffMember.staff_code}` : '';
  };

  const isClockInDisabled = () => {
    if (isLoading || !selectedStaff) return true;
    if (currentStatus?.on_leave) return true;
    if (currentStatus?.status === 'clocked_in') return true;
    return false;
  };

  const isClockOutDisabled = () => {
    if (isLoading || !selectedStaff) return true;
    if (currentStatus?.status !== 'clocked_in') return true;
    return false;
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pb: 4 }}>
      {/* Header section */}
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#1E293B', fontFamily: 'Inter, sans-serif' }}>
          Clock In / Out Dashboard
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5, fontFamily: 'Inter, sans-serif' }}>
          {isAdminUser
            ? 'Record daily entry and exit times for staff members'
            : 'Record your daily workspace log times'}
        </Typography>
      </Box>

      {/* Staff Selection Dropdown (Only visible to admin users) */}
      {isAdminUser && (
        <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: '12px', p: 3, backgroundColor: '#FFFFFF' }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2.5, alignItems: 'center' }}>
            <Box sx={{ flexGrow: 1, minWidth: 280 }}>
              <FormControl size="small" fullWidth>
                <InputLabel id="action-staff-label">Select Employee</InputLabel>
                <MuiSelect
                  labelId="action-staff-label"
                  value={selectedStaff}
                  onChange={(e) => setSelectedStaff(e.target.value)}
                  disabled={isLoadingStaff}
                  label="Select Employee"
                  sx={{ borderRadius: '10px' }}
                >
                  {staffMembers.map((staff) => (
                    <MenuItem key={staff.id} value={staff.id.toString()}>
                      {staff.full_name} {staff.staff_code ? `(${staff.staff_code})` : ''}
                    </MenuItem>
                  ))}
                </MuiSelect>
              </FormControl>
            </Box>
            <Box sx={{ flexGrow: 1.5, minWidth: 260 }}>
              <TextField
                id="location"
                label="Location (Optional)"
                placeholder="e.g. Headquarters Office, Remote Work"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                size="small"
                fullWidth
                slotProps={{
                  input: { sx: { borderRadius: '10px' } }
                }}
              />
            </Box>
          </Box>
        </Paper>
      )}

      {/* Clock and Status Row */}
      <Grid container spacing={3}>
        {/* Current Time Clock */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper
            elevation={0}
            sx={{
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              p: 4.5,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              background: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)',
              textAlign: 'center'
            }}
          >
            <Typography variant="caption" sx={{ color: '#2563EB', fontWeight: 650, letterSpacing: '0.1em', textTransform: 'uppercase', mb: 1, fontFamily: 'Inter' }}>
              Current Workspace Time
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 800, color: '#1E293B', mb: 1.5, letterSpacing: '-0.02em', fontFamily: 'Inter' }}>
              {formatTime(currentTime)}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#64748B', mb: 1.5 }}>
              <CalendarIcon sx={{ fontSize: 18 }} />
              <Typography variant="body2" sx={{ fontWeight: 550, fontFamily: 'Inter' }}>
                {formatDate(currentTime)}
              </Typography>
            </Box>
            {ipAddress && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, border: '1px solid #DBEAFE', borderRadius: '20px', px: 2, py: 0.5, backgroundColor: 'rgba(219, 234, 254, 0.3)' }}>
                <LocationIcon sx={{ fontSize: 13, color: '#2563EB' }} />
                <Typography variant="caption" sx={{ color: '#1E40AF', fontWeight: 600, fontFamily: 'Inter' }}>
                  IP: {ipAddress}
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Current shift status */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: '12px', p: 4, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B', mb: 2, fontFamily: 'Inter, sans-serif', textAlign: 'center' }}>
              {isAdminUser ? `${getCurrentStaffName() || 'Employee'}'s Status` : 'Your Work Status'}
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
              {isLoadingStatus ? (
                <Box sx={{ width: '105%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
                  <MuiSkeleton variant="rectangular" width="40%" height={32} sx={{ borderRadius: '8px' }} />
                  <MuiSkeleton variant="text" width="60%" height={20} />
                </Box>
              ) : currentStatus ? (
                <>
                  {currentStatus.on_leave ? (
                    <Box sx={{ textAlign: 'center' }}>
                      <MuiChip
                        label="On Approved Leave"
                        color="primary"
                        sx={{ fontSize: '0.875rem', fontWeight: 700, borderRadius: '8px', px: 1.5, py: 2.2, backgroundColor: 'rgba(37, 99, 235, 0.1)', color: '#2563EB' }}
                      />
                      {currentStatus.leave_details && (
                        <Typography variant="body2" sx={{ color: '#64748B', mt: 1.5 }}>
                          {currentStatus.leave_details.category?.title || 'Approved leave for today'}
                        </Typography>
                      )}
                    </Box>
                  ) : (
                    <>
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <MuiChip
                          label={
                            currentStatus.status === 'clocked_in'
                              ? 'Active: Clocked In'
                              : currentStatus.status === 'clocked_out'
                              ? 'Off Duty: Clocked Out'
                              : 'Not Shift-Logged'
                          }
                          sx={{
                            fontSize: '0.875rem',
                            fontWeight: 700,
                            borderRadius: '8px',
                            px: 1.5,
                            py: 2.2,
                            backgroundColor:
                              currentStatus.status === 'clocked_in'
                                ? 'rgba(34, 197, 94, 0.1)'
                                : currentStatus.status === 'clocked_out'
                                ? 'rgba(37, 99, 235, 0.1)'
                                : 'rgba(100, 116, 139, 0.1)',
                            color:
                              currentStatus.status === 'clocked_in'
                                ? '#16A34A'
                                : currentStatus.status === 'clocked_out'
                                ? '#2563EB'
                                : '#64748B',
                          }}
                        />
                      </Box>

                      {currentStatus.shift && (
                        <Box sx={{ border: '1px solid #F1F5F9', borderRadius: '10px', p: 2, width: '100%', backgroundColor: '#F8FAFC', textAlign: 'center' }}>
                          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>Assigned Shift</Typography>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B', mt: 0.25 }}>{currentStatus.shift.name}</Typography>
                          <Typography variant="body2" sx={{ color: '#64748B', mt: 0.25, fontSize: '0.8rem' }}>
                            {currentStatus.shift.start_time} - {currentStatus.shift.end_time}
                            {currentStatus.shift.is_night_shift && <span style={{ marginLeft: '4px' }}>🌙</span>}
                          </Typography>

                          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 1 }}>
                            {currentStatus.late_minutes > 0 && (
                              <Typography variant="caption" sx={{ color: '#D97706', fontWeight: 650 }}>
                                Late Arrival: {((currentStatus.late_minutes || 0) / 60).toFixed(1)}h
                              </Typography>
                            )}
                            {currentStatus.overtime_minutes > 0 && (
                              <Typography variant="caption" sx={{ color: '#16A34A', fontWeight: 650 }}>
                                Overtime: {((currentStatus.overtime_minutes || 0) / 60).toFixed(1)}h
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      )}
                    </>
                  )}
                </>
              ) : (
                <Typography variant="body2" sx={{ color: '#94A3B8' }}>
                  {isAdminUser ? 'Pick staff member to view status' : 'Connecting to status...'}
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Messages / Alerts */}
      {message && (
        <MuiAlert severity={message.type === 'error' ? 'error' : 'success'} sx={{ borderRadius: '10px' }}>
          <AlertTitle>{message.type === 'error' ? 'Notification Error' : 'Success Entry'}</AlertTitle>
          {message.text}
        </MuiAlert>
      )}

      {/* Quick Action Controls */}
      <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: '12px', p: 4, backgroundColor: '#FFFFFF' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B', mb: 1, fontFamily: 'Inter, sans-serif' }}>
          Quick Attendance Actions
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748B', mb: 4 }}>
          {currentStatus?.on_leave
            ? 'Employee details suggest leave status today. Actions restricted.'
            : isAdminUser
            ? `Submit punch-in/out on behalf of ${getCurrentStaffName() || 'selected employee'}`
            : 'Select action to punch record log details.'}
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2.5 }}>
          <MuiButton
            onClick={handleClockIn}
            disabled={isClockInDisabled()}
            variant="contained"
            size="large"
            startIcon={<LogInIcon />}
            sx={{
              flex: 1,
              py: 2.2,
              borderRadius: '10px',
              backgroundColor: '#16A34A',
              fontWeight: 650,
              fontSize: '1rem',
              fontFamily: 'Inter',
              textTransform: 'none',
              '&:hover': { backgroundColor: '#15803D' },
              '&.Mui-disabled': { backgroundColor: 'rgba(22, 163, 74, 0.12)', color: 'rgba(22, 163, 74, 0.4)' }
            }}
          >
            {isAdminUser ? 'Clock In Staff' : 'Clock In'}
          </MuiButton>

          <MuiButton
            onClick={handleClockOut}
            disabled={isClockOutDisabled()}
            variant="contained"
            size="large"
            startIcon={<LogOutIcon />}
            sx={{
              flex: 1,
              py: 2.2,
              borderRadius: '10px',
              backgroundColor: '#DC2626',
              fontWeight: 650,
              fontSize: '1rem',
              fontFamily: 'Inter',
              textTransform: 'none',
              '&:hover': { backgroundColor: '#B91C1C' },
              '&.Mui-disabled': { backgroundColor: 'rgba(220, 38, 38, 0.12)', color: 'rgba(220, 38, 38, 0.4)' }
            }}
          >
            {isAdminUser ? 'Clock Out Staff' : 'Clock Out'}
          </MuiButton>
        </Box>

        {(!selectedStaff && isAdminUser) && (
          <Typography variant="caption" sx={{ color: '#DC2626', display: 'block', mt: 1.5, fontWeight: 550, textAlign: 'center' }}>
            Please select an employee to unlock punch-in/out quick actions.
          </Typography>
        )}
      </Paper>

      {/* Today's Log Summary Metrics */}
      <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: '12px', p: 4, backgroundColor: '#FFFFFF' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B', mb: 3, fontFamily: 'Inter, sans-serif' }}>
          Today's Summary Metrics
        </Typography>

        {currentStatus?.on_leave ? (
          <Box sx={{ py: 6, display: 'flex', flexDirection: 'column', gap: 1.5, alignItems: 'center', textAlign: 'center' }}>
            <CalendarIcon sx={{ fontSize: 44, color: '#2563EB' }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B' }}>On Approved Leave</Typography>
            <Typography variant="body2" sx={{ color: '#64748B' }}>
              {currentStatus.leave_details?.category?.title || 'Leave request successfully approved'}
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3.5}>
            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <Paper elevation={0} sx={{ border: '1px solid #F1F5F9', borderRadius: '10px', p: 2.5, backgroundColor: '#FAFAFA', textAlign: 'center' }}>
                <ClockIcon sx={{ color: '#2563EB', fontSize: 26, mb: 1 }} />
                <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontWeight: 550 }}>Clock In</Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mt: 0.5, color: '#1E293B' }}>
                  {formatTimeString(currentStatus?.clock_in) || '--:--'}
                </Typography>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <Paper elevation={0} sx={{ border: '1px solid #F1F5F9', borderRadius: '10px', p: 2.5, backgroundColor: '#FAFAFA', textAlign: 'center' }}>
                <ClockIcon sx={{ color: '#DC2626', fontSize: 26, mb: 1 }} />
                <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontWeight: 550 }}>Clock Out</Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mt: 0.5, color: '#1E293B' }}>
                  {formatTimeString(currentStatus?.clock_out) || '--:--'}
                </Typography>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <Paper elevation={0} sx={{ border: '1px solid #F1F5F9', borderRadius: '10px', p: 2.5, backgroundColor: '#FAFAFA', textAlign: 'center' }}>
                <ClockIcon sx={{ color: '#16A34A', fontSize: 26, mb: 1 }} />
                <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontWeight: 550 }}>Working Hours</Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mt: 0.5, color: '#1E293B' }}>
                  {formatTotalHours(currentStatus?.total_hours)}
                </Typography>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <Paper elevation={0} sx={{ border: '1px solid #F1F5F9', borderRadius: '10px', p: 2.5, backgroundColor: '#FAFAFA', textAlign: 'center' }}>
                <WatchIcon sx={{ color: '#CA8A04', fontSize: 26, mb: 1 }} />
                <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontWeight: 550 }}>Late Hours</Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mt: 0.5, color: '#1E293B' }}>
                  {((currentStatus?.late_minutes || 0) / 60).toFixed(1)}h
                </Typography>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <Paper elevation={0} sx={{ border: '1px solid #F1F5F9', borderRadius: '10px', p: 2.5, backgroundColor: '#FAFAFA', textAlign: 'center' }}>
                <WatchIcon sx={{ color: '#EA580C', fontSize: 26, mb: 1 }} />
                <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontWeight: 550 }}>Overtime (Hrs)</Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mt: 0.5, color: '#1E293B' }}>
                  {((currentStatus?.overtime_minutes || 0) / 60).toFixed(1)}h
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        )}
      </Paper>
    </Box>
  );
}