import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  jobDescriptionApi,
  questionnaireApi,
  type JobDescription,
  type Questionnaire,
  type QuestionItem,
} from '../services/api'

export default function JdDetail() {
  const { id } = useParams<{ id: string }>();
  const [jd, setJd] = useState<JobDescription | null>(null);
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [parsing, setParsing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      jobDescriptionApi.getById(id),
      questionnaireApi.getByJd(id),
    ])
      .then(([jdData, qData]) => { setJd(jdData); setQuestionnaires(qData); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleParse = async () => {
    if (!id) return;
    setParsing(true);
    setError(null);
    try {
      const result = await jobDescriptionApi.parse(id);
      setJd(prev => prev ? { ...prev, parsedJson: result.parsedJson } : prev);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Parse failed');
    } finally {
      setParsing(false);
    }
  };

  const handleGenerate = async () => {
    if (!id) return;
    setGenerating(true);
    setError(null);
    try {
      const q = await questionnaireApi.generate({ jobDescriptionId: id });
      setQuestionnaires(prev => [...prev, q]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <p style={{ color: '#5f6368' }}>Loading...</p>;
  if (!jd) return <p style={{ color: '#d93025' }}>Job description not found.</p>;

  const parsedData = jd.parsedJson ? JSON.parse(jd.parsedJson) : null;

  return (
    <div>
      <Link to="/recruiter" style={{ fontSize: '0.85rem', color: '#1a73e8' }}>&larr; Back to JD List</Link>
      <h2 style={{ margin: '12px 0 24px' }}>{jd.title}</h2>

      {error && <div style={{ color: '#d93025', marginBottom: '16px' }}>{error}</div>}

      {/* JD Info Card */}
      <div style={cardStyle}>
        <h3 style={sectionTitle}>JD Information</h3>
        <div style={{ display: 'grid', gap: '8px', fontSize: '0.9rem' }}>
          <div><strong>Status:</strong>{' '}
            {jd.parsedJson
              ? <span style={{ color: '#0d904f', fontWeight: 600 }}>Parsed</span>
              : <span style={{ color: '#f9ab00', fontWeight: 600 }}>Pending Parse</span>}
          </div>
          <div><strong>Created:</strong> {new Date(jd.createdAt).toLocaleString()}</div>
          {jd.blobUrl && <div><strong>File:</strong> Uploaded</div>}
        </div>

        {!jd.parsedJson && (
          <button onClick={handleParse} disabled={parsing} style={{ ...primaryBtn, marginTop: '16px' }}>
            {parsing ? 'Parsing with AI...' : 'Parse JD with AI'}
          </button>
        )}
      </div>

      {/* Parsed Results */}
      {parsedData && (
        <div style={{ ...cardStyle, marginTop: '16px' }}>
          <h3 style={sectionTitle}>Parsed Requirements</h3>
          {parsedData.summary && <p style={{ color: '#333', marginBottom: '12px' }}>{parsedData.summary}</p>}

          {parsedData.requiredSkills?.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <strong style={{ fontSize: '0.85rem' }}>Skills:</strong>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                {parsedData.requiredSkills.map((s: { name: string; importance: string }, i: number) => (
                  <span key={i} style={{
                    padding: '2px 10px', borderRadius: '12px', fontSize: '0.8rem',
                    background: s.importance === 'required' ? '#e8f0fe' : '#f1f3f4',
                    color: s.importance === 'required' ? '#1a73e8' : '#5f6368',
                    fontWeight: s.importance === 'required' ? 600 : 400,
                  }}>
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {parsedData.experienceLevel && (
            <div><strong style={{ fontSize: '0.85rem' }}>Level:</strong> {parsedData.experienceLevel}
              {parsedData.yearsOfExperience && ` (${parsedData.yearsOfExperience} years)`}
            </div>
          )}

          <button onClick={handleGenerate} disabled={generating} style={{ ...primaryBtn, marginTop: '16px' }}>
            {generating ? 'Generating Questions...' : 'Generate Questionnaire'}
          </button>
        </div>
      )}

      {/* Questionnaires */}
      {questionnaires.length > 0 && (
        <div style={{ ...cardStyle, marginTop: '16px' }}>
          <h3 style={sectionTitle}>Generated Questionnaires</h3>
          {questionnaires.map(q => {
            let questions: QuestionItem[] = [];
            try { questions = JSON.parse(q.questionsJson); } catch { /* skip */ }
            return (
              <div key={q.id} style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #eee' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.85rem', color: '#5f6368' }}>
                    v{q.templateVersion} — {new Date(q.createdAt).toLocaleString()}
                  </span>
                  <Link to={`/recruiter/candidates?questionnaireId=${q.id}`} style={{ fontSize: '0.85rem' }}>
                    Assign to Candidates →
                  </Link>
                </div>
                {questions.map((item, idx) => (
                  <div key={idx} style={{ marginBottom: '12px', padding: '12px', background: '#f8f9fa', borderRadius: '6px' }}>
                    <div style={{ fontSize: '0.8rem', color: '#1a73e8', fontWeight: 600, marginBottom: '4px' }}>
                      Q{item.id || idx + 1}. {item.category}
                    </div>
                    <div style={{ fontSize: '0.9rem' }}>{item.question}</div>
                    {item.relatedSkills?.length > 0 && (
                      <div style={{ marginTop: '6px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {item.relatedSkills.map((s, si) => (
                          <span key={si} style={{ fontSize: '0.7rem', padding: '1px 6px', background: '#e8f0fe', borderRadius: '8px', color: '#1a73e8' }}>
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: 'white', borderRadius: '8px', padding: '20px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
};
const sectionTitle: React.CSSProperties = {
  fontSize: '1rem', color: '#333', marginBottom: '12px',
};
const primaryBtn: React.CSSProperties = {
  background: '#1a73e8', color: 'white', border: 'none', padding: '10px 24px',
  borderRadius: '6px', fontSize: '0.9rem', cursor: 'pointer',
};
