import Link from "next/link";
import Head from "next/head";
import { ArrowRight, BarChart2, TrendingUp, Newspaper, Activity } from "lucide-react";
import { cn } from "../lib/utils";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart2, description: "Main overview of market status" },
  { href: "/price-forecast", label: "Price Forecast", icon: TrendingUp, description: "AI-powered price predictions" },
  { href: "/market-insights", label: "Market Insights", icon: Activity, description: "Deep dive into market trends" },
  { href: "/news-watch", label: "News Watch", icon: Newspaper, description: "Curated industry news feed" },
  { href: "/lstm-demo", label: "LSTM Demo (Golden Path)", icon: Activity, highlight: true, description: "Experimental LSTM model demo" },
];

const Home = () => (
  <>
    <Head>
      <title>Cashew Forecast | AI-Powered Market Analysis</title>
    </Head>
    <main className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="w-full max-w-4xl z-10">
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
            Cashew Forecast
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Advanced market analysis and price forecasting system powered by AI/ML models.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border p-6 transition-all duration-300 hover:shadow-lg",
                  link.highlight
                    ? "bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40"
                    : "bg-white/60 dark:bg-slate-950/60 backdrop-blur-sm border-white/20 hover:bg-white/80 dark:hover:bg-slate-900/80"
                )}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={cn(
                    "p-3 rounded-xl transition-colors",
                    link.highlight ? "bg-emerald-500/10 text-emerald-600" : "bg-primary/5 text-primary group-hover:bg-primary/10"
                  )}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <ArrowRight className={cn(
                    "h-5 w-5 transition-transform duration-300 group-hover:translate-x-1",
                    link.highlight ? "text-emerald-500" : "text-muted-foreground group-hover:text-primary"
                  )} />
                </div>

                <h3 className={cn(
                  "text-lg font-semibold mb-2",
                  link.highlight ? "text-emerald-700 dark:text-emerald-400" : "text-foreground"
                )}>
                  {link.label}
                </h3>

                <p className="text-sm text-muted-foreground">
                  {link.description}
                </p>
              </Link>
            );
          })}
        </div>

        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-border/50 text-sm text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            System Operational • v0.2.0
          </div>
        </div>
      </div>
    </main>
  </>
);

export default Home;
