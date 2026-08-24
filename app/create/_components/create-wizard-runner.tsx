"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listStatusesAction } from "@/app/actions/workflowEngine/status";
import { getWorkItemTypesAction } from "@/app/actions/workflowEngine/workItemType";
import { listCustomFieldDefinitionsAction } from "@/app/actions/workflowEngine/customFieldDefinition";
import { getWorkflowCanvasAction } from "@/app/actions/workflowEngine/workflowCanvas";
import type {
  CustomFieldDefinition,
  Project,
  Status,
  TypeFieldConfig,
  WorkItem,
  WorkItemType,
  Workflow,
} from "@/lib/api/workflowEngine/types";
import { Stepper } from "./stepper";
import { ProjectStep } from "./project-step";
import { StatusesStep } from "./statuses-step";
import { WorkflowStep } from "./workflow-step";
import { CanvasStep } from "./canvas-step";
import { WorkItemTypeStep } from "./work-item-type-step";
import { CustomFieldStep } from "./custom-field-step";
import { WorkItemStep } from "./work-item-step";
import {
  canvasResponseToWizardDraft,
  INITIAL_WIZARD_STATE,
  resetFromStep,
  type WizardState,
  type WizardStepId,
  type WizardTransitionDraft,
} from "./wizard-types";

export default function CreateWizardRunner() {
  const [state, setState] = useState<WizardState>(INITIAL_WIZARD_STATE);
  const [isLoadingProjectData, setIsLoadingProjectData] = useState(false);
  const [isLoadingCanvas, setIsLoadingCanvas] = useState(false);

  function handleStepClick(step: WizardStepId) {
    setState((prev) => ({ ...prev, currentStep: step }));
  }

  async function handleProjectComplete(project: Project) {
    if (state.project?.id === project.id) {
      setState((prev) => ({ ...prev, currentStep: "statuses" }));
      return;
    }

    setIsLoadingProjectData(true);
    const [statusesResult, typesResult, fieldsResult] = await Promise.all([
      listStatusesAction(project.id),
      getWorkItemTypesAction(project.id),
      listCustomFieldDefinitionsAction(project.id),
    ]);
    setIsLoadingProjectData(false);

    for (const result of [statusesResult, typesResult, fieldsResult]) {
      if (!result.success) toast.error(result.error);
    }

    setState((prev) => ({
      ...resetFromStep(prev, "statuses"),
      project,
      statuses: statusesResult.success ? statusesResult.data.data : [],
      workItemTypes: typesResult.success ? typesResult.data.data : [],
      customFieldDefinitions: fieldsResult.success ? fieldsResult.data.data : [],
    }));
  }

  function handleStatusAdded(status: Status) {
    setState((prev) => ({ ...prev, statuses: [...prev.statuses, status] }));
  }

  function handleStatusesContinue() {
    setState((prev) => ({ ...prev, currentStep: "workflow" }));
  }

  async function handleWorkflowComplete(workflow: Workflow) {
    if (!state.project) return;

    if (state.workflow?.id === workflow.id) {
      setState((prev) => ({ ...prev, currentStep: "canvas" }));
      return;
    }

    setIsLoadingCanvas(true);
    const canvasResult = await getWorkflowCanvasAction(
      state.project.id,
      workflow.id,
    );
    setIsLoadingCanvas(false);

    if (!canvasResult.success) {
      toast.error(canvasResult.error);
    }

    const draft = canvasResult.success
      ? canvasResponseToWizardDraft(canvasResult.data)
      : { initialStatusId: null, transitions: [] };

    setState((prev) => ({
      ...prev,
      currentStep: "canvas",
      workflow,
      initialStatusId: draft.initialStatusId,
      transitions: draft.transitions,
      canvasSaved: draft.initialStatusId !== null,
    }));
  }

  function handleInitialStatusChange(statusId: string) {
    setState((prev) => ({ ...prev, initialStatusId: statusId }));
  }

  function handleAddTransition(transition: WizardTransitionDraft) {
    setState((prev) => ({
      ...prev,
      transitions: [...prev.transitions, transition],
    }));
  }

  function handleRemoveTransition(localId: string) {
    setState((prev) => ({
      ...prev,
      transitions: prev.transitions.filter((t) => t.localId !== localId),
    }));
  }

  function handleCanvasSaved() {
    setState((prev) => ({
      ...prev,
      canvasSaved: true,
      currentStep: "workItemType",
    }));
  }

  function handleWorkItemTypeAdded(workItemType: WorkItemType) {
    setState((prev) => ({
      ...prev,
      workItemTypes: [...prev.workItemTypes, workItemType],
    }));
  }

  function handleWorkItemTypesContinue() {
    setState((prev) => ({ ...prev, currentStep: "customField" }));
  }

  function handleCustomFieldDefinitionCreated(
    definition: CustomFieldDefinition,
  ) {
    setState((prev) => ({
      ...prev,
      customFieldDefinitions: [...prev.customFieldDefinitions, definition],
    }));
  }

  function handleCustomFieldAttached(
    config: TypeFieldConfig,
    definition: CustomFieldDefinition,
  ) {
    setState((prev) => ({
      ...prev,
      typeFieldConfigs: [...prev.typeFieldConfigs, config],
      customFieldDefinition: definition,
    }));
  }

  function handleCustomFieldContinue() {
    setState((prev) => ({ ...prev, currentStep: "workItem" }));
  }

  function handleWorkItemComplete(workItem: WorkItem) {
    setState((prev) => ({ ...prev, workItem }));
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-3xl mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold">Create Workflow Engine Data</h1>
        <p className="text-sm text-muted-foreground">
          Build a project, statuses, workflow, canvas, work item type, custom
          field, and work item step by step against the running
          sc-workflow-engine backend. Selecting an existing project loads its
          existing data at each step.
        </p>
      </div>

      <Stepper state={state} onStepClick={handleStepClick} />

      {state.currentStep === "project" && (
        <ProjectStep onComplete={handleProjectComplete} />
      )}

      {state.currentStep === "statuses" && state.project && (
        <>
          {isLoadingProjectData && (
            <p className="text-sm text-muted-foreground">
              Loading existing data…
            </p>
          )}
          <StatusesStep
            projectId={state.project.id}
            statuses={state.statuses}
            onStatusAdded={handleStatusAdded}
            onContinue={handleStatusesContinue}
          />
        </>
      )}

      {state.currentStep === "workflow" && state.project && (
        <WorkflowStep
          projectId={state.project.id}
          onComplete={handleWorkflowComplete}
        />
      )}

      {state.currentStep === "canvas" && state.project && state.workflow && (
        <>
          {isLoadingCanvas && (
            <p className="text-sm text-muted-foreground">
              Loading existing canvas…
            </p>
          )}
          <CanvasStep
            projectId={state.project.id}
            workflowId={state.workflow.id}
            statuses={state.statuses}
            initialStatusId={state.initialStatusId}
            onInitialStatusChange={handleInitialStatusChange}
            transitions={state.transitions}
            onAddTransition={handleAddTransition}
            onRemoveTransition={handleRemoveTransition}
            onSaved={handleCanvasSaved}
          />
        </>
      )}

      {state.currentStep === "workItemType" &&
        state.project &&
        state.workflow && (
          <WorkItemTypeStep
            projectId={state.project.id}
            workflowId={state.workflow.id}
            workItemTypes={state.workItemTypes}
            onWorkItemTypeAdded={handleWorkItemTypeAdded}
            onContinue={handleWorkItemTypesContinue}
          />
        )}

      {state.currentStep === "customField" &&
        state.project &&
        state.workItemTypes.length > 0 && (
          <CustomFieldStep
            projectId={state.project.id}
            workItemTypes={state.workItemTypes}
            customFieldDefinitions={state.customFieldDefinitions}
            typeFieldConfigs={state.typeFieldConfigs}
            onDefinitionCreated={handleCustomFieldDefinitionCreated}
            onAttached={handleCustomFieldAttached}
            onContinue={handleCustomFieldContinue}
          />
        )}

      {state.currentStep === "workItem" &&
        state.project &&
        state.workItemTypes.length > 0 && (
          <WorkItemStep
            projectId={state.project.id}
            workItemTypes={state.workItemTypes}
            statuses={state.statuses}
            customFieldDefinition={state.customFieldDefinition}
            onComplete={handleWorkItemComplete}
          />
        )}

      {state.workItem && (
        <Card>
          <CardHeader>
            <CardTitle>Work Item Created</CardTitle>
            <CardDescription>
              #{state.workItem.item_number} — {state.workItem.title}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto text-xs whitespace-pre-wrap">
              {JSON.stringify(state.workItem, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
