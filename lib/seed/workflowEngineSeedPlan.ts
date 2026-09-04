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
export type SeedTaskPriority = "LOW" | "MEDIUM" | "HIGH";

// Backend assignee_id is a Go *uuid.UUID column with no FK check, so any
// well-formed UUID works — these are just fixed placeholders for demo seed
// data, not real user accounts.
const SEED_ASSIGNEE_ID_1 = "2230dc9e-a9c1-490e-98e3-0ac061207618"; // Housekeeper
const SEED_ASSIGNEE_ID_2 = "efc3680c-2a92-4f70-ae48-684e5129f43c"; // Maintenance

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
}

export const SEED_TASKS: SeedTask[] = [
  {
    id: "TASK-001",
    title: "Clean Master Suite",
    description: "Deep clean of the master suite including bathroom.",
    status: "inProgress",
    taskType: "housekeeping",
    priority: "LOW",
    room: "Room 4",
    location: "North Wing",
    floor: "Floor 1",
    stayDuration: "Short Stay",
    comments: [{ name: "Manager", content: "Needs to be done before 3 PM" }],
    assigneeId: SEED_ASSIGNEE_ID_1,
  },
  {
    id: "TASK-002",
    title: "Fix AC Unit",
    description: "AC unit making rattling noise.",
    status: "todo",
    taskType: "maintenance",
    priority: "LOW",
    room: "Room 4",
    location: "North Wing",
    floor: "Floor 6",
    stayDuration: "Short Stay",
    comments: [{ name: "Guest", content: "Too loud at night" }],
    estimatedDuration: { days: 0, hours: 1 },
    assigneeId: SEED_ASSIGNEE_ID_2,
  },
  {
    id: "TASK-003",
    title: "Restock Mini Bar",
    status: "done",
    taskType: "housekeeping",
    priority: "MEDIUM",
    room: "Room 1",
    location: "West Wing",
    floor: "Floor 1",
    stayDuration: "Long Stay",
    comments: [{ name: "System", content: "Standard restock" }],
    assigneeId: SEED_ASSIGNEE_ID_1,
  },
  {
    id: "TASK-004",
    title: "Replace Showerhead",
    status: "closed",
    taskType: "maintenance",
    priority: "LOW",
    room: "Room 1",
    location: "West Wing",
    floor: "Floor 2",
    stayDuration: "Long Stay",
    comments: [{ name: "Inspector", content: "Leaking constantly" }],
    estimatedDuration: { days: 2, hours: 11 },
    assigneeId: SEED_ASSIGNEE_ID_2,
  },
  {
    id: "TASK-005",
    title: "Turn down service",
    status: "cancelled",
    taskType: "housekeeping",
    priority: "HIGH",
    room: "Room 5",
    location: "South Wing",
    floor: "Floor 3",
    stayDuration: "Short Stay",
    comments: [{ name: "Guest", content: "Extra pillows requested" }],
    assigneeId: SEED_ASSIGNEE_ID_1,
  },
  {
    id: "TASK-006",
    title: "Carpet Cleaning",
    description: "Stain near entrance",
    status: "cancelled",
    taskType: "housekeeping",
    priority: "LOW",
    room: "Room 1",
    location: "West Wing",
    floor: "Floor 1",
    stayDuration: "Long Stay",
    comments: [{ name: "Guest", content: "Extra pillows requested" }],
    assigneeId: SEED_ASSIGNEE_ID_1,
  },
  {
    id: "TASK-007",
    title: "Unassign Task",
    description: "This task is not assign to anyone",
    status: "todo",
    taskType: "housekeeping",
    priority: "LOW",
    room: "Room 2",
    location: "West Wing",
    floor: "Floor 3",
    comments: [{ name: "Guest", content: "Extra pillows requested" }],
    stayDuration: "Short Stay",
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
    code: status.name.toUpperCase().replaceAll(" ", "_"),
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
  {
    name: "From To Do to Cancelled",
    fromStatusName: TASK_STATUS_NAMES.todo,
    toStatusName: TASK_STATUS_NAMES.cancelled,
  },
  {
    name: "From In Progress to Cancelled",
    fromStatusName: TASK_STATUS_NAMES.inProgress,
    toStatusName: TASK_STATUS_NAMES.cancelled,
  },
  {
    name: "From Done to Cancelled",
    fromStatusName: TASK_STATUS_NAMES.done,
    toStatusName: TASK_STATUS_NAMES.cancelled,
  },
  {
    name: "From Cancelled to To Do",
    fromStatusName: TASK_STATUS_NAMES.cancelled,
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
    case "LOW":
      return "LOW";
    case "MEDIUM":
      return "MEDIUM";
    case "HIGH":
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

// Spread seeded tasks across a mix of overdue and upcoming due dates,
// randomized relative to whenever the seed is actually run.
const DUE_DATE_RANGE_DAYS = 5;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function buildRandomDueDateTimestamp(): number {
  const offsetMs = (Math.random() * 2 - 1) * DUE_DATE_RANGE_DAYS * MS_PER_DAY;
  return Math.round(Date.now() + offsetMs);
}

export interface BuildWorkItemPayloadIds {
  typeIdByTaskType: Record<SeedTaskType, string>;
  statusIdByTaskStatus: Record<SeedTaskStatus, string>;
}

export function buildWorkItemPayloadFromTask(
  task_item: SeedTask,
  ids: BuildWorkItemPayloadIds,
): CreateWorkItemPayload {
  const customFieldValues: Record<string, unknown> = {
    room: task_item.room,
    location: task_item.location,
    floor: task_item.floor ?? null,
    stay_duration: task_item.stayDuration ?? null,
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
    due_date: buildRandomDueDateTimestamp(),
    custom_field_values: customFieldValues,
  };
}
