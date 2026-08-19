import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { services, type AlertFilters, type HuntQuery } from "@/services";
import { toast } from "sonner";

export const qk = {
  metrics: ["dashboard", "metrics"] as const,
  feed: ["dashboard", "feed"] as const,
  health: ["system", "health"] as const,
  alerts: (f: AlertFilters) => ["alerts", f] as const,
  alert: (id: string) => ["alert", id] as const,
  incidents: (s: string) => ["incidents", s] as const,
  incident: (id: string) => ["incident", id] as const,
  cases: (s: string) => ["cases", s] as const,
  case: (id: string) => ["case", id] as const,
  iocs: (s: string) => ["iocs", s] as const,
  feeds: ["intel", "feeds"] as const,
  actors: ["intel", "actors"] as const,
  matches: ["intel", "matches"] as const,
  assets: (s: string) => ["assets", s] as const,
  rules: (s: string) => ["rules", s] as const,
  hunts: ["hunting", "saved"] as const,
  reports: ["reports"] as const,
  notifications: ["notifications"] as const,
  adminStats: ["admin", "stats"] as const,
  adminUsers: ["admin", "users"] as const,
  auditLogs: (s: string) => ["admin", "audit", s] as const,
  sessions: ["auth", "sessions"] as const,
};

export const useMetrics = () =>
  useQuery({ queryKey: qk.metrics, queryFn: () => services.dashboard.metrics() });
export const useLiveFeed = () =>
  useQuery({ queryKey: qk.feed, queryFn: () => services.dashboard.liveFeed() });
export const useSystemHealth = () =>
  useQuery({ queryKey: qk.health, queryFn: () => services.dashboard.systemHealth() });

export const useAlerts = (filters: AlertFilters) =>
  useQuery({ queryKey: qk.alerts(filters), queryFn: () => services.alerts.list(filters) });
export const useAlert = (id: string | null) =>
  useQuery({ queryKey: qk.alert(id ?? ""), queryFn: () => services.alerts.get(id!), enabled: !!id });

