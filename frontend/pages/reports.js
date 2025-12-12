import Head from "next/head";
import { useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { FileText, Download, Loader2 } from "lucide-react";
import { api } from "../lib/apiClient";
 
const ReportsPage = () => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [reportUrl, setReportUrl] = useState(null);
    const [reportHtml, setReportHtml] = useState(null);
 
    const generateReport = async () => {
        setIsGenerating(true);
        setReportUrl(null);
        setReportHtml(null);
 
        try {
            // Call API to generate report
            // Note: In a real app, we would pass actual data here
            const response = await api.post("/api/v1/dashboard/reports/generate", {
                trend: "UPWARD",
                confidence: 87,
                forecastPrice: 152.50,
                currentPrice: 148.20,
                priceChange: 2.4,
                volatility: "Medium",
                primaryDriver: "Supply Chain Constraints",
                recommendation: "Increase inventory positions",
                riskRegion: "West Africa"
            });
 
            if (response.data.success) {
                // For demo purposes, we'll fetch the generated file content
                // In production, this would be a download link
                const fileName = response.data.data.fileName;
 
                // Construct URL to view the report (served via static middleware if configured,
                // or we can just render the HTML directly if the API returned it)
                // For this demo, let's simulate by fetching the content if possible,
                // or just showing a success message.
 
                // Since we don't have a direct "get report content" API, we will just show the success state
                // and a mock "Download" button.
 
                // However, to make it "viewable in web", let's try to render a preview iframe
                // We can use the data we sent to render a client-side preview as well.
 
                setReportUrl(fileName);
            }
        } catch (error) {
            console.error("Failed to generate report:", error);
            alert("Failed to generate report. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };
 
    return (
        <>
            <Head>
                <title>Reports | Cashew Forecast</title>
            </Head>
            <DashboardLayout title="Reports & Analysis">
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Generate Market Report
                            </CardTitle>
                            <CardDescription>
                                Create a professional PDF-style report based on the latest market data and AI analysis.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg bg-slate-50 dark:bg-slate-900/50">
                                <div className="text-center space-y-4 max-w-md">
                                    <div className="bg-primary/10 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                                        <FileText className="h-8 w-8 text-primary" />
                                    </div>
                                    <h3 className="text-lg font-semibold">Monthly Market Intelligence Report</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Includes executive summary, price forecast charts, key market drivers, and strategic recommendations.
                                    </p>
 
                                    <Button
                                        onClick={generateReport}
                                        disabled={isGenerating}
                                        className="w-full sm:w-auto"
                                    >
                                        {isGenerating ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Generating Analysis...
                                            </>
                                        ) : (
                                            <>
                                                <FileText className="mr-2 h-4 w-4" />
                                                Generate New Report
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
 
                    {/* Report Preview Section */}
                    {reportUrl && (
                        <Card className="overflow-hidden">
                            <CardHeader className="bg-slate-50 dark:bg-slate-900 border-b flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Report Preview</CardTitle>
                                    <CardDescription>Generated on {new Date().toLocaleDateString()}</CardDescription>
                                </div>
                                <Button variant="outline" size="sm">
                                    <Download className="mr-2 h-4 w-4" />
                                    Download PDF
                                </Button>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="aspect-[1/1.4] w-full bg-white overflow-auto p-8">
                                    {/* This is a visual representation of the report for the web view */}
                                    <div className="max-w-3xl mx-auto bg-white shadow-sm border p-8 min-h-[800px] text-slate-800">
                                        {/* Header */}
                                        <div className="border-b-2 border-slate-900 pb-4 mb-8 flex justify-between items-end">
                                            <div className="text-2xl font-bold text-slate-900 uppercase tracking-wider">
                                                Cashew<span className="text-red-600">AI</span> Intelligence
                                            </div>
                                            <div className="text-right text-xs text-slate-500">
                                                <div>Date: {new Date().toLocaleDateString()}</div>
                                                <div>Report ID: {reportUrl.replace('.html', '')}</div>
                                                <div>Confidential & Proprietary</div>
                                            </div>
                                        </div>
 
                                        {/* Executive Summary */}
                                        <div className="mb-8">
                                            <h2 className="text-lg font-bold text-red-600 uppercase mb-3 border-l-4 border-red-600 pl-2">Executive Summary</h2>
                                            <div className="bg-slate-50 p-4 rounded text-sm space-y-2">
                                                <div className="flex gap-2">
                                                    <span className="text-red-600 font-bold">■</span>
                                                    <p><strong>Market Trend:</strong> The cashew market is showing a <strong>UPWARD</strong> trajectory with a confidence score of 87%.</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <span className="text-red-600 font-bold">■</span>
                                                    <p><strong>Price Forecast:</strong> AI models predict a price movement towards <strong>$152.50</strong> in the next 30 days.</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <span className="text-red-600 font-bold">■</span>
                                                    <p><strong>Key Driver:</strong> Supply Chain Constraints is currently the dominant factor influencing market volatility.</p>
                                                </div>
                                            </div>
                                        </div>
 
                                        {/* Metrics */}
                                        <div className="mb-8">
                                            <h2 className="text-lg font-bold text-red-600 uppercase mb-3 border-l-4 border-red-600 pl-2">Key Market Indicators</h2>
                                            <div className="grid grid-cols-3 gap-4">
                                                <div className="border p-3 text-center">
                                                    <div className="text-xs text-slate-500 uppercase">Current Price</div>
                                                    <div className="text-2xl font-bold text-slate-900 my-1">$148.20</div>
                                                    <div className="text-green-600 text-sm font-medium">▲ 2.4%</div>
                                                </div>
                                                <div className="border p-3 text-center">
                                                    <div className="text-xs text-slate-500 uppercase">Volatility Index</div>
                                                    <div className="text-2xl font-bold text-slate-900 my-1">Medium</div>
                                                    <div className="text-xs text-slate-400">Risk Level</div>
                                                </div>
                                                <div className="border p-3 text-center">
                                                    <div className="text-xs text-slate-500 uppercase">AI Confidence</div>
                                                    <div className="text-2xl font-bold text-slate-900 my-1">87%</div>
                                                    <div className="text-xs text-slate-400">Model Accuracy</div>
                                                </div>
                                            </div>
                                        </div>
 
                                        {/* Strategic Implications */}
                                        <div className="mb-8">
                                            <h2 className="text-lg font-bold text-red-600 uppercase mb-3 border-l-4 border-red-600 pl-2">Strategic Implications</h2>
                                            <div className="text-sm">
                                                <p className="mb-2">Based on the current quantitative analysis and qualitative news sentiment, we recommend the following actions:</p>
                                                <ul className="list-disc pl-5 space-y-1">
                                                    <li><strong>Procurement:</strong> Consider Increase inventory positions as prices are expected to rise.</li>
                                                    <li><strong>Risk Management:</strong> Hedge against potential volatility in the West Africa market sector.</li>
                                                </ul>
                                            </div>
                                        </div>
 
                                        {/* Footer */}
                                        <div className="border-t pt-4 mt-12 flex justify-between text-[10px] text-slate-400">
                                            <div>Generated by Cashew Forecast AI System</div>
                                            <div>Page 1 of 1</div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </DashboardLayout>
        </>
    );
};
 
export default ReportsPage;