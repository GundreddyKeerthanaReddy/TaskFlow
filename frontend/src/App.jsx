import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import useThemeStore from './store/themeStore';
import AppLayout from './components/layout/AppLayout';
import AuthLayout from './components/layout/AuthLayout';
import LoadingScreen from './components/ui/LoadingScreen';

// Lazy-loaded pages
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'));
const ProjectDetailPage = lazy(() => import('./pages/ProjectDetailPage'));
const KanbanPage = lazy(() => import('./pages/KanbanPage'));
const TasksPage = lazy(() => import('./pages/TasksPage'));
const TeamPage = lazy(() => import('./pages/TeamPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

const ProtectedRoute = ({ children }) => {
  const { token, isInitialized } = useAuthStore();
  if (!isInitialized) return <LoadingScreen />;
  if (!token) return <Navigate to="/auth/login" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { token, isInitialized } = useAuthStore();
  if (!isInitialized) return <LoadingScreen />;
  if (token) return <Navigate to="/dashboard" replace />;
  return children;
};

export default function App() {
  const { initialize } = useAuthStore();
  const { initTheme } = useThemeStore();

  useEffect(() => {
    initTheme();
    initialize();
  }, []);

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* Public auth routes */}
        <Route path="/auth" element={<AuthLayout />}>
          <Route path="login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        </Route>

        {/* Protected app routes */}
        <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:id" element={<ProjectDetailPage />} />
          <Route path="projects/:id/kanban" element={<KanbanPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="team" element={<TeamPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
