import {
  buildWorkflowEngineHeaders,
  workflowEngineApiClient,
} from "@/lib/workflowEngineAxios";
import type {
  Pagination,
  Project,
  WorkflowEngineAuthContext,
  WorkflowEngineSuccessEnvelope,
} from "@/lib/api/workflowEngine/types";

export interface CreateProjectPayload {
  name: string;
  key: string;
  tool?: string;
  house_id?: string;
}

export async function createProjectRequest(
  payload: CreateProjectPayload,
  auth: WorkflowEngineAuthContext,
): Promise<Project> {
  const { data } = await workflowEngineApiClient.post<
    WorkflowEngineSuccessEnvelope<Project>
  >("/projects", payload, { headers: buildWorkflowEngineHeaders(auth) });
  return data.data;
}

export async function deleteProjectRequest(
  projectId: string,
  auth: WorkflowEngineAuthContext,
): Promise<void> {
  await workflowEngineApiClient.delete(`/projects/${projectId}`, {
    headers: buildWorkflowEngineHeaders(auth),
  });
}

export interface ListProjectsParams {
  page?: number;
  perPage?: number;
  sortField?: "name" | "key" | "created_at" | "updated_at";
  sortDirection?: "asc" | "desc";
  filter?: Partial<{
    tool: string;
  }>;
}

export async function listProjectsRequest(
  params: ListProjectsParams,
  auth: WorkflowEngineAuthContext,
): Promise<Pagination<Project>> {
  const filterParams: Record<string, string> = {};
  if (params.filter) {
    for (const [key, value] of Object.entries(params.filter)) {
      if (value !== undefined) filterParams[`filter[${key}]`] = value;
    }
  }

  const { data } = await workflowEngineApiClient.get<
    WorkflowEngineSuccessEnvelope<Pagination<Project>>
  >("/projects", {
    headers: buildWorkflowEngineHeaders(auth),
    params: {
      page: params.page,
      per_page: params.perPage,
      ...(params.sortField
        ? {
            "sort[0][field]": params.sortField,
            "sort[0][direction]": params.sortDirection ?? "desc",
          }
        : {}),
      ...filterParams,
    },
  });
  return data.data;
}
