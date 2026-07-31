import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useThemeContext } from "../theme/ThemeContext";
import {
  LayoutDashboard,
  Users,
  Clock,
  Calendar,
  IndianRupee,
  Briefcase,
  Target,
  Package,
  GraduationCap,
  FileText,
  Video,
  BarChart3,
  Settings,
  Shield,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Bell,
  User,
  Sun,
  Moon,
  Search,
  Key,
  Building2,
} from "lucide-react";
import { Button } from "../components/ui/button";
import logoIcon from "../assets/logo_icon.jpg";
import logoFull from "../assets/logo_full.jpg";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { showAlert, showLogoutDialog } from "../lib/sweetalert";
import { authService } from "../services/api";

const API_BASE_URL = "http://127.0.0.1:8000";

interface NavSubItem {
  name: string;
  href: string;
  permission?: string;
  check?: (user: any) => boolean;
}

interface NavItem {
  name: string;
  href?: string;
  icon: React.ElementType;
  permission?: string;
  check?: (user: any) => boolean;
  children?: NavSubItem[];
}

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  //   {
  //   name: "Organizations",
  //   href: "/organizations",
  //   icon: Building2,
  //   permission: "view_organizations",
  // },
  // {
  //   name: "Companies",
  //   href: "/companies",
  //   icon: Building2,
  //   permission: "view_companies",
  // },
  {
    name: "HR & Payroll",
    icon: Users,
    children: [
      { name: "Employee Master", href: "/staff", permission: "view_staff" },
      { name: "Bank Details", href: "/staff-bank-details", permission: "view_staff" },
      // { name: "Recruitment", href: "/recruitment", permission: "view_recruitment" },
      // { name: "My Team", href: "/attendance/details", permission: "view_attendance" },
      // { name: "Leave Management", href: "/leave/requests" },
      { name: "Payroll", href: "/payroll/slips", permission: "view_payslips" },
      { name: "Salary", href: "/payroll/my-slips" },
      { name: "Shift", href: "/attendance/shifts", permission: "view_attendance" },
      { name: "Incentives", href: "/payroll/benefits", permission: "view_benefits" },
      { name: "Documents", href: "/documents/types", permission: "view_documents" },
      // { name: "Exit Management", href: "/exit" }
      //  {
      //   name: "Work Logs",
      //   href: "/attendance/logs",
      //   permission: "view_attendance",
      // },
    ],
  },
    {
    name: "Payroll",
    href: "/payroll/my-slips",
    icon: IndianRupee,
    children: [
      { name: "My Salary Slips", href: "/payroll/my-slips" },
      // Admin-only items (hidden for user role)
      {
        name: "Salary Slips",
        href: "/payroll/slips",
        permission: "view_payslips",
      },
      {
        name: "Generate Payroll",
        href: "/payroll/generate",
        permission: "generate_payslips",
      },
      // {
      //   name: "Compensation",
      //   href: "/payroll/compensation",
      //   permission: "view_compensation",
      // },
      {
        name: "Benefits",
        href: "/payroll/benefits",
        permission: "view_benefits",
      },
      {
        name: "Benefit Types",
        href: "/payroll/benefits/types",
        permission: "view_benefit_types",
      },
      {
        name: "Deductions",
        href: "/payroll/deductions",
        permission: "view_deductions",
      },
      {
        name: "Deduction Types",
        href: "/payroll/deductions/types",
        permission: "view_deduction_types",
      },
      { name: "Tax Slabs", href: "/payroll/tax", permission: "view_tax_slabs" },
    ],
  },
    {
    name: "Attendance",
    href: "/attendance/self",
    icon: Clock,
    children: [
       {
        name: "Daily Attendance",
        href: "/attendance/daily",
        permission: "view_attendance",
      },
      {
        name: "Attendance Dashboard",
        href: "/attendance/dashboard",
        permission: "view_attendance",
      },
      // { name: "Clock In/Out (Self)", href: "/attendance/self", check: (user: any) => !user?.dashboard?.show_admin_dashboard },
      { name: "My Work Logs", href: "/attendance/my-logs" },
      { name: "My Summary", href: "/attendance/my-summary" },
      // Admin-only items (hidden for user role)
      {
        name: "Clock In/Out",
        href: "/attendance",
        permission: "view_attendance",
      },
      {
        name: "Work Logs",
        href: "/attendance/logs",
        permission: "view_attendance",
      },
      {
        name: "Summary",
        href: "/attendance/summary",
        permission: "view_attendance",
      },
      // {
      //   name: "Shifts",
      //   href: "/attendance/shifts",
      //   permission: "edit_attendance",
      // },
    ],
  },
    {
    name: "Leave Management",
    href: "/leave/requests",
    icon: Calendar,
    children: [
      { name: "My Requests", href: "/leave/requests" },
      { name: "Apply Leave", href: "/leave/apply" },
      { name: "My Balances", href: "/leave/my-balances" },
      // Admin-only items (hidden for user role)
      {
        name: "All Requests",
        href: "/leave/all-requests",
        permission: "view_all_time_off",
      },
      {
        name: "Approvals",
        href: "/leave/approvals",
        permission: "approve_time_off",
      },
      {
        name: "Balances",
        href: "/leave/balances",
        permission: "view_time_off",
      },

      {
        name: "Leave Type",
        href: "/leave/categories",
        permission: "manage_time_off_categories",
      },
    ],
  },
  // {
  //   name: "CRM",
  //   icon: Target,
  //   href: "/crm",
  //   permission: "view_crm",
  // },
  {
    name: "Reports",
    icon: BarChart3,
    permission: "view_reports",
    children: [
      { name: "Attendance Report", href: "/reports/attendance", permission: "view_reports" },
      { name: "Leave Report", href: "/reports/leave", permission: "view_reports" },
      { name: "Payroll Report", href: "/reports/payroll", permission: "view_reports" }
    ]
  },
  {
    name: "Settings",
    icon: Settings,
    permission: "view_settings",
    children: [
      { name: "Office Locations", href: "/settings/locations", permission: "view_settings" },
      { name: "Departments", href: "/settings/divisions", permission: "view_settings" },
      { name: "Working Days", href: "/settings/working-days", permission: "view_settings" },
      // { name: "Job Titles", href: "/settings/job-titles", permission: "view_settings" },
      { name: "Holidays", href: "/settings/holidays", permission: "view_settings" },
      { name: "Document Config", href: "/settings/document-config", permission: "view_settings" },
      { name: "Late Coming Policy", href: "/settings/late-coming-policy", permission: "view_settings" },
      // {name: "Leave Types", href: "/leave/categories", permission: "view_settings" },
    ]
  },
  {
    name: "Administration",
    icon: Shield,
    permission: "view_roles",
    children: [
      { name: "Users", href: "/admin/users", permission: "view_roles" },
      { name: "Roles", href: "/admin/roles", permission: "view_roles" },
      { name: "Permissions", href: "/admin/permissions", permission: "view_roles" }
    ]
  }
];

