import { useMutation } from "@tanstack/react-query";
import { createWorkItemCommentAction } from "@/app/actions/workflowEngine/comment";
import type { CreateWorkItemCommentPayload } from "@/lib/api/workflowEngine/comment";
import type { WorkItemComment } from "@/lib/api/workflowEngine/types";
import { WorkflowEngineError } from "@/lib/api/workflowEngine/error";

export interface CreateWorkItemCommentVariables {
  projectId: string;
  itemId: string;
  payload: CreateWorkItemCommentPayload;
}

export function useCreateWorkItemComment() {
  return useMutation<
    WorkItemComment,
    WorkflowEngineError,
    CreateWorkItemCommentVariables
  >({
    mutationFn: async ({ projectId, itemId, payload }) => {
      const result = await createWorkItemCommentAction(
        projectId,
        itemId,
        payload,
      );
      if (!result.success) {
        throw new WorkflowEngineError(result.error, result.code);
      }
      return result.data;
    },
  });
}
