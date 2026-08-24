import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    accessToken?: string;
    user: DefaultSession["user"] & {
      id?: string;
      name?: string;
      email?: string;
      role?: string;
    };
  }

  interface User {
    accessToken?: string;
    id?: string;
    name?: string;
    email?: string;
    role?: string;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    accessToken?: string;
    role?: string;
  }
}
