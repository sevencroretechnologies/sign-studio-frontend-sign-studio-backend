import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import AdminDashboard from './AdminDashboard';
import StaffDashboard from './StaffDashboard';

/**
 * Dashboard
 *
 * Pure renderer — contains zero business logic.
 *
 * This component reads `user.dashboard` from the backend response and
 * renders exactly what it is told to render. It never inspects role
 * names, hierarchy levels, permissions, or any other access rule.
 *
 * All access decisions are made in AuthService::computeDashboardConfig()
 * on the backend and surfaced through three fields:
 *
 *   show_my_dashboard    → render the "My Dashboard" tab?
 *   show_admin_dashboard → render the "Admin Dashboard" tab?
 *   default_dashboard    → which tab is active on first load?
 */
export default function Dashboard() {
  const { user, isLoading } = useAuth();

  // Local UI state: null means "use whatever the backend says is default"
  const [activeTab, setActiveTab] = useState<string | null>(null);

  // ── Loading skeleton ─────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="border-0 shadow-md rounded-lg p-6">
              <div className="h-4 w-24 bg-solarized-base2/50 rounded mb-2"></div>
              <div className="h-8 w-16 bg-solarized-base2/50 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!user) return null;

  const hasAdminRoleString = user.roles?.some(r => typeof r === 'string' ? r.toLowerCase().includes('admin') : false) ?? false;
  const isFallbackAdmin = hasAdminRoleString || (user.primary_role_hierarchy ? user.primary_role_hierarchy <= 2 : false);
  const finalShowAdminDashboard = user.dashboard?.show_admin_dashboard || isFallbackAdmin;

  const dashboard = {
    show_my_dashboard:    user.dashboard?.show_my_dashboard ?? true,
    show_admin_dashboard: finalShowAdminDashboard,
    default_dashboard:    user.dashboard?.show_admin_dashboard ? user.dashboard.default_dashboard : (finalShowAdminDashboard ? 'admin' : 'staff'),
  };

  const { show_my_dashboard, show_admin_dashboard, default_dashboard } = dashboard;

  // The tab that is currently active: user's manual pick, or the backend default
  const currentTab = activeTab ?? default_dashboard;

  // ── Backend says: only My Dashboard → render directly, no tabs ───────────
  if (!show_admin_dashboard) {
    return <StaffDashboard />;
  }

  // ── Backend says: multiple tabs available → render tab switcher ───────────
  return (
    <div className="space-y-6">

      {/* Tab bar — only renders tabs the backend says to show */}
      <div role="tablist" aria-label="Dashboard selector" style={styles.tabContainer}>

        {show_my_dashboard && (
          <button
            id="tab-staff"
            role="tab"
            aria-selected={currentTab === 'staff'}
            aria-controls="panel-staff"
            onClick={() => setActiveTab('staff')}
            style={{
              ...styles.tabButton,
              ...(currentTab === 'staff' ? styles.tabButtonActive : styles.tabButtonInactive),
            }}
          >
            My Dashboard
          </button>
        )}

        {show_admin_dashboard && (
          <button
            id="tab-admin"
            role="tab"
            aria-selected={currentTab === 'admin'}
            aria-controls="panel-admin"
            onClick={() => setActiveTab('admin')}
            style={{
              ...styles.tabButton,
              ...(currentTab === 'admin' ? styles.tabButtonActive : styles.tabButtonInactive),
            }}
          >
            Admin Dashboard
          </button>
        )}

      </div>

      {/* Panel — renders the component whose key matches the active tab */}
      {currentTab === 'staff' ? (
        <div id="panel-staff" role="tabpanel" aria-labelledby="tab-staff">
          <StaffDashboard />
        </div>
      ) : (
        <div id="panel-admin" role="tabpanel" aria-labelledby="tab-admin">
          <AdminDashboard />
        </div>
      )}

    </div>
  );
}

// ── Scoped inline styles — no global CSS modified ────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  tabContainer: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#f1f5f9',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '4px',
  },
  tabButton: {
    padding: '8px 22px',
    fontSize: '14px',
    fontWeight: 500,
    borderRadius: '7px',
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease',
    whiteSpace: 'nowrap',
  },
  tabButtonActive: {
    backgroundColor: '#ffffff',
    color: '#1e293b',
    boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
  },
  tabButtonInactive: {
    backgroundColor: 'transparent',
    color: '#64748b',
  },
};
