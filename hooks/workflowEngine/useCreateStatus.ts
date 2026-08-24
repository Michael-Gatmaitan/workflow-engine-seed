import { useMutation } from "@tanstack/react-query";
import { createStatusAction } from "@/app/actions/workflowEngine/status";
import type { CreateStatusPayload } from "@/lib/api/workflowEngine/status";
import type { Status } from "@/lib/api/workflowEngine/types";
import { WorkflowEngineError } from "@/lib/api/workflowEngine/error";

export interface CreateStatusVariables {
  projectId: string;
  payload: CreateStatusPayload;
}

export function useCreateStatus() {
  return useMutation<Status, WorkflowEngineError, CreateStatusVariables>({
    mutationFn: async ({ projectId, payload }) => {
      const result = await createStatusAction(projectId, payload);
      if (!result.success) {
        throw new WorkflowEngineError(result.error, result.code);
      }
      return result.data;
    },
  });
}
