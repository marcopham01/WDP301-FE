import React from "react";

interface DashboardLayoutProps {
  sidebar: React.ReactNode;
  header: React.ReactNode;
  children: React.ReactNode;
}

export function DashboardLayout({
  sidebar,
  header,
  children,
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen flex w-full">
      {sidebar}
      <div className="flex-1 flex flex-col">
        {header}
        <main className="flex-1 p-6 bg-background">{children}</main>
      </div>
    </div>
  );
}
