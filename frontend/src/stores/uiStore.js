import { create } from "zustand";

const useUIStore = create((set) => ({
  sidebarOpen: true,
  isMobile: window.innerWidth < 640,
  isNarrow: window.innerWidth < 640,
  globalLoading: false,
  toasts: [],

  setSidebarOpen(open) {
    set({ sidebarOpen: open });
  },

  toggleSidebar() {
    set((state) => ({ sidebarOpen: !state.sidebarOpen }));
  },

  setViewport(width) {
    set({
      isMobile: width < 640,
      isNarrow: width < 640,
      sidebarOpen: width >= 640,
    });
  },

  setGlobalLoading(loading) {
    set({ globalLoading: loading });
  },

  addToast(message, type = "info", duration = 4000) {
    const id = Date.now() + Math.random();
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }));
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, duration);
  },

  removeToast(id) {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));

export default useUIStore;
