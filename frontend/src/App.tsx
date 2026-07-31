import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CustomThemeProvider } from './theme/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './layouts/AppLayout';
import AuthLayout from './layouts/AuthLayout';
import { Toaster } from './components/ui/toaster';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';

// Dashboard
import Dashboard from './pages/dashboard/Dashboard';

// Profile
import Profile from './pages/profile/Profile';

// Staff Management
import StaffList from './pages/staff/StaffList';
import StaffCreate from './pages/staff/StaffCreate';
import StaffProfile from './pages/staff/StaffProfile';
import StaffEdit from './pages/staff/StaffEdit';
import StaffBankDetailsList from './pages/staff/StaffBankDetailsList';
import StaffBankDetailsCreate from './pages/staff/StaffBankDetailsCreate';
import StaffBankDetailsEdit from './pages/staff/StaffBankDetailsEdit';
import StaffBankDetailsView from './pages/staff/StaffBankDetailsView';


// Organization
import OrganizationList from './pages/organization/OrganizationList';
import OrganizationCreate from './pages/organization/OrganizationCreate';
import OrganizationEdit from './pages/organization/OrganizationEdit';
import CompanyList from './pages/company/CompanyList';
import CompanyEdit from './pages/company/CompanyEdit';
import CompanyCreate from './pages/company/CompanyCreate';

// Assets
import AssetsList from './pages/assets/AssetsList';
import AssetAssignmentList from './pages/assets/AssetAssignmentList';
import AssetTypeList from './pages/assets/AssetTypeList';
// Documents
import DocumentTypeList from './pages/documents/DocumentTypeList';
import DocumentLocationList from './pages/documents/DocumentLocationList';

// Attendance
import ClockInOut from './pages/attendance/ClockInOut';
import WorkLogs from './pages/attendance/WorkLogs';
import AttendanceSummary from './pages/attendance/AttendanceSummary';
import AttendanceDetailsPage from './pages/attendance/AttendanceDetailsPage';
import DailyAttendance from './pages/attendance/DailyAttendance';
import AttendanceDashboard from './pages/attendance/AttendanceDashboard';
import EmployeeAttendanceDetails from './pages/attendance/EmployeeAttendanceDetails';
import Shifts from './pages/attendance/Shifts';

// Leave Management
import LeaveRequests from './pages/leave/LeaveRequests';
import LeaveApply from './pages/leave/LeaveApply';
import LeaveApprovals from './pages/leave/LeaveApprovals';
import LeaveBalances from './pages/leave/LeaveBalances';
import LeaveCategories from './pages/leave/LeaveCategories';

// Payroll
import SalarySlips from './pages/payroll/SalarySlips';
import MySalarySlip from './pages/payroll/MySalarySlip';
import GeneratePayroll from './pages/payroll/GeneratePayroll';
import Benefits from './pages/payroll/Benefits';
import Deductions from './pages/payroll/Deductions';
import TaxSlabs from './pages/payroll/TaxSlabs';

// Recruitment
import Jobs from './pages/recruitment/Jobs';
import Candidates from './pages/recruitment/Candidates';
import Interviews from './pages/recruitment/Interviews';
import CustomQuestions from './pages/recruitment/CustomQuestions';

// Performance
import ParticipantForm from './pages/training/ParticipantForm';
// import SessionForm from './pages/training/SessionForm';
// import Performance from './pages/performance/Performance';
import Goals from './pages/performance/Goals';
import Competencies from './pages/performance/Competencies';
import Appraisals from './pages/performance/Appraisals';

// Assets
// import AssetsList from './pages/assets/AssetsList';
// import AssetAssignmentList from './pages/assets/AssetAssignmentList';

// Training
import Programs from './pages/training/Programs';
import TrainingTypeList from './pages/training/TrainingTypeList';
import Sessions from './pages/training/Sessions';
import Participants from './pages/training/Participants';

// Contracts
import Contracts from './pages/contracts/Contracts';
import ContractTypes from './pages/contracts/ContractTypes';
import ContractRenewals from './pages/contracts/ContractRenewals';

// Meetings
import Meetings from './pages/meetings/Meetings';

import MeetingCalendar from './pages/meetings/MeetingCalendar';
import MeetingTypes from './pages/meetings/MeetingTypes';
import MeetingRooms from './pages/meetings/MeetingRooms';
import MeetingMinutesPage from './pages/meetings/MeetingMinutesPage';
import MeetingActionItemsPage from './pages/meetings/MeetingActionItemsPage';
import MeetingAttendeesPage from './pages/meetings/MeetingAttendeesPage';



