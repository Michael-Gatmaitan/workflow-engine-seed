import { useMutation } from "@tanstack/react-query";
import { saveWorkflowCanvasAction } from "@/app/actions/workflowEngine/workflowCanvas";
import type { SaveWorkflowCanvasPayload } from "@/lib/api/workflowEngine/workflowCanvas";
import { WorkflowEngineError } from "@/lib/api/workflowEngine/error";

export interface SaveWorkflowCanvasVariables {
  projectId: string;
  workflowId: string;
  payload: SaveWorkflowCanvasPayload;
}

export function useSaveWorkflowCanvas() {
  return useMutation<null, WorkflowEngineError, SaveWorkflowCanvasVariables>({
    mutationFn: async ({ projectId, workflowId, payload }) => {
      const result = await saveWorkflowCanvasAction(
        projectId,
        workflowId,
        payload,
      );
      if (!result.success) {
        throw new WorkflowEngineError(result.error, result.code);
      }
      return result.data;
    },
  });
}
