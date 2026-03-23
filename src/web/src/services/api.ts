const API_BASE = import.meta.env.VITE_API_URL || '';

function getAuthHeader(): Record<string, string> {
  try {
    const stored = sessionStorage.getItem('recai_auth');
    if (!stored) return {};
    const { token } = JSON.parse(stored) as { token: string };
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options?.headers as Record<string, string>),
  };

  const res = await fetch(`${API_BASE}${url}`, { ...options, headers });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }
  return res.json();
}

// --- Types ---

export interface JobDescription {
  id: string;
  recruiterId: string;
  clientId: string | null;
  clientName: string | null;
  title: string;
  blobUrl: string | null;
  parsedJson: string | null;
  promptVersion: string | null;
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  description: string | null;
  workspaceId: string;
  createdAt: string;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  resumeBlobUrl: string | null;
  workspaceId: string;
  createdAt: string;
}

export interface Questionnaire {
  id: string;
  jobDescriptionId: string;
  templateVersion: string | null;
  questionsJson: string;
  createdAt: string;
}

export interface QuestionItem {
  id: number;
  category: string;
  question: string;
  evaluationFocus: string;
  relatedSkills: string[];
}

export interface TokenResponse {
  token: string;
  expiresAt: string;
  submissionUrl: string;
  submissionId: string;
}

export interface SubmissionInfo {
  submissionId: string;
  questionsJson: string;
  jobTitle: string | null;
}

export interface EvaluationReport {
  id: string;
  submissionId: string;
  stage: number;
  aiScore: number;
  recommendation: string;
  reportJson: string;
  createdAt: string;
}

export interface InterviewGuide {
  id: string;
  submissionId: string;
  guideJson: string;
  createdAt: string;
}

export interface ClientFeedback {
  id: string;
  candidateId: string;
  jobDescriptionId: string;
  recruiterId: string;
  outcome: string;
  tags: string;
  comments: string | null;
  createdAt: string;
}

// --- Job Descriptions ---

