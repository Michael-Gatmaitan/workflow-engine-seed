"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCreateProject } from "@/hooks/workflowEngine/useCreateProject";
import { useCreateStatus } from "@/hooks/workflowEngine/useCreateStatus";
import { useCreateWorkflow } from "@/hooks/workflowEngine/useCreateWorkflow";
import { useSaveWorkflowCanvas } from "@/hooks/workflowEngine/useSaveWorkflowCanvas";
import { useWorkflowCanvasLayout } from "@/hooks/workflowEngine/useWorkflowCanvasLayout";
import { useCreateWorkItemType } from "@/hooks/workflowEngine/useCreateWorkItemType";
import { useCreateCustomFieldDefinition } from "@/hooks/workflowEngine/useCreateCustomFieldDefinition";
import { useCreateTypeFieldConfig } from "@/hooks/workflowEngine/useCreateTypeFieldConfig";
import { useCreateWorkItem } from "@/hooks/workflowEngine/useCreateWorkItem";
import { useCreateWorkItemComment } from "@/hooks/workflowEngine/useCreateWorkItemComment";
import { WorkflowEngineError } from "@/lib/api/workflowEngine/error";
import { ESTIMATED_DURATION_FIELD_NAME } from "@/lib/api/workflowEngine/constants";
import {
  buildCommentBodyFromTaskComment,
  buildProjectKey,
  buildStatusPayloads,
  buildTaskStatusToStatusName,
  buildWorkItemPayloadFromTask,
  SEED_STATUSES,
  SEED_TASKS,
  SEED_TRANSITIONS,
  SEED_WORK_ITEM_TYPES,
  type SeedTaskStatus,
  type SeedTaskType,
} from "@/lib/seed/workflowEngineSeedPlan";

type SeedStepId =
  | "create-project"
  | "create-statuses"
  | "create-workflow"
  | "save-canvas"
  | "verify-canvas"
  | "create-work-item-types"
  | "create-custom-field-definition"
  | "create-type-field-config"
  | "create-work-items"
  | "create-comments";

type SeedStepStatus = "idle" | "running" | "success" | "error" | "skipped";

interface SeedStepState {
  id: SeedStepId;
  label: string;
  status: SeedStepStatus;
  detail?: string;
  errorMessage?: string;
  errorCode?: string;
}

const INITIAL_STEPS: SeedStepState[] = [
  { id: "create-project", label: "Create Project", status: "idle" },
  { id: "create-statuses", label: "Create Statuses", status: "idle" },
  { id: "create-workflow", label: "Create Workflow", status: "idle" },
  { id: "save-canvas", label: "Save Workflow Canvas", status: "idle" },
  {
    id: "verify-canvas",
    label: "Verify Workflow Canvas",
    status: "idle",
  },
  {
    id: "create-work-item-types",
    label: "Create Work Item Types",
    status: "idle",
  },
  {
    id: "create-custom-field-definition",
    label: "Create Custom Field Definition",
    status: "idle",
  },
  {
    id: "create-type-field-config",
    label: "Link Custom Field to Maintenance Type",
    status: "idle",
  },
  { id: "create-work-items", label: "Create Work Items", status: "idle" },
  { id: "create-comments", label: "Create Comments", status: "idle" },
];

interface SeedResults {
  projectId?: string;
  projectKey?: string;
  statusIdByName?: Record<string, string>;
  workflowId?: string;
  typeIdByName?: Record<string, string>;
  customFieldDefinitionId?: string;
  typeFieldConfigId?: string;
  workItemIdByTaskId?: Record<string, string>;
  commentIdByTaskId?: Record<string, string>;
}

function badgeVariantForStatus(status: SeedStepStatus) {
  switch (status) {
    case "success":
      return "done" as const;
    case "error":
      return "cancelled" as const;
    case "running":
      return "inprogress" as const;
    case "skipped":
      return "unassigned" as const;
    default:
      return "outline" as const;
  }
}

