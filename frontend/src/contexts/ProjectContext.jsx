import { createContext, useContext, useState, useCallback } from 'react';
import { projectAPI } from '../api';

const ProjectContext = createContext(null);

export function ProjectProvider({ children }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentProject, setCurrentProject] = useState(null);

  const fetchProjects = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    try {
      const res = await projectAPI.getAll(params);
      const data = res.data?.projects || res.data || [];
      setProjects(data);
      return data;
    } catch (err) {
      setError(err.friendlyMessage || 'Failed to load projects');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProject = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const res = await projectAPI.getById(id);
      setCurrentProject(res.data);
      return res.data;
    } catch (err) {
      setError(err.friendlyMessage || 'Failed to load project');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createProject = useCallback(async (formData) => {
    const res = await projectAPI.create(formData);
    await fetchProjects();
    return res.data;
  }, [fetchProjects]);

  const updateProject = useCallback(async (id, formData) => {
    const res = await projectAPI.update(id, formData);
    setProjects((prev) =>
      prev.map((p) => (p._id === id || p.id === id ? res.data : p))
    );
    return res.data;
  }, []);

  const deleteProject = useCallback(async (id) => {
    await projectAPI.delete(id);
    setProjects((prev) => prev.filter((p) => p._id !== id && p.id !== id));
  }, []);

  const value = {
    projects, loading, error, currentProject,
    fetchProjects, fetchProject,
    createProject, updateProject, deleteProject,
    setCurrentProject,
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjects() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProjects must be used within ProjectProvider');
  return ctx;
}

export default ProjectContext;
