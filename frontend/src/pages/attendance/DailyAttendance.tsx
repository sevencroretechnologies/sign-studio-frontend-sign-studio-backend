import React, { useState, useEffect, useCallback } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Avatar as MuiAvatar, Chip as MuiChip, Pagination as MuiPagination, Box, Skeleton as MuiSkeleton, TextField, InputAdornment, MenuItem,
  Select as MuiSelect, FormControl, InputLabel, Dialog, DialogTitle,
  DialogContent, DialogActions, Button as MuiButton, IconButton, Divider,
  Drawer
} from '@mui/material';
import {Typography} from '@mui/material';
import {
  Search as SearchIcon, Close as CloseIcon, AccessTime as AccessTimeIcon,
  CheckCircle as CheckCircleIcon, RadioButtonUnchecked as RadioButtonUncheckedIcon,
  Edit as EditIcon, Refresh as RefreshIcon,
} from '@mui/icons-material';
import { attendanceService, staffService, settingsService, leaveService } from '../../services/api';
import { showAlert } from '../../lib/sweetalert';

// ─── Types ───────────────────────────────────────────────────────────────────

interface StaffMember {
  id: number;
  full_name: string;
  employee_id?: string;
  division?: { title: string } | null;
  office_location?: { name?: string; title?: string } | null;
  job_title?: { title: string } | null;
  profile_image?: string | null;
}

interface WorkLog {
  id?: number;
  staff_member_id: number;
  log_date: string;
  clock_in?: string | null;
  clock_out?: string | null;
  working_hours_formatted?: string | null;
  total_hours?: number | string | null;
  status?: string;
  notes?: string | null;
  clock_in_image?: string | null;
  clock_out_image?: string | null;
}

interface StaffWithLog extends StaffMember {
  workLog?: WorkLog | null;
  punchStatus?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const todayStr = () => new Date().toISOString().split('T')[0];

const formatTime = (t?: string | null) => {
  if (!t) return '—';
  // Handle full datetime "YYYY-MM-DD HH:mm:ss" or "YYYY-MM-DDTHH:mm:ss"
  if (t.includes('T')) {
    return t.split('T')[1].substring(0, 5);
  }
  if (t.includes(' ')) {
    return t.split(' ')[1].substring(0, 5);
  }
  return t.substring(0, 5);
};

const initials = (name: string) =>
  name.split(' ').map((w) => w[0]).join('').substring(0, 2).toUpperCase();

const statusChip = (status?: string) => {
  if (status === 'completed')
    return <MuiChip label="Completed" size="small" sx={{ bgcolor: '#DCFCE7', color: '#16A34A', fontWeight: 700, fontSize: '0.7rem', height: 24 }} />;
  if (status === 'punched_in')
    return <MuiChip label="Active / In" size="small" sx={{ bgcolor: '#E0F2FE', color: '#0284C7', fontWeight: 700, fontSize: '0.7rem', height: 24 }} />;
  if (status === 'not_punched_out')
    return <MuiChip label="Not Punched Out" size="small" sx={{ bgcolor: '#FFEDD5', color: '#F97316', fontWeight: 700, fontSize: '0.7rem', height: 24 }} />;
  // if (status === 'half_day' || status === 'half_day_leave')
  //   return <MuiChip label="Half Day" size="small" sx={{ bgcolor: '#FEF9C3', color: '#B45309', fontWeight: 700, fontSize: '0.7rem', height: 24 }} />;
  if (status === 'on_leave' || status === 'leave' || status === 'paid_leave' || status === 'paid')
    return <MuiChip label="On Leave" size="small" sx={{ bgcolor: '#F3E8FF', color: '#7E22CE', fontWeight: 700, fontSize: '0.7rem', height: 24 }} />;
  if (status === 'holiday')
    return <MuiChip label="Holiday" size="small" sx={{ bgcolor: '#E0F2FE', color: '#0369A1', fontWeight: 700, fontSize: '0.7rem', height: 24 }} />;
  // if (status === 'week_off')
  //   return <MuiChip label="Week Off" size="small" sx={{ bgcolor: '#F1F5F9', color: '#475569', fontWeight: 700, fontSize: '0.7rem', height: 24 }} />;
  if (status === 'absent')
    return <MuiChip label="Absent" size="small" sx={{ bgcolor: '#FEE2E2', color: '#DC2626', fontWeight: 700, fontSize: '0.7rem', height: 24 }} />;

  return <MuiChip label="Not Punched In" size="small" sx={{ bgcolor: '#FEE2E2', color: '#DC2626', fontWeight: 700, fontSize: '0.7rem', height: 24 }} />;
};

const formatTotalHours = (hours?: number | string | null) => {
  if (!hours) return '—';
  const num = Number(hours);
  if (isNaN(num) || num <= 0) return '—';
  
  const h = Math.floor(num);
  const m = Math.round((num - h) * 60);
  
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
};

// ─── Time Edit Sub-modal ─────────────────────────────────────────────────────

interface TimeEditModalProps {
  open: boolean;
  title: string;
  initialTime: string;
  onClose: () => void;
  onSave: (time: string) => Promise<void>;
  saving: boolean;
}

function TimeEditModal({ open, title, initialTime, onClose, onSave, saving }: TimeEditModalProps) {
  const [time, setTime] = useState(initialTime);
  useEffect(() => { if (open) setTime(initialTime); }, [open, initialTime]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
      slotProps={{ paper: { sx: { borderRadius: '12px', p: 1, boxShadow: '0px 10px 30px rgba(0,0,0,0.1)' } } }}>
      <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem', pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {title === 'Set Punch In Time' ? 'In Time' : 'Out Time'}
        <IconButton onClick={onClose} size="small" sx={{ bgcolor: '#94A3B8', color: '#fff', '&:hover': { bgcolor: '#64748B' }, width: 24, height: 24 }}>
          <CloseIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <Box>
          <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600, display: 'block', mb: 0.5 }}>
            Select Shift
          </Typography>
          <TextField
            fullWidth
            size="small"
            value="09:30 AM - 07:00 PM"
            slotProps={{ input: { readOnly: true } }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#F8FAFC' } }}
          />
        </Box>
        <Box>
          <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600, display: 'block', mb: 0.5 }}>
            Select Time
          </Typography>
          <TextField
            fullWidth type="time" value={time} size="small"
            onChange={(e) => setTime(e.target.value)}
            slotProps={{ htmlInput: { step: 60 } }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
        <MuiButton onClick={onClose} variant="outlined" size="small"
          sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 600, color: '#475569', borderColor: '#E2E8F0', '&:hover': { borderColor: '#CBD5E1', bgcolor: '#F8FAFC' } }}>
          Cancel
        </MuiButton>
        <MuiButton onClick={() => onSave(time)} variant="contained" size="small"
          disabled={saving || !time}
          sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 600, bgcolor: '#0EA5E9', '&:hover': { bgcolor: '#0284C7' } }}>
          {saving ? 'Confirming...' : 'Confirm'}
        </MuiButton>
      </DialogActions>
    </Dialog>
  );
}

