import React, { useState, useEffect } from "react";
import {
    Dialog,
    IconButton,
    Box,
    Typography,
    Button,
    Paper,
    Divider,
    CircularProgress,
    Alert,
    TextField,
    Avatar,
    Tooltip,
} from "@mui/material";
import {
    Close as CloseIcon,
    Refresh as RefreshIcon,
} from "@mui/icons-material";
import { attendanceService, workingDaysService, WorkingDayConfig } from "../../services/api";
import Swal from "sweetalert2";

interface EditAttendanceModalProps {
    open: boolean;
    onClose: () => void;
    staffMemberId: number;
    staffName: string;
    month: number;
    year: number;
    onSuccess: () => void;
}

interface DailyRecord {
    id: number;
    log_date: string;
    status:
        | "present"
        | "absent"
        // | "half_day"
        | "on_leave"
        | "paid_leave"
        | "unpaid_leave"
        | "holiday"
        | "late"
        | "week_off";
    clock_in: string | null;
    clock_out: string | null;
    late_minutes: number;
    notes?: string;
    clock_in_display?: string;
    clock_out_display?: string;
    clock_in_location?: string;
    clock_out_location?: string;
    clock_in_image?: string | null;
    clock_out_image?: string | null;
}

const STORAGE_URL = "http://127.0.0.1:8000/storage/";

interface MonthlySummary {
    present_days: number;
    absent_days: number;
    leave_days: number;
    working_days: number;
    records: DailyRecord[];
    leaves: any[];
    message?: string;
    date_of_joining?: string;
    shift?: {
        id: number;
        name: string;
        start_time: string;
        end_time: string;
    };
}

