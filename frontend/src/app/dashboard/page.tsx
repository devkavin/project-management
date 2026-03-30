"use client";

import api from "@/lib/api";
import { Space, Task, TaskStatus, Workspace } from "@/lib/types";
import { useAuthStore } from "@/store/auth-store";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type ViewData = {
  workspace: Workspace & { spaces: (Space & { tasks: Task[] })[] };
  board: { id: number; name: string; tasks: Task[] }[];
  calendar: Task[];
  gantt: Task[];
};

const statuses: TaskStatus[] = ["todo", "in_progress", "done"];

export default function DashboardPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [activeWorkspace, setActiveWorkspace] = useState<number | null>(null);
  const [view, setView] = useState<"list" | "board" | "calendar" | "gantt">("list");
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const workspaces = useQuery<Workspace[]>({
    queryKey: ["workspaces"],
    queryFn: async () => (await api.get("/workspaces")).data,
  });

  const viewData = useQuery<ViewData>({
    queryKey: ["workspace-view", activeWorkspace],
    enabled: !!activeWorkspace,
    queryFn: async () => (await api.get(`/workspaces/${activeWorkspace}/views`)).data,
  });

  const createWorkspace = useMutation({
    mutationFn: async () => (await api.post("/workspaces", { name: `Workspace ${dayjs().format("HHmmss")}` })).data,
    onSuccess: async (workspace) => {
      setActiveWorkspace(workspace.id);
      await qc.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });

  const createSpace = useMutation({
    mutationFn: async () => api.post(`/workspaces/${activeWorkspace}/spaces`, { name: `Space ${dayjs().format("HHmmss")}` }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["workspace-view", activeWorkspace] });
    },
  });

  const createTask = useMutation({
    mutationFn: async ({ spaceId, parentId }: { spaceId: number; parentId?: number }) =>
      api.post(`/spaces/${spaceId}/tasks`, {
        title: parentId ? `Subtask ${dayjs().format("HHmmss")}` : `Task ${dayjs().format("HHmmss")}`,
        parent_id: parentId ?? null,
        status: "todo",
        priority: "medium",
        start_date: dayjs().format("YYYY-MM-DD"),
        due_date: dayjs().add(4, "day").format("YYYY-MM-DD"),
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["workspace-view", activeWorkspace] });
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (taskId: number) => api.delete(`/tasks/${taskId}`),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["workspace-view", activeWorkspace] });
    },
  });

  const changeStatus = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: number; status: TaskStatus }) =>
      api.patch(`/tasks/${taskId}`, { status }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["workspace-view", activeWorkspace] });
    },
  });

  const columns = useMemo(() => {
    const tasks = viewData.data?.workspace.spaces.flatMap((space) => space.tasks).filter((task) => !task.parent_id) ?? [];

    return statuses.map((status) => ({
      status,
      tasks: tasks.filter((task) => task.status === status),
    }));
  }, [viewData.data]);

  const calendarDays = useMemo(() => {
    const monthStart = dayjs().startOf("month");
    const firstGridDay = monthStart.startOf("week");
    return Array.from({ length: 42 }, (_, i) => firstGridDay.add(i, "day"));
  }, []);

  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const task of viewData.data?.calendar ?? []) {
      if (!task.due_date) continue;
      map[task.due_date] = [...(map[task.due_date] ?? []), task];
    }
    return map;
  }, [viewData.data]);

  const logout = () => {
    clearAuth();
    router.push("/login");
  };

  if (workspaces.isError) {
    router.push("/login");
  }

  return (
    <main className="min-h-screen bg-[#1b1d22] text-[#e9ecf1]">
      <div className="grid min-h-screen grid-cols-[260px_1fr]">
        <aside className="border-r border-[#2b2f36] bg-[#16181d] p-4">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-lg font-semibold">Project</h1>
            <button className="rounded bg-[#7557ff] px-2 py-1 text-sm" onClick={() => createWorkspace.mutate()}>
              New
            </button>
          </div>
          <div className="space-y-2">
            {workspaces.data?.map((workspace) => (
              <button
                key={workspace.id}
                onClick={() => setActiveWorkspace(workspace.id)}
                className={clsx(
                  "w-full rounded px-3 py-2 text-left text-sm",
                  activeWorkspace === workspace.id ? "bg-[#2c3140] text-white" : "bg-[#21252d] text-[#cfd5df]",
                )}
              >
                <div>{workspace.name}</div>
                <div className="text-xs opacity-70">{workspace.spaces_count ?? 0} spaces</div>
              </button>
            ))}
          </div>
          <button className="mt-4 w-full rounded border border-[#3a3f4a] px-3 py-2 text-sm" onClick={logout}>
            Sign out
          </button>
        </aside>

        <section className="p-5">
          <div className="mb-5 flex flex-wrap items-center gap-2 border-b border-[#2b2f36] pb-4">
            <button className="rounded bg-[#7557ff] px-3 py-2 text-sm" disabled={!activeWorkspace} onClick={() => createSpace.mutate()}>
              Add space
            </button>
            {(["list", "board", "calendar", "gantt"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setView(tab)}
                className={clsx(
                  "rounded px-3 py-2 text-sm",
                  tab === view ? "bg-[#2c3140] text-white" : "bg-[#21252d] text-[#cfd5df]",
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          {view === "list" && (
            <div className="space-y-4">
              {viewData.data?.workspace.spaces.map((space) => (
                <div key={space.id} className="rounded-lg border border-[#2b2f36] bg-[#191c22] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="font-medium">{space.name}</h2>
                    <button className="rounded bg-[#7557ff] px-2 py-1 text-sm" onClick={() => createTask.mutate({ spaceId: space.id })}>
                      New task
                    </button>
                  </div>

                  <div className="space-y-2">
                    {space.tasks.filter((task) => !task.parent_id).map((task) => (
                      <div key={task.id} className="rounded bg-[#21252d] p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <div className="font-medium">{task.title}</div>
                          <div className="flex gap-2 text-xs">
                            <button className="rounded border border-[#3a3f4a] px-2 py-1" onClick={() => createTask.mutate({ spaceId: space.id, parentId: task.id })}>Subtask</button>
                            <button className="rounded border border-[#3a3f4a] px-2 py-1" onClick={() => deleteTask.mutate(task.id)}>Delete</button>
                          </div>
                        </div>
                        <div className="mb-2 flex gap-2">
                          {statuses.map((status) => (
                            <button
                              key={status}
                              className={clsx(
                                "rounded px-2 py-1 text-xs",
                                task.status === status ? "bg-[#7557ff]" : "bg-[#2b2f36]",
                              )}
                              onClick={() => changeStatus.mutate({ taskId: task.id, status })}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                        {(task.subtasks ?? []).map((subtask) => (
                          <div key={subtask.id} className="ml-4 mt-2 rounded bg-[#181b20] px-2 py-1 text-sm text-[#bfc6d3]">
                            {subtask.title}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {view === "board" && (
            <div className="grid gap-4 md:grid-cols-3">
              {columns.map((column) => (
                <div key={column.status} className="rounded-lg border border-[#2b2f36] bg-[#191c22] p-3">
                  <div className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#aeb6c4]">{column.status}</div>
                  <div className="space-y-2">
                    {column.tasks.map((task) => (
                      <div key={task.id} className="rounded bg-[#21252d] p-2 text-sm">
                        <div>{task.title}</div>
                        <div className="mt-1 text-xs text-[#9ca5b5]">{task.priority}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {view === "calendar" && (
            <div className="rounded-lg border border-[#2b2f36] bg-[#191c22] p-3">
              <div className="mb-3 grid grid-cols-7 gap-2 text-center text-xs uppercase text-[#9ca5b5]">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <div key={day}>{day}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((date) => {
                  const key = date.format("YYYY-MM-DD");
                  const inMonth = date.month() === dayjs().month();

                  return (
                    <div key={key} className={clsx("min-h-24 rounded border p-2", inMonth ? "border-[#313742]" : "border-[#262b33] text-[#657084]") }>
                      <div className="mb-1 text-xs">{date.format("D")}</div>
                      {(tasksByDate[key] ?? []).slice(0, 3).map((task) => (
                        <div key={task.id} className="mb-1 rounded bg-[#7557ff] px-1 py-0.5 text-xs">
                          {task.title}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {view === "gantt" && (
            <div className="rounded-lg border border-[#2b2f36] bg-[#191c22] p-4">
              <div className="space-y-3">
                {(viewData.data?.gantt ?? []).map((task) => {
                  const start = dayjs(task.start_date);
                  const end = dayjs(task.due_date);
                  const monthStart = dayjs().startOf("month");
                  const offset = Math.max(0, start.diff(monthStart, "day"));
                  const span = Math.max(1, end.diff(start, "day") + 1);
                  return (
                    <div key={task.id}>
                      <div className="mb-1 text-sm">{task.title}</div>
                      <div className="relative h-6 rounded bg-[#232833]">
                        <div className="absolute h-6 rounded bg-[#00c2ff]" style={{ left: `${offset * 3.2}%`, width: `${span * 3.2}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
