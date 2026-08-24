"use client";

import { signIn } from "next-auth/react";
import { useMutation } from "@tanstack/react-query";

export const useLogin = () => {
  return useMutation({
    mutationFn: async ({
      email,
      password,
      callbackUrl,
    }: {
      email: string;
      password: string;
      callbackUrl?: string;
    }) => {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        redirectTo: callbackUrl ?? "/tasks",
      });

      if (result?.error === "CredentialsSignin") {
        throw new Error("Invalid email or password.");
      }

      if (result?.error || !result?.ok) {
        throw new Error("Unable to sign in. Please try again.");
      }

      return result;
    },
  });
};
