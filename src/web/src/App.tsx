import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import type { ReactElement } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import LoginPage from './pages/LoginPage'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import RecruiterDashboard from './pages/RecruiterDashboard'
import JdCreate from './pages/JdCreate'
import JdDetail from './pages/JdDetail'
import CandidateQuestionnaire from './pages/CandidateQuestionnaire'
import RecruiterReportView from './pages/RecruiterReportView'
import InterviewerPortal, { InterviewerLanding } from './pages/InterviewerPortal'
import ClientManagement from './pages/ClientManagement'
import NotFound from './pages/NotFound'

/** Route guard: redirects to root if user's role is not in allowedRoles */
function RequireRole({ roles, children }: { roles: string[]; children: ReactElement }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

/** Landing redirect based on role */
function RoleRedirect() {
  const { user } = useAuth();
  if (!user) return <Dashboard />;
  switch (user.role) {
    case 'Recruiter': return <Navigate to="/recruiter" replace />;
    case 'Interviewer': return <Navigate to="/interviewer" replace />;
    case 'Manager':
    case 'AccountManager': return <Navigate to="/manager" replace />;
    default: return <Dashboard />;
  }
}

function AppRoutes() {
  const { user } = useAuth();

  // Public candidate questionnaire — no login required
  if (window.location.pathname.startsWith('/candidate/')) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/candidate/:token" element={<CandidateQuestionnaire />} />
        </Routes>
      </BrowserRouter>
    );
  }

  if (!user) return <LoginPage />;

  const recruiterRoles = ['Recruiter', 'SuperAdmin'];
  const interviewerRoles = ['Interviewer', 'SuperAdmin'];
  const managerRoles = ['Manager', 'AccountManager', 'SuperAdmin'];

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<RoleRedirect />} />

          {/* Recruiter routes */}
          <Route path="recruiter" element={
            <RequireRole roles={recruiterRoles}><RecruiterDashboard /></RequireRole>
          } />
          <Route path="recruiter/jd/new" element={
            <RequireRole roles={recruiterRoles}><JdCreate /></RequireRole>
          } />
          <Route path="recruiter/jd/:id" element={
            <RequireRole roles={[...recruiterRoles, ...interviewerRoles]}><JdDetail /></RequireRole>
          } />
          <Route path="recruiter/report/:submissionId" element={
            <RequireRole roles={recruiterRoles}><RecruiterReportView /></RequireRole>
          } />
          <Route path="recruiter/clients" element={
            <RequireRole roles={recruiterRoles}><ClientManagement /></RequireRole>
          } />

          {/* Interviewer routes */}
          <Route path="interviewer" element={
            <RequireRole roles={interviewerRoles}><InterviewerLanding /></RequireRole>
          } />
          <Route path="interviewer/:submissionId" element={
            <RequireRole roles={interviewerRoles}><InterviewerPortal /></RequireRole>
          } />

          {/* Manager routes */}
          <Route path="manager" element={
            <RequireRole roles={managerRoles}><Dashboard /></RequireRole>
          } />

          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="/candidate/:token" element={<CandidateQuestionnaire />} />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App
