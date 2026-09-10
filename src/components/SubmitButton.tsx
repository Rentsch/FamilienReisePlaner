"use client";

import { useFormStatus } from "react-dom";
import type { ComponentProps, ReactNode } from "react";

export function SubmitButton({
  children,
  pendingText,
  className,
  disabled,
  ...props
}: ComponentProps<"button"> & { pendingText?: ReactNode }) {
  const { pending } = useFormStatus();

  return (
    <button
      {...props}
      type={props.type ?? "submit"}
      disabled={pending || disabled}
      aria-busy={pending}
      className={`${className ?? ""} disabled:cursor-wait disabled:opacity-70`}
    >
      {pending ? (
        <span className="inline-flex items-center gap-2">
          <span className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent" />
          {pendingText ?? children}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
