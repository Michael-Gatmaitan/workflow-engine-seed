import { useMutation } from "@tanstack/react-query";
import { createWorkItemAction } from "@/app/actions/workflowEngine/workItem";
import type { CreateWorkItemPayload } from "@/lib/api/workflowEngine/workItem";
import type { WorkItem } from "@/lib/api/workflowEngine/types";
import { WorkflowEngineError } from "@/lib/api/workflowEngine/error";

export interface CreateWorkItemVariables {
  projectId: string;
  payload: CreateWorkItemPayload;
}

export function useCreateWorkItem() {
  return useMutation<WorkItem, WorkflowEngineError, CreateWorkItemVariables>({
    mutationFn: async ({ projectId, payload }) => {
      const result = await createWorkItemAction(projectId, payload);
      if (!result.success) {
        throw new WorkflowEngineError(result.error, result.code);
      }
      return result.data;
    },
  });
}
