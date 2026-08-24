import {
  buildWorkflowEngineHeaders,
  workflowEngineApiClient,
} from "@/lib/workflowEngineAxios";
import type {
  Pagination,
  WorkflowEngineAuthContext,
  WorkflowEngineSuccessEnvelope,
  WorkItemComment,
} from "@/lib/api/workflowEngine/types";

export interface CreateWorkItemCommentPayload {
  body: string;
}

export async function createWorkItemCommentRequest(
  projectId: string,
  itemId: string,
  payload: CreateWorkItemCommentPayload,
  auth: WorkflowEngineAuthContext,
): Promise<WorkItemComment> {
  const { data } = await workflowEngineApiClient.post<
    WorkflowEngineSuccessEnvelope<WorkItemComment>
  >(`/projects/${projectId}/work-items/${itemId}/comments`, payload, {
    headers: buildWorkflowEngineHeaders(auth),
  });
  return data.data;
}

export async function listWorkItemCommentsRequest(
  projectId: string,
  itemId: string,
  auth: WorkflowEngineAuthContext,
  perPage = 50,
): Promise<Pagination<WorkItemComment>> {
  const { data } = await workflowEngineApiClient.get<
    WorkflowEngineSuccessEnvelope<Pagination<WorkItemComment>>
  >(`/projects/${projectId}/work-items/${itemId}/comments`, {
    headers: buildWorkflowEngineHeaders(auth),
    params: { per_page: perPage },
  });
  return data.data;
}
