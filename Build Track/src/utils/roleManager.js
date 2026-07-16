import useAuthStore from "../stores/authStore";

const RoleManager = {
  get isAdmin() {
    return useAuthStore.getState().isAdmin;
  },
  get isSupervisor() {
    return useAuthStore.getState().isSupervisor;
  },
  get isMason() {
    return useAuthStore.getState().isMason;
  },

  hasPermission(key) {
    const state = useAuthStore.getState();
    if (state.isAdmin) return true;
    return state.permissions.includes(key);
  },

  hasProjectAccess(projectId) {
    return useAuthStore.getState().hasProjectAccess(projectId);
  },

  canCreateProject: () => RoleManager.hasPermission("create_project"),
  canEditProject: () => RoleManager.hasPermission("edit_project"),
  canDeleteProject: () => RoleManager.hasPermission("delete_project"),
  canViewAllProjects: () => RoleManager.hasPermission("view_all_projects"),
  canViewAssignedProject: () => RoleManager.hasPermission("view_assigned_project") || RoleManager.hasPermission("view_projects"),
  canViewProjects: () => RoleManager.hasPermission("view_all_projects") || RoleManager.hasPermission("view_assigned_project") || RoleManager.hasPermission("view_projects"),

  canManageBuildingType: () => RoleManager.hasPermission("manage_building_type"),
  canManageFloors: () => RoleManager.hasPermission("manage_floors"),
  canManagePhases: () => RoleManager.hasPermission("manage_phases"),
  canManageActivities: () => RoleManager.hasPermission("manage_activities"),
  canManageChecklists: () => RoleManager.hasPermission("manage_checklists"),

  canManageContractors: () => RoleManager.hasPermission("manage_contractors"),
  canManageUsers: () => RoleManager.hasPermission("manage_users"),
  canAssignRoles: () => RoleManager.hasPermission("assign_roles"),
  canAssignProject: () => RoleManager.hasPermission("assign_project"),
  canManageTeam: () => RoleManager.hasPermission("manage_team"),

  canSubmitDailyUpdate: () => RoleManager.hasPermission("submit_daily_update") || RoleManager.hasPermission("add_entries"),
  canUploadPhotos: () => RoleManager.hasPermission("upload_photos") || RoleManager.hasPermission("add_entries"),
  canUploadVideos: () => RoleManager.hasPermission("upload_videos"),
  canSubmitChecklist: () => RoleManager.hasPermission("submit_checklist") || RoleManager.hasPermission("add_entries"),
  canReportIssue: () => RoleManager.hasPermission("report_issue") || RoleManager.hasPermission("add_entries"),
  canReportDelay: () => RoleManager.hasPermission("report_delay") || RoleManager.hasPermission("add_entries"),
  canAddEntries: () => RoleManager.hasPermission("add_entries") || RoleManager.hasPermission("submit_daily_update"),

  canApproveUpdates: () => RoleManager.hasPermission("approve_updates") || RoleManager.hasPermission("approve_payments"),
  canRejectUpdates: () => RoleManager.hasPermission("reject_updates") || RoleManager.hasPermission("approve_payments"),
  canAddSupervisorRemarks: () => RoleManager.hasPermission("add_supervisor_remarks"),
  canApprovePayments: () => RoleManager.hasPermission("approve_payments") || RoleManager.hasPermission("approve_updates"),

  canViewProgressDashboard: () => RoleManager.hasPermission("view_progress_dashboard") || RoleManager.hasPermission("view_projects"),
  canViewIssueTracker: () => RoleManager.hasPermission("view_issue_tracker"),
  canViewDelayTracker: () => RoleManager.hasPermission("view_delay_tracker"),
  canViewMediaGallery: () => RoleManager.hasPermission("view_media_gallery"),
  canViewReports: () => RoleManager.hasPermission("view_reports"),

  canManageExpenses: () => RoleManager.hasPermission("manage_expenses"),
  canMarkPaid: () => RoleManager.hasPermission("mark_paid"),
  canViewPaymentReports: () => RoleManager.hasPermission("view_payment_reports") || RoleManager.hasPermission("view_reports"),

  canUploadDocuments: () => RoleManager.hasPermission("upload_documents"),
  canViewDocuments: () => RoleManager.hasPermission("view_documents"),

  canManageMaterialMaster: () => RoleManager.hasPermission("manage_material_master"),
  canManageLabourMaster: () => RoleManager.hasPermission("manage_labour_master"),
  canManageEquipmentMaster: () => RoleManager.hasPermission("manage_equipment_master"),
  canManageInventory: () => RoleManager.hasPermission("manage_material_master") || RoleManager.hasPermission("manage_labour_master") || RoleManager.hasPermission("manage_equipment_master"),

  canViewContractorPerformance: () => RoleManager.hasPermission("view_contractor_performance"),

  canViewNotifications: () => true,
  canEditProfile: () => true,

  canDeleteEntries: () => RoleManager.canApprovePayments(),
  canApproveEntries: () => RoleManager.canApprovePayments(),
  canUpdateProgress: () => RoleManager.canAddEntries(),
  canViewTeamAccess: () => RoleManager.isAdmin,

  _restrictedRoutes: {
    "/assign-role": () => RoleManager.canAssignRoles(),
    "/reports": () => RoleManager.canViewReports(),
    "/logs": () => RoleManager.isAdmin || RoleManager.canViewReports(),
    "/approvals": () => RoleManager.canApprovePayments(),
  },

  canNavigate(route) {
    const check = RoleManager._restrictedRoutes[route];
    if (!check) return true;
    return check();
  },
};

export default RoleManager;