// ─── Employee Detail Modal ────────────────────────────────────────────────────

interface EmployeeModalProps {
  open: boolean;
  employee: StaffWithLog | null;
  currentDate: string;
  onClose: () => void;
  onRefresh: () => void;
}

function EmployeeModal({ open, employee, currentDate, onClose, onRefresh }: EmployeeModalProps) {
  const [timeModal, setTimeModal] = useState<{ open: boolean; type: 'clock_in' | 'clock_out'; initial: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('present');
  const [selectedLeave, setSelectedLeave] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  // Sync state with employee data when opened
  useEffect(() => {
    if (open && employee) {
      setSelectedStatus(employee.workLog?.status || 'present');
      setNotes(employee.workLog?.notes || '');
      setSelectedLeave(null); // Assuming leave isn't directly in workLog for now
    }
  }, [open, employee]);

  if (!employee) return null;
  const { workLog } = employee;

  const handleSaveTime = async (time: string) => {
    if (!timeModal) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        staff_member_id: employee.id,
        log_date: currentDate,
        [timeModal.type === 'clock_in' ? 'clock_in' : 'clock_out']: time,
        status: selectedStatus,
        notes,
      };

      if (workLog?.id) {
        await attendanceService.updateWorkLog(workLog.id, payload);
      } else {
        await attendanceService.createWorkLog(payload);
      }

      showAlert('success', 'Saved', 'Attendance updated successfully.');
      setTimeModal(null);
      onRefresh();
    } catch {
      showAlert('error', 'Error', 'Failed to save attendance.');
    } finally {
      setSaving(false);
    }
  };

  const dateObj = new Date(currentDate);
  const displayDate = `${dateObj.getDate()}${['th', 'st', 'nd', 'rd'][((dateObj.getDate() % 10) > 3 ? 0 : (dateObj.getDate() % 10)) - (dateObj.getDate() % 100 - dateObj.getDate() % 10 != 10 ? 0 : 10)] || 'th'} ${dateObj.toLocaleDateString('en-US', { month: 'long' })}`;

  const StatusChip = ({ label, value, activeColor, inactiveColor }: any) => {
    const isActive = selectedStatus === value;
    return (
      <MuiChip
        label={label}
        onClick={() => setSelectedStatus(value)}
        sx={{
          fontWeight: 700, fontSize: '0.7rem', borderRadius: '20px', cursor: 'pointer', height: 26,
          bgcolor: isActive ? activeColor : 'transparent',
          color: isActive ? '#fff' : inactiveColor,
          border: `1px solid ${inactiveColor}`,
          '&:hover': { bgcolor: isActive ? activeColor : `${inactiveColor}22` }
        }}
      />
    );
  };

  const LeaveChip = ({ label, value, color }: any) => {
    const isActive = selectedLeave === value;
    return (
      <MuiChip
        label={label}
        onClick={() => setSelectedLeave(value)}
        sx={{
          fontWeight: 700, fontSize: '0.7rem', borderRadius: '20px', cursor: 'pointer', height: 26, mb: 1, mr: 1,
          bgcolor: isActive ? color : 'transparent',
          color: isActive ? '#fff' : color,
          border: `1px solid ${color}`,
          '&:hover': { bgcolor: isActive ? color : `${color}22` }
        }}
      />
    );
  };

  return (
    <>
      <Drawer anchor="right" open={open} onClose={onClose} slotProps={{ paper: { sx: { width: { xs: '100%', sm: 380 }, p: 0 } } }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderBottom: '1px solid #E2E8F0' }}>
          <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: '#0F172A' }}>
            Edit Attendance : {employee.full_name}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Box sx={{ p: 2.5, flex: 1, overflowY: 'auto' }}>
          {/* Date Row */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: '#1E293B' }}>
                {displayDate}
              </Typography>
              {employee.punchStatus === 'not_punched_out' && (
                <span style={{
                  padding: "2px 8px",
                  borderRadius: "12px",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  backgroundColor: "#FFEDD5",
                  color: "#F97316"
                }}>
                  ⚠️ Not Punched Out
                </span>
              )}
            </Box>
            <IconButton size="small" onClick={onRefresh}>
              <RefreshIcon fontSize="small" sx={{ color: '#64748B' }} />
            </IconButton>
          </Box>

          {/* Status Row 1 */}
          <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
            <StatusChip label="ABSENT" value="absent" activeColor="#DC2626" inactiveColor="#DC2626" />
            <StatusChip label="PRESENT" value="present" activeColor="#10B981" inactiveColor="#10B981" />
          </Box>
          
          {/* Status Row 2 */}
          {/* <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
            <StatusChip label="WEEK OFF" value="week_off" activeColor="#94A3B8" inactiveColor="#94A3B8" />
            <StatusChip label="HOLIDAY" value="holiday" activeColor="#94A3B8" inactiveColor="#94A3B8" />
          </Box> */}

          {/* Leaves Section */}
          <Typography sx={{ mb: 1.5, fontWeight: 700, fontSize: '0.85rem', color: '#1E293B' }}>
            Leaves
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', mb: 3 }}>
            <LeaveChip label="PAID LEAVE" value="paid" color="#D946EF" />
            <LeaveChip label="HALF DAY LEAVE" value="half_day_leave" color="#C084FC" />
            <LeaveChip label="UNPAID LEAVE" value="unpaid" color="#0EA5E9" />
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Punches */}
          {workLog?.clock_in && (
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                {workLog.clock_in_image ? (
                  <MuiAvatar src={`http://127.0.0.1:8000/storage/${workLog.clock_in_image}`} sx={{ width: 40, height: 40 }} />
                ) : (
                  <MuiAvatar sx={{ width: 40, height: 40, bgcolor: '#F1F5F9' }} />
                )}
                <Box>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>PUNCH IN</Typography>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.85rem' }}>{formatTime(workLog.clock_in)}</Typography>
                </Box>
              </Box>
              <IconButton size="small" onClick={() => setTimeModal({ open: true, type: 'clock_in', initial: formatTime(workLog.clock_in) || '09:00' })}>
                <EditIcon fontSize="small" sx={{ color: '#64748B' }} />
              </IconButton>
            </Box>
          )}

          {workLog?.clock_out && (
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                {workLog.clock_out_image ? (
                  <MuiAvatar src={`http://127.0.0.1:8000/storage/${workLog.clock_out_image}`} sx={{ width: 40, height: 40 }} />
                ) : (
                  <MuiAvatar sx={{ width: 40, height: 40, bgcolor: '#F1F5F9' }} />
                )}
                <Box>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>PUNCH OUT</Typography>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.85rem' }}>{formatTime(workLog.clock_out)}</Typography>
                </Box>
              </Box>
              <IconButton size="small" onClick={() => setTimeModal({ open: true, type: 'clock_out', initial: formatTime(workLog.clock_out) || '18:00' })}>
                <EditIcon fontSize="small" sx={{ color: '#64748B' }} />
              </IconButton>
            </Box>
          )}

          {/* Add Punch Links */}
          <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
            {!workLog?.clock_in && (
              <Typography
                sx={{ cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, fontSize: '0.75rem', color: '#0EA5E9' }}
                onClick={() => setTimeModal({ open: true, type: 'clock_in', initial: '09:00' })}
              >
                + ADD PUNCH IN
              </Typography>
            )}
            {!workLog?.clock_out && (
              <Typography
                sx={{ cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, fontSize: '0.75rem', color: '#0EA5E9' }}
                onClick={() => setTimeModal({ open: true, type: 'clock_out', initial: '18:00' })}
              >
                + ADD PUNCH OUT
              </Typography>
            )}
          </Box>

          {/* Notes Area */}
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="Add Note"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: '0.85rem' } }}
          />
        </Box>

      </Drawer>

      {timeModal && (
        <TimeEditModal
          open={timeModal.open}
          title={timeModal.type === 'clock_in' ? 'Set Punch In Time' : 'Set Punch Out Time'}
          initialTime={timeModal.initial}
          onClose={() => setTimeModal(null)}
          onSave={handleSaveTime}
          saving={saving}
        />
      )}
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DailyAttendance() {
  const [staff, setStaff] = useState<StaffWithLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;
  const [totalRows, setTotalRows] = useState(0);

  // Filters
  const [dateFilter, setDateFilter] = useState(todayStr());
  const [branchFilter, setBranchFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [punchStatusFilter, setPunchStatusFilter] = useState('all');
  const [branchOptions, setBranchOptions] = useState<{ id: number; title: string }[]>([]);
  const [deptOptions, setDeptOptions] = useState<{ id: number; title: string }[]>([]);

  // Modal
  const [selectedEmployee, setSelectedEmployee] = useState<StaffWithLog | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Load filter options
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [brRes, deptRes] = await Promise.all([
          settingsService.getOfficeLocations({ paginate: 'false' }),
          settingsService.getDivisions({ paginate: 'false' }),
        ]);
        setBranchOptions(brRes.data?.data ?? []);
        setDeptOptions(deptRes.data?.data ?? []);
      } catch { /* silent */ }
    };
    loadOptions();
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const staffParams: Record<string, unknown> = { page, per_page: perPage };
      if (search.trim()) staffParams.name = search.trim();
      if (branchFilter !== 'all') staffParams.branch_id = Number(branchFilter);
      if (deptFilter !== 'all') staffParams.department_id = Number(deptFilter);

      const [staffRes, logsRes, leavesRes] = await Promise.all([
        staffService.getAllForAttendance(staffParams),
        attendanceService.getWorkLogs({ start_date: dateFilter, end_date: dateFilter, per_page: 200 }),
        leaveService.getRequests({ start_date: dateFilter, end_date: dateFilter, status: 'approved', per_page: 200 }).catch(() => ({ data: { data: [] } })),
      ]);

      const staffData: StaffMember[] = staffRes.data?.data ?? [];
      setTotalRows(staffRes.data?.meta?.total ?? 0);

      const logs: WorkLog[] = logsRes.data?.data ?? [];
      const logsMap = new Map<number, WorkLog>();
      logs.forEach((l) => logsMap.set(l.staff_member_id, l));

      const approvedLeaves: any[] = leavesRes.data?.data ?? [];
      const leavesMap = new Map<number, any>();
      approvedLeaves.forEach((l) => leavesMap.set(l.staff_member_id, l));

      const merged: StaffWithLog[] = staffData.map((s) => {
        const log = logsMap.get(s.id) || null;
        const leave = leavesMap.get(s.id) || null;

        let punchStatus = 'not_punched';

        if (log?.status && ['half_day', 'half_day_leave', 'on_leave', 'holiday', 'week_off', 'absent', 'present', 'not_punched_out', 'in'].includes(log.status)) {
          if (log.status === 'present') {
            if (log.clock_in && log.clock_out) punchStatus = 'completed';
            else if (log.clock_in) punchStatus = 'punched_in';
            else punchStatus = 'not_punched';
          } else if (log.status === 'in') {
            punchStatus = 'punched_in';
          } else {
            punchStatus = log.status;
          }
        } else if (log?.clock_in && log?.clock_out) {
          punchStatus = 'completed';
        } else if (log?.clock_in) {
          punchStatus = 'punched_in';
        } else if (leave) {
          punchStatus = 'on_leave';
        }

        return { ...s, workLog: log, punchStatus };
      });

      // Client-side status filter
      const filtered = punchStatusFilter === 'all'
        ? merged
        : merged.filter((item) => {
            if (punchStatusFilter === 'not_punched') return item.punchStatus === 'not_punched';
            if (punchStatusFilter === 'not_punched_out') return item.punchStatus === 'not_punched_out';
            if (punchStatusFilter === 'punched_in') return item.punchStatus === 'punched_in';
            if (punchStatusFilter === 'completed') return item.punchStatus === 'completed';
            if (punchStatusFilter === 'half_day') return item.punchStatus === 'half_day' || item.punchStatus === 'half_day_leave';
            if (punchStatusFilter === 'on_leave') return item.punchStatus === 'on_leave' || item.punchStatus === 'leave' || item.punchStatus === 'paid_leave';
            if (punchStatusFilter === 'holiday') return item.punchStatus === 'holiday';
            return true;
          });

      setStaff(filtered);
    } catch {
      showAlert('error', 'Error', 'Failed to load attendance data.');
      setStaff([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, branchFilter, deptFilter, punchStatusFilter, dateFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleReset = () => {
    setSearchInput('');
    setSearch('');
    setDateFilter(todayStr());
    setBranchFilter('all');
    setDeptFilter('all');
    setPunchStatusFilter('all');
    setPage(1);
  };

  const openModal = (emp: StaffWithLog) => {
    setSelectedEmployee(emp);
    setModalOpen(true);
  };

  const totalPages = Math.max(1, Math.ceil(totalRows / perPage));

  return (
    <Box sx={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A' }}>Daily Attendance</Typography>
        <Typography variant="caption" color="#64748B">
          Punch-in/out status for all employees — {new Date(dateFilter).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </Typography>
      </Box>

      {/* Filters */}
      <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: '12px', p: 2.5, mb: 2.5 }}>
        <Box component="form" onSubmit={handleSearch}
          sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
          {/* Search */}
          <TextField
            placeholder="Search by Employee Name..."
            size="small"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            slotProps={{
              input: { startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: '#94A3B8' }} /></InputAdornment> }
            }}
            sx={{ minWidth: 220, '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: '0.85rem' } }}
          />

          {/* Date */}
          <TextField
            label="Date"
            type="date"
            size="small"
            value={dateFilter}
            onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ minWidth: 150, '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: '0.85rem' } }}
          />

          {/* Branch */}
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel sx={{ fontSize: '0.85rem' }}>Branch</InputLabel>
            <MuiSelect value={branchFilter} label="Branch" onChange={(e) => { setBranchFilter(e.target.value); setPage(1); }}
              sx={{ borderRadius: '10px', fontSize: '0.85rem' }}>
              <MenuItem value="all">All Branches</MenuItem>
              {branchOptions.map((b) => <MenuItem key={b.id} value={String(b.id)}>{b.title}</MenuItem>)}
            </MuiSelect>
          </FormControl>

          {/* Department */}
          <FormControl size="small" sx={{ minWidth: 170 }}>
            <InputLabel sx={{ fontSize: '0.85rem' }}>Department</InputLabel>
            <MuiSelect value={deptFilter} label="Department" onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }}
              sx={{ borderRadius: '10px', fontSize: '0.85rem' }}>
              <MenuItem value="all">All Departments</MenuItem>
              {deptOptions.map((d) => <MenuItem key={d.id} value={String(d.id)}>{d.title}</MenuItem>)}
            </MuiSelect>
          </FormControl>

          {/* Punch Status */}
          <FormControl size="small" sx={{ minWidth: 170 }}>
            <InputLabel sx={{ fontSize: '0.85rem' }}>Punch Status</InputLabel>
            <MuiSelect value={punchStatusFilter} label="Punch Status" onChange={(e) => { setPunchStatusFilter(e.target.value); setPage(1); }}
              sx={{ borderRadius: '10px', fontSize: '0.85rem' }}>
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="not_punched">Not Punched In</MenuItem>
              <MenuItem value="not_punched_out">Not Punched Out</MenuItem>
              <MenuItem value="punched_in">Active / In</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="half_day">Half Day</MenuItem>
              <MenuItem value="on_leave">On Leave</MenuItem>
              <MenuItem value="holiday">Holiday</MenuItem>
            </MuiSelect>
          </FormControl>

          <MuiButton type="submit" variant="contained" size="small"
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, px: 2.5, bgcolor: '#2563EB', '&:hover': { bgcolor: '#1D4ED8' } }}>
            Search
          </MuiButton>
          <MuiButton type="button" variant="outlined" size="small" onClick={handleReset}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, px: 2 }}>
            Reset Filters
          </MuiButton>
        </Box>
      </Paper>

      {/* Table */}
      <TableContainer component={Paper} elevation={0}
        sx={{ border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden' }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#F8FAFC' }}>
              {['Staff', 'First In', 'Last Out', 'Hours Worked', 'Status'].map((h) => (
                <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.72rem', color: '#64748B',
                  textTransform: 'uppercase', letterSpacing: '0.05em', py: 1.5, px: 2, borderBottom: '1px solid #E2E8F0' }}>
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((__, j) => (
                    <TableCell key={j} sx={{ py: 1.5, px: 2 }}>
                      <MuiSkeleton animation="wave" height={20} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : staff.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} sx={{ textAlign: 'center', py: 6, color: '#94A3B8' }}>
                  No employees found for today.
                </TableCell>
              </TableRow>
            ) : (
              staff.map((emp) => (
                <TableRow key={emp.id}
                  hover
                  onClick={() => openModal(emp)}
                  sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#F0F7FF' },
                    '& td': { borderBottom: '1px solid #F1F5F9', py: 1.5, px: 2, fontSize: '0.82rem' } }}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <MuiAvatar sx={{ width: 34, height: 34, fontSize: '0.75rem', fontWeight: 700,
                        bgcolor: '#EFF6FF', color: '#2563EB' }}>
                        {initials(emp.full_name)}
                      </MuiAvatar>
                      <Box>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.82rem', color: '#0F172A' }}>{emp.full_name}</Typography>
                        <Typography variant="caption" color="#94A3B8">
                          {emp.employee_id ? `#${emp.employee_id}` : 'Staff'} • {emp.division?.title || 'No Dept'}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {emp.workLog?.clock_in
                      ? <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#16A34A', fontWeight: 600 }}>
                          <AccessTimeIcon sx={{ fontSize: 14 }} />{formatTime(emp.workLog.clock_in)}
                        </Box>
                      : <Typography variant="caption" color="#94A3B8">—</Typography>}
                  </TableCell>
                  <TableCell>
                    {emp.workLog?.clock_out
                      ? <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#2563EB', fontWeight: 600 }}>
                          <AccessTimeIcon sx={{ fontSize: 14 }} />{formatTime(emp.workLog.clock_out)}
                        </Box>
                      : <Typography variant="caption" color="#94A3B8">—</Typography>}
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.82rem', color: '#475569' }}>
                      {formatTotalHours(emp.workLog?.total_hours)}
                    </Typography>
                  </TableCell>
                  <TableCell>{statusChip(emp.punchStatus)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {!isLoading && staff.length > 0 && (
          <Box sx={{ p: 2.5, borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" color="#64748B">
              Showing page {page} of {totalPages} ({totalRows} employees)
            </Typography>
            <MuiPagination count={totalPages} page={page} onChange={(_, v) => setPage(v)}
              variant="outlined" shape="rounded"
              sx={{ '& .MuiPaginationItem-root': { borderRadius: '8px', fontFamily: 'Inter, sans-serif',
                '&.Mui-selected': { bgcolor: '#2563EB', color: '#fff', border: '1px solid #2563EB',
                  '&:hover': { bgcolor: '#1D4ED8' } } } }} />
          </Box>
        )}
      </TableContainer>

      {/* Employee Modal */}
      <EmployeeModal
        open={modalOpen}
        employee={selectedEmployee}
        currentDate={dateFilter}
        onClose={() => { setModalOpen(false); setSelectedEmployee(null); }}
        onRefresh={fetchData}
      />
    </Box>
  );
}
