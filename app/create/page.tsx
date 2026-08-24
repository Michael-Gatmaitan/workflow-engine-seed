import type { Metadata } from "next";
import CreateWizardRunner from "./_components/create-wizard-runner";

export const metadata: Metadata = {
  title: "Create Workflow Engine Data",
};

export default function CreatePage() {
  return <CreateWizardRunner />;
}
