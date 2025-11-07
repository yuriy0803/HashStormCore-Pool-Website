"use client";

import * as React from "react";

type Opt = { value: string; label: string; href: string; disabled?: boolean };

export default function SelectNav({
  ariaLabel,
  value,
  options,
  className,
  disabled,
}: {
  ariaLabel?: string;
  value?: string;
  options: Opt[];
  className?: string;
  disabled?: boolean;
}) {
  return (
    <select
      aria-label={ariaLabel}
      className={className}
      value={value ?? ""}
      disabled={disabled}
      onChange={(e) => {
        const i = e.target.selectedIndex;
        const href = options[i]?.href;
        if (href) window.location.href = href;
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} disabled={o.disabled}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
