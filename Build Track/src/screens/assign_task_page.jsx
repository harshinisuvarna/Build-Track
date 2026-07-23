import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Badge } from '../components/ui';
import { projectAPI, workerAPI, taskAPI } from '../api';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { colors, gradients } from '../styles/designTokens';

export default function AssignTaskPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);

  const [formData, setFormData] = useState({
    project: '',
    title: '',
    description: '',
    assignedTo: '',
    phaseName: '',
    activityName: '',
  });

  useEffect(() => {
    Promise.all([
      projectAPI.getAll().catch(() => ({ data: { projects: [] } })),
      workerAPI.getAll().catch(() => ({ data: { workers: [] } }))
    ]).then(([projRes, userRes]) => {
      setProjects(projRes.data?.projects || projRes.data || []);
      setUsers(userRes.data?.workers || userRes.data || []);
    });
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.project || !formData.title || !formData.assignedTo) {
      alert('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      await taskAPI.createTask(formData);
      navigate(-1);
    } catch (error) {
      console.error(error);
      alert('Failed to assign task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px 24px', maxWidth: 800, margin: '0 auto', animation: 'fadeUp 300ms ease' }}>
      <button
        onClick={() => navigate(-1)}
        style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: colors.textSecondary, cursor: 'pointer', marginBottom: 24, fontSize: 15, fontWeight: 600 }}
      >
        <ArrowLeft size={18} /> Back
      </button>

      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: colors.textPrimary, margin: '0 0 8px' }}>Assign Task</h1>
        <p style={{ color: colors.textSecondary, margin: 0, fontSize: 15 }}>Create a new daily task and assign it to a team member.</p>
      </div>

      <Card padding={32}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14 }}>Project *</label>
            <select
              name="project"
              value={formData.project}
              onChange={handleChange}
              style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: `1px solid ${colors.border}`, fontSize: 15 }}
            >
              <option value="">Select Project</option>
              {projects.map(p => (
                <option key={p._id || p.id} value={p._id || p.id}>{p.projectName || p.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14 }}>Phase</label>
              <input
                name="phaseName" value={formData.phaseName} onChange={handleChange} placeholder="e.g. Foundation"
                style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: `1px solid ${colors.border}`, fontSize: 15 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14 }}>Activity</label>
              <input
                name="activityName" value={formData.activityName} onChange={handleChange} placeholder="e.g. Concrete Pour"
                style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: `1px solid ${colors.border}`, fontSize: 15 }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14 }}>Task Title *</label>
            <input
              name="title" value={formData.title} onChange={handleChange} placeholder="What needs to be done?"
              style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: `1px solid ${colors.border}`, fontSize: 15 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14 }}>Description</label>
            <textarea
              name="description" value={formData.description} onChange={handleChange} placeholder="Any additional details..." rows={3}
              style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: `1px solid ${colors.border}`, fontSize: 15, fontFamily: 'inherit' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14 }}>Assign To *</label>
            <select
              name="assignedTo"
              value={formData.assignedTo}
              onChange={handleChange}
              style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: `1px solid ${colors.border}`, fontSize: 15 }}
            >
              <option value="">Select Worker</option>
              {users.map(u => (
                <option key={u._id} value={u._id}>{u.name} ({u.role || 'Worker'})</option>
              ))}
            </select>
          </div>

          <div style={{ paddingTop: 16 }}>
            <Button variant="primary" size="lg" style={{ width: '100%' }} type="submit" disabled={loading}>
              {loading ? 'Assigning...' : 'Assign Task'}
            </Button>
          </div>

        </form>
      </Card>
    </div>
  );
}
