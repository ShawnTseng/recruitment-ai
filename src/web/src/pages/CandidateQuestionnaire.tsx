import { useEffect, useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { submissionApi, type QuestionItem } from '../services/api'

export default function CandidateQuestionnaire() {
  const { token } = useParams<{ token: string }>();
  const [jobTitle, setJobTitle] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    submissionApi.getByToken(token)
      .then(info => {
        setJobTitle(info.jobTitle);
        try {
          setQuestions(JSON.parse(info.questionsJson));
        } catch {
          setQuestions([]);
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || !consent) return;

    setSubmitting(true);
    setError(null);
    try {
      const answersJson = JSON.stringify(
        questions.map((q, idx) => ({
          questionId: q.id || idx + 1,
          answer: answers[q.id || idx + 1] || '',
        }))
      );
      await submissionApi.submitAnswers(token, { answersJson, consentAiEvaluation: true });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <p style={{ color: '#5f6368', fontSize: '1.1rem' }}>Loading questionnaire...</p>
      </div>
    );
  }

  if (error && questions.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <h2 style={{ color: '#d93025' }}>Unable to load questionnaire</h2>
        <p style={{ color: '#5f6368' }}>{error}</p>
        <p style={{ color: '#5f6368', fontSize: '0.9rem' }}>
          The link may be expired, invalid, or already used.
        </p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <h2 style={{ color: '#0d904f' }}>Thank You!</h2>
        <p style={{ color: '#333', fontSize: '1.1rem' }}>
          Your answers have been submitted successfully.
        </p>
        <p style={{ color: '#5f6368' }}>
          The recruitment team will review your responses and follow up.
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '4px' }}>Technical Screening Questionnaire</h2>
      {jobTitle && <p style={{ color: '#5f6368', margin: '0 0 24px' }}>Position: {jobTitle}</p>}

      {/* Instructions */}
      <div style={{ ...cardStyle, background: '#f0f4f9', marginBottom: '24px' }}>
        <p style={{ margin: '0 0 8px', fontWeight: 600 }}>Instructions</p>
        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.9rem', lineHeight: 1.8 }}>
          <li>Please answer based on your <strong>actual project experience</strong>.</li>
          <li>For each answer, include: project context, technologies used, and your specific role.</li>
          <li>Short answers are acceptable. Focus on what <strong>you personally did</strong>.</li>
          <li>This questionnaire uses AI-assisted evaluation. Generic or AI-generated answers will be identified.</li>
        </ul>
      </div>

      <form onSubmit={handleSubmit}>
        {questions.map((q, idx) => {
          const qId = q.id || idx + 1;
          return (
            <div key={qId} style={{ ...cardStyle, marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'baseline' }}>
                <span style={{
                  background: '#1a73e8', color: 'white', borderRadius: '50%',
                  width: '28px', height: '28px', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '0.8rem', fontWeight: 600, flexShrink: 0,
                }}>
                  {qId}
                </span>
                {q.category && (
                  <span style={{ fontSize: '0.8rem', color: '#1a73e8', fontWeight: 600 }}>{q.category}</span>
                )}
              </div>
              <p style={{ fontSize: '0.95rem', margin: '0 0 12px', lineHeight: 1.6 }}>{q.question}</p>
              <textarea
                value={answers[qId] || ''}
                onChange={e => setAnswers(prev => ({ ...prev, [qId]: e.target.value }))}
                placeholder="Type your answer here..."
                style={{
                  width: '100%', minHeight: '120px', padding: '10px 12px',
                  border: '1px solid #dadce0', borderRadius: '6px', fontSize: '0.9rem',
                  resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6,
                }}
                required
              />
            </div>
          );
        })}

        {/* Consent */}
        <div style={{ ...cardStyle, marginBottom: '24px' }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={consent}
              onChange={e => setConsent(e.target.checked)}
              style={{ marginTop: '4px' }}
              required
            />
            <span style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>
              I understand and consent to AI-assisted evaluation of my responses.
            </span>
          </label>
        </div>

        {error && <div style={{ color: '#d93025', marginBottom: '16px' }}>{error}</div>}

        <button
          type="submit"
          disabled={submitting || !consent}
          style={{
            background: consent ? '#1a73e8' : '#ccc', color: 'white', border: 'none',
            padding: '14px 32px', borderRadius: '6px', fontSize: '1rem',
            cursor: consent ? 'pointer' : 'not-allowed', width: '100%',
          }}
        >
          {submitting ? 'Submitting...' : 'Submit Answers'}
        </button>
      </form>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: 'white', borderRadius: '8px', padding: '20px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
};
