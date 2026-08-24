import { useMutation } from "@tanstack/react-query";
import { createTypeFieldConfigAction } from "@/app/actions/workflowEngine/typeFieldConfig";
import type { CreateTypeFieldConfigPayload } from "@/lib/api/workflowEngine/typeFieldConfig";
import type { TypeFieldConfig } from "@/lib/api/workflowEngine/types";
import { WorkflowEngineError } from "@/lib/api/workflowEngine/error";

export interface CreateTypeFieldConfigVariables {
  projectId: string;
  typeId: string;
  payload: CreateTypeFieldConfigPayload;
}

export function useCreateTypeFieldConfig() {
  return useMutation<
    TypeFieldConfig,
    WorkflowEngineError,
    CreateTypeFieldConfigVariables
  >({
    mutationFn: async ({ projectId, typeId, payload }) => {
      const result = await createTypeFieldConfigAction(
        projectId,
        typeId,
        payload,
      );
      if (!result.success) {
        throw new WorkflowEngineError(result.error, result.code);
      }
      return result.data;
    },
  });
}
