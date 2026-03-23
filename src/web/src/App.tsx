import { BrowserRouter, Routes, Route } from 'react-router-dom'
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
import NotFound from './pages/NotFound'

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

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="recruiter" element={<RecruiterDashboard />} />
          <Route path="recruiter/jd/new" element={<JdCreate />} />
          <Route path="recruiter/jd/:id" element={<JdDetail />} />
          <Route path="recruiter/report/:submissionId" element={<RecruiterReportView />} />
          <Route path="interviewer" element={<InterviewerLanding />} />
          <Route path="interviewer/:submissionId" element={<InterviewerPortal />} />
          <Route path="manager" element={<Dashboard />} />
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