export function useAlertActions() {
  const qc = useQueryClient();
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["alerts"] });
    void qc.invalidateQueries({ queryKey: ["alert"] });
    void qc.invalidateQueries({ queryKey: ["dashboard"] });
  };
  const update = useMutation({
    mutationFn: (v: { id: string; patch: Parameters<typeof services.alerts.update>[1] }) =>
      services.alerts.update(v.id, v.patch),
    onSuccess: () => {
      invalidate();
      toast.success("Alert updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const addNote = useMutation({
    mutationFn: (v: { id: string; body: string }) => services.alerts.addNote(v.id, v.body),
    onSuccess: () => {
      invalidate();
      toast.success("Note added to investigation");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const escalate = useMutation({
    mutationFn: (id: string) => services.incidents.createFromAlert(id),
    onSuccess: (inc) => {
      invalidate();
      void qc.invalidateQueries({ queryKey: ["incidents"] });
      toast.success(`Incident ${inc.id} created`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return { update, addNote, escalate };
}

export const useIncidents = (search: string) =>
  useQuery({ queryKey: qk.incidents(search), queryFn: () => services.incidents.list(search) });
export const useIncident = (id: string | null) =>
  useQuery({ queryKey: qk.incident(id ?? ""), queryFn: () => services.incidents.get(id!), enabled: !!id });
export function useIncidentUpdate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; patch: Parameters<typeof services.incidents.update>[1] }) =>
      services.incidents.update(v.id, v.patch),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["incidents"] });
      void qc.invalidateQueries({ queryKey: ["incident"] });
      toast.success("Incident updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export const useCases = (search: string) =>
  useQuery({ queryKey: qk.cases(search), queryFn: () => services.cases.list(search) });
export const useCase = (id: string | null) =>
  useQuery({ queryKey: qk.case(id ?? ""), queryFn: () => services.cases.get(id!), enabled: !!id });
export function useCaseActions() {
  const qc = useQueryClient();
  const done = (msg: string) => {
    void qc.invalidateQueries({ queryKey: ["cases"] });
    void qc.invalidateQueries({ queryKey: ["case"] });
    toast.success(msg);
  };
  return {
    create: useMutation({
      mutationFn: services.cases.create,
      onSuccess: (c) => done(`Case ${c.id} created`),
      onError: (e: Error) => toast.error(e.message),
    }),
    update: useMutation({
      mutationFn: (v: { id: string; patch: Parameters<typeof services.cases.update>[1] }) =>
        services.cases.update(v.id, v.patch),
      onSuccess: () => done("Case updated"),
      onError: (e: Error) => toast.error(e.message),
    }),
    toggleTask: useMutation({
      mutationFn: (v: { caseId: string; taskId: string }) => services.cases.toggleTask(v.caseId, v.taskId),
      onSuccess: () => done("Task updated"),
      onError: (e: Error) => toast.error(e.message),
    }),
  };
}

export const useIocs = (search: string) =>
  useQuery({ queryKey: qk.iocs(search), queryFn: () => services.iocs.list(search) });
export function useIocActions() {
  const qc = useQueryClient();
  const done = (m: string) => {
    void qc.invalidateQueries({ queryKey: ["iocs"] });
    toast.success(m);
  };
  return {
    create: useMutation({
      mutationFn: services.iocs.create,
      onSuccess: (i) => done(`Indicator ${i.id} created`),
      onError: (e: Error) => toast.error(e.message),
    }),
    remove: useMutation({
      mutationFn: services.iocs.remove,
      onSuccess: () => done("Indicator deleted"),
      onError: (e: Error) => toast.error(e.message),
    }),
  };
}

export const useFeeds = () => useQuery({ queryKey: qk.feeds, queryFn: () => services.intel.feeds() });
export const useActors = () => useQuery({ queryKey: qk.actors, queryFn: () => services.intel.actors() });
export const useIntelMatches = () =>
  useQuery({ queryKey: qk.matches, queryFn: () => services.intel.recentMatches() });
export function useFeedToggle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; enabled: boolean }) => services.intel.toggleFeed(v.id, v.enabled),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.feeds });
      toast.success("Threat feed configuration saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export const useAssets = (search: string) =>
  useQuery({ queryKey: qk.assets(search), queryFn: () => services.assets.list(search) });

export const useRules = (search: string) =>
  useQuery({ queryKey: qk.rules(search), queryFn: () => services.rules.list(search) });
export function useRuleToggle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; enabled: boolean }) => services.rules.toggle(v.id, v.enabled),
    onSuccess: (_d, v) => {
      void qc.invalidateQueries({ queryKey: ["rules"] });
      toast.success(`Rule ${v.id} ${v.enabled ? "enabled" : "disabled"}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export const useSavedHunts = () => useQuery({ queryKey: qk.hunts, queryFn: () => services.hunting.saved() });
export function useHuntRun() {
  return useMutation({
    mutationFn: (q: HuntQuery) => services.hunting.run(q),
    onError: (e: Error) => toast.error(e.message),
  });
}
export function useHuntSave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: services.hunting.save,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.hunts });
      toast.success("Hunt saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export const useReports = () => useQuery({ queryKey: qk.reports, queryFn: () => services.reports.list() });
export function useReportGenerate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: services.reports.generate,
    onSuccess: (r) => {
      void qc.invalidateQueries({ queryKey: qk.reports });
      toast.success(`${r.name} generated`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export const useNotifications = () =>
  useQuery({ queryKey: qk.notifications, queryFn: () => services.notifications.list() });
export function useNotificationActions() {
  const qc = useQueryClient();
  const inv = () => void qc.invalidateQueries({ queryKey: qk.notifications });
  return {
    markRead: useMutation({ mutationFn: services.notifications.markRead, onSuccess: inv }),
    markAllRead: useMutation({
      mutationFn: services.notifications.markAllRead,
      onSuccess: () => {
        inv();
        toast.success("All notifications marked as read");
      },
    }),
  };
}

export const useAdminStats = () => useQuery({ queryKey: qk.adminStats, queryFn: () => services.admin.stats() });
export const useAdminUsers = () => useQuery({ queryKey: qk.adminUsers, queryFn: () => services.admin.users() });
export const useAuditLogs = (search: string) =>
  useQuery({ queryKey: qk.auditLogs(search), queryFn: () => services.admin.auditLogs(search) });
export const useSessions = () => useQuery({ queryKey: qk.sessions, queryFn: () => services.auth.sessions() });
export function useUserAdminActions() {
  const qc = useQueryClient();
  const done = (m: string) => {
    void qc.invalidateQueries({ queryKey: ["admin"] });
    toast.success(m);
  };
  return {
    update: useMutation({
      mutationFn: (v: { id: string; patch: Parameters<typeof services.admin.updateUser>[1]; message?: string }) =>
        services.admin.updateUser(v.id, v.patch),
      onSuccess: (_d, v) => done(v.message ?? "User updated"),
      onError: (e: Error) => toast.error(e.message),
    }),
    revokeSession: useMutation({
      mutationFn: services.auth.revokeSession,
      onSuccess: () => {
        void qc.invalidateQueries({ queryKey: qk.sessions });
        toast.success("Session revoked");
      },
      onError: (e: Error) => toast.error(e.message),
    }),
  };
}

export function useDebounced<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useStateSafe(value);
  useEffectSafe(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

import { useState as useStateSafe, useEffect as useEffectSafe } from "react";
