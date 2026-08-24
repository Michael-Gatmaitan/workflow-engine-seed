import { useQuery } from "@tanstack/react-query";
import { listProjectsAction } from "@/app/actions/workflowEngine/project";
import type { ListProjectsParams } from "@/lib/api/workflowEngine/project";
import type { Pagination, Project } from "@/lib/api/workflowEngine/types";
import { WorkflowEngineError } from "@/lib/api/workflowEngine/error";

export function useProjects(params: ListProjectsParams = {}) {
  return useQuery<Pagination<Project>, WorkflowEngineError>({
    queryKey: ["workflowEngine", "projects", params],
    queryFn: async () => {
      const result = await listProjectsAction(params);
      if (!result.success) {
        throw new WorkflowEngineError(result.error, result.code);
      }
      return result.data;
    },
  });
}
