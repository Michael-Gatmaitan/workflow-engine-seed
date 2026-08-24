import axios from "axios";
import { auth } from "@/auth";
import type {
  WorkflowEngineAuthContext,
  WorkflowEngineErrorEnvelope,
} from "@/lib/api/workflowEngine/types";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

export async function getWorkflowEngineAuthContext(): Promise<WorkflowEngineAuthContext | null> {
  const session = await auth();
  if (!session?.accessToken) return null;

  return {
    accessToken: session.accessToken,
    houseId: process.env.NEXT_PUBLIC_WORKFLOW_ENGINE_DEFAULT_HOUSE_ID ?? "",
  };
}

export function toActionErrorFields(error: unknown): {
  error: string;
  code?: string;
} {
  if (axios.isAxiosError<WorkflowEngineErrorEnvelope>(error)) {
    return {
      error: error.response?.data?.message ?? error.message,
      code: error.response?.data?.code,
    };
  }

  if (error instanceof Error) {
    return { error: error.message };
  }

  return { error: "An unknown error occurred." };
}
