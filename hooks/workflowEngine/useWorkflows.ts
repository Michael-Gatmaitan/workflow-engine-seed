import { useQuery } from "@tanstack/react-query";
import { listWorkflowsAction } from "@/app/actions/workflowEngine/workflow";
import type { ListWorkflowsParams } from "@/lib/api/workflowEngine/workflow";
import type { Pagination, Workflow } from "@/lib/api/workflowEngine/types";
import { WorkflowEngineError } from "@/lib/api/workflowEngine/error";

export function useWorkflows(
  projectId: string,
  params: ListWorkflowsParams = {},
) {
  return useQuery<Pagination<Workflow>, WorkflowEngineError>({
    queryKey: ["workflowEngine", "workflows", projectId, params],
    queryFn: async () => {
      const result = await listWorkflowsAction(projectId, params);
      if (!result.success) {
        throw new WorkflowEngineError(result.error, result.code);
      }
      return result.data;
    },
    enabled: Boolean(projectId),
  });
}
