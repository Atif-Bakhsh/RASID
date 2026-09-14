import type { ReactNode } from 'react';

export function PageContainer({ children }: { children: ReactNode }) {
  return <div className="page-container">{children}</div>;
}
