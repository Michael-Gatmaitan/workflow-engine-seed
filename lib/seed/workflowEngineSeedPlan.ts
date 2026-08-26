import type { CreateStatusPayload } from "@/lib/api/workflowEngine/status";
import type { CreateWorkItemPayload } from "@/lib/api/workflowEngine/workItem";
import type {
  EstimatedDuration,
  PriorityLevel,
  StatusCategory,
} from "@/lib/api/workflowEngine/types";
import {
  ESTIMATED_DURATION_FIELD_NAME,
  TASK_STATUS_NAMES,
} from "@/lib/api/workflowEngine/constants";
import { KANBAN_COLUMN_COLORS } from "../constants";

export type SeedTaskStatus =
  | "todo"
  | "inProgress"
  | "done"
  | "cancelled"
  | "closed";
export type SeedTaskType = "housekeeping" | "maintenance";
export type SeedTaskPriority = "low" | "medium" | "high";

// Backend assignee_id is a Go *uuid.UUID column with no FK check, so any
// well-formed UUID works — these are just fixed placeholders for demo seed
// data, not real user accounts.
const SEED_ASSIGNEE_ID_1 = "05a0a65f-eeae-4f1f-99e1-805f9b4a1d8c";
const SEED_ASSIGNEE_ID_2 = "4f3e1d78-4c94-4cc9-b7ec-240e5e64190c";

export interface SeedTaskComment {
  name: string;
  content: string;
}

export interface SeedTask {
  id: string;
  title: string;
  description?: string;
  status: SeedTaskStatus;
  taskType: SeedTaskType;
  priority: SeedTaskPriority;
  room: string;
  location: string;
  floor?: string;
  stayDuration: string;
  comments: SeedTaskComment[];
  estimatedDuration?: EstimatedDuration;
  assigneeId: string | undefined;
  dueDate?: Date;
}

export const SEED_TASKS: SeedTask[] = [
  {
    id: "TASK-001",
    title: "Clean Master Suite",
    description: "Deep clean of the master suite including bathroom.",
    status: "inProgress",
    taskType: "housekeeping",
    priority: "high",
    room: "101",
    location: "north",
    floor: "1",
    stayDuration: "short stay",
    comments: [{ name: "Manager", content: "Needs to be done before 3 PM" }],
    assigneeId: SEED_ASSIGNEE_ID_1,
  },
  {
    id: "TASK-002",
    title: "Fix AC Unit",
    description: "AC unit making rattling noise.",
    status: "todo",
    taskType: "maintenance",
    priority: "medium",
    room: "205",
    location: "south",
    floor: "2",
    stayDuration: "long stay",
    comments: [{ name: "Guest", content: "Too loud at night" }],
    estimatedDuration: { days: 0, hours: 1 },
    assigneeId: SEED_ASSIGNEE_ID_2,
  },
  {
    id: "TASK-003",
    title: "Restock Mini Bar",
    status: "done",
    taskType: "housekeeping",
    priority: "low",
    room: "310",
    location: "east",
    floor: "3",
    stayDuration: "short stay",
    comments: [{ name: "System", content: "Standard restock" }],
    assigneeId: SEED_ASSIGNEE_ID_1,
  },
  {
    id: "TASK-004",
    title: "Replace Showerhead",
    status: "closed",
    taskType: "maintenance",
    priority: "high",
    room: "402",
    location: "west",
    floor: "4",
    stayDuration: "long stay",
    comments: [{ name: "Inspector", content: "Leaking constantly" }],
    estimatedDuration: { days: 2, hours: 11 },
    assigneeId: SEED_ASSIGNEE_ID_2,
  },
  {
    id: "TASK-005",
    title: "Turn down service",
    status: "cancelled",
    taskType: "housekeeping",
    priority: "medium",
    room: "501",
    location: "north",
    floor: "5",
    stayDuration: "short stay",
    comments: [{ name: "Guest", content: "Extra pillows requested" }],
    assigneeId: SEED_ASSIGNEE_ID_1,
  },
  {
    id: "TASK-006",
    title: "Carpet Cleaning",
    description: "Stain near entrance",
    status: "cancelled",
    taskType: "housekeeping",
    priority: "medium",
    room: "Room 239",
    location: "east",
    floor: "Floor 3",
    stayDuration: "short stay",
    comments: [{ name: "Guest", content: "Extra pillows requested" }],
    assigneeId: SEED_ASSIGNEE_ID_1,
  },
  {
    id: "TASK-007",
    title: "Unassign Task",
    description: "This task is not assign to anyone",
    status: "todo",
    taskType: "housekeeping",
    priority: "low",
    room: "Room 239",
    location: "south",
    floor: "Floor 3",
    comments: [{ name: "Guest", content: "Extra pillows requested" }],
    stayDuration: "short stay",
    assigneeId: undefined,
  },
];

