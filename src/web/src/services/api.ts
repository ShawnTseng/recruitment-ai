const API_BASE = import.meta.env.VITE_API_URL || '';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
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
  title: string;
  blobUrl: string | null;
  parsedJson: string | null;
  promptVersion: string | null;
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
  getByRecruiter: (recruiterId: string) =>
    request<JobDescription[]>(`/api/job-descriptions?recruiterId=${recruiterId}`),

  getById: (id: string) =>
    request<JobDescription>(`/api/job-descriptions/${id}`),

  create: (recruiterId: string, data: { title: string; rawText?: string }) =>
    request<JobDescription>(`/api/job-descriptions?recruiterId=${recruiterId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  upload: async (recruiterId: string, title: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(
      `${API_BASE}/api/job-descriptions/upload?recruiterId=${recruiterId}&title=${encodeURIComponent(title)}`,
      { method: 'POST', body: formData }
    );
    if (!res.ok) throw new Error(`Upload failed: ${res.statusText}`);
    return res.json() as Promise<JobDescription>;
  },

  parse: (id: string) =>
    request<{ jobDescriptionId: string; parsedJson: string }>(
      `/api/job-descriptions/${id}/parse`,
      { method: 'POST' }
    ),
};

// --- Candidates ---

export const candidateApi = {
  getByWorkspace: (workspaceId: string) =>
    request<Candidate[]>(`/api/candidates?workspaceId=${workspaceId}`),

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

  getByRecruiter: (recruiterId: string) =>
    request<ClientFeedback[]>(`/api/feedback?recruiterId=${recruiterId}`),
};
