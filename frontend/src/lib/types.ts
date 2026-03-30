export type User = { id: number; name: string; email: string };

export type Workspace = {
  id: number;
  name: string;
  description?: string | null;
  spaces_count?: number;
};

export type Space = {
  id: number;
  workspace_id: number;
  name: string;
  description?: string | null;
  color: string;
};

export type TaskStatus = "todo" | "in_progress" | "done";

export type TaskPriority = "low" | "medium" | "high" | "urgent";

export type Task = {
  id: number;
  space_id: number;
  parent_id: number | null;
  assignee_id: number | null;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  start_date: string | null;
  due_date: string | null;
  progress: number;
  subtasks?: Task[];
};
