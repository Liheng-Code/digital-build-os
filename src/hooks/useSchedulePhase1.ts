import { useCallback, useEffect, useState } from "react";
import {
  Calendar, WbsBaseline, BaselineTask, TaskScheduleCalc,
  listCalendars, listBaselines, listBaselineTasks, listScheduleCalc,
} from "@/services/scheduleService";

export function useCalendars(projectId: string | null | undefined) {
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [loading, setLoading] = useState(false);
  const refresh = useCallback(async () => {
    if (!projectId) { setCalendars([]); return; }
    setLoading(true);
    try { setCalendars(await listCalendars(projectId)); } finally { setLoading(false); }
  }, [projectId]);
  useEffect(() => { refresh(); }, [refresh]);
  return { calendars, loading, refresh };
}

export function useBaselines(projectId: string | null | undefined) {
  const [baselines, setBaselines] = useState<WbsBaseline[]>([]);
  const [activeTasks, setActiveTasks] = useState<Map<string, BaselineTask>>(new Map());
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!projectId) { setBaselines([]); setActiveTasks(new Map()); return; }
    setLoading(true);
    try {
      const list = await listBaselines(projectId);
      setBaselines(list);
      const active = list.find((b) => b.is_active);
      if (active) {
        const tasks = await listBaselineTasks(active.id);
        const map = new Map<string, BaselineTask>();
        tasks.forEach((t) => map.set(t.task_id, t));
        setActiveTasks(map);
      } else {
        setActiveTasks(new Map());
      }
    } finally { setLoading(false); }
  }, [projectId]);
  useEffect(() => { refresh(); }, [refresh]);

  const activeBaseline = baselines.find((b) => b.is_active) ?? null;
  return { baselines, activeBaseline, activeTasks, loading, refresh };
}

export function useCpm(projectId: string | null | undefined) {
  const [byTask, setByTask] = useState<Map<string, TaskScheduleCalc>>(new Map());
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!projectId) { setByTask(new Map()); return; }
    setLoading(true);
    try {
      const list = await listScheduleCalc(projectId);
      const m = new Map<string, TaskScheduleCalc>();
      list.forEach((c) => m.set(c.task_id, c));
      setByTask(m);
    } finally { setLoading(false); }
  }, [projectId]);
  useEffect(() => { refresh(); }, [refresh]);

  return { byTask, loading, refresh };
}
