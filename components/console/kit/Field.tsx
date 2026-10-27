"use client";

import { useId, useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

/**
 * Form cells in the contact form's style: each field is a ruled cell (mono label on top, large input below,
 * the error in accent on the label line). Put them in <FormGrid> — its 1px gaps draw the rules between cells.
 */
const PAD = "px-[clamp(14px,1.4vw,26px)]";
const INPUT = `w-full bg-transparent ${PAD} pb-3 pt-1 text-[clamp(15px,1.05vw,19px)] font-semibold tracking-[-0.02em] text-ink outline-none placeholder:font-medium placeholder:text-ink/25 disabled:text-ink/45`;

export function FormGrid({ cols = 2, children, className = "" }: { cols?: 1 | 2 | 3 | 4; children: ReactNode; className?: string }) {
  const c = { 1: "", 2: "md:grid-cols-2", 3: "md:grid-cols-3", 4: "md:grid-cols-2 xl:grid-cols-4" }[cols];
  return <div className={`ruled ${c} ${className}`}>{children}</div>;
}

type Shell = { label: ReactNode; error?: string | null; hint?: ReactNode; required?: boolean; className?: string; span?: 1 | 2 | 3 | 4 | "full" };

const SPAN = { 1: "", 2: "md:col-span-2", 3: "md:col-span-3", 4: "md:col-span-4", full: "col-span-full" } as const;

function Cell({ id, label, error, hint, required, className = "", span = 1, children }: Shell & { id: string; children: ReactNode }) {
  return (
    <div className={`group relative bg-paper transition-colors focus-within:bg-paper-2/60 ${SPAN[span]} ${className}`}>
      <label htmlFor={id} className={`t-mono-xs flex items-baseline justify-between gap-3 ${PAD} pt-3 text-ink/55`}>
        <span>
          {label}
          {required && <span className="text-accent"> *</span>}
        </span>
        {error && (
          <span id={`${id}-err`} role="alert" className="normal-case tracking-normal text-accent">
            {error}
          </span>
        )}
      </label>
      {children}
      {hint && <p className={`t-mono-xs ${PAD} pb-3 text-ink/45 normal-case tracking-normal`}>{hint}</p>}
    </div>
  );
}

type InputProps = Shell & Omit<InputHTMLAttributes<HTMLInputElement>, "className"> & { suffix?: ReactNode };

export function TextField({ label, error, hint, required, className, span, suffix, id, ...input }: InputProps) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <Cell id={fid} label={label} error={error} hint={hint} required={required} className={className} span={span}>
      <div className="flex items-baseline">
        <input id={fid} required={required} aria-invalid={Boolean(error) || undefined} aria-describedby={error ? `${fid}-err` : undefined} className={INPUT} {...input} />
        {suffix && <span className={`t-mono-xs shrink-0 pr-[clamp(14px,1.4vw,26px)] text-ink/45`}>{suffix}</span>}
      </div>
    </Cell>
  );
}

/** Integer VND: shows thousands separators while typing, hands back a number (or null when empty). */
export function MoneyField({ value, onValue, ...rest }: Omit<InputProps, "value" | "onChange" | "type"> & { value: number | null; onValue: (v: number | null) => void }) {
  const shown = value === null || Number.isNaN(value) ? "" : String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return (
    <TextField
      {...rest}
      inputMode="numeric"
      value={shown}
      suffix="₫"
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, "");
        onValue(digits ? Number(digits) : null);
      }}
    />
  );
}

export function PasswordField({ showLabel, hideLabel, ...rest }: Omit<InputProps, "type" | "suffix"> & { showLabel: string; hideLabel: string }) {
  const [shown, setShown] = useState(false);
  return (
    <TextField
      {...rest}
      type={shown ? "text" : "password"}
      suffix={
        <button type="button" className="t-mono-xs text-ink/55 hover:text-accent" onClick={() => setShown((s) => !s)} aria-pressed={shown}>
          {shown ? hideLabel : showLabel}
        </button>
      }
    />
  );
}

