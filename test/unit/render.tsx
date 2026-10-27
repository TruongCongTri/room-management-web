import { render } from "@testing-library/react";
import type { ReactNode } from "react";
export { nav } from "./nav";
import { Provider } from "react-redux";
import en from "@/i18n/console/en.json";
import ConsoleI18nProvider from "@/i18n/ConsoleI18nProvider";
import I18nProvider from "@/i18n/I18nProvider";
import { setLocale } from "@/lib/console/slice";
import { makeStore } from "@/lib/store/store";

/** Renders inside the store and both dictionaries (English), like the console layout does. */
export function renderConsole(ui: ReactNode) {
  const store = makeStore();
  store.dispatch(setLocale("en"));
  const utils = render(
    <Provider store={store}>
      <I18nProvider locale="en" dictionary={{} as never}>
        <ConsoleI18nProvider dictionary={en}>{ui}</ConsoleI18nProvider>
      </I18nProvider>
    </Provider>,
  );
  return { store, ...utils };
}

export const jsonResponse = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });
