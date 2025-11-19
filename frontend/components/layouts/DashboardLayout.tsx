/**
 * Dashboard Layout Component
 * Main layout wrapper with sidebar and topbar
 */

import React from 'react';
import {
  Sidebar,
  DashboardIcon,
  ChartIcon,
  NewsIcon,
  SettingsIcon,
  DatabaseIcon,
} from '../ui/Sidebar';
import { Topbar } from '../ui/Topbar';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  topbarActions?: React.ReactNode;
  topbarFilters?: React.ReactNode;
  userRole?: 'user' | 'admin';
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  title,
  subtitle,
  topbarActions,
  topbarFilters,
  userRole = 'user',
}) => {
  const navSections = [
    {
      title: 'Dashboards',
      items: [
        {
          label: 'Overview',
          href: '/dashboard',
          icon: <DashboardIcon />,
        },
        {
          label: 'Price Forecast',
          href: '/dashboard/forecast',
          icon: <ChartIcon />,
        },
        {
          label: 'Market Movement',
          href: '/dashboard/market',
          icon: <ChartIcon />,
        },
        {
          label: 'News Insights',
          href: '/dashboard/news',
          icon: <NewsIcon />,
        },
        {
          label: 'Combined Analysis',
          href: '/dashboard/ensemble',
          icon: <ChartIcon />,
        },
      ],
    },
    {
      title: 'Data',
      items: [
        {
          label: 'Raw Data',
          href: '/data/bronze',
          icon: <DatabaseIcon />,
        },
        {
          label: 'Cleaned Data',
          href: '/data/silver',
          icon: <DatabaseIcon />,
        },
        {
          label: 'Gold Layer',
          href: '/data/gold',
          icon: <DatabaseIcon />,
        },
      ],
    },
    {
      title: 'System',
      adminOnly: true,
      items: [
        {
          label: 'Schedules',
          href: '/admin/schedules',
          icon: <SettingsIcon />,
        },
        {
          label: 'Sources',
          href: '/admin/sources',
          icon: <SettingsIcon />,
        },
        {
          label: 'Logs',
          href: '/admin/logs',
          icon: <DatabaseIcon />,
        },
        {
          label: 'Backtest',
          href: '/admin/backtest',
          icon: <ChartIcon />,
        },
      ],
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar sections={navSections} userRole={userRole} />
      <div className="flex-1 overflow-hidden flex flex-col">
        <Topbar
          title={title}
          subtitle={subtitle}
          actions={topbarActions}
          filters={topbarFilters}
        />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};
