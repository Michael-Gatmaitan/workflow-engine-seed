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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateWorkItemType } from "@/hooks/workflowEngine/useCreateWorkItemType";
import { WorkflowEngineError } from "@/lib/api/workflowEngine/error";
import type { WorkItemType } from "@/lib/api/workflowEngine/types";
import { StepModal } from "./step-modal";
import { ICON_OPTIONS, IconPicker } from "./icon-picker";

const workItemTypeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  icon_name: z.string().min(1, "Icon is required"),
});

interface WorkItemTypeStepProps {
  projectId: string;
  workflowId: string;
  workItemTypes: WorkItemType[];
  onWorkItemTypeAdded: (workItemType: WorkItemType) => void;
  onContinue: () => void;
}

export function WorkItemTypeStep({
  projectId,
  workflowId,
  workItemTypes,
  onWorkItemTypeAdded,
  onContinue,
}: WorkItemTypeStepProps) {
  const [open, setOpen] = useState(false);
  const createWorkItemType = useCreateWorkItemType();

  const form = useForm<z.infer<typeof workItemTypeSchema>>({
    resolver: zodResolver(workItemTypeSchema),
    mode: "onChange",
    defaultValues: { name: "", icon_name: Object.keys(ICON_OPTIONS)[0] },
  });

  function onSubmit(values: z.infer<typeof workItemTypeSchema>) {
    createWorkItemType.mutate(
      {
        projectId,
        payload: { ...values, workflow_id: workflowId },
      },
      {
        onSuccess: (workItemType) => {
          form.reset({ name: "", icon_name: Object.keys(ICON_OPTIONS)[0] });
          onWorkItemTypeAdded(workItemType);
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
        <CardTitle>Work Item Type</CardTitle>
        <CardDescription>
          Create one or more types of work item for this workflow, e.g.
          &ldquo;Task&rdquo; or &ldquo;Bug&rdquo;.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {workItemTypes.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {workItemTypes.map((workItemType) => {
              const Icon = workItemType.icon_name
                ? ICON_OPTIONS[workItemType.icon_name]
                : undefined;
              return (
                <li key={workItemType.id}>
                  <Badge variant="outline">
                    {Icon && <Icon className="size-3" />}
                    {workItemType.name}
                  </Badge>
                </li>
              );
            })}
          </ul>
        )}
        <div className="flex gap-2">
          <Button type="button" onClick={() => setOpen(true)} className="w-fit">
            Create Work Item Type
          </Button>
          {workItemTypes.length > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={onContinue}
              className="w-fit"
            >
              Next Step
            </Button>
          )}
        </div>
      </CardContent>

      <StepModal
        open={open}
        onOpenChange={setOpen}
        title="Create Work Item Type"
      >
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          {createWorkItemType.isError && (
            <div
              className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs font-medium text-red-700"
              role="alert"
            >
              <CircleAlert size={18} />
              <span>{createWorkItemType.error.message}</span>
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
                  placeholder="e.g. Task"
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
            name="icon_name"
            control={form.control}
            render={({ field }) => (
              <div className="grid gap-1.5">
                <Label htmlFor={field.name}>Icon</Label>
                <IconPicker value={field.value} onChange={field.onChange} />
              </div>
            )}
          />

          <Button
            variant="solid-blue"
            type="submit"
            disabled={createWorkItemType.isPending}
          >
            {createWorkItemType.isPending ? "Creating…" : "Create Work Item Type"}
          </Button>
        </form>
      </StepModal>
    </Card>
  );
}
