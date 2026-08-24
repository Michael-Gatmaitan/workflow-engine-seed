import { useMutation } from "@tanstack/react-query";
import { attachTagAction } from "@/app/actions/workflowEngine/tag";
import type { AttachTagPayload } from "@/lib/api/workflowEngine/tag";
import type { Tag } from "@/lib/api/workflowEngine/types";
import { WorkflowEngineError } from "@/lib/api/workflowEngine/error";

export function useAttachTag() {
  return useMutation<Tag, WorkflowEngineError, AttachTagPayload>({
    mutationFn: async (payload) => {
      const result = await attachTagAction(payload);
      if (!result.success) {
        throw new WorkflowEngineError(result.error, result.code);
      }
      return result.data;
    },
  });
}
