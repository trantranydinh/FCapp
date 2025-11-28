/**
 * Section Selection Page
 * User selects either Parity Tool or Forecast Price after login
 */

import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useAuth } from '../components/AuthProvider';
import { Calculator, TrendingUp, LogOut } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';

const sections = [
  {
    id: 'parity',
    title: 'Parity Tool',
    description: 'Calculate price parity and analyze market competitiveness',
    icon: Calculator,
    color: 'from-rose-500 to-red-600',
    href: '/dashboard?section=parity'
  },
  {
    id: 'forecast',
    title: 'Forecast Price',
    description: 'AI-powered price predictions and market insights',
    icon: TrendingUp,
    color: 'from-orange-500 to-red-500',
    href: '/dashboard?section=forecast'
  }
];

export default function Home() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mounted, setMounted] = useState(false);

  // Ensure component only renders user-dependent UI on client side
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSectionClick = (section) => {
    router.push(section.href);
  };

  return (
    <>
      <Head>
        <title>Intersnack Forecast | Select Your Tool</title>
      </Head>

      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Background Elements with Red Theme */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent/10 blur-3xl" />
        </div>

        {/* Logout Button */}
        {mounted && user && (
          <div className="absolute top-6 right-6">
            <Button
              variant="outline"
              onClick={logout}
              className="gap-2 border-primary/20 hover:bg-primary/10"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        )}

        <div className="w-full max-w-5xl z-10">
          {/* Header */}
          <div className="text-center mb-12 space-y-4">
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary">
                Intersnack Forecast
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Advanced market analysis and price forecasting platform
            </p>
            {mounted && user && (
              <p className="text-sm text-muted-foreground">
                Welcome, <span className="font-semibold text-foreground">{user.email}</span>
              </p>
            )}
          </div>

          {/* Section Cards */}
          <div className="grid gap-8 md:grid-cols-2 mb-8">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <Card
                  key={section.id}
                  onClick={() => handleSectionClick(section)}
                  className="group relative overflow-hidden border-none bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-105"
                >
                  {/* Gradient Top Border */}
                  <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${section.color}`} />

                  {/* Card Content */}
                  <div className="p-8 space-y-6">
                    {/* Icon */}
                    <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${section.color} shadow-lg`}>
                      <Icon className="h-10 w-10 text-white" />
                    </div>

                    {/* Text */}
                    <div className="space-y-2">
                      <h2 className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
                        {section.title}
                      </h2>
                      <p className="text-muted-foreground">
                        {section.description}
                      </p>
                    </div>

                    {/* Arrow Indicator */}
                    <div className="flex items-center gap-2 text-primary font-medium group-hover:gap-4 transition-all">
                      <span>Get Started</span>
                      <svg
                        className="h-5 w-5 transition-transform group-hover:translate-x-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                  </div>

                  {/* Hover Effect Overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${section.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
                </Card>
              );
            })}
          </div>

          {/* Status Indicator */}
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-border/50 text-sm text-muted-foreground">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              System Operational • v1.0.0
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
