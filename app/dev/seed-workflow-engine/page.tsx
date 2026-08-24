import { notFound } from "next/navigation";
import type { Metadata } from "next";
import SeedWorkflowEngineRunner from "./seed-workflow-engine-runner";

export const metadata: Metadata = {
  title: "Seed Workflow Engine",
};

export default function SeedWorkflowEnginePage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return <SeedWorkflowEngineRunner />;
}
