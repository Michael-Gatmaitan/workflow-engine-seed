import {
  buildWorkflowEngineHeaders,
  workflowEngineApiClient,
} from "@/lib/workflowEngineAxios";
import type {
  Pagination,
  TypeFieldConfig,
  WorkflowEngineAuthContext,
  WorkflowEngineSuccessEnvelope,
} from "@/lib/api/workflowEngine/types";

export interface CreateTypeFieldConfigPayload {
  custom_field_definition_id: string;
  is_required?: boolean;
  default_value?: string;
  sort_order?: number;
}

export async function createTypeFieldConfigRequest(
  projectId: string,
  typeId: string,
  payload: CreateTypeFieldConfigPayload,
  auth: WorkflowEngineAuthContext,
): Promise<TypeFieldConfig> {
  const { data } = await workflowEngineApiClient.post<
    WorkflowEngineSuccessEnvelope<TypeFieldConfig>
  >(
    `/projects/${projectId}/work-item-types/${typeId}/field-configurations`,
    payload,
    { headers: buildWorkflowEngineHeaders(auth) },
  );
  return data.data;
}

export async function listTypeFieldConfigsRequest(
  projectId: string,
  typeId: string,
  auth: WorkflowEngineAuthContext,
  perPage = 100,
): Promise<Pagination<TypeFieldConfig>> {
  const { data } = await workflowEngineApiClient.get<
    WorkflowEngineSuccessEnvelope<Pagination<TypeFieldConfig>>
  >(`/projects/${projectId}/work-item-types/${typeId}/field-configurations`, {
    headers: buildWorkflowEngineHeaders(auth),
    params: { per_page: perPage },
  });
  return data.data;
}
