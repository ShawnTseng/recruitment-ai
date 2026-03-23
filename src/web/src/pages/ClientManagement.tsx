import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { clientApi, jobDescriptionApi, type Client, type JobDescription } from '../services/api'

export default function ClientManagement() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [jdCounts, setJdCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const loadClients = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await clientApi.getAll();
      setClients(list);
      // Load JD counts per client
      const counts: Record<string, number> = {};
      await Promise.all(list.map(async c => {
        try {
          const jds: JobDescription[] = await jobDescriptionApi.getAll(c.id);
          counts[c.id] = jds.length;
        } catch { counts[c.id] = 0; }
      }));
      setJdCounts(counts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadClients(); }, []);

  const openCreate = () => {
    setEditClient(null);
    setName('');
    setDescription('');
    setShowForm(true);
  };

  const openEdit = (c: Client) => {
    setEditClient(c);
    setName(c.name);
    setDescription(c.description ?? '');
    setShowForm(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      if (editClient) {
        const updated = await clientApi.update(editClient.id, { name: name.trim(), description: description.trim() || undefined });
        setClients(prev => prev.map(c => c.id === updated.id ? updated : c));
      } else {
        const created = await clientApi.create({ name: name.trim(), description: description.trim() || undefined });
        setClients(prev => [...prev, created]);
        setJdCounts(prev => ({ ...prev, [created.id]: 0 }));
      }
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save client');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this client? JDs assigned to it will be unassigned.')) return;
    setError(null);
    try {
      await clientApi.delete(id);
      setClients(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete client');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button onClick={() => navigate('/recruiter')} style={backBtn}>← Back</button>
        <h2 style={{ margin: 0 }}>Client Management</h2>
      </div>

      {error && <div style={errorBox}>{error}</div>}

      {showForm && (
        <div style={{ ...cardStyle, marginBottom: '20px', border: '1px solid #1a73e8' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1rem' }}>{editClient ? 'Edit Client' : 'New Client'}</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>Client Name *</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="e.g. Accenture" style={inputStyle} required autoFocus />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Optional notes about this client..."
                style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" disabled={saving} style={primaryBtn}>
                {saving ? 'Saving...' : editClient ? 'Save Changes' : 'Create Client'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} style={secondaryBtn}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <span style={{ color: '#5f6368', fontSize: '0.9rem' }}>{clients.length} client(s)</span>
        {!showForm && (
          <button onClick={openCreate} style={primaryBtn}>+ New Client</button>
        )}
      </div>

      {loading ? <p style={{ color: '#5f6368' }}>Loading...</p>
        : clients.length === 0 ? (
          <div style={cardStyle}>
            <p style={{ color: '#5f6368', textAlign: 'center' }}>
              No clients yet. Create a client to categorize your Job Descriptions.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {clients.map(c => (
              <div key={c.id} style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 4px', fontSize: '1rem' }}>{c.name}</h3>
                    {c.description && <p style={{ margin: '0 0 8px', fontSize: '0.875rem', color: '#5f6368' }}>{c.description}</p>}
                    <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: '#5f6368' }}>
                      <span>📄 {jdCounts[c.id] ?? 0} JD(s)</span>
                      <span>Created {new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
                    <button onClick={() => navigate(`/recruiter?client=${c.id}`)} style={{ ...secondaryBtn, padding: '6px 12px', fontSize: '0.8rem' }}>
                      View JDs
                    </button>
                    <button onClick={() => openEdit(c)} style={{ ...secondaryBtn, padding: '6px 12px', fontSize: '0.8rem' }}>
                      Edit
                    </button>
                    <button onClick={() => handleDelete(c.id)}
                      style={{ background: '#fce8e6', color: '#d93025', border: '1px solid #d93025', borderRadius: '6px', padding: '6px 12px', fontSize: '0.8rem', cursor: 'pointer' }}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: 'white', borderRadius: '8px', padding: '16px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
};
const errorBox: React.CSSProperties = {
  color: '#d93025', background: '#fce8e6', padding: '12px', borderRadius: '6px', marginBottom: '16px',
};
const labelStyle: React.CSSProperties = {
  display: 'block', marginBottom: '4px', fontSize: '0.875rem', fontWeight: 600, color: '#333',
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', border: '1px solid #dadce0', borderRadius: '6px',
  fontSize: '0.9rem', boxSizing: 'border-box',
};
const primaryBtn: React.CSSProperties = {
  background: '#1a73e8', color: 'white', border: 'none', padding: '8px 20px',
  borderRadius: '6px', fontSize: '0.9rem', cursor: 'pointer',
};
const secondaryBtn: React.CSSProperties = {
  background: 'white', color: '#333', border: '1px solid #dadce0',
  borderRadius: '6px', cursor: 'pointer', padding: '8px 20px', fontSize: '0.9rem',
};
const backBtn: React.CSSProperties = {
  background: 'none', border: 'none', color: '#1a73e8', fontSize: '0.9rem',
  cursor: 'pointer', padding: '4px 0',
};
