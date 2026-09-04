"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useSaveWorkflowCanvas } from "@/hooks/workflowEngine/useSaveWorkflowCanvas";
import { useWorkflowCanvasLayout } from "@/hooks/workflowEngine/useWorkflowCanvasLayout";
import { WorkflowEngineError } from "@/lib/api/workflowEngine/error";
import type { WorkflowCanvasResponse } from "@/lib/api/workflowEngine/types";
import type { SaveWorkflowCanvasPayload } from "@/lib/api/workflowEngine/workflowCanvas";

interface SaveCanvasPanelProps {
  projectId: string;
  workflowId: string;
  payload: SaveWorkflowCanvasPayload;
  onSaveSuccess: (canvas: WorkflowCanvasResponse) => void;
}

export function SaveCanvasPanel({
  projectId,
  workflowId,
  payload,
  onSaveSuccess,
}: SaveCanvasPanelProps) {
  const saveWorkflowCanvas = useSaveWorkflowCanvas();
  const workflowCanvasLayout = useWorkflowCanvasLayout();

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      toast.success("Copied JSON to clipboard");
    } catch {
      toast.error("Failed to copy JSON");
    }
  }

  function handleSave() {
    saveWorkflowCanvas.mutate(
      { projectId, workflowId, payload },
      {
        onSuccess: async () => {
          try {
            const fresh = await workflowCanvasLayout.mutateAsync({
              projectId,
              workflowId,
            });
            onSaveSuccess(fresh);
            toast.success("Workflow canvas saved");
          } catch {
            toast.error(
              "Saved, but failed to refresh the canvas — reload to see the latest state.",
            );
          }
        },
        onError: (error: WorkflowEngineError) => {
          toast.error(`${error.code ? `[${error.code}] ` : ""}${error.message}`);
        },
      },
    );
  }

  return (
    <div className="flex flex-col gap-2 border-t border-border pt-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium">Save Canvas</span>
        <span className="font-mono text-xs text-muted-foreground">
          PUT /projects/{projectId}/workflows/{workflowId}/layout
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        Path only — the base URL (WORKFLOW_ENGINE_API_BASE_URL) is a
        server-only env var and isn&apos;t resolvable client-side.
      </p>
      <pre className="max-h-64 overflow-auto rounded-md border border-border bg-muted/30 p-2 text-xs whitespace-pre-wrap">
        {JSON.stringify(payload, null, 2)}
      </pre>
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={() => void handleCopy()}>
          Copy JSON
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={saveWorkflowCanvas.isPending}
        >
          {saveWorkflowCanvas.isPending ? "Saving…" : "Save Canvas"}
        </Button>
      </div>
    </div>
  );
}
