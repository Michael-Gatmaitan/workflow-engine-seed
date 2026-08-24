import { useQuery } from "@tanstack/react-query";
import { listTypeFieldConfigsAction } from "@/app/actions/workflowEngine/typeFieldConfig";
import type { Pagination, TypeFieldConfig } from "@/lib/api/workflowEngine/types";
import { WorkflowEngineError } from "@/lib/api/workflowEngine/error";

export function useTypeFieldConfigs(projectId: string, typeId: string) {
  return useQuery<Pagination<TypeFieldConfig>, WorkflowEngineError>({
    queryKey: ["workflowEngine", "typeFieldConfigs", projectId, typeId],
    queryFn: async () => {
      const result = await listTypeFieldConfigsAction(projectId, typeId);
      if (!result.success) {
        throw new WorkflowEngineError(result.error, result.code);
      }
      return result.data;
    },
    enabled: Boolean(projectId) && Boolean(typeId),
  });
}
