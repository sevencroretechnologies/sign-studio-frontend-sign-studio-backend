import React, { useState, useMemo, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  Select as MuiSelect,
  MenuItem,
  Checkbox,
  Pagination as MuiPagination,
  Box,
  Typography,
} from '@mui/material';
import { Download, Filter, Search, Building, CheckCircle2, Clock, LayoutGrid, AlertCircle, XCircle, AlertTriangle, ChevronDown } from 'lucide-react';
import PenaltyOvertimeDetails from './PenaltyOvertimeDetails';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { showAlert } from '../../lib/sweetalert';
import { attendanceService } from '../../services/api';

interface TimingFormInput {
  shiftChoice: string;
  checkinMode: string;
  automationRule: string;
}

interface WorkLog {
  id: number;
  status: string;
  shift?: { name: string; start_time: string; end_time: string };
  staff_member?: {
    id: number;
    full_name: string;
    division?: { title: string };
    office_location?: { name: string };
    job_title?: { title: string };
  };
}

export default function AttendanceDetailsPage() {
  // Main Top-level Tabs
  const topTabs = [
    { id: 'staff', label: 'Staff Details' },
    { id: 'attendance', label: 'Attendance Details' },
    { id: 'bank', label: 'Bank Details' },
    { id: 'salary', label: 'Salary Details' },
    { id: 'leave', label: 'Leave Balance' },
    { id: 'overtime', label: 'Penalty & Overtime' },
    { id: 'permissions', label: 'Permissions' },
  ];
  const [activeTopTab, setActiveTopTab] = useState('attendance');

  // Subtabs under Attendance Details
  const subTabs = [
    { id: 'timings', label: 'Work Timings' },
    { id: 'modes', label: 'Attendance Modes' },
    { id: 'rules', label: 'Automation Rules' },
  ];
  const [activeSubTab, setActiveSubTab] = useState('timings');

  // List State & Filters
  const [logs, setLogs] = useState<WorkLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Multi-Selection
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);
      try {
        const response = await attendanceService.getWorkLogs({ per_page: 100 });
        setLogs(response.data.data || []);
      } catch (error) {
        console.error('Failed to fetch logs:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLogs();
  }, []);

  // Dynamic filter options
  const departments = useMemo(() => {
    const depts = new Set<string>();
    logs.forEach((log) => {
      if (log.staff_member?.division?.title) depts.add(log.staff_member.division.title);
    });
    return Array.from(depts).sort();
  }, [logs]);

  const branches = useMemo(() => {
    const b = new Set<string>();
    logs.forEach((log) => {
      if (log.staff_member?.office_location?.name) b.add(log.staff_member.office_location.name);
    });
    return Array.from(b).sort();
  }, [logs]);

  const statuses = useMemo(() => {
    const s = new Set<string>();
    logs.forEach((log) => {
      if (log.status) s.add(log.status);
    });
    return Array.from(s).sort();
  }, [logs]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  // react-hook-form
  const { control, handleSubmit, reset } = useForm<TimingFormInput>({
    defaultValues: {
      shiftChoice: '09:00 AM - 06:00 PM',
      checkinMode: 'Biometric / Face App',
      automationRule: 'Auto-Approved',
    },
  });

  // Filter Logic
  const filteredRecords = useMemo(() => {
    return logs.filter((log) => {
      const name = log.staff_member?.full_name?.toLowerCase() || '';
      const role = log.staff_member?.job_title?.title?.toLowerCase() || '';
      const branch = log.staff_member?.office_location?.name || '';
      const dept = log.staff_member?.division?.title || '';
      const status = log.status || '';

      const matchesSearch = name.includes(search.toLowerCase()) || role.includes(search.toLowerCase());
      const matchesBranch = branchFilter === 'all' || branch === branchFilter;
      const matchesDept = deptFilter === 'all' || dept === deptFilter;
      const matchesStatus = statusFilter === 'all' || status === statusFilter;
      return matchesSearch && matchesBranch && matchesDept && matchesStatus;
    });
  }, [logs, search, branchFilter, deptFilter, statusFilter]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, branchFilter, deptFilter, statusFilter]);

  // Paginated Records
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRecords.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRecords, currentPage]);

  // Checkbox handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredRecords.map((r) => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Submit bulk timing changes
  const onSaveTimings = (_data: TimingFormInput) => {
    // In a real application, you would send this to the API
    showAlert('success', 'Roster Updated', `Shift overrides applied to ${selectedIds.length} employees.`);
    setIsModalOpen(false);
    setSelectedIds([]);
    reset();
  };

  // Status badging details
  const getStatusBadge = (status: string | undefined) => {
    switch (status) {
      case 'present':
        return 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20';
      case 'late':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
      case 'absent':
        return 'bg-red-500/10 text-red-500 border border-red-500/20';
      case 'on_leave':
      case 'leave':
      case 'half_day':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20';
      default:
        return 'bg-slate-500/10 text-slate-650 dark:text-slate-400 border border-slate-500/20';
    }
  };

  const getStatusIcon = (status: string | undefined) => {
    switch (status) {
      case 'present':
        return <CheckCircle2 className="h-3 w-3 mr-1" />;
      case 'late':
        return <AlertTriangle className="h-3 w-3 mr-1" />;
      case 'absent':
        return <XCircle className="h-3 w-3 mr-1" />;
      default:
        return <Clock className="h-3 w-3 mr-1" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Title Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-205">Attendance & Roster</h1>
        <p className="text-sm text-slate-400 mt-1">Configure timings, view compliance records and configure auto adjustments</p>
      </div>

      {/* 2. Top primary navigation tabs */}
      <div className="border-b border-slate-100 dark:border-slate-800 flex overflow-x-auto gap-4 no-scrollbar">
        {topTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTopTab(tab.id)}
            className={`pb-3 font-semibold text-xs transition-all border-b-2 whitespace-nowrap px-1 ${
              activeTopTab === tab.id
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Primary tab content container */}
      {activeTopTab === 'attendance' ? (
        <div className="space-y-6">
          {/* Sub Navigation */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-1 rounded-xl flex gap-1 w-fit">
            {subTabs.map((sub) => (
              <button
                key={sub.id}
                onClick={() => setActiveSubTab(sub.id)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeSubTab === sub.id
                    ? 'bg-white dark:bg-[#111827] text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>

          {activeSubTab === 'timings' ? (
            <div className="space-y-5">
              {/* 3. Toolbar filters */}
              <Card className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm rounded-xl">
                <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Search and Filters */}
                  <div className="flex flex-wrap items-center gap-3 flex-1">
                    <div className="relative min-w-[200px] flex-1 max-w-xs">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Search className="h-4 w-4" />
                      </span>
                      <Input
                        placeholder="Search employee..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 h-9.5 text-xs bg-slate-50/60 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 rounded-lg"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-850 px-2 py-1 rounded-lg border border-slate-100 dark:border-slate-800">
                        <Building className="h-3.5 w-3.5 text-slate-400" />
                        <select
                          className="bg-transparent text-xs font-semibold focus:outline-none border-none py-0.5 text-slate-600 dark:text-slate-350 cursor-pointer"
                          value={branchFilter}
                          onChange={(e) => setBranchFilter(e.target.value)}
                        >
                          <option value="all">All Branches</option>
                          {branches.map(b => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-850 px-2 py-1 rounded-lg border border-slate-100 dark:border-slate-800">
                        <Building className="h-3.5 w-3.5 text-slate-400" />
                        <select
                          className="bg-transparent text-xs font-semibold focus:outline-none border-none py-0.5 text-slate-600 dark:text-slate-350 cursor-pointer"
                          value={deptFilter}
                          onChange={(e) => setDeptFilter(e.target.value)}
                        >
                          <option value="all">All Depts</option>
                          {departments.map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-850 px-2 py-1 rounded-lg border border-slate-100 dark:border-slate-800">
                        <Filter className="h-3.5 w-3.5 text-slate-400" />
                        <select
                          className="bg-transparent text-xs font-semibold focus:outline-none border-none py-0.5 text-slate-600 dark:text-slate-350 cursor-pointer capitalize"
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                        >
                          <option value="all">All Status</option>
                          {statuses.map(s => (
                            <option key={s} value={s}>{s.replace('_', ' ')}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Actions right aligned */}
                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="rounded-lg text-xs h-9 text-slate-600 dark:text-slate-350 bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800">
                          Bulk Actions <ChevronDown className="ml-1 h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[180px]">
                        <DropdownMenuLabel className="text-3xs uppercase tracking-wider text-slate-400 font-bold">Manage Timings</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            if (selectedIds.length === 0) {
                              showAlert('warning', 'No selection', 'Please check at least one employee in the table.');
                              return;
                            }
                            setIsModalOpen(true);
                          }}
                          className="text-xs cursor-pointer"
                        >
                          <Clock className="mr-2 h-4 w-4 text-blue-500" /> Update Shift Timings
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs h-9">
                      <Download className="mr-1.5 h-3.5 w-3.5" /> Export XLSX
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* 4. Employee Table with Checkboxes */}
              <Card className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="text-3xs uppercase bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold">
                      <tr>
                        <th className="px-5 py-4 w-12 text-center">
                          <Checkbox
                            size="small"
                            checked={selectedIds.length > 0 && selectedIds.length === filteredRecords.length}
                            indeterminate={selectedIds.length > 0 && selectedIds.length < filteredRecords.length}
                            onChange={handleSelectAll}
                            className="p-0 text-slate-355"
                          />
                        </th>
                        <th className="px-4 py-4">Employee</th>
                        <th className="px-4 py-4">Branch & Department</th>
                        <th className="px-4 py-4">Shift Timings</th>
                        <th className="px-4 py-4">Check-In Mode</th>
                        <th className="px-4 py-4">Compliance Status</th>
                        <th className="px-4 py-4">Automation Mode</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                      {isLoading ? (
                        <tr>
                          <td colSpan={7} className="text-center py-10 text-slate-500">
                            Loading work logs...
                          </td>
                        </tr>
                      ) : filteredRecords.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-10 text-slate-500">
                            No records found.
                          </td>
                        </tr>
                      ) : (
                        paginatedRecords.map((row) => (
                          <tr
                            key={row.id}
                            className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors ${
                              selectedIds.includes(row.id) ? 'bg-blue-50/20 dark:bg-blue-950/10' : ''
                            }`}
                          >
                            <td className="px-5 py-3 text-center">
                              <Checkbox
                                size="small"
                                checked={selectedIds.includes(row.id)}
                                onChange={() => handleSelectOne(row.id)}
                                className="p-0 text-slate-355"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8.5 w-8.5">
                                  <AvatarFallback className="bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold text-[10px]">
                                    {row.staff_member?.full_name?.substring(0, 2).toUpperCase() || 'NA'}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-bold text-slate-800 dark:text-slate-205">{row.staff_member?.full_name || 'Unknown'}</p>
                                  <p className="text-[10px] text-slate-400 mt-0.5">{row.staff_member?.job_title?.title || 'Staff'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-slate-500">
                              <p className="font-semibold text-slate-700 dark:text-slate-300">{row.staff_member?.division?.title || 'Not Assigned'}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">{row.staff_member?.office_location?.name || 'Not Assigned'}</p>
                            </td>
                            <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                              <div className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5 text-slate-400" />
                                <span>{row.shift ? `${row.shift.start_time} - ${row.shift.end_time}` : 'Not Assigned'}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-slate-500 font-medium">
                              Biometric / Face App
                            </td>
                            <td className="px-4 py-3">
                              <Badge className={`${getStatusBadge(row.status)} rounded-md py-0.5 px-2 font-bold text-3xs capitalize`}>
                                <div className="flex items-center">
                                  {getStatusIcon(row.status)}
                                  <span>{row.status?.replace('_', ' ') || 'Unknown'}</span>
                                </div>
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-slate-500 font-semibold">
                              Auto-Approved
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {/* Pagination Controls */}
                {!isLoading && filteredRecords.length > 0 && (
                  <Box
                    sx={{
                      p: 3,
                      borderTop: '1px solid #F1F5F9',
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 2,
                      backgroundColor: '#FFFFFF',
                      borderBottomLeftRadius: '12px',
                      borderBottomRightRadius: '12px',
                    }}
                  >
                    <Typography variant="caption" sx={{ color: '#64748B', fontFamily: 'Inter, sans-serif' }}>
                      Showing page {currentPage} of {Math.ceil(filteredRecords.length / itemsPerPage)} ({filteredRecords.length} items)
                    </Typography>
                    <MuiPagination
                      count={Math.ceil(filteredRecords.length / itemsPerPage)}
                      page={currentPage}
                      onChange={(_, value) => setCurrentPage(value)}
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
              </Card>
            </div>
          ) : (
            <Card className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm rounded-xl">
              <CardContent className="py-12 text-center text-slate-400">
                <AlertCircle className="mx-auto h-12 w-12 stroke-[1.5] text-slate-350 mb-3" />
                <p className="font-bold text-sm">Dashboard Configuration settings</p>
                <p className="text-2xs text-slate-400 mt-0.5">Please check config settings or automate rules in later dashboard screens.</p>
              </CardContent>
            </Card>
          )}

          {/* 5. Update Timing Modal Dialog */}
          <Dialog
            open={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            maxWidth="xs"
            fullWidth
            slotProps={{
              paper: {
                className: 'rounded-2xl dark:bg-[#111827] border border-slate-100 dark:border-slate-800 p-2',
              },
            }}
          >
            <DialogTitle className="text-md font-bold dark:text-white pb-1">Update Roster & Shift Timings</DialogTitle>
            <form onSubmit={handleSubmit(onSaveTimings)}>
              <DialogContent className="space-y-4 pt-1">
                <p className="text-2xs text-slate-400 pb-2">
                  Applying update overrides for {selectedIds.length} chosen employee records.
                </p>

                {/* Shift Choice Dropdown */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Shift Timings</label>
                  <Controller
                    name="shiftChoice"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth size="small">
                        <MuiSelect {...field} className="rounded-xl text-xs dark:text-white">
                          <MenuItem value="09:00 AM - 06:00 PM">09:00 AM - 06:00 PM (Regular)</MenuItem>
                          <MenuItem value="10:00 AM - 07:00 PM">10:00 AM - 07:00 PM (Late Shift)</MenuItem>
                          <MenuItem value="08:00 AM - 05:00 PM">08:00 AM - 05:00 PM (Early Shift)</MenuItem>
                          <MenuItem value="02:00 PM - 11:00 PM">02:00 PM - 11:00 PM (Night Swapping)</MenuItem>
                        </MuiSelect>
                      </FormControl>
                    )}
                  />
                </div>

                {/* Attendance Mode Dropdown */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Attendance Check-In Mode</label>
                  <Controller
                    name="checkinMode"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth size="small">
                        <MuiSelect {...field} className="rounded-xl text-xs dark:text-white">
                          <MenuItem value="Biometric / Face App">Biometric / Face App</MenuItem>
                          <MenuItem value="Mobile GPS">Mobile GPS Tracking</MenuItem>
                          <MenuItem value="QR Scanner Checkin">QR Scanner Checkin</MenuItem>
                          <MenuItem value="Web Portal Checkin">Web Portal Checkin</MenuItem>
                        </MuiSelect>
                      </FormControl>
                    )}
                  />
                </div>

                {/* Automation Rules */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Automation Rule</label>
                  <Controller
                    name="automationRule"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth size="small">
                        <MuiSelect {...field} className="rounded-xl text-xs dark:text-white">
                          <MenuItem value="Auto-Approved">Auto-Approved (Strict)</MenuItem>
                          <MenuItem value="Manual Review">Requires Manager Manual Review</MenuItem>
                          <MenuItem value="Flexible Buffer">Flexible Timing Buffer (30m)</MenuItem>
                        </MuiSelect>
                      </FormControl>
                    )}
                  />
                </div>
              </DialogContent>

              <DialogActions className="pr-4 pb-4">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="rounded-xl text-xs font-semibold">
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-750 text-white rounded-xl text-xs font-semibold px-4">
                  Apply Roster Rules
                </Button>
              </DialogActions>
            </form>
          </Dialog>
        </div>
      ) : activeTopTab === 'overtime' ? (
        <PenaltyOvertimeDetails />
      ) : (
        <Card className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm rounded-xl">
          <CardContent className="py-16 text-center text-slate-400 space-y-3">
            <LayoutGrid className="mx-auto h-12 w-12 text-slate-350 stroke-[1.5]" />
            <h4 className="font-bold text-sm text-slate-650 dark:text-slate-350">{topTabs.find((t) => t.id === activeTopTab)?.label} Container</h4>
            <p className="text-2xs text-slate-400 mt-1 max-w-sm mx-auto">
              This section is configured via standard HRMS pipelines. Switch to Attendance Details to preview the work timings roster table.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
