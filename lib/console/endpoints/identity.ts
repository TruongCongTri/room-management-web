import { consoleApi, one, page, type Dto, type Page } from "../api";
import type { SessionInfo } from "../../api/session";

/**
 * Module 0 — identity: sign-in (through this app's /api/auth routes, which keep the tokens in httpOnly
 * cookies), OTP activation and reset, the signed-in account, its devices, and staff / tenant accounts.
 */
export type Me = Dto<"MeDto">;
export type Session = Dto<"SessionDto">;
export type User = Dto<"UserDto">;
export type MfaChallenge = Dto<"MfaChallengeDto">;
export type OtpAccepted = Dto<"OtpRequestAcceptedDto">;

/** 200 → signed in; 202 → a finance role must confirm with the OTP. */
export type LoginResult = { kind: "session"; session: SessionInfo } | { kind: "mfa"; challenge: MfaChallenge };

export type UserQuery = { role?: string; status?: string; buildingId?: string; page?: number; limit?: number };

export const identityApi = consoleApi.injectEndpoints({
  endpoints: (b) => ({
    login: b.mutation<LoginResult, { phone: string; password: string }>({
      query: (body) => ({ url: "/api/auth/login", method: "POST", body }),
      transformResponse: (env: { data: SessionInfo | MfaChallenge }) =>
        "mfaRequired" in env.data ? { kind: "mfa", challenge: env.data as MfaChallenge } : { kind: "session", session: env.data as SessionInfo },
    }),
    verifyMfa: b.mutation<SessionInfo, { challengeId: string; code: string }>({
      query: (body) => ({ url: "/api/auth/login/mfa", method: "POST", body }),
      transformResponse: one<SessionInfo>,
    }),
    requestOtp: b.mutation<OtpAccepted, { phone: string; purpose: "ACTIVATE_ACCOUNT" | "RESET_PASSWORD" }>({
      query: (body) => ({ url: "/auth/otp/request", method: "POST", body }),
      transformResponse: one<OtpAccepted>,
    }),
    activate: b.mutation<SessionInfo, { phone: string; code: string; newPassword: string }>({
      query: (body) => ({ url: "/api/auth/activate", method: "POST", body }),
      transformResponse: one<SessionInfo>,
    }),
    resetPassword: b.mutation<null, { phone: string; code: string; newPassword: string }>({
      query: (body) => ({ url: "/auth/password/reset", method: "POST", body }),
    }),
    logout: b.mutation<null, { everywhere?: boolean }>({
      query: ({ everywhere }) => ({ url: everywhere ? "/api/auth/logout-all" : "/api/auth/logout", method: "POST" }),
    }),

    me: b.query<Me, void>({ query: () => "/auth/me", transformResponse: one<Me>, providesTags: ["Me"] }),
    changePassword: b.mutation<null, { currentPassword: string; newPassword: string }>({
      query: (body) => ({ url: "/auth/password/change", method: "POST", body }),
    }),
    sessions: b.query<Session[], void>({ query: () => "/auth/sessions", transformResponse: one<Session[]>, providesTags: ["Sessions"] }),
    revokeSession: b.mutation<null, string>({
      query: (id) => ({ url: `/auth/sessions/${id}`, method: "DELETE" }),
      invalidatesTags: ["Sessions"],
    }),

    users: b.query<Page<User>, UserQuery>({
      query: (params) => ({ url: "/users", params: { limit: 20, ...params } }),
      transformResponse: page<User>,
      providesTags: ["Users"],
    }),
    user: b.query<User, string>({ query: (id) => `/users/${id}`, transformResponse: one<User>, providesTags: (_r, _e, id) => [{ type: "Users", id }] }),
    createUser: b.mutation<User, { body: Dto<"CreateUserDto">; idempotencyKey: string }>({
      query: ({ body, idempotencyKey }) => ({ url: "/users", method: "POST", body, idempotencyKey }),
      transformResponse: one<User>,
      invalidatesTags: ["Users"],
    }),
    updateUser: b.mutation<User, { id: string; body: Dto<"UpdateUserDto"> }>({
      query: ({ id, body }) => ({ url: `/users/${id}`, method: "PATCH", body }),
      transformResponse: one<User>,
      invalidatesTags: (_r, _e, { id }) => ["Users", { type: "Users", id }],
    }),
  }),
});

export const {
  useLoginMutation,
  useVerifyMfaMutation,
  useRequestOtpMutation,
  useActivateMutation,
  useResetPasswordMutation,
  useLogoutMutation,
  useMeQuery,
  useChangePasswordMutation,
  useSessionsQuery,
  useRevokeSessionMutation,
  useUsersQuery,
  useUserQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
} = identityApi;
