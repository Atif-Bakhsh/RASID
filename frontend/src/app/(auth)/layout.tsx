import type { ReactNode } from "react";

// Authentication screens will use this shell-free route group in Stage 1.
export default function AuthenticationLayout({ children }: { children: ReactNode }) {
  return children;
}
