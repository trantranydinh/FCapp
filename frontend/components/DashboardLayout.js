import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { Badge } from "./ui/badge";

export default function DashboardLayout({ children, title = "Dashboard" }) {
  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      {/* Layer 1: Sidebar (Fixed Left) */}
      <Sidebar />

      {/* Main Content Area (Pushed right) */}
      <div className="lg:pl-64 flex flex-col min-h-screen transition-all duration-300">
        {/* Layer 2: Top Navigation (Sticky) */}
        <Topbar />

        {/* Layer 3: Page Content */}
        <main className="flex-1 container mx-auto p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Page Header */}
          <div className="mb-8 flex flex-col gap-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
            <p className="text-muted-foreground">
              AI-Powered Analytics & Forecasting Engine
            </p>
          </div>

          {children}
        </main>

        {/* Layer 4: Footer */}
        <footer className="border-t border-border/40 bg-background/50 backdrop-blur-sm mt-auto">
          <div className="container mx-auto px-6 py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
              <div className="flex flex-col md:flex-row items-center gap-2 md:gap-6">
                <p>© 2025 Cashew Forecast App. All rights reserved.</p>
                <div className="hidden md:block h-4 w-px bg-border" />
                <div className="flex gap-4">
                  <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
                  <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs">Powered by</span>
                <Badge variant="outline" className="font-mono text-[10px] tracking-wider">
                  LSTM-NEURAL-NET v2.1
                </Badge>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