export const jobDescriptionApi = {
  getAll: (clientId?: string) => {
    const qs = clientId ? `?clientId=${clientId}` : '';
    return request<JobDescription[]>(`/api/job-descriptions${qs}`);
  },

  getById: (id: string) =>
    request<JobDescription>(`/api/job-descriptions/${id}`),

  create: (data: { title: string; rawText: string; clientId?: string }) =>
    request<JobDescription>('/api/job-descriptions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  parse: (id: string) =>
    request<{ jobDescriptionId: string; parsedJson: string }>(
      `/api/job-descriptions/${id}/parse`,
      { method: 'POST' }
    ),
};

// --- Clients ---

export const clientApi = {
  getAll: () => request<Client[]>('/api/clients'),

  getById: (id: string) => request<Client>(`/api/clients/${id}`),

  create: (data: { name: string; description?: string }) =>
    request<Client>('/api/clients', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: { name: string; description?: string }) =>
    request<Client>(`/api/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<void>(`/api/clients/${id}`, { method: 'DELETE' }),
};

// --- Candidates ---

export const candidateApi = {
  // workspaceId is optional — Interviewers/Managers get all candidates; Recruiters are filtered server-side by JWT
  getByWorkspace: (workspaceId?: string) => {
    const qs = workspaceId ? `?workspaceId=${workspaceId}` : '';
    return request<Candidate[]>(`/api/candidates${qs}`);
  },

  getById: (id: string) =>
    request<Candidate>(`/api/candidates/${id}`),

  create: (data: { name: string; email: string; workspaceId: string }) =>
    request<Candidate>('/api/candidates', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  generateToken: (candidateId: string, data: { questionnaireId: string; expiryHours?: number }) =>
    request<TokenResponse>(`/api/candidates/${candidateId}/tokens`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// --- Questionnaires ---

export const questionnaireApi = {
  getByJd: (jobDescriptionId: string) =>
    request<Questionnaire[]>(`/api/questionnaires?jobDescriptionId=${jobDescriptionId}`),

  getById: (id: string) =>
    request<Questionnaire>(`/api/questionnaires/${id}`),

  generate: (data: { jobDescriptionId: string; resumeText?: string }) =>
    request<Questionnaire>('/api/questionnaires/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// --- Submissions (candidate-facing, no auth) ---

export const submissionApi = {
  getByToken: (token: string) =>
    request<SubmissionInfo>(`/api/submissions/by-token/${token}`),

  submitAnswers: (token: string, data: { answersJson: string; consentAiEvaluation: boolean }) =>
    request<{ message: string; submissionId: string }>(
      `/api/submissions/by-token/${token}/answer`,
      { method: 'POST', body: JSON.stringify(data) }
    ),

  getByCandidate: (candidateId: string) =>
    request<{ id: string; candidateId: string; questionnaireId: string; submittedAt: string | null }[]>(
      `/api/submissions?candidateId=${candidateId}`
    ),
};

// --- Evaluations ---

export const evaluationApi = {
  evaluate: (submissionId: string) =>
    request<EvaluationReport>(`/api/evaluations/evaluate/${submissionId}`, {
      method: 'POST',
    }),

  getById: (id: string) =>
    request<EvaluationReport>(`/api/evaluations/${id}`),

  getBySubmission: (submissionId: string) =>
    request<EvaluationReport[]>(`/api/evaluations/by-submission/${submissionId}`),
};

// --- Interviews ---

export const interviewApi = {
  generate: (submissionId: string) =>
    request<InterviewGuide>(`/api/interviews/generate/${submissionId}`, { method: 'POST' }),

  getBySubmission: (submissionId: string) =>
    request<InterviewGuide>(`/api/interviews/${submissionId}`),
};

// --- Feedback ---

export const feedbackApi = {
  create: (data: {
    candidateId: string;
    jobDescriptionId: string;
    recruiterId: string;
    outcome: string;
    tags: string;
    comments?: string;
  }) =>
    request<ClientFeedback>('/api/feedback', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Returns own feedback for Recruiters, all feedback for Manager/AccountManager/SuperAdmin
  getAll: () => request<ClientFeedback[]>('/api/feedback'),

  // Kept for backward compat — same endpoint, just alias
  getByRecruiter: (_recruiterId: string) => request<ClientFeedback[]>('/api/feedback'),
};

// --- Manager ---

export interface ManagerStats {
  totalJobDescriptions: number;
  totalCandidates: number;
  totalSubmissions: number;
  evaluatedSubmissions: number;
  stage1PassCount: number;
  stage1HoldCount: number;
  stage1RejectCount: number;
  stage1PassRate: number;
  stage2CompletedCount: number;
  totalFeedbacks: number;
  hiredCount: number;
  rejectedAtClientCount: number;
  hireRate: number;
  averageAiScore: number;
}

export const managerApi = {
  getStats: () => request<ManagerStats>('/api/manager/stats'),
};

// --- System Parameters ---

export interface SystemParameter {
  key: string;
  value: string;
  updatedBy: string | null;
  updatedAt: string;
}

export const systemParameterApi = {
  getAll: () => request<SystemParameter[]>('/api/system-parameters'),

  upsert: (key: string, data: { value: string; updatedBy?: string }) =>
    request<SystemParameter>(`/api/system-parameters/${encodeURIComponent(key)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (key: string) =>
    fetch(`${API_BASE}/api/system-parameters/${encodeURIComponent(key)}`, { method: 'DELETE' }),
};

// --- Talent Pool ---

export interface TalentPoolCandidate {
  id: string;
  name: string;
  email: string;
  skillTags: string;
  workspaceId: string;
  createdAt: string;
  totalSubmissions: number;
  latestAiScore: number | null;
  latestRecommendation: string | null;
  lastOutcome: string | null;
}

export const talentPoolApi = {
  search: (skills?: string, minScore?: number) => {
    const params = new URLSearchParams();
    if (skills) params.append('skills', skills);
    if (minScore !== undefined) params.append('minScore', String(minScore));
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request<TalentPoolCandidate[]>(`/api/talent-pool${qs}`);
  },

  updateSkills: (candidateId: string, skillTags: string) =>
    request<void>(`/api/talent-pool/${candidateId}/skills`, {
      method: 'PATCH',
      body: JSON.stringify({ skillTags }),
    }),
};
