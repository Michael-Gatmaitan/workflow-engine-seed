import {
  buildWorkflowEngineHeaders,
  workflowEngineApiClient,
} from "@/lib/workflowEngineAxios";
import type {
  Tag,
  WorkflowEngineAuthContext,
  WorkflowEngineSuccessEnvelope,
} from "@/lib/api/workflowEngine/types";

export type TaggableResourceType = "WORK_ITEM";

export interface AttachTagPayload {
  name: string;
  resource_type: TaggableResourceType;
  resource_id: string;
}

export async function attachTagRequest(
  payload: AttachTagPayload,
  auth: WorkflowEngineAuthContext,
): Promise<Tag> {
  const { data } = await workflowEngineApiClient.post<
    WorkflowEngineSuccessEnvelope<Tag>
  >("/tags/attach", payload, { headers: buildWorkflowEngineHeaders(auth) });
  return data.data;
}

export interface Tagging {
  id: string;
  tag_id: string;
  resource_type: TaggableResourceType;
  resource_id: string;
  tag?: Tag;
}

export async function listTagsForResourceRequest(
  resourceType: TaggableResourceType,
  resourceId: string,
  auth: WorkflowEngineAuthContext,
): Promise<Tagging[]> {
  const { data } = await workflowEngineApiClient.get<
    WorkflowEngineSuccessEnvelope<Tagging[]>
  >("/tags/resource", {
    headers: buildWorkflowEngineHeaders(auth),
    params: { resource_type: resourceType, resource_id: resourceId },
  });
  return data.data;
}
