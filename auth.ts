import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { AuthError } from "next-auth";
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

import { db } from "@/db";
import {
  accounts,
  authenticators,
  sessions,
  users,
  verificationTokens,
} from "@/db/schema";

const providers = [
  ...(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET
    ? [
        GitHub({
          clientId: process.env.AUTH_GITHUB_ID,
          clientSecret: process.env.AUTH_GITHUB_SECRET,
        }),
      ]
    : []),
  ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
    ? [
        Google({
          clientId: process.env.AUTH_GOOGLE_ID,
          clientSecret: process.env.AUTH_GOOGLE_SECRET,
        }),
      ]
    : []),
];

if (providers.length === 0) {
  console.warn(
    "[auth] No OAuth providers: set AUTH_GITHUB_* and/or AUTH_GOOGLE_* in .env"
  );
}

/** Avoid `console.error` for recoverable auth failures — Next.js dev overlay treats it as a runtime error. */
function authLoggerError(error: Error) {
  const recoverable =
    error instanceof AuthError &&
    (error.type === "SessionTokenError" ||
      error.type === "JWTSessionError" ||
      error.type === "AdapterError");
  if (recoverable) {
    console.warn(
      `[auth] ${error.type} (signed out or DB unreachable; clear cookies if this persists):`,
      error.message
    );
    return;
  }
  console.error("[auth][error]", error);
  if (error.cause) console.error("[auth][cause]", error.cause);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
    authenticatorsTable: authenticators,
  }),
  providers,
  secret: process.env.AUTH_SECRET,
  debug: process.env.AUTH_DEBUG === "1",
  logger: { error: authLoggerError },
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  trustHost: true,
});