export interface SeedStatusDefinition {
  taskStatus: SeedTaskStatus;
  name: string;
  category: StatusCategory;
  color: keyof typeof KANBAN_COLUMN_COLORS;
  isInitial: boolean;
}

// One row per SeedTaskStatus. done/cancelled/closed all map to the "DONE"
// backend status_category enum value.
export const SEED_STATUSES: SeedStatusDefinition[] = [
  {
    taskStatus: "todo",
    name: TASK_STATUS_NAMES.todo,
    category: "TODO",
    color: "orange",
    isInitial: true,
  },
  {
    taskStatus: "inProgress",
    name: TASK_STATUS_NAMES.inProgress,
    category: "IN_PROGRESS",
    color: "blue",
    isInitial: false,
  },
  {
    taskStatus: "done",
    name: TASK_STATUS_NAMES.done,
    category: "DONE",
    color: "green",
    isInitial: false,
  },
  {
    taskStatus: "cancelled",
    name: TASK_STATUS_NAMES.cancelled,
    category: "DONE",
    color: "red",
    isInitial: false,
  },
  {
    taskStatus: "closed",
    name: TASK_STATUS_NAMES.closed,
    category: "DONE",
    color: "green",
    isInitial: false,
  },
];

export function buildStatusPayloads(): CreateStatusPayload[] {
  return SEED_STATUSES.map((status) => ({
    name: status.name,
    category: status.category,
    color: status.color,
  }));
}

export function buildTaskStatusToStatusName(): Record<SeedTaskStatus, string> {
  const entries = SEED_STATUSES.map(
    (status) => [status.taskStatus, status.name] as const,
  );

  return Object.fromEntries(entries) as Record<SeedTaskStatus, string>;
}

export interface SeedTransitionDefinition {
  name: string;
  fromStatusName: string;
  toStatusName: string;
}

// Todo -> In Progress -> Done -> Todo, one specific from/to edge at a time
// (is_global: false) — not "reachable from anywhere".
export const SEED_TRANSITIONS: SeedTransitionDefinition[] = [
  {
    name: "Start Progress",
    fromStatusName: TASK_STATUS_NAMES.todo,
    toStatusName: TASK_STATUS_NAMES.inProgress,
  },
  {
    name: "Complete",
    fromStatusName: TASK_STATUS_NAMES.inProgress,
    toStatusName: TASK_STATUS_NAMES.done,
  },
  {
    name: "Reopen",
    fromStatusName: TASK_STATUS_NAMES.done,
    toStatusName: TASK_STATUS_NAMES.todo,
  },
];

export interface SeedWorkItemTypeDefinition {
  name: "Housekeeping" | "Maintenance";
  taskType: SeedTaskType;
  iconName: string;
}

export const SEED_WORK_ITEM_TYPES: SeedWorkItemTypeDefinition[] = [
  { name: "Housekeeping", taskType: "housekeeping", iconName: "Sparkles" },
  { name: "Maintenance", taskType: "maintenance", iconName: "Wrench" },
];

export function buildProjectKey(): string {
  const suffix = Date.now().toString(36).slice(-4).toUpperCase();
  return `SEED${suffix}`;
}

export function mapTaskPriorityToPriorityLevel(
  priority: SeedTaskPriority,
): PriorityLevel {
  switch (priority) {
    case "low":
      return "LOW";
    case "medium":
      return "MEDIUM";
    case "high":
      return "HIGH";
    default: {
      const exhaustiveCheck: never = priority;
      throw new Error(`Unhandled task priority: ${String(exhaustiveCheck)}`);
    }
  }
}

export function buildCommentBodyFromTaskComment(
  comment: SeedTaskComment,
): string {
  return `[${comment.name}] ${comment.content}`;
}

// Spread seeded tasks across a mix of overdue and upcoming due dates.

export interface BuildWorkItemPayloadIds {
  typeIdByTaskType: Record<SeedTaskType, string>;
  statusIdByTaskStatus: Record<SeedTaskStatus, string>;
}

export function buildWorkItemPayloadFromTask(
  task_item: SeedTask,
  ids: BuildWorkItemPayloadIds,
): CreateWorkItemPayload {
  const customFieldValues: Record<string, unknown> = {
    legacy_task_id: task_item.id,
    room: task_item.room,
    location: task_item.location,
    floor: task_item.floor ?? null,
    stay_duration: task_item.stayDuration,
  };

  if (task_item.estimatedDuration) {
    customFieldValues[ESTIMATED_DURATION_FIELD_NAME] = {
      days: task_item.estimatedDuration.days,
      hours: task_item.estimatedDuration.hours,
    } satisfies EstimatedDuration;
  }

  return {
    type_id: ids.typeIdByTaskType[task_item.taskType],
    title: task_item.title,
    description: task_item.description ?? "",
    current_status_id: ids.statusIdByTaskStatus[task_item.status],
    priority: mapTaskPriorityToPriorityLevel(task_item.priority),
    assignee_id: task_item.assigneeId,
    custom_field_values: customFieldValues,
  };
}
