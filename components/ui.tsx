import type { ComponentProps, ReactNode } from "react";
import LocaleLink from "./LocaleLink";
import PixelFill from "./fx/PixelFill";
import { RollIcon, RollText } from "./fx/Roll";

function Arrow({ className = "" }: { className?: string }) {
  return (
    <svg className={`arrow ${className}`} width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M1 7h11M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

type ButtonProps = Omit<ComponentProps<typeof LocaleLink>, "className"> & {
  variant?: "outline" | "solid" | "accent";
  className?: string;
  children: ReactNode;
};

export function Button({ variant = "outline", className = "", children, ...props }: ButtonProps) {
  const v = variant === "solid" ? "btn-solid" : variant === "accent" ? "btn-accent" : "";
  return (
    <LocaleLink className={`btn fx ${v} ${className}`} {...props}>
      <PixelFill color={variant === "accent" ? "--ink" : "--accent"} />
      <RollText>{children}</RollText>
      <RollIcon>
        <Arrow />
      </RollIcon>
    </LocaleLink>
  );
}
