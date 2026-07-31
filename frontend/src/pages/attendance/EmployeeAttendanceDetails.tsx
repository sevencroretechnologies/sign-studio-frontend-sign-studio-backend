import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Box,
    Typography,
    Button,
    Avatar,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    CircularProgress,
    Alert,
} from "@mui/material";
import {
    ArrowBack as ArrowBackIcon,
    FileDownloadOutlined as DownloadIcon,
} from "@mui/icons-material";
import { attendanceService } from "../../services/api";
import EditAttendanceModal from "./EditAttendanceModal";

interface MonthlyHistoryRecord {
    month_name: string;
    month: number;
    year: number;
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
    early_leaving: number;
}

interface StaffInfo {
    id: number;
    name: string;
    initials: string;
    date_of_joining?: string;
}

const EmployeeAttendanceDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [staff, setStaff] = useState<StaffInfo | null>(null);
    const [history, setHistory] = useState<MonthlyHistoryRecord[]>([]);
    const [showAll, setShowAll] = useState<boolean>(false);
    
    // Modal state
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

    const fetchHistory = async () => {
            if (!id) return;
            setLoading(true);
            setError(null);
            try {
                const response = await attendanceService.getStaffHistoricalAttendance(parseInt(id), { months: 12 });
                if (response.data?.success) {
                    setStaff(response.data.data.staff);
                    setHistory(response.data.data.history);
                } else {
                    setError(response.data?.message || "Failed to load historical data.");
                }
            } catch (err: any) {
                console.error("Error fetching historical attendance:", err);
                setError(err?.response?.data?.message || "Failed to load historical data.");
            } finally {
                setLoading(false);
            }
        };

    useEffect(() => {
        fetchHistory();
    }, [id]);

    const handleMonthClick = (month: number, year: number) => {
        setSelectedMonth(month);
        setSelectedYear(year);
        setIsEditModalOpen(true);
    };

    const handleDownloadReport = () => {
        if (!history || history.length === 0) {
            alert("No data available to download.");
            return;
        }

        const headers = [
            "Month",
            "Present",
            "Absent",
            "Half Day",
            "Week Off",
            "Holiday",
            "Paid Leave",
            "Unpaid Leave",
            "Overtime On Working Day",
            "Overtime On Week Off",
            "Overtime On Holiday",
            "Late Coming",
            "Early Leaving"
        ];

        const csvRows = history.map(row => [
            `"${row.month_name}"`, // Quote strings to prevent issues with commas
            row.present,
            row.absent,
            row.half_day,
            row.week_off,
            row.holiday,
            row.paid_leave,
            row.unpaid_leave,
            row.overtime_working_day,
            row.overtime_week_off,
            row.overtime_holiday,
            row.late_coming,
            row.early_leaving
        ]);

        const csvContent = [
            headers.join(","),
            ...csvRows.map(row => row.join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const safeName = staff?.name ? staff.name.replace(/\s+/g, '_') : 'Employee';
        
        link.setAttribute("href", url);
        link.setAttribute("download", `${safeName}_Attendance_History.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const visibleHistory = showAll ? history : history.slice(0, 3);

    return (
        <Box sx={{ p: 3, maxWidth: "100%", overflowX: "hidden" }}>
            {/* Header Section */}
            <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate("/attendance/dashboard")}
                    sx={{ color: "text.primary", textTransform: "none", mr: 2 }}
                >
                    Employee Attendance
                </Button>
            </Box>

            {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
                    <CircularProgress />
                </Box>
            ) : error ? (
                <Alert severity="error">{error}</Alert>
            ) : (
                <>
                    {/* User Info & Actions */}
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                            <Avatar sx={{ width: 56, height: 56, bgcolor: "primary.main" }}>
                                {staff?.initials}
                            </Avatar>
                            <Typography variant="h5" sx={{ fontWeight: 600 }}>
                                {staff?.name}
                            </Typography>
                        </Box>
                        <Button
                            variant="outlined"
                            startIcon={<DownloadIcon />}
                            onClick={handleDownloadReport}
                            sx={{ borderColor: "#E0E0E0", color: "#424242", textTransform: "none" }}
                        >
                            Download Report
                        </Button>
                    </Box>

                    {/* Table or Missing DOJ Alert */}
                    {!staff?.date_of_joining ? (
                        <Alert severity="warning" sx={{ mt: 2, borderRadius: 2 }}>
                            No Date of Joining found. Please add a Date of Joining for this staff member to view their historical attendance records.
                        </Alert>
                    ) : (
                        <>
                            <TableContainer component={Paper} sx={{ boxShadow: "none", border: "1px solid #E0E0E0", borderRadius: 2 }}>
                                <Table sx={{ minWidth: 1200 }} aria-label="historical attendance table">
                                    <TableHead sx={{ bgcolor: "#F5F5F5" }}>
                                        <TableRow>
                                            <TableCell sx={{ position: "sticky", left: 0, bgcolor: "#F5F5F5", zIndex: 2, fontWeight: 600, color: "#424242", minWidth: 120 }}>Month</TableCell>
                                            <TableCell sx={{ fontWeight: 600, color: "#424242" }}>Present</TableCell>
                                            <TableCell sx={{ fontWeight: 600, color: "#424242" }}>Absent</TableCell>
                                            <TableCell sx={{ fontWeight: 600, color: "#424242" }}>Half Day</TableCell>
                                            <TableCell sx={{ fontWeight: 600, color: "#424242" }}>Week Off</TableCell>
                                            <TableCell sx={{ fontWeight: 600, color: "#424242" }}>Holiday</TableCell>
                                            <TableCell sx={{ fontWeight: 600, color: "#424242" }}>Paid Leave</TableCell>
                                            <TableCell sx={{ fontWeight: 600, color: "#424242" }}>Unpaid Leave</TableCell>
                                            <TableCell sx={{ fontWeight: 600, color: "#424242" }}>Overtime On<br/>Working Day</TableCell>
                                            <TableCell sx={{ fontWeight: 600, color: "#424242" }}>Overtime On<br/>Week Off</TableCell>
                                            <TableCell sx={{ fontWeight: 600, color: "#424242" }}>Overtime On<br/>Holiday</TableCell>
                                            <TableCell sx={{ fontWeight: 600, color: "#424242" }}>Late Coming</TableCell>
                                            <TableCell sx={{ fontWeight: 600, color: "#424242" }}>Early Leaving</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {history.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={13} align="center" sx={{ py: 4 }}>
                                                    No historical data found.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            visibleHistory.map((row, index) => (
                                                <TableRow 
                                                    key={index} 
                                                    onClick={() => handleMonthClick(row.month, row.year)}
                                                    sx={{ 
                                                        bgcolor: "#ffffff",
                                                        "&:last-child td, &:last-child th": { border: 0 },
                                                        cursor: "pointer",
                                                        "&:hover": { bgcolor: "#F0F7FF" }
                                                    }}
                                                >
                                                    <TableCell sx={{ position: "sticky", left: 0, bgcolor: "inherit", zIndex: 1 }}>{row.month_name}</TableCell>
                                                    <TableCell>{row.present}</TableCell>
                                                    <TableCell>{row.absent}</TableCell>
                                                    <TableCell>{row.half_day}</TableCell>
                                                    <TableCell>{row.week_off}</TableCell>
                                                    <TableCell>{row.holiday}</TableCell>
                                                    <TableCell>{row.paid_leave}</TableCell>
                                                    <TableCell>{row.unpaid_leave}</TableCell>
                                                    <TableCell>{row.overtime_working_day}</TableCell>
                                                    <TableCell>{row.overtime_week_off}</TableCell>
                                                    <TableCell>{row.overtime_holiday}</TableCell>
                                                    <TableCell>{row.late_coming}</TableCell>
                                                    <TableCell>{row.early_leaving}</TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
        
                            {history.length > 3 && (
                                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                                    <Button 
                                        variant="text" 
                                        onClick={() => setShowAll(!showAll)}
                                        sx={{ textTransform: 'none', fontWeight: 600 }}
                                    >
                                        {showAll ? 'Show Less' : 'Show More'}
                                    </Button>
                                </Box>
                            )}
                        </>
                    )}

                    {staff && (
                        <EditAttendanceModal
                            open={isEditModalOpen}
                            onClose={() => setIsEditModalOpen(false)}
                            staffMemberId={staff.id}
                            staffName={staff.name}
                            month={selectedMonth}
                            year={selectedYear}
                            onSuccess={() => fetchHistory()}
                        />
                    )}
                </>
            )}
        </Box>
    );
};

export default EmployeeAttendanceDetails;
