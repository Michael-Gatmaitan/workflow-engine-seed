import {
  buildWorkflowEngineHeaders,
  workflowEngineApiClient,
} from "@/lib/workflowEngineAxios";
import type {
  Pagination,
  Workflow,
  WorkflowEngineAuthContext,
  WorkflowEngineSuccessEnvelope,
} from "@/lib/api/workflowEngine/types";

export interface CreateWorkflowPayload {
  name: string;
  is_active?: boolean;
  house_id?: string;
}

export async function createWorkflowRequest(
  projectId: string,
  payload: CreateWorkflowPayload,
  auth: WorkflowEngineAuthContext,
): Promise<Workflow> {
  const { data } = await workflowEngineApiClient.post<
    WorkflowEngineSuccessEnvelope<Workflow>
  >(`/projects/${projectId}/workflows`, payload, {
    headers: buildWorkflowEngineHeaders(auth),
  });
  return data.data;
}

export interface ListWorkflowsParams {
  page?: number;
  perPage?: number;
}

export async function listWorkflowsRequest(
  projectId: string,
  params: ListWorkflowsParams,
  auth: WorkflowEngineAuthContext,
): Promise<Pagination<Workflow>> {
  const { data } = await workflowEngineApiClient.get<
    WorkflowEngineSuccessEnvelope<Pagination<Workflow>>
  >(`/projects/${projectId}/workflows`, {
    headers: buildWorkflowEngineHeaders(auth),
    params: { page: params.page, per_page: params.perPage ?? 100 },
  });
  return data.data;
}
