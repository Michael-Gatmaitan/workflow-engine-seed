import {
  buildWorkflowEngineHeaders,
  workflowEngineApiClient,
} from "@/lib/workflowEngineAxios";
import type {
  Pagination,
  PriorityLevel,
  WorkflowEngineAuthContext,
  WorkflowEngineSuccessEnvelope,
  WorkItem,
} from "@/lib/api/workflowEngine/types";

export interface CreateWorkItemPayload {
  type_id: string;
  title: string;
  description?: string;
  current_status_id: string;
  priority?: PriorityLevel;
  assignee_id?: string;
  custom_field_values?: Record<string, unknown>;
}

export async function createWorkItemRequest(
  projectId: string,
  payload: CreateWorkItemPayload,
  auth: WorkflowEngineAuthContext,
): Promise<WorkItem> {
  const { data } = await workflowEngineApiClient.post<
    WorkflowEngineSuccessEnvelope<WorkItem>
  >(`/projects/${projectId}/work-items`, payload, {
    headers: buildWorkflowEngineHeaders(auth),
  });
  return data.data;
}

export interface ListWorkItemsParams {
  page?: number;
  perPage?: number;
  filter?: Partial<{
    title: string;
    priority: PriorityLevel;
    category: string;
    assignee_id: string;
    type_id: string;
    current_status_id: string;
  }>;
}

export async function listWorkItemsRequest(
  projectId: string,
  params: ListWorkItemsParams,
  auth: WorkflowEngineAuthContext,
): Promise<Pagination<WorkItem>> {
  const filterParams: Record<string, string> = {};
  if (params.filter) {
    for (const [key, value] of Object.entries(params.filter)) {
      if (value !== undefined) filterParams[`filter[${key}]`] = value;
    }
  }

  const { data } = await workflowEngineApiClient.get<
    WorkflowEngineSuccessEnvelope<Pagination<WorkItem>>
  >(`/projects/${projectId}/work-items`, {
    headers: buildWorkflowEngineHeaders(auth),
    params: {
      page: params.page,
      per_page: params.perPage ?? 100,
      ...filterParams,
    },
  });
  return data.data;
}

export async function getWorkItemRequest(
  projectId: string,
  itemId: string,
  auth: WorkflowEngineAuthContext,
): Promise<WorkItem> {
  const { data } = await workflowEngineApiClient.get<
    WorkflowEngineSuccessEnvelope<WorkItem>
  >(`/projects/${projectId}/work-items/${itemId}`, {
    headers: buildWorkflowEngineHeaders(auth),
  });
  return data.data;
}

// PUT is a full replace, not a partial patch — omitted fields are zeroed out.
export type UpdateWorkItemPayload = CreateWorkItemPayload;

export async function updateWorkItemRequest(
  projectId: string,
  itemId: string,
  payload: UpdateWorkItemPayload,
  auth: WorkflowEngineAuthContext,
): Promise<WorkItem> {
  const { data } = await workflowEngineApiClient.put<
    WorkflowEngineSuccessEnvelope<WorkItem>
  >(`/projects/${projectId}/work-items/${itemId}`, payload, {
    headers: buildWorkflowEngineHeaders(auth),
  });
  return data.data;
}
