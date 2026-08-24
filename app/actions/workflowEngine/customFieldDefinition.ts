"use server";

import {
  createCustomFieldDefinitionRequest,
  listCustomFieldDefinitionsRequest,
  type CreateCustomFieldDefinitionPayload,
} from "@/lib/api/workflowEngine/customFieldDefinition";
import type {
  CustomFieldDefinition,
  Pagination,
} from "@/lib/api/workflowEngine/types";
import {
  getWorkflowEngineAuthContext,
  toActionErrorFields,
  type ActionResult,
} from "@/app/actions/workflowEngine/shared";

export async function createCustomFieldDefinitionAction(
  projectId: string,
  payload: CreateCustomFieldDefinitionPayload,
): Promise<ActionResult<CustomFieldDefinition>> {
  const auth = await getWorkflowEngineAuthContext();
  if (!auth) {
    return { success: false, error: "You must be signed in to do this." };
  }

  try {
    const data = await createCustomFieldDefinitionRequest(
      projectId,
      payload,
      auth,
    );
    return { success: true, data };
  } catch (error) {
    return { success: false, ...toActionErrorFields(error) };
  }
}

export async function listCustomFieldDefinitionsAction(
  projectId: string,
): Promise<ActionResult<Pagination<CustomFieldDefinition>>> {
  const auth = await getWorkflowEngineAuthContext();
  if (!auth) {
    return { success: false, error: "You must be signed in to do this." };
  }

  try {
    const data = await listCustomFieldDefinitionsRequest(projectId, auth);
    return { success: true, data };
  } catch (error) {
    return { success: false, ...toActionErrorFields(error) };
  }
}
