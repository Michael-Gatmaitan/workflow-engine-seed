import { useMutation } from "@tanstack/react-query";
import { createCustomFieldDefinitionAction } from "@/app/actions/workflowEngine/customFieldDefinition";
import type { CreateCustomFieldDefinitionPayload } from "@/lib/api/workflowEngine/customFieldDefinition";
import type { CustomFieldDefinition } from "@/lib/api/workflowEngine/types";
import { WorkflowEngineError } from "@/lib/api/workflowEngine/error";

export interface CreateCustomFieldDefinitionVariables {
  projectId: string;
  payload: CreateCustomFieldDefinitionPayload;
}

export function useCreateCustomFieldDefinition() {
  return useMutation<
    CustomFieldDefinition,
    WorkflowEngineError,
    CreateCustomFieldDefinitionVariables
  >({
    mutationFn: async ({ projectId, payload }) => {
      const result = await createCustomFieldDefinitionAction(
        projectId,
        payload,
      );
      if (!result.success) {
        throw new WorkflowEngineError(result.error, result.code);
      }
      return result.data;
    },
  });
}
