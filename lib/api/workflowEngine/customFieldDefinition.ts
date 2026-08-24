import {
  buildWorkflowEngineHeaders,
  workflowEngineApiClient,
} from "@/lib/workflowEngineAxios";
import type {
  CustomFieldDefinition,
  FieldDataType,
  Pagination,
  WorkflowEngineAuthContext,
  WorkflowEngineSuccessEnvelope,
} from "@/lib/api/workflowEngine/types";

export interface CreateCustomFieldDefinitionPayload {
  name: string;
  field_type: FieldDataType;
  configuration?: Record<string, unknown>;
}

export async function createCustomFieldDefinitionRequest(
  projectId: string,
  payload: CreateCustomFieldDefinitionPayload,
  auth: WorkflowEngineAuthContext,
): Promise<CustomFieldDefinition> {
  const { data } = await workflowEngineApiClient.post<
    WorkflowEngineSuccessEnvelope<CustomFieldDefinition>
  >(`/projects/${projectId}/custom-field-definitions`, payload, {
    headers: buildWorkflowEngineHeaders(auth),
  });
  return data.data;
}

export async function listCustomFieldDefinitionsRequest(
  projectId: string,
  auth: WorkflowEngineAuthContext,
  perPage = 100,
): Promise<Pagination<CustomFieldDefinition>> {
  const { data } = await workflowEngineApiClient.get<
    WorkflowEngineSuccessEnvelope<Pagination<CustomFieldDefinition>>
  >(`/projects/${projectId}/custom-field-definitions`, {
    headers: buildWorkflowEngineHeaders(auth),
    params: { per_page: perPage },
  });
  return data.data;
}
