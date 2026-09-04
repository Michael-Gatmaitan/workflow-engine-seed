import {
  buildWorkflowEngineHeaders,
  workflowEngineApiClient,
} from "@/lib/workflowEngineAxios";
import type {
  Pagination,
  WorkflowEngineAuthContext,
  WorkflowEngineSuccessEnvelope,
  WorkItemType,
} from "@/lib/api/workflowEngine/types";

export interface CreateWorkItemTypePayload {
  name: string;
  icon_name?: string;
  workflow_id?: string;
  tool?: string;
  is_subtask_type?: boolean;
  color: string;
}

export async function createWorkItemTypeRequest(
  projectId: string,
  payload: CreateWorkItemTypePayload,
  auth: WorkflowEngineAuthContext,
): Promise<WorkItemType> {
  const { data } = await workflowEngineApiClient.post<
    WorkflowEngineSuccessEnvelope<WorkItemType>
  >(`/projects/${projectId}/work-item-types`, payload, {
    headers: buildWorkflowEngineHeaders(auth),
  });
  return data.data;
}

export async function getWorkItemTypesRequest(
  projectId: string,
  auth: WorkflowEngineAuthContext,
  perPage = 100,
): Promise<Pagination<WorkItemType>> {
  const { data } = await workflowEngineApiClient.get<
    WorkflowEngineSuccessEnvelope<Pagination<WorkItemType>>
  >(`/projects/${projectId}/work-item-types`, {
    headers: buildWorkflowEngineHeaders(auth),
    params: { per_page: perPage },
  });
  return data.data;
}
