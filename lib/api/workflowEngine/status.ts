import {
  buildWorkflowEngineHeaders,
  workflowEngineApiClient,
} from "@/lib/workflowEngineAxios";
import type {
  Pagination,
  Status,
  StatusCategory,
  WorkflowEngineAuthContext,
  WorkflowEngineSuccessEnvelope,
} from "@/lib/api/workflowEngine/types";

export interface CreateStatusPayload {
  name: string;
  category: StatusCategory;
  color?: string;
  house_id?: string;
}

export async function createStatusRequest(
  projectId: string,
  payload: CreateStatusPayload,
  auth: WorkflowEngineAuthContext,
): Promise<Status> {
  const { data } = await workflowEngineApiClient.post<
    WorkflowEngineSuccessEnvelope<Status>
  >(`/projects/${projectId}/statuses`, payload, {
    headers: buildWorkflowEngineHeaders(auth),
  });
  return data.data;
}

export async function listStatusesRequest(
  projectId: string,
  auth: WorkflowEngineAuthContext,
  perPage = 100,
): Promise<Pagination<Status>> {
  const { data } = await workflowEngineApiClient.get<
    WorkflowEngineSuccessEnvelope<Pagination<Status>>
  >(`/projects/${projectId}/statuses`, {
    headers: buildWorkflowEngineHeaders(auth),
    params: { per_page: perPage },
  });
  return data.data;
}
