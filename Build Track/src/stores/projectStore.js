import { create } from "zustand";
import { persist } from "zustand/middleware";
import { projectAPI } from "../api";

const useProjectStore = create(
  persist(
    (set) => ({
      projects: [],
      selectedProject: null,
      loading: false,
      error: null,
      stats: {},

      async fetchProjects(params = {}) {
        set({ loading: true, error: null });
        try {
          const { data } = await projectAPI.getAll(params);
          const list = Array.isArray(data) ? data : data.projects || [];
          set({ projects: list, loading: false });
          return list;
        } catch (err) {
          set({ error: err.message || "Failed to load projects", loading: false });
          return [];
        }
      },

      async fetchProjectById(id) {
        try {
          const { data } = await projectAPI.getById(id);
          const project = data.project || data;
          set((state) => ({
            selectedProject: project,
            projects: state.projects.map((p) =>
              (p._id || p.id) === id ? project : p
            ),
          }));
          return project;
        } catch (err) {
          set({ error: err.message || "Failed to load project" });
          return null;
        }
      },

      async fetchProjectStats(id) {
        try {
          const { data } = await projectAPI.getStats(id);
          set((state) => ({
            stats: { ...state.stats, [id]: data.stats || data },
          }));
          return data.stats || data;
        } catch {
          return null;
        }
      },

      async createProject(projectData) {
        try {
          const { data } = await projectAPI.create(projectData);
          const newProject = data.project || data;
          set((state) => ({ projects: [newProject, ...state.projects] }));
          return newProject;
        } catch (err) {
          set({ error: err.message || "Failed to create project" });
          throw err;
        }
      },

      async updateProject(id, updates) {
        try {
          const { data } = await projectAPI.update(id, updates);
          const updated = data.project || data;
          set((state) => ({
            projects: state.projects.map((p) =>
              (p._id || p.id) === id ? updated : p
            ),
            selectedProject: (state.selectedProject?._id || state.selectedProject?.id) === id
              ? updated
              : state.selectedProject,
          }));
          return updated;
        } catch (err) {
          set({ error: err.message || "Failed to update project" });
          throw err;
        }
      },

      async deleteProject(id) {
        try {
          await projectAPI.delete(id);
          set((state) => ({
            projects: state.projects.filter((p) => (p._id || p.id) !== id),
            selectedProject: (state.selectedProject?._id || state.selectedProject?.id) === id
              ? null
              : state.selectedProject,
          }));
          return true;
        } catch (err) {
          set({ error: err.message || "Failed to delete project" });
          throw err;
        }
      },

      setSelectedProject(project) {
        set({ selectedProject: project });
      },

      clearError() {
        set({ error: null });
      },
    }),
    {
      name: "bt_projects",
      partialize: (state) => ({
        projects: state.projects,
        selectedProject: state.selectedProject,
      }),
    }
  )
);

export default useProjectStore;
