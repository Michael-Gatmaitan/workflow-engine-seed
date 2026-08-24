"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { X } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSaveWorkflowCanvas } from "@/hooks/workflowEngine/useSaveWorkflowCanvas";
import { WorkflowEngineError } from "@/lib/api/workflowEngine/error";
import type { Status } from "@/lib/api/workflowEngine/types";
import { StepModal } from "./step-modal";
import type { WizardTransitionDraft } from "./wizard-types";

const transitionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  fromStatusId: z.string().min(1, "From status is required"),
  toStatusId: z.string().min(1, "To status is required"),
  isGlobal: z.boolean(),
});

interface CanvasStepProps {
  projectId: string;
  workflowId: string;
  statuses: Status[];
  initialStatusId: string | null;
  onInitialStatusChange: (statusId: string) => void;
  transitions: WizardTransitionDraft[];
  onAddTransition: (transition: WizardTransitionDraft) => void;
  onRemoveTransition: (localId: string) => void;
  onSaved: () => void;
}

export function CanvasStep({
  projectId,
  workflowId,
  statuses,
  initialStatusId,
  onInitialStatusChange,
  transitions,
  onAddTransition,
  onRemoveTransition,
  onSaved,
}: CanvasStepProps) {
  const [open, setOpen] = useState(false);
  const saveCanvas = useSaveWorkflowCanvas();

  const form = useForm<z.infer<typeof transitionSchema>>({
    resolver: zodResolver(transitionSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      fromStatusId: "",
      toStatusId: "",
      isGlobal: false,
    },
  });

  function onAddSubmit(values: z.infer<typeof transitionSchema>) {
    onAddTransition({ localId: crypto.randomUUID(), ...values });
    form.reset({
      name: "",
      fromStatusId: "",
      toStatusId: "",
      isGlobal: false,
    });
    setOpen(false);
  }

  function statusName(statusId: string) {
    return statuses.find((status) => status.id === statusId)?.name ?? statusId;
  }

  const statusItems = Object.fromEntries(
    statuses.map((status) => [status.id, status.name]),
  );

  function saveCanvasClick() {
    if (!initialStatusId) return;

    saveCanvas.mutate(
      {
        projectId,
        workflowId,
        payload: {
          nodes: statuses.map((status, index) => ({
            status_id: status.id,
            ui_pos_x: index * 220,
            ui_pos_y: 200,
            is_initial_state: status.id === initialStatusId,
          })),
          transitions: transitions.map((transition) => ({
            name: transition.name,
            from_node_id: transition.fromStatusId,
            to_node_id: transition.toStatusId,
            is_global: transition.isGlobal,
          })),
        },
      },
      {
        onSuccess: onSaved,
        onError: (error: WorkflowEngineError) => {
          toast.error(error.message);
        },
      },
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Canvas &amp; Transitions</CardTitle>
        <CardDescription>
          Pick one initial status, add transitions between statuses, then save
          the canvas.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label>Initial status</Label>
          <RadioGroup
            value={initialStatusId ?? undefined}
            onValueChange={onInitialStatusChange}
          >
            {statuses.map((status) => (
              <label
                key={status.id}
                className="flex items-center gap-2 text-sm"
              >
                <RadioGroupItem value={status.id} />
                {status.name}
              </label>
            ))}
          </RadioGroup>
        </div>

        {transitions.length > 0 && (
          <ul className="flex flex-col gap-2">
            {transitions.map((transition) => (
              <li
                key={transition.localId}
                className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
              >
                <span>
                  {transition.name}: {statusName(transition.fromStatusId)} →{" "}
                  {statusName(transition.toStatusId)}
                  {transition.isGlobal ? " (global)" : ""}
                </span>
                <button
                  type="button"
                  onClick={() => onRemoveTransition(transition.localId)}
                  aria-label="Remove transition"
                >
                  <X className="size-4 text-muted-foreground" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex gap-2">
          <Button type="button" onClick={() => setOpen(true)} className="w-fit">
            Add Transition
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={
              !initialStatusId ||
              transitions.length === 0 ||
              saveCanvas.isPending
            }
            onClick={saveCanvasClick}
            className="w-fit"
          >
            {saveCanvas.isPending ? "Saving…" : "Save Canvas"}
          </Button>
        </div>
      </CardContent>

      <StepModal
        open={open}
        onOpenChange={setOpen}
        title="Add Transition"
        description="Transitions define which status changes are allowed."
      >
        <form onSubmit={form.handleSubmit(onAddSubmit)} className="grid gap-4">
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <div className="grid gap-1.5">
                <Label htmlFor={field.name}>Name</Label>
                <Input
                  {...field}
                  id={field.name}
                  placeholder="e.g. Start Progress"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <p className="text-xs text-destructive">
                    {fieldState.error?.message}
                  </p>
                )}
              </div>
            )}
          />

          <Controller
            name="fromStatusId"
            control={form.control}
            render={({ field }) => (
              <div className="grid gap-1.5">
                <Label htmlFor={field.name}>From status</Label>
                <Select
                  items={statusItems}
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status.id} value={status.id}>
                        {status.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          />

          <Controller
            name="toStatusId"
            control={form.control}
            render={({ field }) => (
              <div className="grid gap-1.5">
                <Label htmlFor={field.name}>To status</Label>
                <Select
                  items={statusItems}
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status.id} value={status.id}>
                        {status.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          />

          <Controller
            name="isGlobal"
            control={form.control}
            render={({ field }) => (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={(event) => field.onChange(event.target.checked)}
                />
                Global (allowed from any status)
              </label>
            )}
          />

          <Button variant="solid-blue" type="submit">
            Add Transition
          </Button>
        </form>
      </StepModal>
    </Card>
  );
}