// Reports
import AttendanceReport from './pages/reports/AttendanceReport';
import LeaveReport from './pages/reports/LeaveReport';
import PayrollReport from './pages/reports/PayrollReport';

// Settings
import OfficeLocations from './pages/settings/OfficeLocations';
import WorkingDays from './pages/settings/WorkingDays';
import Divisions from './pages/settings/Divisions';
import JobTitles from './pages/settings/JobTitles';
import Holidays from './pages/settings/Holidays';
import FileCategories from './pages/settings/FileCategories';
import DocumentConfiguration from './pages/settings/DocumentConfiguration';

// Admin
import Users from './pages/admin/Users';
import UsersByOrg from './pages/admin/UsersByOrg';
import UsersByCompany from './pages/admin/UsersByCompany';
import Roles from './pages/admin/Roles';
import RolePermissions from './pages/admin/RolePermissions';
import Permissions from './pages/admin/Permissions';
import BenefitTypes from './pages/payroll/BenefitTypes';
import WithholdingTypes from './pages/payroll/WithHoldingType';
import JobCategories from './pages/recruitment/JobCategory';
import CandidateSources from './pages/recruitment/CandidateSources';
import JobStages from './pages/recruitment/JobStages';
import JobApplications from './pages/recruitment/JobApplications';
import OnboardingChecklist from './pages/recruitment/OnboardingChecklist';

// Error Pages
import Unauthorized from './pages/Unauthorized';
import CompanyNotices from './pages/settings/CompanyNotices';
import AllLeaveRequests from './pages/leave/AllLeaveRequests';
import MyLeaveBalances from './pages/leave/MyLeaveBalances';
import MyWorkLogs from './pages/attendance/MyWorkLogs';
import MyAttendanceSummary from './pages/attendance/MyAttendanceSummary';
import ClockInOutSelf from './pages/attendance/ClockInOutSelf';
import PenaltyOvertimeDetails from './pages/attendance/PenaltyOvertimeDetails';

