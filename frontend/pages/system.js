import React from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Cpu, Database, LineChart, Workflow, Layers } from 'lucide-react';

export default function System() {
    return (
        <DashboardLayout>
            <div className="container mx-auto p-6 max-w-6xl space-y-8">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight">System Methodology</h1>
                    <p className="text-muted-foreground">Understanding the core architecture and forecasting models of CashewAI.</p>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Card className="glass-card">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <Database className="h-5 w-5 text-primary" />
                                </div>
                                <CardTitle className="text-lg">Data Collection</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm text-muted-foreground">
                            <p>Real-time data ingestion from multiple global sources including:</p>
                            <ul className="list-disc pl-4 space-y-1">
                                <li>Global trade statistics</li>
                                <li>Weather patterns (IVC, West Africa)</li>
                                <li>Currency exchange rates</li>
                                <li>Agricultural reports</li>
                            </ul>
                        </CardContent>
                    </Card>

                    <Card className="glass-card">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <Cpu className="h-5 w-5 text-primary" />
                                </div>
                                <CardTitle className="text-lg">LSTM Neural Networks</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm text-muted-foreground">
                            <p>Long Short-Term Memory (LSTM) networks analyze time-series data to capture long-term dependencies in price movements, ideal for agricultural commodities with seasonal trends.</p>
                        </CardContent>
                    </Card>

                    <Card className="glass-card">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <Workflow className="h-5 w-5 text-primary" />
                                </div>
                                <CardTitle className="text-lg">Ensemble Learning</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm text-muted-foreground">
                            <p>Combining predictions from multiple models (ARIMA, FB Prophet, LSTM) to reduce variance and improve overall forecast accuracy.</p>
                        </CardContent>
                    </Card>
                </div>

                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle>Architecture Overview</CardTitle>
                        <CardDescription>High-level data flow from ingestion to visualization.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="relative flex flex-col md:flex-row items-center justify-between gap-4 p-8 bg-muted/30 rounded-xl border border-dashed border-border/50">
                            {['Raw Data Ingestion', 'Preprocessing & Cleaning', 'Model Inference', 'Post-Processing', 'Frontend Visualization'].map((step, i) => (
                                <React.Fragment key={i}>
                                    <div className="flex flex-col items-center gap-2 text-center z-10">
                                        <div className="h-12 w-12 rounded-xl bg-card border border-border shadow-sm flex items-center justify-center font-bold text-primary">
                                            {i + 1}
                                        </div>
                                        <span className="text-xs font-medium max-w-[100px]">{step}</span>
                                    </div>
                                    {i < 4 && (
                                        <div className="w-px h-8 md:w-full md:h-px bg-border flex-1" />
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
