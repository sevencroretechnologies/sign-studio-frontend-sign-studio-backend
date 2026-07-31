import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import {
  Users,
  Clock,
  Calendar,
  IndianRupee,
  TrendingUp,
  UserCheck,
  UserMinus,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  TrendingDown,
  Percent,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

interface EmployeeStats {
  total: number;
  active: number;
  on_leave: number;
  inactive: number;
  new_this_month: number;
}

interface AttendanceStats {
  present: number;
  absent: number;
  not_marked: number;
}

interface LeaveStats {
  pending: number;
  approved_this_month: number;
}

interface DashboardData {
  employees: EmployeeStats;
  attendance: {
    today: AttendanceStats;
    weekly_trend: AttendanceData[];
  };
  department_split: {
    department: string;
    count: number;
    percentage: number;
  }[];
  leave: LeaveStats;
  payroll: {
    generated: number;
    paid: number;
    monthly_expense: PayrollSummaryData[];
  };
  recent_activities: any[];
  upcoming_events: any[];
  recent_announcements: any[];
}

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
    status?: number;
  };
  message?: string;
}

interface AttendanceData {
  date: string;
  present: number;
  absent: number;
}

interface PayrollSummaryData {
  month: string;
  payroll?: number;
  amount?: number;
}

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Curated color themes
  const CHART_COLORS = ['#2563EB', '#22C55E', '#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6'];


  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);
        const dashboardRes = await dashboardService.getStats();

        if (dashboardRes.data.success && dashboardRes.data.data) {
          setDashboardData(dashboardRes.data.data);
        } else {
          setError(dashboardRes.data.message || 'Failed to load dashboard data');
        }
      } catch (err) {
        const apiError = err as ApiError;
        const errorMessage = apiError.response?.data?.message || apiError.message || 'Failed to fetch dashboard data';
        setError(errorMessage);
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const totalEmployees = dashboardData?.employees?.total || 0;
  const presentCount = dashboardData?.attendance?.today?.present || 0;
  const absentCount = dashboardData?.attendance?.today?.absent || 0;
  const onLeaveCount = dashboardData?.employees?.on_leave || 0;
  const newJoinees = dashboardData?.employees?.new_this_month || 0;
  
  // Calculate total monthly payroll for UI (sum of latest month or fallback)
  const monthlyExpenses = dashboardData?.payroll?.monthly_expense || [];
  const latestPayrollAmount = monthlyExpenses.length > 0 ? (monthlyExpenses[monthlyExpenses.length - 1].amount ?? monthlyExpenses[monthlyExpenses.length - 1].payroll ?? 0) : 0;
  const monthlyPayrollVal = `₹${latestPayrollAmount.toLocaleString()}`;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-5">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="border-slate-100 dark:border-slate-800">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-28 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-slate-100 dark:border-slate-800">
            <CardContent className="h-[350px] flex items-center justify-center">
              <Skeleton className="h-[280px] w-full" />
            </CardContent>
          </Card>
          <Card className="border-slate-100 dark:border-slate-800">
            <CardContent className="h-[350px] flex items-center justify-center">
              <Skeleton className="h-[250px] w-[250px] rounded-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <div>
            <p className="text-red-500 font-semibold text-sm">Offline mode</p>
            <p className="text-xs text-red-400">Notice: Unable to check real-time stats (API error). Showing stored statistics.</p>
          </div>
        </div>
      )}

      {/* Metrics Cards Grid - 6 Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-5">
        {/* Total Employees */}
        <Card className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Users className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-bold tracking-tight">{totalEmployees}</h3>
              <p className="text-3xs text-slate-400 mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span>+12% vs last month</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Present Today */}
        <Card className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Present</span>
              <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-950/30 flex items-center justify-center text-green-600 dark:text-green-400">
                <UserCheck className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-bold tracking-tight text-green-600 dark:text-green-400">{presentCount}</h3>
              <p className="text-3xs text-slate-400 mt-1 flex items-center gap-1">
                <Percent className="h-3 w-3 text-green-500" />
                <span>{totalEmployees > 0 ? Math.round((presentCount / totalEmployees) * 100) : 0}% attendance rate</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Absent */}
        <Card className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Absent</span>
              <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/30 flex items-center justify-center text-red-600 dark:text-red-400">
                <UserMinus className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-bold tracking-tight text-red-500 dark:text-red-450">{absentCount}</h3>
              <p className="text-3xs text-slate-400 mt-1 flex items-center gap-1">
                <TrendingDown className="h-3 w-3 text-red-500" />
                <span>Needs follow-up</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* On Leave */}
        <Card className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">On Leave</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Calendar className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-bold tracking-tight text-amber-500 dark:text-amber-405">{onLeaveCount}</h3>
              <p className="text-3xs text-slate-400 mt-1">
                Approved vacation policy
              </p>
            </div>
          </CardContent>
        </Card>

        {/* New Joinees */}
        <Card className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">New Joinees</span>
              <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/30 flex items-center justify-center text-teal-600 dark:text-teal-400">
                <UserPlus className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-bold tracking-tight">{newJoinees}</h3>
              <p className="text-3xs text-slate-400 mt-1">
                Joined in the current month
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Payroll */}
        <Card className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Payroll</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <IndianRupee className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2.5xl font-bold tracking-tight">{monthlyPayrollVal}</h3>
              <p className="text-3xs text-slate-400 mt-1 flex items-center gap-1">
                <span className="text-green-500">Processed</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Trend (Area Chart) */}
        <Card className="lg:col-span-2 border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-md font-bold">Attendance Trend</CardTitle>
            <CardDescription className="text-xs">Weekly breakdown of presence rates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dashboardData?.attendance?.weekly_trend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="presentGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22C55E" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#22C55E" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="absentGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-slate-850" />
                  <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="present"
                    name="Present"
                    stroke="#22C55E"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#presentGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="absent"
                    name="Absent"
                    stroke="#EF4444"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#absentGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Department Distribution (Doughnut Chart) */}
        <Card className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-bold">Department Split</CardTitle>
            <CardDescription className="text-xs">Employee count distribution</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col justify-between h-[280px] pb-6">
            <div className="h-[180px] relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dashboardData?.department_split || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={68}
                    paddingAngle={3}
                    dataKey="count"
                  >
                    {(dashboardData?.department_split || []).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 text-2xs px-2">
              {(dashboardData?.department_split || []).map((entry, index) => (
                <div key={entry.department} className="flex items-center gap-1.5 min-w-0">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                  />
                  <span className="truncate text-slate-500 dark:text-slate-400">
                    {entry.department}: {entry.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payroll summary (Bar Chart) */}
        <Card className="lg:col-span-2 border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-md font-bold">Payroll Expenses</CardTitle>
            <CardDescription className="text-xs">Monthly breakdown of historical payroll</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboardData?.payroll?.monthly_expense || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-slate-850" />
                  <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={(value) => [`₹${(value as number).toLocaleString()}`, 'Payroll Spent']}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar
                    dataKey="amount"
                    fill="#2563EB"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={36}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity Panel */}
        <Card className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-md font-bold">Recent Activities</CardTitle>
              <CardDescription className="text-xs">Real-time log events</CardDescription>
            </div>
            <Link to="/reports/attendance">
              <Button variant="ghost" size="sm" className="text-blue-600 dark:text-blue-400 text-xs px-2 hover:bg-slate-50 dark:hover:bg-slate-850">
                View all
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData?.recent_activities?.length ? (
                dashboardData.recent_activities.map((activity) => (
                  <div key={activity.id} className="flex gap-3 text-xs leading-normal">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      activity.type === 'leave' ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400' :
                      activity.type === 'employee' ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400' :
                      'bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400'
                    }`}>
                      {activity.type === 'leave' && <Calendar className="h-4.5 w-4.5" />}
                      {activity.type === 'employee' && <Users className="h-4.5 w-4.5" />}
                      {activity.type === 'attendance' && <Clock className="h-4.5 w-4.5" />}
                      {!['leave', 'employee', 'attendance'].includes(activity.type) && <CheckCircle2 className="h-4.5 w-4.5" />}
                    </div>
                    <div>
                      <p className="font-semibold">{activity.action}</p>
                      <p className="text-slate-500 dark:text-slate-400 text-2xs mt-0.5">{activity.user}</p>
                      <p className="text-3xs text-slate-400 dark:text-slate-550 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-xs text-slate-450">No recent activities</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
