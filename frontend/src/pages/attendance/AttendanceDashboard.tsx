import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Avatar,
    Pagination,
    Box,
    Skeleton,
    TextField,
    InputAdornment,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Checkbox,
    FormControlLabel,
    IconButton,
    Button,
    Typography,
    Divider,
} from "@mui/material";
import {
    Search as SearchIcon,
    FilterList as FilterListIcon,
    FileUploadOutlined as ImportIcon,
    FileDownloadOutlined as DownloadIcon,
} from "@mui/icons-material";
import { attendanceService, settingsService, staffService } from "../../services/api";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface DashboardRecord {
    id: number;
    name: string;
    phone_number: string;
    employee_id: string;
    job_title: string;
    present: number;
    absent: number;
    half_day: number;
    week_off: number;
    holiday: number;
    paid_leave: number;
    unpaid_leave: number;
    overtime_working_day: number;
    overtime_week_off: number;
    overtime_holiday: number;
    late_coming: number;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

const initials = (name: string) =>
    name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .substring(0, 2)
        .toUpperCase();

const avatarColors = [
    "#2563EB",
    "#7C3AED",
    "#DB2777",
    "#DC2626",
    "#EA580C",
    "#D97706",
    "#16A34A",
    "#0D9488",
    "#0284C7",
    "#4F46E5",
];

// ─── Main Component ────────────────────────────────────────────────────────────

export default function AttendanceDashboard() {
    const navigate = useNavigate();
    const [data, setData] = useState<DashboardRecord[]>([]);
    const [loading, setLoading] = useState(false);

    // Filters
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [branch, setBranch] = useState("");
    const [department, setDepartment] = useState("");
    const [showInactive, setShowInactive] = useState(false);
    const [dateOfJoining, setDateOfJoining] = useState("");
    const [dateOfLeaving, setDateOfLeaving] = useState("");

    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    // Filter options
    const [branchOptions, setBranchOptions] = useState<
        { id: number; title: string }[]
    >([]);
    const [deptOptions, setDeptOptions] = useState<
        { id: number; title: string }[]
    >([]);

    // Load filter options
    useEffect(() => {
        const loadOptions = async () => {
            try {
                const [brRes, deptRes] = await Promise.all([
                    settingsService.getOfficeLocations({ paginate: "false" }),
                    settingsService.getDivisions({ paginate: "false" }),
                ]);
                setBranchOptions(brRes.data?.data ?? []);
                setDeptOptions(deptRes.data?.data ?? []);
            } catch {
                /* silent */
            }
        };
        loadOptions();
    }, []);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, unknown> = {
                month,
                year,
                page,
                per_page: 15,
            };
            if (search.trim()) params.search = search.trim();
            if (branch) params.office_location_id = branch;
            if (department) params.division_id = department;
            if (showInactive) params.show_inactive = showInactive;
            if (dateOfJoining) params.date_of_joining = dateOfJoining;
            if (dateOfLeaving) params.date_of_leaving = dateOfLeaving;

            // Fetch dashboard report directly from the backend
            const res = await attendanceService.getDashboardReport(params);
            const responseData = res.data?.data;
            
            setData(responseData?.data ?? []);
            setTotalPages(responseData?.last_page ?? 1);
            setTotalRecords(responseData?.total ?? 0);
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
            setData([]);
        } finally {
            setLoading(false);
        }
    }, [
        month,
        year,
        page,
        search,
        branch,
        department,
        showInactive,
        dateOfJoining,
        dateOfLeaving,
    ]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearch(searchInput);
        setPage(1);
    };

    const resetFilters = () => {
        setMonth(new Date().getMonth() + 1);
        setYear(new Date().getFullYear());
        setSearchInput("");
        setSearch("");
        setBranch("");
        setDepartment("");
        setShowInactive(false);
        setDateOfJoining("");
        setDateOfLeaving("");
        setPage(1);
    };

    // Sticky name column styles
    const stickyHeaderSx = {
        position: "sticky" as const,
        left: 0,
        zIndex: 12,
        bgcolor: "#F8FAFC",
        borderRight: "1px solid #E2E8F0",
        minWidth: 220,
    };

    const stickyCellSx = {
        position: "sticky" as const,
        left: 0,
        zIndex: 2,
        bgcolor: "#FFFFFF",
        borderRight: "1px solid #F1F5F9",
        minWidth: 220,
    };

    // Data columns definition
    const dataColumns = [
        { key: "phone_number", label: "Phone Number", align: "left" as const },
        { key: "employee_id", label: "Employee ID", align: "left" as const },
        { key: "job_title", label: "Job Title", align: "left" as const },
        {
            key: "present",
            label: "Present",
            align: "center" as const,
            color: "#0F172A",
        },
        {
            key: "absent",
            label: "Absent",
            align: "center" as const,
            color: "#DC2626",
        },
        // {
        //     key: "half_day",
        //     label: "Half\nDay",
        //     align: "center" as const,
        //     color: "#D97706",
        // },
        {
            key: "week_off",
            label: "Week Off",
            align: "center" as const,
            color: "#64748B",
        },
        // {
        //     key: "holiday",
        //     label: "Holiday",
        //     align: "center" as const,
        //     color: "#0284C7",
        // },
        {
            key: "paid_leave",
            label: "Paid\nLeave",
            align: "center" as const,
            color: "#16A34A",
        },
        {
            key: "unpaid_leave",
            label: "Unpaid\nLeave",
            align: "center" as const,
            color: "#DC2626",
        },
        {
            key: "overtime_working_day",
            label: "Overtime On\nWorking Day",
            align: "center" as const,
            color: "#64748B",
        },
        {
            key: "overtime_week_off",
            label: "Overtime On\nWeek Off",
            align: "center" as const,
            color: "#64748B",
        },
        {
            key: "overtime_holiday",
            label: "Overtime On\nHoliday",
            align: "center" as const,
            color: "#64748B",
        },
        {
            key: "late_coming",
            label: "Late\nComing",
            align: "center" as const,
            color: "#DC2626",
        },
    ];

    const monthDisplay = new Date(year, month - 1).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
    });

    return (
        <Box sx={{ fontFamily: "Inter, sans-serif" }}>
            {/* Page header */}
            <Typography
                variant='h6'
                sx={{ fontWeight: 700, color: "#0F172A", mb: 3 }}
            >
                Attendance Dashboard
            </Typography>

            {/* Main layout: sidebar + table */}
            <Box sx={{ display: "flex", gap: 2.5, alignItems: "flex-start" }}>
                {/* ── Left Sidebar Filters ── */}
                <Paper
                    elevation={0}
                    sx={{
                        border: "1px solid #E2E8F0",
                        borderRadius: "12px",
                        width: 240,
                        flexShrink: 0,
                        display: { xs: "none", md: "block" },
                    }}
                >
                    {/* Filter header */}
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            p: 2,
                            pb: 1.5,
                        }}
                    >
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                            }}
                        >
                            <FilterListIcon
                                sx={{ fontSize: 18, color: "#2563EB" }}
                            />
                        </Box>
                        <Typography
                            onClick={resetFilters}
                            sx={{
                                fontSize: "0.8rem",
                                fontWeight: 600,
                                color: "#2563EB",
                                cursor: "pointer",
                                "&:hover": { textDecoration: "underline" },
                            }}
                        >
                            Reset
                        </Typography>
                    </Box>

                    <Box sx={{ px: 2, pb: 2.5 }}>
                        {/* Month */}
                        <Typography
                            variant='caption'
                            sx={{
                                color: "#64748B",
                                fontWeight: 600,
                                display: "block",
                                mb: 0.5,
                            }}
                        >
                            Month
                        </Typography>
                        <TextField
                            type='month'
                            size='small'
                            fullWidth
                            value={`${year}-${month.toString().padStart(2, "0")}`}
                            onChange={(e) => {
                                const [y, m] = e.target.value.split("-");
                                if (y && m) {
                                    setYear(parseInt(y));
                                    setMonth(parseInt(m));
                                    setPage(1);
                                }
                            }}
                            sx={{
                                mb: 2,
                                "& .MuiOutlinedInput-root": {
                                    borderRadius: "8px",
                                    fontSize: "0.85rem",
                                },
                            }}
                        />

                        {/* Branch */}
                        <Typography
                            variant='caption'
                            sx={{
                                color: "#64748B",
                                fontWeight: 600,
                                display: "block",
                                mb: 0.5,
                            }}
                        >
                            Select Branch
                        </Typography>
                        <FormControl size='small' fullWidth sx={{ mb: 2 }}>
                            <Select
                                displayEmpty
                                value={branch}
                                onChange={(e) => {
                                    setBranch(e.target.value);
                                    setPage(1);
                                }}
                                sx={{
                                    borderRadius: "8px",
                                    fontSize: "0.85rem",
                                }}
                            >
                                <MenuItem value=''>All Branches</MenuItem>
                                {branchOptions.map((b) => (
                                    <MenuItem key={b.id} value={String(b.id)}>
                                        {b.title}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* Department */}
                        <Typography
                            variant='caption'
                            sx={{
                                color: "#64748B",
                                fontWeight: 600,
                                display: "block",
                                mb: 0.5,
                            }}
                        >
                            Select Department
                        </Typography>
                        <FormControl size='small' fullWidth sx={{ mb: 2 }}>
                            <Select
                                displayEmpty
                                value={department}
                                onChange={(e) => {
                                    setDepartment(e.target.value);
                                    setPage(1);
                                }}
                                sx={{
                                    borderRadius: "8px",
                                    fontSize: "0.85rem",
                                }}
                            >
                                <MenuItem value=''>All Departments</MenuItem>
                                {deptOptions.map((d) => (
                                    <MenuItem key={d.id} value={String(d.id)}>
                                        {d.title}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* Date of Leaving */}
                        <Typography
                            variant='caption'
                            sx={{
                                color: "#64748B",
                                fontWeight: 600,
                                display: "block",
                                mb: 0.5,
                            }}
                        >
                            Date of Leaving
                        </Typography>
                        <TextField
                            type='date'
                            size='small'
                            fullWidth
                            value={dateOfLeaving}
                            onChange={(e) => {
                                setDateOfLeaving(e.target.value);
                                setPage(1);
                            }}
                            slotProps={{ inputLabel: { shrink: true } }}
                            sx={{
                                mb: 2,
                                "& .MuiOutlinedInput-root": {
                                    borderRadius: "8px",
                                    fontSize: "0.85rem",
                                },
                            }}
                        />

                        {/* Date of Joining */}
                        <Typography
                            variant='caption'
                            sx={{
                                color: "#64748B",
                                fontWeight: 600,
                                display: "block",
                                mb: 0.5,
                            }}
                        >
                            Date of Joining
                        </Typography>
                        <TextField
                            type='date'
                            size='small'
                            fullWidth
                            value={dateOfJoining}
                            onChange={(e) => {
                                setDateOfJoining(e.target.value);
                                setPage(1);
                            }}
                            slotProps={{ inputLabel: { shrink: true } }}
                            sx={{
                                mb: 2,
                                "& .MuiOutlinedInput-root": {
                                    borderRadius: "8px",
                                    fontSize: "0.85rem",
                                },
                            }}
                        />

                        {/* Show Inactive Staff */}
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={showInactive}
                                    onChange={(e) => {
                                        setShowInactive(e.target.checked);
                                        setPage(1);
                                    }}
                                    size='small'
                                    sx={{
                                        "&.Mui-checked": { color: "#2563EB" },
                                    }}
                                />
                            }
                            label={
                                <Typography
                                    sx={{
                                        fontSize: "0.82rem",
                                        fontWeight: 500,
                                        color: "#475569",
                                    }}
                                >
                                    Show Inactive Staff
                                </Typography>
                            }
                        />
                    </Box>
                </Paper>

                {/* ── Right: Table Panel ── */}
                <Paper
                    elevation={0}
                    sx={{
                        border: "1px solid #E2E8F0",
                        borderRadius: "12px",
                        flex: 1,
                        minWidth: 0,
                        overflow: "hidden",
                    }}
                >
                    {/* Top bar: search + actions */}
                    <Box
                        sx={{
                            p: 2,
                            display: "flex",
                            flexWrap: "wrap",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 1.5,
                            borderBottom: "1px solid #E2E8F0",
                        }}
                    >
                        <Box
                            component='form'
                            onSubmit={handleSearch}
                            sx={{ display: "flex", alignItems: "center" }}
                        >
                            <TextField
                                placeholder='Search staff by Name or Phone'
                                size='small'
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position='start'>
                                                <SearchIcon
                                                    sx={{
                                                        fontSize: 18,
                                                        color: "#94A3B8",
                                                    }}
                                                />
                                            </InputAdornment>
                                        ),
                                    },
                                }}
                                sx={{
                                    minWidth: 260,
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: "10px",
                                        fontSize: "0.85rem",
                                    },
                                }}
                            />
                        </Box>

                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1.5,
                                flexWrap: "wrap",
                            }}
                        >
                            <Typography
                                variant='caption'
                                sx={{
                                    color: "#64748B",
                                    fontWeight: 600,
                                    whiteSpace: "nowrap",
                                }}
                            >
                                Showing {totalRecords} staff
                            </Typography>
                            <Button
                                variant='outlined'
                                size='small'
                                startIcon={<ImportIcon sx={{ fontSize: 16 }} />}
                                sx={{
                                    borderRadius: "8px",
                                    textTransform: "none",
                                    fontWeight: 600,
                                    borderColor: "#2563EB",
                                    color: "#2563EB",
                                    fontSize: "0.8rem",
                                    "&:hover": {
                                        borderColor: "#1D4ED8",
                                        bgcolor: "#EFF6FF",
                                    },
                                }}
                            >
                                Import Attendance
                            </Button>
                            <Button
                                variant='contained'
                                size='small'
                                startIcon={
                                    <DownloadIcon sx={{ fontSize: 16 }} />
                                }
                                sx={{
                                    borderRadius: "8px",
                                    textTransform: "none",
                                    fontWeight: 600,
                                    bgcolor: "#2563EB",
                                    fontSize: "0.8rem",
                                    "&:hover": { bgcolor: "#1D4ED8" },
                                }}
                            >
                                Download Report
                            </Button>
                        </Box>
                    </Box>

                    {/* Table */}
                    <TableContainer
                        sx={{
                            maxHeight: "calc(100vh - 260px)",
                            overflow: "auto",
                        }}
                    >
                        <Table size='small' stickyHeader>
                            <TableHead>
                                <TableRow>
                                    {/* Sticky Name header */}
                                    <TableCell
                                        sx={{
                                            ...stickyHeaderSx,
                                            fontWeight: 700,
                                            fontSize: "0.72rem",
                                            color: "#64748B",
                                            textTransform: "uppercase",
                                            letterSpacing: "0.05em",
                                            py: 1.5,
                                            px: 2,
                                            borderBottom: "1px solid #E2E8F0",
                                        }}
                                    >
                                        Name
                                    </TableCell>
                                    {dataColumns.map((col) => (
                                        <TableCell
                                            key={col.key}
                                            align={col.align}
                                            sx={{
                                                fontWeight: 700,
                                                fontSize: "0.72rem",
                                                color: "#64748B",
                                                textTransform: "uppercase",
                                                letterSpacing: "0.05em",
                                                py: 1.5,
                                                px: 1.5,
                                                borderBottom:
                                                    "1px solid #E2E8F0",
                                                whiteSpace: "pre-line",
                                                lineHeight: 1.3,
                                                bgcolor: "#F8FAFC",
                                                minWidth:
                                                    col.align === "center"
                                                        ? 70
                                                        : 120,
                                            }}
                                        >
                                            {col.label}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? (
                                    Array.from({ length: 8 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell
                                                sx={{
                                                    ...stickyCellSx,
                                                    py: 1.5,
                                                    px: 2,
                                                }}
                                            >
                                                <Skeleton
                                                    animation='wave'
                                                    height={20}
                                                    width={160}
                                                />
                                            </TableCell>
                                            {dataColumns.map((col) => (
                                                <TableCell
                                                    key={col.key}
                                                    sx={{ py: 1.5, px: 1.5 }}
                                                >
                                                    <Skeleton
                                                        animation='wave'
                                                        height={20}
                                                        width={50}
                                                    />
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : data.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={1 + dataColumns.length}
                                            sx={{
                                                textAlign: "center",
                                                py: 8,
                                                color: "#94A3B8",
                                                fontSize: "0.9rem",
                                            }}
                                        >
                                            No attendance records found for{" "}
                                            {monthDisplay}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    data.map((record, idx) => (
                                        <TableRow
                                            key={record.id}
                                            hover
                                            sx={{
                                                "&:hover td": {
                                                    bgcolor:
                                                        "#F0F7FF !important",
                                                },
                                                "& td": {
                                                    borderBottom:
                                                        "1px solid #F1F5F9",
                                                    py: 1.5,
                                                },
                                            }}
                                        >
                                            {/* Sticky Name cell */}
                                            <TableCell
                                                sx={{ ...stickyCellSx, px: 2 }}
                                            >
                                                <Box
                                                    sx={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 1.5,
                                                    }}
                                                >
                                                    <Avatar
                                                        sx={{
                                                            width: 32,
                                                            height: 32,
                                                            fontSize: "0.72rem",
                                                            fontWeight: 700,
                                                            bgcolor:
                                                                avatarColors[
                                                                    idx %
                                                                        avatarColors.length
                                                                ],
                                                        }}
                                                    >
                                                        {initials(record.name)}
                                                    </Avatar>
                                                    <Typography
                                                        onClick={() => navigate(`/attendance/staff/${record.id}`)}
                                                        sx={{
                                                            fontWeight: 600,
                                                            fontSize: "0.82rem",
                                                            color: "#2563EB",
                                                            cursor: "pointer",
                                                            "&:hover": {
                                                                textDecoration: "underline",
                                                                color: "#1D4ED8",
                                                            }
                                                        }}
                                                    >
                                                        {record.name}
                                                    </Typography>
                                                </Box>
                                            </TableCell>

                                            {/* Data cells */}
                                            {dataColumns.map((col) => {
                                                const val = (record as any)[
                                                    col.key
                                                ];
                                                const isNumeric =
                                                    col.align === "center";
                                                return (
                                                    <TableCell
                                                        key={col.key}
                                                        align={col.align}
                                                        sx={{
                                                            px: 1.5,
                                                            fontSize: "0.82rem",
                                                            fontWeight:
                                                                isNumeric
                                                                    ? 600
                                                                    : 400,
                                                            color: isNumeric
                                                                ? col.color ||
                                                                  "#0F172A"
                                                                : "#475569",
                                                        }}
                                                    >
                                                        {val === 0 && isNumeric
                                                            ? "0"
                                                            : val ||
                                                              (isNumeric
                                                                  ? "0"
                                                                  : "—")}
                                                    </TableCell>
                                                );
                                            })}
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* Pagination */}
                    {!loading && data.length > 0 && (
                        <Box
                            sx={{
                                p: 2,
                                borderTop: "1px solid #F1F5F9",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            <Typography variant='caption' color='#64748B'>
                                Page {page} of {totalPages} ({totalRecords}{" "}
                                staff)
                            </Typography>
                            <Pagination
                                count={totalPages}
                                page={page}
                                onChange={(_, v) => setPage(v)}
                                variant='outlined'
                                shape='rounded'
                                sx={{
                                    "& .MuiPaginationItem-root": {
                                        borderRadius: "8px",
                                        fontFamily: "Inter, sans-serif",
                                        "&.Mui-selected": {
                                            bgcolor: "#2563EB",
                                            color: "#fff",
                                            border: "1px solid #2563EB",
                                            "&:hover": { bgcolor: "#1D4ED8" },
                                        },
                                    },
                                }}
                            />
                        </Box>
                    )}
                </Paper>
            </Box>
        </Box>
    );
}
