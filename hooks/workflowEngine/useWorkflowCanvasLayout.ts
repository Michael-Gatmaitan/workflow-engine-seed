import { useMutation } from "@tanstack/react-query";
import { getWorkflowCanvasAction } from "@/app/actions/workflowEngine/workflowCanvas";
import type { WorkflowCanvasResponse } from "@/lib/api/workflowEngine/types";
import { WorkflowEngineError } from "@/lib/api/workflowEngine/error";

export interface GetWorkflowCanvasLayoutVariables {
  projectId: string;
  workflowId: string;
}

export function useWorkflowCanvasLayout() {
  return useMutation<
    WorkflowCanvasResponse,
    WorkflowEngineError,
    GetWorkflowCanvasLayoutVariables
  >({
    mutationFn: async ({ projectId, workflowId }) => {
      const result = await getWorkflowCanvasAction(projectId, workflowId);
      if (!result.success) {
        throw new WorkflowEngineError(result.error, result.code);
      }
      return result.data;
    },
  });
}