function App() {
  return (
    <AuthProvider>
      <CustomThemeProvider>
        <Router>
        <Toaster />
        <Routes>
          {/* Public Routes - Auth */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
          </Route>

          {/* Protected Routes */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            {/* Dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />

            {/* Profile */}
            <Route path="/profile" element={<Profile />} />

            {/* Staff Management */}
            <Route path="/staff" element={<StaffList />} />
            <Route path="/staff/create" element={<StaffCreate />} />
            <Route path="/staff/departments" element={<Divisions />} />
            <Route path="/staff/:id" element={<StaffProfile />} />
            <Route path="/staff/:id/edit" element={<StaffEdit />} />

            {/* Staff Bank Details */}
            <Route path="/staff-bank-details" element={<StaffBankDetailsList />} />
            <Route path="/staff-bank-details/create" element={<StaffBankDetailsCreate />} />
            <Route path="/staff-bank-details/:id" element={<StaffBankDetailsView />} />
            <Route path="/staff-bank-details/:id/edit" element={<StaffBankDetailsEdit />} />

            {/* Organization */}
            <Route path="/organizations" element={<OrganizationList />} />
            <Route path="/organizations/create" element={<OrganizationCreate />} />
            <Route path="/organizations/:id/edit" element={<OrganizationEdit />} />
            <Route path="/companies" element={<CompanyList />} />
            <Route path="/companies/create" element={<CompanyCreate />} />
            <Route path="/companies/:id/edit" element={<CompanyEdit />} />

            {/* Assets */}
            <Route path="/assets" element={<AssetsList />} />
            <Route path="/assets/assignments" element={<AssetAssignmentList />} />

            {/* Documents */}
            <Route path="/documents/types" element={<DocumentTypeList />} />
            <Route path="/documents/locations" element={<DocumentLocationList />} />

            {/* Attendance */}
            <Route path="/attendance" element={
              <ProtectedRoute requiredPermission="view_attendance">
                <ClockInOut />
              </ProtectedRoute>
            } />
            <Route path="/attendance/self" element={<ClockInOutSelf />} />
            <Route path="/attendance/logs" element={
              <ProtectedRoute requiredPermission="view_attendance">
                <WorkLogs />
              </ProtectedRoute>
            } />
            <Route path="/attendance/my-logs" element={<MyWorkLogs />} />
            <Route path="/attendance/summary" element={
              <ProtectedRoute requiredPermission="view_attendance">
                <AttendanceSummary />
              </ProtectedRoute>
            } />
            <Route path="/attendance/my-summary" element={<MyAttendanceSummary />} />
            <Route path="/attendance/shifts" element={
              <ProtectedRoute requiredPermission="view_attendance">
                <Shifts />
              </ProtectedRoute>
            } />
            <Route path="/attendance/details" element={
              <ProtectedRoute requiredPermission="view_attendance">
                <AttendanceDetailsPage />
              </ProtectedRoute>
            } />
            <Route path="/attendance/daily" element={
              <ProtectedRoute requiredPermission="view_attendance">
                <DailyAttendance />
              </ProtectedRoute>
            } />
            <Route path="/attendance/dashboard" element={
              <ProtectedRoute requiredPermission="view_attendance">
                <AttendanceDashboard />
              </ProtectedRoute>
            } />
            <Route path="/attendance/staff/:id" element={
              <ProtectedRoute requiredPermission="view_attendance">
                <EmployeeAttendanceDetails />
              </ProtectedRoute>
            } />

            {/* Leave Management */}
            <Route path="/leave" element={<LeaveRequests />} />
            <Route path="/leave/requests" element={<LeaveRequests />} />
            <Route path="/leave/all-requests" element={
              <ProtectedRoute requiredPermission="view_all_time_off">
                <AllLeaveRequests />
              </ProtectedRoute>
            } />
            <Route path="/leave/apply" element={<LeaveApply />} />
            <Route path="/leave/approvals" element={
              <ProtectedRoute requiredPermission="approve_time_off">
                <LeaveApprovals />
              </ProtectedRoute>
            } />
            <Route path="/leave/balances" element={
              <ProtectedRoute requiredPermission="view_time_off">
                <LeaveBalances />
              </ProtectedRoute>
            } />
            <Route path="/leave/my-balances" element={<MyLeaveBalances />} />
            <Route path="/leave/categories" element={
              <ProtectedRoute
                requiredPermission="manage_time_off_categories"
              >
                <LeaveCategories />
              </ProtectedRoute>
            } />

            {/* Payroll */}
            <Route path="/payroll" element={
              <ProtectedRoute requiredPermission="view_payslips">
                <SalarySlips />
              </ProtectedRoute>
            } />
            <Route path="/payroll/slips" element={
              <ProtectedRoute requiredPermission="view_payslips">
                <SalarySlips />
              </ProtectedRoute>
            } />
            <Route path="/payroll/my-slips" element={<MySalarySlip />} />
            <Route path="/payroll/generate" element={
              <ProtectedRoute requiredPermission="generate_payslips">
                <GeneratePayroll />
              </ProtectedRoute>
            } />
            <Route path="/payroll/benefits" element={
              <ProtectedRoute requiredPermission="view_benefits">
                <Benefits />
              </ProtectedRoute>
            } />
            <Route path="/payroll/benefits/types" element={
              <ProtectedRoute requiredPermission="view_benefit_types">
                <BenefitTypes />
              </ProtectedRoute>
            } />
            <Route path="/payroll/deductions" element={
              <ProtectedRoute requiredPermission="view_deductions">
                <Deductions />
              </ProtectedRoute>
            } />
            <Route path="/payroll/deductions/types" element={
              <ProtectedRoute requiredPermission="view_deduction_types">
                <WithholdingTypes />
              </ProtectedRoute>
            } />
            <Route path="/payroll/tax" element={
              <ProtectedRoute requiredPermission="view_tax_slabs">
                <TaxSlabs />
              </ProtectedRoute>
            } />

            {/* Recruitment */}
            <Route path="/recruitment/job/categories" element={<JobCategories />} />
            <Route path="/recruitment" element={<Jobs />} />
            <Route path="/recruitment/candidate-sources" element={<CandidateSources />} />
            <Route path="/recruitment/jobs" element={<Jobs />} />
            <Route path="/recruitment/candidates" element={<Candidates />} />
            <Route path="/recruitment/interviews" element={<Interviews />} />
            <Route path="/recruitment/job/stages" element={<JobStages />} />
            <Route path="/recruitment/applications" element={<JobApplications />} />
            <Route path="/recruitment/onboarding-checklists" element={<OnboardingChecklist />} />
            <Route path="/recruitment/custom-questions" element={<CustomQuestions />} />

            {/* Performance */}
            <Route path="/performance/goals" element={
              <ProtectedRoute requiredPermission="manage_goals">
                <Goals />
              </ProtectedRoute>
            } />
            <Route path="/performance/competencies" element={
              <ProtectedRoute requiredPermission="view_staff_performance">
                <Competencies />
              </ProtectedRoute>
            } />
            <Route path="/performance/appraisals" element={
              <ProtectedRoute requiredPermission="manage_appraisals">
                <Appraisals />
              </ProtectedRoute>
            } />

            {/* Assets */}
            <Route path="/assets" element={<AssetsList />} />
            <Route path="/assets/assignments" element={<AssetAssignmentList />} />
            <Route path="/assets/types" element={<AssetTypeList />} />

            {/* Training */}
            <Route path="/training" element={<Programs />} />
            <Route path="/training/programs" element={<Programs />} />
            <Route path="/training/types" element={<TrainingTypeList />} />
            <Route path="/training/sessions" element={<Sessions />} />
            <Route path="/training/participants" element={<Participants />} />
            <Route path="/training/participants/create" element={<ParticipantForm />} />
            <Route path="/training/participants/:id/edit" element={<ParticipantForm />} />

            {/* Contracts */}
            <Route path="/contracts" element={<Contracts />} />
            <Route path="/contracts/types" element={<ContractTypes />} />
            <Route path="/contracts/renewals" element={<ContractRenewals />} />


            {/* Meetings */}
            <Route path="/meetings" element={
              <ProtectedRoute requiredPermission="view_meetings">
                <Meetings />
              </ProtectedRoute>
            } />
            <Route path="/meetings/calendar" element={
              <ProtectedRoute requiredPermission="view_meetings">
                <MeetingCalendar />
              </ProtectedRoute>
            } />
            <Route path="/meetings/minutes" element={
              <ProtectedRoute requiredPermission="manage_meeting_minutes">
                <MeetingMinutesPage />
              </ProtectedRoute>
            } />
            <Route path="/meetings/action-items" element={
              <ProtectedRoute requiredPermission="view_meetings">
                <MeetingActionItemsPage />
              </ProtectedRoute>
            } />
            <Route path="/meetings/attendees" element={
              <ProtectedRoute requiredPermission="view_meetings">
                <MeetingAttendeesPage />
              </ProtectedRoute>
            } />
            <Route path="/meetings/types" element={
              <ProtectedRoute requiredPermission="manage_meeting_types">
                <MeetingTypes />
              </ProtectedRoute>
            } />
            <Route path="/meetings/rooms" element={
              <ProtectedRoute requiredPermission="manage_meeting_rooms">
                <MeetingRooms />
              </ProtectedRoute>
            } />

            {/* Reports */}
            <Route path="/reports" element={<AttendanceReport />} />
            <Route path="/reports/attendance" element={<AttendanceReport />} />
            <Route path="/reports/leave" element={<LeaveReport />} />
            <Route path="/reports/payroll" element={<PayrollReport />} />

            {/* Settings */}
            <Route path="/settings" element={<OfficeLocations />} />
            <Route path="/settings/working-days" element={<WorkingDays />} />
            <Route path="/settings/locations" element={<OfficeLocations />} />
            <Route path="/settings/divisions" element={<Divisions />} />
            <Route path="/settings/job-titles" element={<JobTitles />} />
            <Route path="/settings/holidays" element={<Holidays />} />
            <Route path="/settings/company-notices" element={<CompanyNotices />} />
            <Route path="/settings/file-categories" element={<FileCategories />} />
            <Route path="/settings/document-config" element={<DocumentConfiguration />} />
            <Route path="/settings/late-coming-policy" element={<PenaltyOvertimeDetails />} />

            {/* Admin */}
            <Route path="/admin" element={<Users />} />
            <Route path="/admin/users" element={<Users />} />
            <Route path="/admin/users/org" element={<UsersByOrg />} />
            <Route path="/admin/users/company" element={<UsersByCompany />} />
            <Route path="/admin/roles" element={<Roles />} />
            <Route path="/admin/roles/:id/permissions" element={<RolePermissions />} />
            <Route path="/admin/permissions" element={<Permissions />} />
          </Route>

          {/* Unauthorized */}
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Catch all - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
      </CustomThemeProvider>
    </AuthProvider>
  );
}

export default App