export default function SeedWorkflowEngineRunner() {
  const [steps, setSteps] = useState<SeedStepState[]>(INITIAL_STEPS);
  const [results, setResults] = useState<SeedResults>({});
  const [isRunning, setIsRunning] = useState(false);

  const createProject = useCreateProject();
  const createStatus = useCreateStatus();
  const createWorkflow = useCreateWorkflow();
  const saveWorkflowCanvas = useSaveWorkflowCanvas();
  const workflowCanvasLayout = useWorkflowCanvasLayout();
  const createWorkItemType = useCreateWorkItemType();
  const createCustomFieldDefinition = useCreateCustomFieldDefinition();
  const createTypeFieldConfig = useCreateTypeFieldConfig();
  const createWorkItem = useCreateWorkItem();
  const createWorkItemComment = useCreateWorkItemComment();

  function updateStep(id: SeedStepId, patch: Partial<SeedStepState>) {
    setSteps((current) =>
      current.map((step) => (step.id === id ? { ...step, ...patch } : step)),
    );
  }

  function skipRemaining(fromIndex: number) {
    setSteps((current) =>
      current.map((step, index) =>
        index > fromIndex && step.status === "idle"
          ? { ...step, status: "skipped" }
          : step,
      ),
    );
  }

  async function runSeed() {
    setIsRunning(true);
    setSteps(INITIAL_STEPS);
    setResults({});

    const stepOrder = INITIAL_STEPS.map((step) => step.id);
    const indexOf = (id: SeedStepId) => stepOrder.indexOf(id);

    try {
      // 1. Project
      updateStep("create-project", { status: "running" });
      const projectKey = buildProjectKey();
      const project = await createProject.mutateAsync({
        name: `Seed Sandbox ${projectKey}`,
        key: projectKey,
      });
      updateStep("create-project", {
        status: "success",
        detail: `${project.name} (${project.key})`,
      });
      setResults((current) => ({
        ...current,
        projectId: project.id,
        projectKey: project.key,
      }));

      // 2. Statuses
      updateStep("create-statuses", { status: "running" });
      const statusIdByName: Record<string, string> = {};
      const statusPayloads = buildStatusPayloads();
      for (let index = 0; index < statusPayloads.length; index += 1) {
        const payload = statusPayloads[index];
        const status = await createStatus.mutateAsync({
          projectId: project.id,
          payload,
        });
        statusIdByName[status.name] = status.id;
        updateStep("create-statuses", {
          status: "running",
          detail: `${index + 1}/${statusPayloads.length} statuses created`,
        });
      }
      updateStep("create-statuses", {
        status: "success",
        detail: `${statusPayloads.length}/${statusPayloads.length} statuses created`,
      });
      setResults((current) => ({ ...current, statusIdByName }));

      const taskStatusToStatusName = buildTaskStatusToStatusName();
      const statusIdByTaskStatus = Object.fromEntries(
        Object.entries(taskStatusToStatusName).map(([taskStatus, name]) => [
          taskStatus,
          statusIdByName[name],
        ]),
      ) as Record<SeedTaskStatus, string>;

      // 3. Workflow
      updateStep("create-workflow", { status: "running" });
      const workflow = await createWorkflow.mutateAsync({
        projectId: project.id,
        payload: { name: "Default Workflow" },
      });
      updateStep("create-workflow", {
        status: "success",
        detail: workflow.name,
      });
      setResults((current) => ({ ...current, workflowId: workflow.id }));

      // 4. Save canvas
      updateStep("save-canvas", { status: "running" });
      await saveWorkflowCanvas.mutateAsync({
        projectId: project.id,
        workflowId: workflow.id,
        payload: {
          nodes: SEED_STATUSES.map((status, index) => ({
            status_id: statusIdByName[status.name],
            ui_pos_x: index * 220,
            ui_pos_y: 200,
            is_initial_state: status.isInitial,
          })),
          transitions: SEED_TRANSITIONS.map((transition) => ({
            name: transition.name,
            from_node_id: statusIdByName[transition.fromStatusName],
            to_node_id: statusIdByName[transition.toStatusName],
            is_global: false,
          })),
        },
      });
      updateStep("save-canvas", {
        status: "success",
        detail: `${SEED_STATUSES.length} nodes, ${SEED_TRANSITIONS.length} transitions saved`,
      });

      // 5. Verify canvas
      updateStep("verify-canvas", { status: "running" });
      const canvas = await workflowCanvasLayout.mutateAsync({
        projectId: project.id,
        workflowId: workflow.id,
      });
      const initialCount = canvas.nodes.filter(
        (node) => node.is_initial_state,
      ).length;
      updateStep("verify-canvas", {
        status: "success",
        detail: `${canvas.nodes.length} nodes / ${initialCount} initial / ${canvas.transitions.length} transitions`,
      });

      // 6. Work item types
      updateStep("create-work-item-types", { status: "running" });
      const typeIdByName: Record<string, string> = {};
      const typeIdByTaskType: Record<SeedTaskType, string> = {} as Record<
        SeedTaskType,
        string
      >;
      for (let index = 0; index < SEED_WORK_ITEM_TYPES.length; index += 1) {
        const typeDefinition = SEED_WORK_ITEM_TYPES[index];
        const workItemType = await createWorkItemType.mutateAsync({
          projectId: project.id,
          payload: {
            name: typeDefinition.name,
            workflow_id: workflow.id,
            icon_name: typeDefinition.iconName,
          },
        });
        typeIdByName[workItemType.name] = workItemType.id;
        typeIdByTaskType[typeDefinition.taskType] = workItemType.id;
        updateStep("create-work-item-types", {
          status: "running",
          detail: `${index + 1}/${SEED_WORK_ITEM_TYPES.length} types created`,
        });
      }
      updateStep("create-work-item-types", {
        status: "success",
        detail: `${SEED_WORK_ITEM_TYPES.length}/${SEED_WORK_ITEM_TYPES.length} types created`,
      });
      setResults((current) => ({ ...current, typeIdByName }));

      // 7. Custom field definition
      updateStep("create-custom-field-definition", { status: "running" });
      const customFieldDefinition =
        await createCustomFieldDefinition.mutateAsync({
          projectId: project.id,
          payload: {
            name: ESTIMATED_DURATION_FIELD_NAME,
            field_type: "OBJECT",
          },
        });
      updateStep("create-custom-field-definition", {
        status: "success",
        detail: customFieldDefinition.name,
      });
      setResults((current) => ({
        ...current,
        customFieldDefinitionId: customFieldDefinition.id,
      }));

      // 8. Type field config
      updateStep("create-type-field-config", { status: "running" });
      const typeFieldConfig = await createTypeFieldConfig.mutateAsync({
        projectId: project.id,
        typeId: typeIdByName["Maintenance"],
        payload: { custom_field_definition_id: customFieldDefinition.id },
      });
      updateStep("create-type-field-config", {
        status: "success",
        detail: "Linked to Maintenance",
      });
      setResults((current) => ({
        ...current,
        typeFieldConfigId: typeFieldConfig.id,
      }));

      // 9. Work items
      updateStep("create-work-items", { status: "running" });
      const workItemIdByTaskId: Record<string, string> = {};
      for (let index = 0; index < SEED_TASKS.length; index += 1) {
        const task_item = SEED_TASKS[index];
        const workItem = await createWorkItem.mutateAsync({
          projectId: project.id,
          payload: buildWorkItemPayloadFromTask(task_item, {
            typeIdByTaskType,
            statusIdByTaskStatus,
          }),
        });
        workItemIdByTaskId[task_item.id] = workItem.id;
        updateStep("create-work-items", {
          status: "running",
          detail: `${index + 1}/${SEED_TASKS.length} work items created`,
        });
      }
      updateStep("create-work-items", {
        status: "success",
        detail: `${SEED_TASKS.length}/${SEED_TASKS.length} work items created`,
      });
      setResults((current) => ({ ...current, workItemIdByTaskId }));

      // 10. Comments
      updateStep("create-comments", { status: "running" });
      const commentIdByTaskId: Record<string, string> = {};
      let commentsCreated = 0;
      for (const task_item of SEED_TASKS) {
        const firstComment = task_item.comments[0];
        if (!firstComment) continue;
        const comment = await createWorkItemComment.mutateAsync({
          projectId: project.id,
          itemId: workItemIdByTaskId[task_item.id],
          payload: { body: buildCommentBodyFromTaskComment(firstComment) },
        });
        commentIdByTaskId[task_item.id] = comment.id;
        commentsCreated += 1;
        updateStep("create-comments", {
          status: "running",
          detail: `${commentsCreated}/${SEED_TASKS.length} comments created`,
        });
      }
      updateStep("create-comments", {
        status: "success",
        detail: `${commentsCreated}/${SEED_TASKS.length} comments created`,
      });
      setResults((current) => ({ ...current, commentIdByTaskId }));
    } catch (error) {
      const failedStepId = steps.find((step) => step.status === "running")?.id;
      const message =
        error instanceof WorkflowEngineError
          ? error.message
          : error instanceof Error
            ? error.message
            : "An unknown error occurred.";
      const code =
        error instanceof WorkflowEngineError ? error.code : undefined;

      if (failedStepId) {
        updateStep(failedStepId, {
          status: "error",
          errorMessage: message,
          errorCode: code,
        });
        skipRemaining(indexOf(failedStepId));
      }
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-3xl mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold">Seed Workflow Engine</h1>
        <p className="text-sm text-muted-foreground">
          Creates a fresh sandbox Project, Workflow, Statuses, Work Item Types,
          a custom field, sample Work Items, and Comments against the running
          sc-workflow-engine backend. Every run creates an independent project
          (unique key each time), so it&apos;s safe to click more than once.
        </p>
      </div>

      <Button onClick={() => void runSeed()} disabled={isRunning}>
        {isRunning ? "Running Seed…" : "Run Seed"}
      </Button>

      <div className="flex flex-col gap-2">
        {steps.map((step) => (
          <Card key={step.id} size="sm">
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                <span>{step.label}</span>
                <Badge variant={badgeVariantForStatus(step.status)}>
                  {step.status}
                </Badge>
              </CardTitle>
              {step.detail && <CardDescription>{step.detail}</CardDescription>}
              {step.errorMessage && (
                <CardDescription className="text-destructive">
                  {step.errorCode ? `[${step.errorCode}] ` : ""}
                  {step.errorMessage}
                </CardDescription>
              )}
            </CardHeader>
          </Card>
        ))}
      </div>

      {Object.keys(results).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <CardDescription>
              Created entity IDs, for manual verification against the backend.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto text-xs whitespace-pre-wrap">
              {JSON.stringify(results, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
