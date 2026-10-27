"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useSelector } from "react-redux";
import type { Me } from "@/lib/console/endpoints/identity";
import { can, type Action, type Scope } from "@/lib/console/permissions";
import type { RootState } from "@/lib/store/store";

type Session = { me: Me | null; ready: boolean };
const MeContext = createContext<Session | null>(null);

/** The signed-in account for the console (set by Shell; `ready` once /auth/me answered and a building is chosen). */
export function MeProvider({ me, ready, children }: { me: Me | null; ready: boolean; children: ReactNode }) {
  return <MeContext.Provider value={{ me, ready }}>{children}</MeContext.Provider>;
}

export function useSession(): Session {
  const s = useContext(MeContext);
  if (!s) throw new Error("useSession must be used inside the console Shell");
  return s;
}

/** The signed-in account. Only inside <Screen>, which renders its screen once the account is known. */
export function useMe(): Me {
  const { me } = useSession();
  if (!me) throw new Error("useMe must be used inside <Screen>");
  return me;
}

/** `useCan()("contracts", "manage")`: hide what the API would refuse. */
export function useCan() {
  const me = useMe();
  return (resource: string, action: Action, scope?: Scope) => can(me.permissions, resource, action, scope);
}

/** The building every call is made for (X-Building-ID). */
export const useBuildingId = () => useSelector((s: RootState) => s.console.buildingId);