export default function EditAttendanceModal({
    open,
    onClose,
    staffMemberId,
    staffName,
    month,
    year,
    onSuccess,
}: EditAttendanceModalProps) {
    const [loading, setLoading] = useState(false);
    const [summary, setSummary] = useState<MonthlySummary | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<number | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [workingDaysConfigs, setWorkingDaysConfigs] = useState<WorkingDayConfig[]>([]);

    // Nested Punch Modal State
    const [punchModalOpen, setPunchModalOpen] = useState(false);
    const [clockInTime, setClockInTime] = useState("");
    const [clockOutTime, setClockOutTime] = useState("");
    const [note, setNote] = useState("");

    const fetchMonthlyData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [res, configsRes] = await Promise.all([
                attendanceService.getMonthlyAttendance(staffMemberId, { month, year }),
                workingDaysService.getAll({ paginate: 0 }).catch(() => null)
            ]);
            
            if (res.data?.success) {
                setSummary(res.data.data);
                if (selectedDate === null) setSelectedDate(1);
            } else {
                setError("Failed to load data.");
            }

            if (configsRes && configsRes.data?.success) {
                setWorkingDaysConfigs(configsRes.data.data);
            }
        } catch (err: any) {
            setError(err?.response?.data?.message || "Failed to load data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            setSelectedDate(null);
            fetchMonthlyData();
        }
    }, [open, staffMemberId, month, year]);

    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
    const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const emptyCells = Array.from({ length: firstDayOfMonth }, (_, i) => i);

    const getStatusForDay = (day: number) => {
        if (!summary) return null;
        const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const dateObj = new Date(year, month - 1, day);
        const today = new Date();
        const isToday = dateObj.toDateString() === today.toDateString();
        
        const record = summary.records.find((r) => r.log_date.startsWith(dateStr));
        
        // Priority 1 - Holiday
        if (record?.status === "holiday") return { status: "holiday", record };

        // Priority 2 - Approved Leave
        const leave = summary.leaves.find((l) => {
            const start = new Date(l.start_date);
            start.setHours(0,0,0,0);
            const end = new Date(l.end_date);
            end.setHours(23,59,59,999);
            return dateObj >= start && dateObj <= end;
        });
        if (leave) {
            return { 
                status: leave.category?.is_paid ? "paid_leave" : "unpaid_leave",
                record 
            };
        }
        // Manual Leave assignments by HR
        if (record?.status === "on_leave" || record?.status === "paid_leave" || record?.status === "unpaid_leave") {
            return { status: record.status, record };
        }

        // Priority 3 - Weekly Off
        let isWorkingDay = true;
        if (workingDaysConfigs.length > 0) {
            const config = workingDaysConfigs.find(c => {
               const from = c.from_date ? new Date(c.from_date) : null;
               const to = c.to_date ? new Date(c.to_date) : null;
               if (from && dateObj < from) return false;
               if (to && dateObj > to) return false;
               return true;
            });
            
            if (config) {
                const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                const dayName = days[dateObj.getDay()];
                isWorkingDay = config[dayName as keyof typeof config] as boolean;
            } else {
                isWorkingDay = dateObj.getDay() !== 0 && dateObj.getDay() !== 6;
            }
        } else {
            isWorkingDay = dateObj.getDay() !== 0 && dateObj.getDay() !== 6;
        }
        
        if (!isWorkingDay) {
            return { status: "week_off", record };
        }
        if (record?.status === "week_off") return { status: "week_off", record };

        // Priority 9 - Future Dates (return blank)
        if (dateObj > today) return null;

        // Priority 4 - Trust Backend Status
        if (record && record.status) {
            return { status: record.status, record };
        }

        // Priority 5 - Absent (if no record exists on a working day)
        if (isWorkingDay) {
            return { status: "absent", record: null };
        }

        return { status: "week_off", record: null };

    };

    const handleUpdateStatus = async (status: string, customNote?: string) => {
        if (!selectedDate || !summary) return;
        setActionLoading(true);

        const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(selectedDate).padStart(2, "0")}`;
        const existingRecord = summary.records.find((r) =>
            r.log_date.startsWith(dateStr),
        );

        if (status === "present" && existingRecord) {
            if (existingRecord.clock_in && !existingRecord.clock_out) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Missing Punch Out',
                    text: "Cannot mark as Present without a Punch Out time. Please use '+ ADD / EDIT PUNCH' to add a Punch Out time first."
                });
                setActionLoading(false);
                return;
            }
        }

        try {
            if (status === "clear") {
                // CLEAR STATUS: update the existing row — never delete it
                if (existingRecord) {
                    await attendanceService.clearWorkLogStatus(existingRecord.id);
                }
                // If no record exists, nothing to clear — just refresh
            } else if (existingRecord) {
                // Record already exists for this date → UPDATE in place, never delete/recreate
                await attendanceService.updateWorkLog(existingRecord.id, {
                    status: status,
                    notes: customNote !== undefined ? customNote : note,
                });
            } else {
                // No record for this date yet → CREATE one
                const payload = {
                    staff_member_id: staffMemberId,
                    log_date: dateStr,
                    status: status,
                    notes: customNote !== undefined ? customNote : note,
                };
                await attendanceService.createWorkLog(payload);
            }

            setPunchModalOpen(false);
            await fetchMonthlyData();
            onSuccess();
        } catch (err: any) {
            console.error(err);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: "Failed to update status."
            });
        } finally {
            setActionLoading(false);
        }
    };

    const handleSavePunch = async () => {
        if (!selectedDate || !summary) return;
        setActionLoading(true);

        const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(selectedDate).padStart(2, "0")}`;
        const existingRecord = summary.records.find((r) =>
            r.log_date.startsWith(dateStr),
        );

        try {
            const payload = {
                staff_member_id: staffMemberId,
                log_date: dateStr,
                status: clockInTime ? (clockOutTime ? "present" : "in") : "absent",
                clock_in: clockInTime || null,
                clock_out: clockOutTime || null,
                notes: note,
            };
            
            if (existingRecord) {
                await attendanceService.updateWorkLog(existingRecord.id, payload);
            } else {
                await attendanceService.createWorkLog(payload);
            }

            setPunchModalOpen(false);
            await fetchMonthlyData();
            onSuccess();
        } catch (err: any) {
            console.error(err);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: "Failed to save punch."
            });
        } finally {
            setActionLoading(false);
        }
    };

    const handleOpenPunchModal = () => {
        if (selectedDate && summary) {
            const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(selectedDate).padStart(2, "0")}`;
            const existingRecord = summary.records.find((r) =>
                r.log_date.startsWith(dateStr),
            );
            if (existingRecord) {
                setClockInTime(
                    existingRecord.clock_in
                        ? existingRecord.clock_in.substring(0, 5)
                        : "",
                );
                setClockOutTime(
                    existingRecord.clock_out
                        ? existingRecord.clock_out.substring(0, 5)
                        : "",
                );
                setNote(existingRecord.notes || "");
            } else {
                setClockInTime("");
                setClockOutTime("");
                setNote("");
            }
            setPunchModalOpen(true);
        }
    };

    // Update form when date changes
    useEffect(() => {
        setPunchModalOpen(false);
        if (selectedDate && summary) {
            const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(selectedDate).padStart(2, "0")}`;
            const record = summary.records.find((r) => r.log_date === dateStr);
            setNote(record?.notes || "");
        } else {
            setNote("");
        }
    }, [selectedDate, summary, month, year]);

    const selectedRecord = selectedDate ? getStatusForDay(selectedDate) : null;

    const getFormattedSelectedDate = () => {
        if (!selectedDate) return "";
        const d = new Date(year, month - 1, selectedDate);
        const day = d.getDate();
        const suffix =
            ["th", "st", "nd", "rd"][
                day % 10 > 3
                    ? 0
                    : (day % 100) - (day % 10) !== 10
                      ? day % 10
                      : 0
            ] || "th";
        const monthName = d.toLocaleString("en-US", { month: "long" });
        return `${day}${suffix} ${monthName}`;
    };

    const isFutureDate = (day: number) => {
        const d = new Date(year, month - 1, day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return d > today;
    };

    const isBeforeJoiningDate = (day: number) => {
        if (!summary?.date_of_joining) return false;
        const doj = new Date(summary.date_of_joining);
        doj.setHours(0, 0, 0, 0);
        const currentDate = new Date(year, month - 1, day);
        return currentDate < doj;
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case "present": return "Present";
            case "in": return "🟢 IN";
            case "not_punched_out": return "⚠️ Not Punched Out";
            case "absent": return "Absent";
            // case "half_day": return "Half Day";
            case "paid_leave": return "Paid Leave";
            case "unpaid_leave": return "Unpaid Leave";
            case "on_leave": return "Leave";
            case "holiday": return "Holiday";
            case "week_off": return "Week Off";
            default: return "";
        }
    };

    const colors = {
        beforeJoining: {
            bg: "#F1F5F9",
            text: "#94A3B8",
            lightBg: "#F8FAFC",
            border: "#E2E8F0",
        },
        present: {
            bg: "#22C55E",
            text: "#fff",
            lightBg: "#ECFDF5",
            border: "#22C55E",
        },
        in: {
            bg: "#86EFAC",
            text: "#0F172A",
            lightBg: "#ECFDF5",
            border: "#86EFAC",
        },
        not_punched_out: {
            bg: "#F97316", // Orange 500
            text: "#fff",
            lightBg: "#FFF7ED", // Orange 50
            border: "#FDBA74", // Orange 300
        },
        absent: {
            bg: "#EF4444",
            text: "#fff",
            lightBg: "#FEF2F2",
            border: "#EF4444",
        },
        // halfDay: {
        //     bg: "#F59E0B",
        //     text: "#fff",
        //     lightBg: "#FFFBEB",
        //     border: "#F59E0B",
        // },
        paidLeave: {
            bg: "#D946EF",
            text: "#fff",
            lightBg: "#FDF4FF",
            border: "#D946EF",
        },
        unpaidLeave: {
            bg: "#0EA5E9",
            text: "#fff",
            lightBg: "#F0F9FF",
            border: "#0EA5E9",
        },
        weekOff: {
            bg: "#9CA3AF",
            text: "#fff",
            lightBg: "#F3F4F6",
            border: "#9CA3AF",
        },
        holiday: {
            bg: "#9CA3AF",
            text: "#fff",
            lightBg: "#F3F4F6",
            border: "#9CA3AF",
        },
        default: {
            bg: "#E2E8F0",
            text: "#9CA3AF",
            lightBg: "#FFFFFF",
            border: "#E2E8F0",
        },
        clearStatus: {
            bg: "#323233ff",
            text: "#000000",
            lightBg: "#3f3e3eff",
            border: "#1d1d1dff",
        },
    };

    const getDayStyle = (day: number) => {
        if (isBeforeJoiningDate(day)) {
            return colors.beforeJoining;
        }
        
        const stat = getStatusForDay(day) as any;
        if (isFutureDate(day) && !stat?.status) {
            return colors.default;
        }
        switch (stat?.status) {
            case "present":
            case "late":
                return colors.present;
            case "in":
                return colors.in;
            case "not_punched_out":
                return colors.not_punched_out;
            case "absent":
                return colors.absent;
            // case "half_day":
            //     return colors.halfDay;
            case "on_leave": {
                const notes = (stat?.record?.notes || stat?.notes || "").toLowerCase();
                if (notes.includes("unpaid")) {
                    return colors.unpaidLeave;
                }
                return colors.paidLeave;
            }
            case "paid_leave":
                return colors.paidLeave;
            case "unpaid_leave":
                return colors.unpaidLeave;
            case "week_off":
                return colors.weekOff;
            case "holiday":
                return colors.holiday;
            default:
                return {
                    bg: "#fff",
                    text: "#0F172A",
                    lightBg: "#fff",
                    border: "#E2E8F0",
                };
        }
    };

    const SummaryCard = ({
        title,
        count,
        colorTheme,
    }: {
        title: string;
        count: string | number;
        colorTheme: any;
    }) => (
        <Paper
            elevation={0}
            sx={{
                bgcolor: colorTheme.lightBg,
                borderLeft: `4px solid ${colorTheme.border}`,
                p: 1.5,
                minWidth: "100px",
                flex: "1 1 auto",
                borderRadius: "4px",
            }}
        >
            <Typography variant='body2' sx={{ color: "#64748B", mb: 0.5 }}>
                {title}
            </Typography>
            <Typography variant='h5' sx={{ color: "#0F172A", fontWeight: 600 }}>
                {count}
            </Typography>
        </Paper>
    );

    const ActionButton = ({
        label,
        statusValue,
        colorTheme,
        onClick,
        customSelected,
    }: {
        label: string;
        statusValue: string;
        colorTheme: any;
        onClick: () => void;
        customSelected?: boolean;
    }) => {
        const isSelected =
            customSelected !== undefined
                ? customSelected
                : selectedRecord?.status === statusValue;
        const isDisabled = actionLoading;

        return (
            <Button
                variant={isSelected ? "contained" : "outlined"}
                onClick={onClick}
                disabled={isDisabled}
                sx={{
                    borderRadius: "20px",
                    textTransform: "uppercase",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    px: 2,
                    py: 0.5,
                    bgcolor: isSelected ? colorTheme.bg : "transparent",
                    color: isSelected ? colorTheme.text : colorTheme.border,
                    borderColor: colorTheme.border,
                    "&:hover": {
                        bgcolor: isSelected
                            ? colorTheme.bg
                            : `${colorTheme.border}1A`,
                        borderColor: colorTheme.border,
                    },
                    boxShadow: "none",
                }}
            >
                {label}
            </Button>
        );
    };

    const calculatedSummary = calendarDays.reduce((acc, day) => {
        const stat = getStatusForDay(day) as any;
        if (stat?.status) {
            acc[stat.status] = (acc[stat.status] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth='lg'
            fullWidth
            sx={{ "& .MuiDialog-paper": { borderRadius: "8px" } }}
        >
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                    minHeight: "650px",
                }}
            >
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        p: 2,
                        borderBottom: "1px solid #E2E8F0",
                    }}
                >
                    <Typography
                        variant='h6'
                        sx={{ fontWeight: 600, color: "#0F172A" }}
                    >
                        Edit Attendance : {staffName}
                    </Typography>
                    <IconButton onClick={onClose} size='small'>
                        <CloseIcon />
                    </IconButton>
                </Box>

                <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
                    {loading && !summary ? (
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                width: "100%",
                            }}
                        >
                            <CircularProgress />
                        </Box>
                    ) : error ? (
                        <Box sx={{ p: 3, width: "100%" }}>
                            <Alert severity='error'>{error}</Alert>
                        </Box>
                    ) : !summary?.date_of_joining ? (
                        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%", p: 4, height: "100%", minHeight: "400px" }}>
                            <Alert severity="warning" sx={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                                    Missing Date of Joining
                                </Typography>
                                <Typography variant="body2">
                                    Please add a Date of Joining for this staff member in their profile to view and manage their attendance records.
                                </Typography>
                            </Alert>
                        </Box>
                    ) : summary?.message ? (
                        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%", p: 4, height: "100%", minHeight: "400px" }}>
                            <Typography variant="h6" sx={{ color: "#64748B", textAlign: "center" }}>
                                {summary.message}
                            </Typography>
                        </Box>
                    ) : (
                        <>
                            {/* Left Side */}
                            <Box
                                sx={{
                                    flex: 1.4,
                                    p: 3,
                                    borderRight: "1px solid #E2E8F0",
                                    overflowY: "auto",
                                }}
                            >
                                {/* Summary Wrap */}
                                <Box
                                    sx={{
                                        display: "grid",
                                        gridTemplateColumns: "repeat(3, 1fr)",
                                        gap: 2,
                                        mb: 4,
                                    }}
                                >
                                    <SummaryCard
                                        title='Present'
                                        count={calculatedSummary["present"] || 0}
                                        colorTheme={colors.present}
                                    />
                                    <SummaryCard
                                        title='IN'
                                        count={calculatedSummary["in"] || 0}
                                        colorTheme={colors.in}
                                    />
                                    <SummaryCard
                                        title='Not Punched Out'
                                        count={calculatedSummary["not_punched_out"] || 0}
                                        colorTheme={colors.not_punched_out}
                                    />
                                    <SummaryCard
                                        title='Absent'
                                        count={calculatedSummary["absent"] || 0}
                                        colorTheme={colors.absent}
                                    />
                                    {/* <SummaryCard
                                        title='Half day'
                                        count={calculatedSummary["half_day"] || 0}
                                        colorTheme={colors.halfDay}
                                    /> */}
                                    <SummaryCard
                                        title='Paid Leave'
                                        count={(calculatedSummary["paid_leave"] || 0) + (calculatedSummary["on_leave"] || 0)}
                                        colorTheme={colors.paidLeave}
                                    />
                                    <SummaryCard
                                        title='Week Off'
                                        count={calculatedSummary["week_off"] || 0}
                                        colorTheme={colors.weekOff}
                                    />
                                </Box>

                                {/* Calendar CSS Grid */}
                                <Box
                                    sx={{ maxWidth: "400px", margin: "0 auto" }}
                                >
                                    <Box
                                        sx={{
                                            display: "grid",
                                            gridTemplateColumns:
                                                "repeat(7, 1fr)",
                                            gap: 1,
                                            mb: 1,
                                        }}
                                    >
                                        {[
                                            "Sun",
                                            "Mon",
                                            "Tue",
                                            "Wed",
                                            "Thu",
                                            "Fri",
                                            "Sat",
                                        ].map((day) => (
                                            <Typography
                                                key={day}
                                                variant='caption'
                                                sx={{
                                                    color: "#64748B",
                                                    fontWeight: 600,
                                                    textAlign: "center",
                                                    fontSize: "0.75rem",
                                                }}
                                            >
                                                {day}
                                            </Typography>
                                        ))}
                                    </Box>

                                    <Box
                                        sx={{
                                            display: "grid",
                                            gridTemplateColumns:
                                                "repeat(7, 1fr)",
                                            gap: 1,
                                        }}
                                    >
                                        {emptyCells.map((i) => (
                                            <Box key={`empty-${i}`} />
                                        ))}
                                        {calendarDays.map((day) => {
                                            const statObj = getStatusForDay(
                                                day,
                                            ) as any;
                                            const style = getDayStyle(day);
                                            const isSelected =
                                                selectedDate === day;

                                            const isBeforeDoj = isBeforeJoiningDate(day);

                                            const dayBox = (
                                                <Box
                                                    key={day}
                                                    onClick={() => {
                                                        if (!isBeforeDoj) setSelectedDate(day);
                                                    }}
                                                    sx={{
                                                        aspectRatio: "1",
                                                        bgcolor: style.bg,
                                                        color: style.text,
                                                        borderRadius: "8px",
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        alignItems: "center",
                                                        justifyContent:
                                                            "center",
                                                        cursor: isBeforeDoj ? "not-allowed" : "pointer",
                                                        border: isSelected
                                                            ? "2px solid #0F172A"
                                                            : `1px solid ${style.bg === "#fff" ? "#E2E8F0" : style.bg}`,
                                                        position: "relative",
                                                        boxShadow: isSelected
                                                            ? "0 0 0 2px #fff inset"
                                                            : "none",
                                                        "&:hover": {
                                                            opacity: isBeforeDoj ? 1 : 0.8,
                                                        },
                                                    }}
                                                >
                                                    <Typography
                                                        variant='body2'
                                                        sx={{
                                                            fontWeight: 700,
                                                            fontSize: "0.9rem",
                                                        }}
                                                    >
                                                        {String(day).padStart(
                                                            2,
                                                            "0",
                                                        )}
                                                    </Typography>

                                                    {statObj?.status && !(statObj.status === "present" && (statObj?.record?.late_minutes > 0 || statObj?.late_minutes > 0)) && (
                                                        <Typography
                                                            variant='caption'
                                                            sx={{
                                                                fontSize: "0.45rem",
                                                                fontWeight: 600,
                                                                lineHeight: 1.1,
                                                                textAlign: "center",
                                                                px: 0.5,
                                                                mt: 0.2
                                                            }}
                                                        >
                                                            {isBeforeDoj ? "Before Joining" : getStatusLabel(statObj.status).replace("🔴 ", "").replace("🟢 ", "")}
                                                        </Typography>
                                                    )}

                                                    {(statObj?.record?.late_minutes > 0 || statObj?.late_minutes > 0) && (
                                                        <Typography
                                                            variant='caption'
                                                            sx={{
                                                                fontSize:
                                                                    "0.5rem",
                                                                fontWeight: 800,
                                                                letterSpacing:
                                                                    "0.5px",
                                                                position:
                                                                    "absolute",
                                                                bottom: 2,
                                                            }}
                                                        >
                                                            LATE
                                                        </Typography>
                                                    )}
                                                </Box>
                                            );

                                            return isBeforeDoj ? (
                                                <Tooltip title="Before Joining" key={day} arrow placement="top">
                                                    {dayBox}
                                                </Tooltip>
                                            ) : dayBox;
                                        })}
                                    </Box>
                                </Box>

                                {/* Mark All Absent as Present removed as requested */}
                            </Box>

                            {/* Right Side */}
                            <Box
                                sx={{
                                    flex: 1,
                                    p: 3,
                                    display: "flex",
                                    flexDirection: "column",
                                    overflowY: "hidden",
                                }}
                            >
                                {!selectedDate ? (
                                    <Box
                                        sx={{
                                            display: "flex",
                                            height: "100%",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        <Typography color='text.secondary'>
                                            Select a date from the calendar
                                        </Typography>
                                    </Box>
                                ) : (
                                    <>
                                        <Box
                                            sx={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                mb: 2,
                                            }}
                                        >
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                                <Typography
                                                    variant='subtitle1'
                                                    sx={{
                                                        fontWeight: 700,
                                                        color: "#0F172A",
                                                    }}
                                                >
                                                    {getFormattedSelectedDate()}
                                                </Typography>
                                                {selectedRecord?.status && (
                                                    <span style={{
                                                        padding: "2px 8px",
                                                        borderRadius: "12px",
                                                        fontSize: "0.75rem",
                                                        fontWeight: 600,
                                                        backgroundColor: getDayStyle(selectedDate as number).lightBg,
                                                        color: getDayStyle(selectedDate as number).bg === "#fff" ? "#475569" : getDayStyle(selectedDate as number).bg
                                                    }}>
                                                        {getStatusLabel(selectedRecord.status)}
                                                    </span>
                                                )}
                                            </Box>
                                            <IconButton
                                                size='small'
                                                onClick={fetchMonthlyData}
                                                disabled={actionLoading}
                                            >
                                                <RefreshIcon
                                                    fontSize='small'
                                                    sx={{ color: "#64748B" }}
                                                />
                                            </IconButton>
                                        </Box>

                                        <Box
                                            sx={{
                                                display: "flex",
                                                gap: 1.5,
                                                mb: 1,
                                                flexWrap: "wrap",
                                            }}
                                        >
                                            <ActionButton
                                                label='ABSENT'
                                                statusValue='absent'
                                                colorTheme={colors.absent}
                                                onClick={() =>
                                                    handleUpdateStatus("absent")
                                                }
                                            />
                                            {/* <ActionButton
                                                label='HALF DAY'
                                                statusValue='half_day'
                                                colorTheme={colors.halfDay}
                                                onClick={() =>
                                                    handleUpdateStatus(
                                                        "half_day",
                                                    )
                                                }
                                            /> */}
                                            <ActionButton
                                                label='PRESENT'
                                                statusValue='present'
                                                colorTheme={colors.present}
                                                onClick={() =>
                                                    handleUpdateStatus(
                                                        "present",
                                                    )
                                                }
                                            />
                                        </Box>



                                        <Divider sx={{ mb: 2 }} />

                                        <Typography
                                            variant='body2'
                                            sx={{
                                                fontWeight: 700,
                                                color: "#0F172A",
                                                mb: 1,
                                            }}
                                        >
                                            Leaves
                                        </Typography>
                                        {(() => {
                                            const isPaidLeave =
                                                selectedRecord?.status ===
                                                    "on_leave" &&
                                                !(selectedRecord as any)?.notes
                                                    ?.toLowerCase()
                                                    .includes("unpaid");
                                            const isUnpaidLeave =
                                                selectedRecord?.status ===
                                                    "on_leave" &&
                                                !!(selectedRecord as any)?.notes
                                                    ?.toLowerCase()
                                                    .includes("unpaid");
                                            return (
                                                <>
                                                    <Box
                                                        sx={{
                                                            display: "flex",
                                                            gap: 1.5,
                                                            mb: 2,
                                                            flexWrap: "wrap",
                                                        }}
                                                    >
                                                        <ActionButton
                                                            label='PAID LEAVE'
                                                            statusValue='on_leave'
                                                            customSelected={
                                                                isPaidLeave
                                                            }
                                                            colorTheme={
                                                                colors.paidLeave
                                                            }
                                                            onClick={() =>
                                                                handleUpdateStatus(
                                                                    "on_leave",
                                                                    "Approved Paid Leave",
                                                                )
                                                            }
                                                        />
                                                        <ActionButton
                                                            label='UNPAID LEAVE'
                                                            statusValue='on_leave'
                                                            customSelected={
                                                                isUnpaidLeave
                                                            }
                                                            colorTheme={
                                                                colors.unpaidLeave
                                                            }
                                                            onClick={() =>
                                                                handleUpdateStatus(
                                                                    "on_leave",
                                                                    "Approved Unpaid Leave",
                                                                )
                                                            }
                                                        />
                                                    </Box>
                                                </>
                                            );
                                        })()}

                                        <Divider sx={{ mb: 2 }} />

                                        {(selectedRecord?.record as any)?.clock_in && (
                                            <Box sx={{ mb: 1.5 }}>
                                                <Box
                                                    sx={{
                                                        display: "flex",
                                                        gap: 2,
                                                        mb: 1.5,
                                                    }}
                                                >
                                                    {(selectedRecord?.record as any)
                                                        .clock_in_image ? (
                                                        <Avatar
                                                            src={`${STORAGE_URL}${(selectedRecord?.record as any).clock_in_image}`}
                                                            sx={{
                                                                width: 40,
                                                                height: 40,
                                                            }}
                                                        />
                                                    ) : (
                                                        <Avatar
                                                            src='/default-avatar.png'
                                                            sx={{
                                                                width: 40,
                                                                height: 40,
                                                            }}
                                                        />
                                                    )}
                                                    <Box>
                                                        <Typography
                                                            variant='body2'
                                                            sx={{
                                                                fontWeight: 600,
                                                                color: "#0F172A",
                                                            }}
                                                        >
                                                            {(
                                                                selectedRecord?.record as any
                                                            )
                                                                .clock_in_display ||
                                                                (
                                                                    selectedRecord?.record as any
                                                                ).clock_in}{" "}
                                                            <span
                                                                style={{
                                                                    color: "#22C55E",
                                                                    fontWeight: 600,
                                                                    marginLeft: "4px"
                                                                }}
                                                            >
                                                                In
                                                            </span>
                                                        </Typography>
                                                        <Typography
                                                            variant='caption'
                                                            sx={{
                                                                color: "#64748B",
                                                                display:
                                                                    "block",
                                                                mt: 0.5,
                                                                lineHeight: 1.4,
                                                                whiteSpace:
                                                                    "pre-line",
                                                            }}
                                                        >
                                                            📍{" "}
                                                            {(
                                                                selectedRecord?.record as any
                                                            )
                                                                .clock_in_location ||
                                                                (
                                                                    selectedRecord?.record as any
                                                                )
                                                                    .clock_in_address ||
                                                                "Location unavailable"}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                                {(selectedRecord?.record as any)?.clock_out && (selectedRecord?.record as any)?.clock_out !== "00:00:00" ? (
                                                    <Box
                                                        sx={{
                                                            display: "flex",
                                                            gap: 2,
                                                        }}
                                                    >
                                                        {(selectedRecord?.record as any)
                                                            .clock_out_image ? (
                                                            <Avatar
                                                                src={`${STORAGE_URL}${(selectedRecord?.record as any).clock_out_image}`}
                                                                sx={{
                                                                    width: 40,
                                                                    height: 40,
                                                                }}
                                                            />
                                                        ) : (
                                                            <Avatar
                                                                src='/default-avatar.png'
                                                                sx={{
                                                                    width: 40,
                                                                    height: 40,
                                                                }}
                                                            />
                                                        )}
                                                        <Box>
                                                            <Typography
                                                                variant='body2'
                                                                sx={{
                                                                    fontWeight: 600,
                                                                    color: "#0F172A",
                                                                }}
                                                            >
                                                                {(
                                                                    selectedRecord?.record as any
                                                                )
                                                                    .clock_out_display ||
                                                                    (
                                                                        selectedRecord?.record as any
                                                                    )
                                                                        .clock_out}{" "}
                                                                <span
                                                                    style={{
                                                                        color: "#EF4444",
                                                                        fontWeight: 600,
                                                                        marginLeft: "4px"
                                                                    }}
                                                                >
                                                                    Out
                                                                </span>
                                                            </Typography>
                                                            <Typography
                                                                variant='caption'
                                                                sx={{
                                                                    color: "#64748B",
                                                                    display:
                                                                        "block",
                                                                    mt: 0.5,
                                                                    lineHeight: 1.4,
                                                                    whiteSpace:
                                                                        "pre-line",
                                                                }}
                                                            >
                                                                📍{" "}
                                                                {(
                                                                    selectedRecord?.record as any
                                                                )
                                                                    .clock_out_location ||
                                                                    (
                                                                        selectedRecord?.record as any
                                                                    )
                                                                        .clock_out_address ||
                                                                "Location unavailable"}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                ) : selectedRecord?.status === "not_punched_out" ? (
                                                    <Box sx={{ display: "flex", gap: 2, alignItems: "center", mt: 1 }}>
                                                        <Avatar sx={{ width: 40, height: 40, bgcolor: "#FFF7ED", color: "#F97316", fontWeight: "bold" }}>
                                                            !
                                                        </Avatar>
                                                        <Typography variant="body2" sx={{ color: "#F97316", fontWeight: 600 }}>
                                                            In but not out
                                                        </Typography>
                                                    </Box>
                                                ) : null}
                                            </Box>
                                        )}

                                        <Box
                                            sx={{
                                                pt: 2,
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: 1.5,
                                            }}
                                        >
                                            <Box>
                                                <Typography
                                                    variant='body2'
                                                    onClick={
                                                        handleOpenPunchModal
                                                    }
                                                    sx={{
                                                        fontWeight: 700,
                                                        color: "#0284C7",
                                                        cursor: "pointer",
                                                        display: "inline-block",
                                                    }}
                                                >
                                                    + ADD / EDIT PUNCH
                                                </Typography>
                                            </Box>
                                            <TextField
                                                fullWidth
                                                size='small'
                                                multiline
                                                rows={2}
                                                placeholder='Add Note'
                                                value={note}
                                                disabled={actionLoading}
                                                onChange={(e) =>
                                                    setNote(e.target.value)
                                                }
                                                sx={{
                                                    "& .MuiOutlinedInput-root":
                                                        {
                                                            borderRadius: 1,
                                                            bgcolor: "#FAFAFA",
                                                        },
                                                }}
                                            />
                                        </Box>
                                    </>
                                )}
                            </Box>
                        </>
                    )}
                </Box>
            </Box>

            {/* Nested Punch Modal */}
            <Dialog
                open={punchModalOpen}
                onClose={() => setPunchModalOpen(false)}
                maxWidth='xs'
                fullWidth
                sx={{ "& .MuiDialog-paper": { borderRadius: "8px", p: 1 } }}
            >
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        p: 2,
                        borderBottom: "1px solid #E2E8F0",
                        mb: 2,
                    }}
                >
                    <Typography
                        variant='subtitle1'
                        sx={{ fontWeight: 600, color: "#0F172A" }}
                    >
                        {getFormattedSelectedDate()} - Punch Update
                    </Typography>
                    <IconButton
                        onClick={() => setPunchModalOpen(false)}
                        size='small'
                    >
                        <CloseIcon />
                    </IconButton>
                </Box>

                <Box
                    sx={{
                        px: 3,
                        pb: 3,
                        display: "flex",
                        flexDirection: "column",
                        gap: 3,
                    }}
                >
                    <Box sx={{ display: "flex", gap: 2 }}>
                        <Box sx={{ flex: 1 }}>
                            <Typography
                                variant='caption'
                                sx={{
                                    fontWeight: 600,
                                    color: "#64748B",
                                    mb: 0.5,
                                    display: "block",
                                }}
                            >
                                Punch In
                            </Typography>
                            <TextField
                                variant='outlined'
                                type='time'
                                size='small'
                                fullWidth
                                value={clockInTime}
                                onChange={(e) => setClockInTime(e.target.value)}
                            />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <Typography
                                variant='caption'
                                sx={{
                                    fontWeight: 600,
                                    color: "#64748B",
                                    mb: 0.5,
                                    display: "block",
                                }}
                            >
                                Punch Out
                            </Typography>
                            <TextField
                                variant='outlined'
                                type='time'
                                size='small'
                                fullWidth
                                value={clockOutTime}
                                onChange={(e) =>
                                    setClockOutTime(e.target.value)
                                }
                            />
                        </Box>
                    </Box>
                    <Box
                        sx={{
                            display: "flex",
                            gap: 2,
                            justifyContent: "flex-end",
                            mt: 1,
                        }}
                    >
                        <Button
                            onClick={() => setPunchModalOpen(false)}
                            disabled={actionLoading}
                            sx={{ color: "#64748B", fontWeight: 600 }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant='contained'
                            color='primary'
                            onClick={handleSavePunch}
                            disabled={actionLoading}
                            sx={{ borderRadius: "6px", px: 3, fontWeight: 600 }}
                        >
                            Save Punch
                        </Button>
                    </Box>
                </Box>
            </Dialog>
        </Dialog>
    );
}
