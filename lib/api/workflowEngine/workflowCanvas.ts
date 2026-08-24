import {
  buildWorkflowEngineHeaders,
  workflowEngineApiClient,
} from "@/lib/workflowEngineAxios";
import type {
  WorkflowCanvasResponse,
  WorkflowEngineAuthContext,
  WorkflowEngineSuccessEnvelope,
} from "@/lib/api/workflowEngine/types";

export interface WorkflowCanvasNodeInput {
  status_id: string;
  ui_pos_x: number;
  ui_pos_y: number;
  is_initial_state: boolean;
}

export interface WorkflowCanvasTransitionInput {
  name: string;
  from_node_id: string;
  to_node_id: string;
  is_global: boolean;
  rules?: Record<string, unknown>;
}

export interface SaveWorkflowCanvasPayload {
  nodes: WorkflowCanvasNodeInput[];
  transitions: WorkflowCanvasTransitionInput[];
}

export async function saveWorkflowCanvasRequest(
  projectId: string,
  workflowId: string,
  payload: SaveWorkflowCanvasPayload,
  auth: WorkflowEngineAuthContext,
): Promise<null> {
  const { data } = await workflowEngineApiClient.put<
    WorkflowEngineSuccessEnvelope<null>
  >(`/projects/${projectId}/workflows/${workflowId}/layout`, payload, {
    headers: buildWorkflowEngineHeaders(auth),
  });
  return data.data;
}

export async function getWorkflowCanvasRequest(
  projectId: string,
  workflowId: string,
  auth: WorkflowEngineAuthContext,
): Promise<WorkflowCanvasResponse> {
  const { data } = await workflowEngineApiClient.get<
    WorkflowEngineSuccessEnvelope<WorkflowCanvasResponse>
  >(`/projects/${projectId}/workflows/${workflowId}/layout`, {
    headers: buildWorkflowEngineHeaders(auth),
  });
  return data.data;
}
