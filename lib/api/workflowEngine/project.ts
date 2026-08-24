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

export interface ListProjectsParams {
  page?: number;
  perPage?: number;
  sortField?: "name" | "key" | "created_at" | "updated_at";
  sortDirection?: "asc" | "desc";
}

export async function listProjectsRequest(
  params: ListProjectsParams,
  auth: WorkflowEngineAuthContext,
): Promise<Pagination<Project>> {
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
    },
  });
  return data.data;
}
