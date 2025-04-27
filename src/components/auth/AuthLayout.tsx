import { ReactNode } from "react";

type AuthLayoutProps = {
  children: ReactNode;
};

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-8">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 flex justify-center">
            <h1 className="text-2xl font-bold">Event Orchestrator HQ</h1>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
} 