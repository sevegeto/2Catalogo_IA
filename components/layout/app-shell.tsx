import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { DemoBanner } from '@/components/layout/demo-banner';
import { ThemeProvider } from '@/components/layout/theme-provider';
import { DemoModeProvider } from '@/lib/demo-mode';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <DemoModeProvider>
        <div className="flex h-screen overflow-hidden bg-background">
          <Sidebar />
          <div className="flex flex-1 flex-col overflow-hidden">
            <DemoBanner />
            <Topbar />
            <main className="flex-1 overflow-y-auto">{children}</main>
          </div>
        </div>
      </DemoModeProvider>
    </ThemeProvider>
  );
}
