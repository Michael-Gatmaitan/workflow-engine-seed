import { useMutation } from "@tanstack/react-query";
import { createWorkItemTypeAction } from "@/app/actions/workflowEngine/workItemType";
import type { CreateWorkItemTypePayload } from "@/lib/api/workflowEngine/workItemType";
import type { WorkItemType } from "@/lib/api/workflowEngine/types";
import { WorkflowEngineError } from "@/lib/api/workflowEngine/error";

export interface CreateWorkItemTypeVariables {
  projectId: string;
  payload: CreateWorkItemTypePayload;
}

export function useCreateWorkItemType() {
  return useMutation<
    WorkItemType,
    WorkflowEngineError,
    CreateWorkItemTypeVariables
  >({
    mutationFn: async ({ projectId, payload }) => {
      const result = await createWorkItemTypeAction(projectId, payload);
      if (!result.success) {
        throw new WorkflowEngineError(result.error, result.code);
      }
      return result.data;
    },
  });
}
