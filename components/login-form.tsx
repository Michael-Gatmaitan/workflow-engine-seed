"use client";

import { useState } from "react";
import { useLogin } from "@/hooks/useLogin";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CircleAlert } from "lucide-react";

const loginSchema = z.object({
  email: z.string().min(1, "Email required").email("Invalid email address"),
  password: z.string().min(1, "Password required"),
});

export default function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: { email: "", password: "" },
  });

  const { mutate: login, isPending, error, reset } = useLogin();

  function onSubmit(data: z.infer<typeof loginSchema>) {
    reset();
    login(
      { ...data, callbackUrl },
      {
        onSuccess: (result) => {
          if (result.url) {
            window.location.assign(result.url);
          }
        },
      },
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5">
      {error && (
        <div
          className="flex items-center gap-2 rounded-lg p-3.5 text-xs font-medium border border-red-200 bg-red-50 text-red-700"
          role="alert"
        >
          <CircleAlert size={18} />
          <span>{error.message}</span>
        </div>
      )}

      <div className="grid gap-3">
        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <div className="grid gap-1.5">
              <Label htmlFor={field.name}>Email</Label>
              <Input
                {...field}
                id={field.name}
                type="email"
                placeholder="e.g. name@example.com"
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
          name="password"
          control={form.control}
          render={({ field, fieldState }) => (
            <div className="grid gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor={field.name}>Password</Label>
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:underline"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <Input
                {...field}
                id={field.name}
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
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
      </div>

      <Button
        variant="solid-blue"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Signing in…" : "Sign In"}
      </Button>
    </form>
  );
}
