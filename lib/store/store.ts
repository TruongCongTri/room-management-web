import { configureStore, type UnknownAction } from "@reduxjs/toolkit";
import { defaultSerializeQueryArgs } from "@reduxjs/toolkit/query";
import type { Locale } from "../../i18n/config";
import { apiSlice, type Seed } from "../api/apiSlice";
import { consoleApi } from "../console/api";
import { consoleSlice } from "../console/slice";

type ApiState = ReturnType<typeof apiSlice.reducer>;
export type RootState = {
  [apiSlice.reducerPath]: ApiState;
  [consoleApi.reducerPath]: ReturnType<typeof consoleApi.reducer>;
  console: ReturnType<typeof consoleSlice.reducer>;
};

// A plain root reducer instead of combineReducers: combineReducers probes reducers with a randomly
// named action, and the store is created during render, where Next's prerender rejects Math.random().
const rootReducer = (state: RootState | undefined, action: UnknownAction): RootState => ({
  [apiSlice.reducerPath]: apiSlice.reducer(state?.[apiSlice.reducerPath], action),
  [consoleApi.reducerPath]: consoleApi.reducer(state?.[consoleApi.reducerPath], action),
  console: consoleSlice.reducer(state?.console, action),
});

const inBrowser = typeof window !== "undefined";

/** One store per request on the server and one per tab in the browser (never module-global). */
export function makeStore() {
  return configureStore({
    reducer: rootReducer,
    // Redux Toolkit's dev-only check middlewares time every action with Date.now(). RTK Query hooks
    // dispatch during render, and Next's prerender rejects clock reads there, so the checks run in the
    // browser only. They don't change what renders, so server and client markup still match.
    middleware: (getDefault) =>
      getDefault({ immutableCheck: inBrowser, serializableCheck: inBrowser }).concat(apiSlice.middleware, consoleApi.middleware),
  });
}

export type AppStore = ReturnType<typeof makeStore>;
export type AppDispatch = AppStore["dispatch"];

// the action type behind apiSlice.util.upsertQueryEntries (typed without `.type`, but it is a slice action)
const UPSERT_ENTRIES =
  (apiSlice.util.upsertQueryEntries as unknown as { type?: string }).type ?? `${apiSlice.reducerPath}/queries/cacheEntriesUpserted`;

/**
 * Put server-fetched data into the RTK Query cache synchronously, so components read it on their
 * first render (no loading state, no duplicate request). Entries already cached are left alone.
 *
 * This builds the same action as `apiSlice.util.upsertQueryEntries`, but with a fixed request id and
 * timestamp: the stock action creator generates both with nanoid()/Date.now(), which Next's prerender
 * rejects during render. Every seeded endpoint takes the locale as its only argument.
 */
export function seedStore(store: AppStore, seed: Seed, locale: Locale) {
  const state = store.getState();
  const names = (Object.keys(seed) as (keyof Seed)[]).filter(
    (name) => seed[name] !== undefined && !apiSlice.endpoints[name].select(locale)(state).data,
  );
  if (!names.length) return;
  store.dispatch({
    type: UPSERT_ENTRIES,
    payload: names.map((endpointName) => ({
      queryDescription: {
        type: "query",
        endpointName,
        originalArgs: locale,
        queryCacheKey: defaultSerializeQueryArgs({
          queryArgs: locale,
          endpointName,
          endpointDefinition: apiSlice.endpoints[endpointName] as never,
        }),
      },
      value: seed[endpointName],
    })),
    // RTK Query only treats an entry as fresh when fulfilledTimeStamp is truthy, so not 0. A real clock
    // reading isn't allowed while prerendering; the value only matters for age-based refetching, which
    // isn't enabled (data freshness comes from the server cache and focus/reconnect refetches).
    meta: { requestId: `seed:${locale}:${names.join(",")}`, timestamp: 1 },
  });
}
