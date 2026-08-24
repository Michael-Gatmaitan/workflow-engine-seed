import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { loginRequest } from "./lib/api/auth";

class InvalidLoginError extends CredentialsSignin {
  code = "Invalid email or password";
}

// Trimmed down from sc-pwa's auth.ts: this project only needs an
// access token to call the workflow-engine API, so it keeps the
// email/password Credentials provider and drops the WebAuthn/passkey
// provider (which needs a WebAuthn RP origin + DB-backed credentials
// that this standalone dev tool doesn't have).
export const { auth, handlers, signIn, signOut } = NextAuth({
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials.email;
        const password = credentials.password;

        if (
          typeof email !== "string" ||
          typeof password !== "string" ||
          !email ||
          !password
        ) {
          return null;
        }

        try {
          const response = await loginRequest(email, password);

          const token = response?.authorization?.token;
          const userId = response?.user?.id;

          if (!token || userId == null) throw new InvalidLoginError();

          return {
            id: String(userId),
            email: response?.user?.email ?? email,
            name: response?.user?.user_name,
            role:
              response?.user?.roles?.[0]?.type === "ADMIN"
                ? "manager"
                : "worker",
            accessToken: token,
          };
        } catch (error) {
          console.error("Error logging in:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.accessToken = user.accessToken;
        token.role = user.role;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id;
      }
      session.accessToken = token.accessToken;
      session.user.role = token.role;

      return session;
    },
  },
});
