import React from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { GitCommit, Tag } from 'lucide-react';

const changes = [
    {
        version: "v2.1.0",
        date: "2026-01-29",
        type: "Performance & UI",
        title: "Login Optimization & Asset Restructuring",
        description: "Resolved database timeout issues (ETIMEDOUT) by optimizing auth sync parallelism. Restructured public assets into a unified folder. Verified News Crawler robustness."
    },
    {
        version: "v2.0.0",
        date: "2026-01-21",
        type: "Major Release",
        title: "Unified Architecture & Data Lakehouse",
        description: "Refactored application to Single Entrypoint (Standardized URL). Integrated Direct Data Lakehouse connection for Raw and Forecast data tables. Optimized Parity Tool history lookup."
    },
    {
        version: "v1.2.0",
        date: "2025-12-17",
        type: "Feature",
        title: "Extended System Features",
        description: "Added dedicated pages for System Methodology, Settings, and Notifications. Introduced 'Coming Soon' placeholders for future modules."
    },
    {
        version: "v1.1.5",
        date: "2025-12-16",
        type: "Improvement",
        title: "News Crawler Optimization",
        description: "Enhanced real-time news crawling reliability and improved source differentiation."
    },
    {
        version: "v1.1.0",
        date: "2025-12-15",
        type: "Architecture",
        title: "Forecast Module Refactor",
        description: "Unified forecast orchestration and standardized API endpoints for LSTM and Price forecasting."
    },
    {
        version: "v1.0.0",
        date: "2025-11-25",
        type: "Release",
        title: "Initial Launch",
        description: "Base release with Parity Tool, Price Forecast, and core Dashboard functionalities."
    }
];

export default function Changelog() {
    return (
        <DashboardLayout>
            <div className="container mx-auto p-6 max-w-4xl space-y-8">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight">Changelog</h1>
                    <p className="text-muted-foreground">Track the evolution of the CashewAI platform.</p>
                </div>

                <div className="relative border-l border-border/50 ml-4 space-y-12">
                    {changes.map((change, index) => (
                        <div key={index} className="relative pl-8">
                            <div className="absolute -left-[9px] top-1">
                                <div className="h-4 w-4 rounded-full bg-background border-2 border-primary ring-4 ring-background" />
                            </div>

                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-xl font-bold flex items-center gap-2">
                                        {change.version}
                                        <Badge variant="outline" className="font-normal text-xs bg-muted/50">
                                            {change.date}
                                        </Badge>
                                    </h2>
                                </div>

                                <Card className="glass-card">
                                    <CardContent className="pt-6">
                                        <div className="flex items-start gap-4">
                                            <div className="p-2 bg-secondary rounded-lg">
                                                {change.type === 'Release' ? <Tag className="h-5 w-5" /> : <GitCommit className="h-5 w-5" />}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-lg mb-1">{change.title}</h3>
                                                <p className="text-muted-foreground">{change.description}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}