function NavItemComponent({
  item,
  isCollapsed,
  onItemClick,
}: {
  item: NavItem;
  isCollapsed: boolean;
  onItemClick?: () => void;
}) {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const hasActiveChild = item.children?.some(
    (child) => location.pathname === child.href
  );
  const isActive = item.href ? location.pathname === item.href : hasActiveChild;

  useEffect(() => {
    if (hasActiveChild) {
      setIsOpen(true);
    }
  }, [hasActiveChild]);

  const Icon = item.icon;

  if (item.children && !isCollapsed) {
    return (
      <div className="space-y-1">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-xl transition-all ${isActive
              ? "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 font-semibold"
              : "text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
            }`}
        >
          <div className="flex items-center gap-3">
            <Icon className="h-5 w-5 stroke-[1.75]" />
            <span>{item.name}</span>
          </div>
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 opacity-60 ${isOpen ? "rotate-180" : ""
              }`}
          />
        </button>
        {isOpen && (
          <div className="ml-4 pl-3 border-l border-slate-100 dark:border-slate-800 space-y-1 mt-1 transition-all">
            {item.children.map((child) => {
              const isChildActive = location.pathname === child.href;
              return (
                <Link
                  key={child.href}
                  to={child.href}
                  onClick={onItemClick}
                  className={`block px-3 py-2 text-sm rounded-lg transition-all ${isChildActive
                      ? "text-blue-600 dark:text-blue-400 font-semibold bg-blue-50/50 dark:bg-blue-950/20"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
                    }`}
                >
                  {child.name}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  if (item.children && isCollapsed) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={`w-full flex items-center justify-center p-2.5 rounded-xl transition-all ${isActive
                ? "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400"
                : "text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
              }`}
            title={item.name}
          >
            <Icon className="h-5 w-5 stroke-[1.75]" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start" className="w-56 ml-1">
          <p className="px-2 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">{item.name}</p>
          <DropdownMenuSeparator />
          {item.children.map((child) => (
            <DropdownMenuItem key={child.href} asChild>
              <Link
                to={child.href}
                className={location.pathname === child.href ? "text-blue-600 dark:text-blue-400 font-medium" : ""}
              >
                {child.name}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Link
      to={item.href || "#"}
      onClick={onItemClick}
      className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all ${isActive
          ? "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 font-semibold"
          : "text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
        }`}
      title={isCollapsed ? item.name : undefined}
    >
      <Icon className="h-5 w-5 stroke-[1.75] flex-shrink-0" />
      {!isCollapsed && <span>{item.name}</span>}
    </Link>
  );
}

export default function AppLayout() {
  const { user, logout, hasPermission } = useAuth();
  const { mode, toggleTheme } = useThemeContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Custom dummy search input state
  const [searchQuery, setSearchQuery] = useState("");

  // Breadcrumbs generation
  const pathnames = location.pathname.split("/").filter((x) => x);
  const getBreadcrumbs = () => {
    return (
      <div className="flex items-center gap-1.5 text-xs text-slate-400 capitalize">
        <Link to="/dashboard" className="hover:text-blue-600 transition-colors">Home</Link>
        {pathnames.map((value, index) => {
          const to = `/${pathnames.slice(0, index + 1).join("/")}`;
          const isLast = index === pathnames.length - 1;
          const cleanValue = value.replace("-", " ");
          return (
            <span key={to} className="flex items-center gap-1.5">
              <ChevronRight className="h-3 w-3" />
              {isLast ? (
                <span className="font-medium text-slate-700 dark:text-slate-200">{cleanValue}</span>
              ) : (
                <Link to={to} className="hover:text-blue-600 transition-colors">{cleanValue}</Link>
              )}
            </span>
          );
        })}
      </div>
    );
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await authService.getProfile();
        const profileImagePath =
          response.data.data?.user?.staff_member?.profile_image;
        if (profileImagePath) {
          const imageUrl = profileImagePath.startsWith("http")
            ? profileImagePath
            : `${API_BASE_URL}${profileImagePath}`;
          setProfileImage(imageUrl);
        }
      } catch (error) {
        console.error("Failed to fetch profile image:", error);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user]);

  const handleLogout = async () => {
    const result = await showLogoutDialog();
    if (result.isConfirmed) {
      await logout();
      showAlert("success", "Logged Out", "You have been logged out successfully.", 2000);
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    }
  };

  const filteredNavigation = navigation
    .filter((item) => {
      if (item.permission && !hasPermission(item.permission)) return false;
      if (item.check && !item.check(user)) return false;
      return true;
    })
    .map((item) => {
      if (item.children) {
        return {
          ...item,
          children: item.children.filter((child) => {
            if (child.permission && !hasPermission(child.permission)) return false;
            if (child.check && !child.check(user)) return false;
            return true;
          }),
        };
      }
      return item;
    })
    .filter((item) => !item.children || item.children.length > 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 flex">
      {/* Mobile sidebar drawer overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full bg-white dark:bg-[#111827] border-r border-slate-150 dark:border-slate-800 transition-all duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0 ${sidebarCollapsed ? "lg:w-20" : "lg:w-[260px]"} flex-shrink-0 flex flex-col`}
      >
        {/* Sidebar Header / Logo */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-slate-100 dark:border-slate-800">
          <Link to="/dashboard" className="flex items-center w-full max-w-[200px]">
            {sidebarCollapsed ? (
              <img
                src={logoIcon}
                alt="SignStudio"
                className="w-10 h-10 rounded-xl object-contain shadow-lg shadow-blue-500/20"
              />
            ) : (
              <img
                src={logoFull}
                alt="SignStudio"
                className="w-full h-12 object-contain object-left"
              />
            )}
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1.5">
          {filteredNavigation.map((item, idx) => (
            <NavItemComponent
              key={idx}
              item={item}
              isCollapsed={sidebarCollapsed}
              onItemClick={() => setSidebarOpen(false)}
            />
          ))}
        </nav>

        {/* Sidebar Footer User Info or Collapse Toggle */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center gap-2">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-3 overflow-hidden">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile"
                  className="w-9 h-9 rounded-xl object-cover border border-slate-150 dark:border-slate-800"
                />
              ) : (
                <div className="w-9 h-9 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center font-bold">
                  {user?.name?.[0]?.toUpperCase() || <User className="h-4 w-4" />}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate leading-tight">{user?.name}</p>
                <p className="text-xs text-slate-400 truncate mt-0.5">{user?.role_display || "Staff"}</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 rounded-xl text-slate-450 hover:bg-slate-50 dark:hover:bg-slate-800/80 hidden lg:flex items-center justify-center"
            title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${sidebarCollapsed ? "lg:ml-[80px]" : "lg:ml-[260px]"
          }`}
      >
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-[#111827]/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden sm:block">
              {getBreadcrumbs()}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Box */}
            {/* <div className="relative hidden md:block w-64">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="h-4 w-4 stroke-[1.75]" />
              </span>
              <input
                type="text"
                placeholder="Search staff, schedules, documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-1.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-850 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all font-medium"
              />
            </div> */}

            {/* Dark Mode Switcher */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
              title={mode === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
            >
              {mode === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </button>

            {/* Notifications Menu */}
            {/* <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 relative transition-colors">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-[#111827]" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[320px] p-2 mt-1">
                <div className="flex justify-between items-center px-3 py-2 border-b border-slate-55 dark:border-slate-800 pb-2 mb-2">
                  <h4 className="font-bold text-sm">Notifications</h4>
                  <button className="text-xs text-blue-600 hover:underline">Mark all read</button>
                </div>
                <div className="space-y-1 max-h-[250px] overflow-y-auto">
                  <div className="p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Work Timing Updated</p>
                    <p className="text-3xs text-slate-400 mt-0.5">Your work timings were modified by admin.</p>
                  </div>
                  <div className="p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-[#1e293b] cursor-pointer">
                    <p className="text-xs font-semibold text-slate-805 dark:text-slate-200">Leave Approved</p>
                    <p className="text-3xs text-slate-400 mt-0.5">Your causal leave request has been approved.</p>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu> */}

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Avatar"
                      className="w-8 h-8 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-lg flex items-center justify-center text-xs font-bold shadow-sm shadow-blue-500/20">
                      {user?.name?.[0]?.toUpperCase() || <User className="h-4 w-4" />}
                    </div>
                  )}
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[180px] p-1 mt-1">
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex items-center gap-2 cursor-pointer py-2">
                    <User className="h-4 w-4 text-slate-400" />
                    <span>My Profile</span>
                  </Link>
                </DropdownMenuItem>
                {/* <DropdownMenuItem asChild>
                  <Link to="/profile?tab=security" className="flex items-center gap-2 cursor-pointer py-2">
                    <Key className="h-4 w-4 text-slate-400" />
                    <span>Change Password</span>
                  </Link>
                </DropdownMenuItem> */}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-red-500 hover:text-red-650 cursor-pointer py-2 focus:bg-red-50 dark:focus:bg-red-950/20"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-6 scroll-smooth">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
