import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Locale } from "../../i18n/config";

/**
 * Client state of the console: the language API messages come back in, the building the visitor works on
 * (sent as X-Building-ID) and whether the session has ended (any call answered 401 for good).
 */
export type ConsoleState = { locale: Locale; buildingId: string | null; sessionEnded: boolean };

const initialState: ConsoleState = { locale: "vi", buildingId: null, sessionEnded: false };

export const BUILDING_STORAGE_KEY = "rm.building";

export const consoleSlice = createSlice({
  name: "console",
  initialState,
  reducers: {
    setLocale: (s, a: PayloadAction<Locale>) => {
      s.locale = a.payload;
    },
    setBuilding: (s, a: PayloadAction<string | null>) => {
      s.buildingId = a.payload;
    },
    sessionEnded: (s) => {
      s.sessionEnded = true;
    },
    sessionStarted: (s) => {
      s.sessionEnded = false;
    },
  },
});

export const { setLocale, setBuilding, sessionEnded, sessionStarted } = consoleSlice.actions;

/** Remembered building of this browser (a convenience: falls back to the account's active building). */
export function rememberedBuilding(): string | null {
  try {
    return window.localStorage.getItem(BUILDING_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function rememberBuilding(id: string | null) {
  try {
    if (id) window.localStorage.setItem(BUILDING_STORAGE_KEY, id);
    else window.localStorage.removeItem(BUILDING_STORAGE_KEY);
  } catch {
    /* storage blocked: the choice lasts for this tab only */
  }
}