export function SelectField({ label, error, hint, required, className, span, id, children, ...select }: Shell & Omit<SelectHTMLAttributes<HTMLSelectElement>, "className">) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <Cell id={fid} label={label} error={error} hint={hint} required={required} className={className} span={span}>
      <select id={fid} required={required} aria-invalid={Boolean(error) || undefined} className={`${INPUT} cursor-pointer appearance-none bg-[length:12px] bg-[right_clamp(14px,1.4vw,26px)_center] bg-no-repeat pr-10`} style={{ backgroundImage: CHEVRON }} {...select}>
        {children}
      </select>
    </Cell>
  );
}

const TICK = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath d='M1.5 5.2l2.2 2.2L8.5 2.6' fill='none' stroke='%23f3f2ee' stroke-width='1.4'/%3E%3C/svg%3E")`;
const CHEVRON = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' fill='none' stroke='%23282828' stroke-width='1.4'/%3E%3C/svg%3E")`;

export function TextAreaField({ label, error, hint, required, className, span, id, ...area }: Shell & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className">) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <Cell id={fid} label={label} error={error} hint={hint} required={required} className={className} span={span}>
      <textarea id={fid} required={required} aria-invalid={Boolean(error) || undefined} className={`${INPUT} min-h-24 resize-y`} {...area} />
    </Cell>
  );
}

/** A checkbox cell: square box in ink, label beside it. */
export function CheckField({ label, hint, error, className = "", span = 1, id, ...input }: Omit<Shell, "required"> & Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "type">) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <div className={`bg-paper ${SPAN[span]} ${className}`}>
      <label htmlFor={fid} className={`flex cursor-pointer items-start gap-3 ${PAD} py-3.5`}>
        <input
          id={fid}
          type="checkbox"
          className="mt-0.5 size-4 shrink-0 cursor-pointer appearance-none border border-ink bg-paper bg-center bg-no-repeat transition-colors checked:bg-ink checked:[background-image:var(--tick)] disabled:cursor-not-allowed disabled:opacity-40"
          style={{ ["--tick" as string]: TICK }}
          {...input}
        />
        <span className="t-body text-ink!">
          {label}
          {hint && <span className="t-mono-xs mt-1 block normal-case tracking-normal text-ink/45">{hint}</span>}
          {error && (
            <span role="alert" className="t-mono-xs mt-1 block normal-case tracking-normal text-accent">
              {error}
            </span>
          )}
        </span>
      </label>
    </div>
  );
}

/** "YYYY-MM-01" ⇄ <input type="month"> "YYYY-MM". */
export function MonthField({ value, onValue, ...rest }: Omit<InputProps, "value" | "onChange" | "type"> & { value: string; onValue: (v: string) => void }) {
  return <TextField {...rest} type="month" value={value ? value.slice(0, 7) : ""} onChange={(e) => onValue(e.target.value ? `${e.target.value}-01` : "")} />;
}

/** Inline filter control for toolbars: label + small select. */
export function FilterSelect({ label, className = "", children, ...select }: { label: string; className?: string } & Omit<SelectHTMLAttributes<HTMLSelectElement>, "className">) {
  const id = useId();
  return (
    <div className={`flex min-w-0 flex-col bg-paper ${className}`}>
      <label htmlFor={id} className={`t-mono-xs ${PAD} pt-2.5 text-ink/50`}>
        {label}
      </label>
      <select id={id} className={`t-mono w-full cursor-pointer appearance-none bg-transparent bg-[length:10px] bg-[right_14px_center] bg-no-repeat ${PAD} pb-2.5 pt-1 pr-8 text-ink outline-none`} style={{ backgroundImage: CHEVRON }} {...select}>
        {children}
      </select>
    </div>
  );
}

export function FilterInput({ label, className = "", ...input }: { label: string; className?: string } & Omit<InputHTMLAttributes<HTMLInputElement>, "className">) {
  const id = useId();
  return (
    <div className={`flex min-w-0 flex-col bg-paper ${className}`}>
      <label htmlFor={id} className={`t-mono-xs ${PAD} pt-2.5 text-ink/50`}>
        {label}
      </label>
      <input id={id} className={`t-mono w-full bg-transparent ${PAD} pb-2.5 pt-1 text-ink outline-none placeholder:text-ink/30`} {...input} />
    </div>
  );
}
