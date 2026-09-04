"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StepModal } from "@/app/create/_components/step-modal";
import type { WorkflowNode } from "@/lib/api/workflowEngine/types";

export interface PendingConnection {
  fromNodeId: string;
  toNodeId: string;
}

function defaultNameFor(
  pendingConnection: PendingConnection | null,
  nodeById: Map<string, WorkflowNode>,
): string {
  if (!pendingConnection) return "";
  const fromName =
    nodeById.get(pendingConnection.fromNodeId)?.status?.name ??
    pendingConnection.fromNodeId;
  const toName =
    nodeById.get(pendingConnection.toNodeId)?.status?.name ??
    pendingConnection.toNodeId;
  return `${fromName} → ${toName}`;
}

interface TransitionNameModalProps {
  pendingConnection: PendingConnection | null;
  nodeById: Map<string, WorkflowNode>;
  onConfirm: (name: string) => void;
  onCancel: () => void;
}

export function TransitionNameModal({
  pendingConnection,
  nodeById,
  onConfirm,
  onCancel,
}: TransitionNameModalProps) {
  const connectionKey = pendingConnection
    ? `${pendingConnection.fromNodeId}:${pendingConnection.toNodeId}`
    : null;
  const [trackedKey, setTrackedKey] = useState(connectionKey);
  const [name, setName] = useState(() => defaultNameFor(pendingConnection, nodeById));

  // Reset the field whenever a *new* connection comes in, without unmounting
  // the modal (which would cut its close animation short mid-cancel).
  if (connectionKey !== trackedKey) {
    setTrackedKey(connectionKey);
    setName(defaultNameFor(pendingConnection, nodeById));
  }

  const trimmedName = name.trim();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!trimmedName) return;
    onConfirm(trimmedName);
  }

  return (
    <StepModal
      open={pendingConnection !== null}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
      title="Name this transition"
      description="This transition will be included the next time you save the canvas."
    >
      <form onSubmit={handleSubmit} className="grid gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="transition-name">Name</Label>
          <Input
            id="transition-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={!trimmedName}>
            Add Transition
          </Button>
        </DialogFooter>
      </form>
    </StepModal>
  );
}
