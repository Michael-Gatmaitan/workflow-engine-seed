import axios from "axios";
import type { WorkflowEngineAuthContext } from "@/lib/api/workflowEngine/types";

export const workflowEngineApiClient = axios.create({
  baseURL: `${process.env.WORKFLOW_ENGINE_API_BASE_URL ?? "http://localhost:8086"}/api/workflow-engine`,
});

export function buildWorkflowEngineHeaders(auth: WorkflowEngineAuthContext) {
  return {
    Authorization: `Bearer ${auth.accessToken}`,
    "X-House": auth.houseId,
  };
}
