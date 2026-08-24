import { useMutation } from "@tanstack/react-query";
import { createProjectAction } from "@/app/actions/workflowEngine/project";
import type { CreateProjectPayload } from "@/lib/api/workflowEngine/project";
import type { Project } from "@/lib/api/workflowEngine/types";
import { WorkflowEngineError } from "@/lib/api/workflowEngine/error";

export function useCreateProject() {
  return useMutation<Project, WorkflowEngineError, CreateProjectPayload>({
    mutationFn: async (payload) => {
      const result = await createProjectAction(payload);
      if (!result.success) {
        throw new WorkflowEngineError(result.error, result.code);
      }
      return result.data;
    },
  });
}
