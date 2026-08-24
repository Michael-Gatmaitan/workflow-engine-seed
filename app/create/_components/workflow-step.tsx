"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { CircleAlert } from "lucide-react";
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
import { useWorkflows } from "@/hooks/workflowEngine/useWorkflows";
import { useCreateWorkflow } from "@/hooks/workflowEngine/useCreateWorkflow";
import { WorkflowEngineError } from "@/lib/api/workflowEngine/error";
import type { Workflow } from "@/lib/api/workflowEngine/types";
import { StepModal } from "./step-modal";

const workflowSchema = z.object({
  name: z.string().min(1, "Name is required"),
  is_active: z.boolean(),
});

interface WorkflowStepProps {
  projectId: string;
  onComplete: (workflow: Workflow) => void;
}

export function WorkflowStep({ projectId, onComplete }: WorkflowStepProps) {
  const [open, setOpen] = useState(false);
  const workflowsQuery = useWorkflows(projectId);
  const createWorkflow = useCreateWorkflow();

  const form = useForm<z.infer<typeof workflowSchema>>({
    resolver: zodResolver(workflowSchema),
    mode: "onChange",
    defaultValues: { name: "", is_active: true },
  });

  function onSubmit(values: z.infer<typeof workflowSchema>) {
    createWorkflow.mutate(
      { projectId, payload: values },
      {
        onSuccess: (workflow) => {
          form.reset();
          setOpen(false);
          onComplete(workflow);
        },
        onError: (error: WorkflowEngineError) => {
          toast.error(error.message);
        },
      },
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workflow</CardTitle>
        <CardDescription>
          Pick an existing workflow for this project or create a new one.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {workflowsQuery.isLoading && (
          <p className="text-sm text-muted-foreground">Loading workflows…</p>
        )}
        {workflowsQuery.data && workflowsQuery.data.data.length > 0 && (
          <ul className="flex flex-col gap-2">
            {workflowsQuery.data.data.map((workflow) => (
              <li key={workflow.id}>
                <button
                  type="button"
                  onClick={() => onComplete(workflow)}
                  className="flex w-full items-center justify-between rounded-md border border-border px-3 py-2 text-left text-sm hover:bg-muted"
                >
                  <span>{workflow.name}</span>
                  <span className="text-muted-foreground">
                    {workflow.is_active ? "Active" : "Inactive"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <Button type="button" onClick={() => setOpen(true)} className="w-fit">
          Create Workflow
        </Button>
      </CardContent>

      <StepModal
        open={open}
        onOpenChange={setOpen}
        title="Create Workflow"
        description="Statuses become the nodes of this workflow's canvas in the next step."
      >
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          {createWorkflow.isError && (
            <div
              className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs font-medium text-red-700"
              role="alert"
            >
              <CircleAlert size={18} />
              <span>{createWorkflow.error.message}</span>
            </div>
          )}

          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <div className="grid gap-1.5">
                <Label htmlFor={field.name}>Name</Label>
                <Input
                  {...field}
                  id={field.name}
                  placeholder="e.g. Default Workflow"
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
            name="is_active"
            control={form.control}
            render={({ field }) => (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={(event) => field.onChange(event.target.checked)}
                />
                Active
              </label>
            )}
          />

          <Button
            variant="solid-blue"
            type="submit"
            disabled={createWorkflow.isPending}
          >
            {createWorkflow.isPending ? "Creating…" : "Create Workflow"}
          </Button>
        </form>
      </StepModal>
    </Card>
  );
}
