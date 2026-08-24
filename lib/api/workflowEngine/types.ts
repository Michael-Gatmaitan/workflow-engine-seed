export type StatusCategory = "TODO" | "IN_PROGRESS" | "DONE";

export type PriorityLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type FieldDataType =
  | "TEXT"
  | "NUMBER"
  | "DATE"
  | "DROPDOWN"
  | "USER_PICKER"
  | "BOOLEAN"
  | "OBJECT";

export interface EstimatedDuration {
  days: number;
  hours: number;
}

export interface WorkflowEngineAuthContext {
  accessToken: string;
  houseId: string;
}

export interface WorkflowEngineValidationError {
  field: string;
  message: string;
  code: string;
}

export interface WorkflowEngineSuccessEnvelope<T> {
  status: "success";
  data: T;
  message: string;
  code?: string;
  errors?: WorkflowEngineValidationError[];
}

export interface WorkflowEngineErrorEnvelope {
  status: "error";
  message: string;
  code?: string;
  errors?: WorkflowEngineValidationError[];
}

export interface Pagination<T> {
  current_page: number;
  data: T[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  next_page_url: string;
  path: string;
  per_page: number;
  prev_page_url: string;
  to: number;
  total: number;
}

export interface Project {
  id: string;
  house_id: string | null;
  name: string;
  key: string;
  tool: string | null;
  item_counter: number;
}

export interface Status {
  id: string;
  house_id: string | null;
  project_id: string;
  name: string;
  color: string;
  category: StatusCategory;
}

export interface Workflow {
  id: string;
  house_id: string | null;
  project_id: string;
  name: string;
  is_active: boolean;
}

export interface WorkflowNode {
  id: string;
  house_id: string | null;
  workflow_id: string;
  status_id: string;
  ui_pos_x: number;
  ui_pos_y: number;
  is_initial_state: boolean;
  status?: Status;
}

export interface WorkflowTransition {
  id: string;
  house_id: string | null;
  workflow_id: string;
  from_node_id: string | null;
  to_node_id: string;
  is_global: boolean;
  name: string;
  rules: Record<string, unknown>;
}

export interface WorkflowCanvasResponse {
  nodes: WorkflowNode[];
  transitions: WorkflowTransition[];
}

export interface WorkItemType {
  id: string;
  house_id: string | null;
  project_id: string;
  workflow_id: string | null;
  name: string;
  icon_name: string | null;
  tool: string | null;
  is_subtask_type: boolean;
}

export interface CustomFieldDefinition {
  id: string;
  house_id: string | null;
  project_id: string;
  name: string;
  field_type: FieldDataType;
  configuration: Record<string, unknown>;
}

export interface TypeFieldConfig {
  id: string;
  house_id: string | null;
  work_item_type_id: string;
  custom_field_definition_id: string;
  is_required: boolean;
  default_value: string | null;
  sort_order: number;
}

export interface WorkItem {
  id: string;
  house_id: string | null;
  project_id: string;
  type_id: string;
  current_status_id: string;
  item_number: number;
  title: string;
  description: string;
  priority: PriorityLevel;
  reporter_id: string;
  assignee_id: string | null;
  parent_item_id: string | null;
  custom_field_values: Record<string, unknown>;
  project?: Project;
  type?: WorkItemType & { workflow?: Workflow };
  status?: Status;
}

export interface WorkItemComment {
  id: string;
  house_id: string | null;
  work_item_id: string;
  user_id: string;
  body: string;
}

export interface Tag {
  id: string;
  name: string;
  normalized_name: string;
  type: string | null;
  color: string | null;
}
