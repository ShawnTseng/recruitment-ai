import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import AuthGuard from './components/AuthGuard'
import Dashboard from './pages/Dashboard'
import RecruiterDashboard from './pages/RecruiterDashboard'
import JdCreate from './pages/JdCreate'
import JdDetail from './pages/JdDetail'
import CandidateList from './pages/CandidateList'
import CandidateQuestionnaire from './pages/CandidateQuestionnaire'
import RecruiterReportView from './pages/RecruiterReportView'
import InterviewerPortal from './pages/InterviewerPortal'
import NotFound from './pages/NotFound'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          {/* Protected routes — require Entra ID sign-in */}
          <Route path="recruiter" element={<AuthGuard><RecruiterDashboard /></AuthGuard>} />
          <Route path="recruiter/jd/new" element={<AuthGuard><JdCreate /></AuthGuard>} />
          <Route path="recruiter/jd/:id" element={<AuthGuard><JdDetail /></AuthGuard>} />
          <Route path="recruiter/candidates" element={<AuthGuard><CandidateList /></AuthGuard>} />
          <Route path="recruiter/report/:submissionId" element={<AuthGuard><RecruiterReportView /></AuthGuard>} />
          <Route path="interviewer/:submissionId" element={<AuthGuard><InterviewerPortal /></AuthGuard>} />
          <Route path="*" element={<NotFound />} />
        </Route>
        {/* Candidate questionnaire — no auth, token-based access */}
        <Route path="/candidate/:token" element={<CandidateQuestionnaire />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
