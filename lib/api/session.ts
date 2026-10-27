import type { components } from "./generated/schema";

/** What the browser learns about a new session from /api/auth/*: who signed in, never the tokens. */
export type SessionInfo = Pick<components["schemas"]["TokenPairDto"], "user" | "sessionId" | "accessTokenExpiresIn" | "refreshTokenExpiresAt">;
