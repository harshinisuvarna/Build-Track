import useAuthStore from "../stores/authStore";

export function canEditEntry({ status, createdBy, projectId }) {
  if (status === "approved") return false;
  const state = useAuthStore.getState();
  if (state.isAdmin) return true;
  if (state.isSupervisor) return state.hasProjectAccess(projectId);
  if (state.isMason) return createdBy === state.user?.id;
  return false;
}

export function canDeleteEntry({ status, createdBy, projectId }) {
  return canEditEntry({ status, createdBy, projectId });
}

export function canApproveEntry() {
  const state = useAuthStore.getState();
  return state.isAdmin || state.hasPermission("approve_payments") || state.hasPermission("approve_updates");
}

export function canViewEntry({ createdBy, projectId }) {
  const state = useAuthStore.getState();
  if (state.isAdmin) return true;
  if (state.isSupervisor) return state.hasProjectAccess(projectId);
  if (state.isMason) return createdBy === state.user?.id;
  return false;
}

export function filterEntries(entries) {
  const state = useAuthStore.getState();
  if (state.isAdmin) return entries;
  return entries.filter((e) =>
    canViewEntry({
      createdBy: e.createdBy || e.userId || "",
      projectId: e.projectId || "",
    })
  );
}
