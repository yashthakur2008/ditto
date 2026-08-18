import type { ReactNode } from "react";

export function Container({
  children,
  size = "md",
}: {
  children: ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  const max =
    size === "sm" ? "max-w-2xl" : size === "lg" ? "max-w-6xl" : "max-w-4xl";
  return (
    <div className={`mx-auto w-full px-6 sm:px-8 ${max}`}>{children}</div>
  );
}
