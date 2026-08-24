import { useMutation } from "@tanstack/react-query";
import { createWorkflowAction } from "@/app/actions/workflowEngine/workflow";
import type { CreateWorkflowPayload } from "@/lib/api/workflowEngine/workflow";
import type { Workflow } from "@/lib/api/workflowEngine/types";
import { WorkflowEngineError } from "@/lib/api/workflowEngine/error";

export interface CreateWorkflowVariables {
  projectId: string;
  payload: CreateWorkflowPayload;
}

export function useCreateWorkflow() {
  return useMutation<Workflow, WorkflowEngineError, CreateWorkflowVariables>({
    mutationFn: async ({ projectId, payload }) => {
      const result = await createWorkflowAction(projectId, payload);
      if (!result.success) {
        throw new WorkflowEngineError(result.error, result.code);
      }
      return result.data;
    },
  });
}
