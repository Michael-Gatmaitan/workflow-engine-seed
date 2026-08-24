import { Metadata } from "next";
import LoginForm from "@/components/login-form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Sign In",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  return (
    <main className="h-screen w-full grid place-items-center p-6">
      <Card className="max-w-md w-full shadow-md">
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>
            Use the same staff credentials you use for sc-pwa. Your access
            token is used to call the workflow-engine API.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm callbackUrl={callbackUrl} />
        </CardContent>
      </Card>
    </main>
  );
}
