"use client";

import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement>;

export function TextInput(props: Props) {
  return <input {...props} className={`field-input ${props.className ?? ""}`} />;
}
