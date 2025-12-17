import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Calculator, AlertCircle, CheckCircle2, Eraser, History, ChevronUp, ChevronDown } from "lucide-react";

const ORIGINS = [
    { value: "", label: "Select Origin" },
    { value: "tanzania", label: "Tanzania" },
    { value: "ghana", label: "Ghana" },
    { value: "IVC", label: "IVC" },
    { value: "cambodia", label: "Cambodia" },
    { value: "vietnam", label: "Vietnam" },
    { value: "nigeria", label: "Nigeria" },
    { value: "benin", label: "Benin" },
    { value: "india", label: "India" },
    { value: "bissau", label: "Bissau" },
    { value: "conakry", label: "Conakry" },
    { value: "senegal", label: "Senegal" },
    { value: "indonesia", label: "Indonesia" },
];

const ParityTool = () => {
    const [formData, setFormData] = useState({
        origin: "",
        rcnCfr: "",
        qualityKor: "",
    });

    const [errors, setErrors] = useState({});
    const [result, setResult] = useState(null);
    const [isCalculating, setIsCalculating] = useState(false);
    const [history, setHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: 'timestamp', direction: 'desc' });

    // Filter and Sort Logic
    const filteredHistory = history.filter(item => {
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        return (
            (item.origin && item.origin.toLowerCase().includes(searchLower)) ||
            (item.rcn_cfr && item.rcn_cfr.toString().includes(searchLower)) ||
            (item.quality_kor && item.quality_kor.toString().includes(searchLower))
        );
    }).sort((a, b) => {
        if (!sortConfig.key) return 0;

        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue < bValue) {
            return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
            return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
    });

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const fetchHistory = async () => {
        if (showHistory) {
            setShowHistory(false);
            return;
        }

        setIsLoadingHistory(true);
        try {
            const { api } = await import("../lib/apiClient");
            const response = await api.get('/api/v1/parity/history?limit=20');
            setHistory(response.data.data);
            setShowHistory(true);
        } catch (error) {
            console.error("Failed to fetch history:", error);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.origin) {
            newErrors.origin = "Please select an origin";
        }

        const rcnValue = parseFloat(formData.rcnCfr);
        if (!formData.rcnCfr || isNaN(rcnValue)) {
            newErrors.rcnCfr = "Please enter a valid RCN price";
        } else if (rcnValue < 1000 || rcnValue > 2500) {
            newErrors.rcnCfr = "Kindly enter the RCN price correctly.";
        }

        const korValue = parseFloat(formData.qualityKor);
        if (!formData.qualityKor || isNaN(korValue)) {
            newErrors.qualityKor = "Please enter a valid KOR value";
        } else if (korValue < 40 || korValue > 60) {
            newErrors.qualityKor = "Kindly enter the KOR (lbs/bag) correctly.";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: "" }));
        }
    };

    const handleCalculate = async () => {
        if (!validateForm()) return;

        setIsCalculating(true);
        setResult(null);

        try {
            const { api } = await import("../lib/apiClient");
            const response = await api.post('/api/v1/parity/calculate', formData);

            setResult({
                priceCkLb: response.data.priceCkLb,
                priceCkKg: response.data.priceCkKg,
                origin: ORIGINS.find((o) => o.value === formData.origin)?.label,
                rcnCfr: formData.rcnCfr,
                qualityKor: formData.qualityKor,
            });
        } catch (error) {
            const errorMessage = error.response?.data?.error || "Calculation failed. Please try again.";
            setErrors({ general: errorMessage });
        } finally {
            setIsCalculating(false);
        }
    };

    const handleIncrement = (field, step = 1) => {
        const currentValue = parseFloat(formData[field]) || 0;
        handleInputChange(field, (currentValue + step).toFixed(2));
    };

    const handleDecrement = (field, step = 1) => {
        const currentValue = parseFloat(formData[field]) || 0;
        handleInputChange(field, (currentValue - step).toFixed(2));
    };

    const handleClear = () => {
        setFormData({ origin: "", rcnCfr: "", qualityKor: "" });
        setErrors({});
        setResult(null);
    };

    return (
        <div className="space-y-6">
            <Card className="bg-card border border-border shadow-none">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Calculator className="h-5 w-5 text-primary" />
                            Parity Tool
                        </CardTitle>
                        <CardDescription>
                            Calculate Price Ck/lb based on RCN CFR and Quality KOR
                        </CardDescription>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={fetchHistory}
                        className="gap-2 text-muted-foreground hover:text-primary"
                    >
                        <History className="h-4 w-4" />
                        Detail
                    </Button>
                </CardHeader>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-card border border-border shadow-none">
                    <CardHeader>
                        <CardTitle className="text-lg">Input Parameters</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Origin <span className="text-accent">*</span>
                            </label>
                            <select
                                value={formData.origin}
                                onChange={(e) => handleInputChange("origin", e.target.value)}
                                className={`w-full px-4 py-2.5 rounded-lg border ${errors.origin
                                    ? "border-accent focus:ring-accent"
                                    : "border-slate-300 focus:ring-primary"
                                    } focus:ring-2 focus:outline-none transition-all bg-white dark:bg-slate-800`}
                            >
                                {ORIGINS.map((origin) => (
                                    <option key={origin.value} value={origin.value}>
                                        {origin.label}
                                    </option>
                                ))}
                            </select>
                            {errors.origin && (
                                <p className="mt-1 text-sm text-accent flex items-center gap-1">
                                    <AlertCircle className="h-4 w-4" />
                                    {errors.origin}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                RCN CFR ($/MT) <span className="text-accent">*</span>
                            </label>
                            <input
                                type="number"
                                value={formData.rcnCfr}
                                onChange={(e) => handleInputChange("rcnCfr", e.target.value)}
                                placeholder="1000 - 2500"
                                step="0.01"
                                className={`w-full px-4 py-2.5 rounded-lg border ${errors.rcnCfr
                                    ? "border-accent focus:ring-accent"
                                    : "border-slate-300 focus:ring-primary"
                                    } focus:ring-2 focus:outline-none transition-all bg-white dark:bg-slate-800`}
                            />
                            {errors.rcnCfr && (
                                <p className="mt-1 text-sm text-accent flex items-center gap-1">
                                    <AlertCircle className="h-4 w-4" />
                                    {errors.rcnCfr}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Quality KOR (lbs/bag) <span className="text-accent">*</span>
                            </label>
                            <input
                                type="number"
                                value={formData.qualityKor}
                                onChange={(e) => handleInputChange("qualityKor", e.target.value)}
                                placeholder="40 - 60"
                                step="0.01"
                                className={`w-full px-4 py-2.5 rounded-lg border ${errors.qualityKor
                                    ? "border-accent focus:ring-accent"
                                    : "border-slate-300 focus:ring-primary"
                                    } focus:ring-2 focus:outline-none transition-all bg-white dark:bg-slate-800`}
                            />
                            {errors.qualityKor && (
                                <p className="mt-1 text-sm text-accent flex items-center gap-1">
                                    <AlertCircle className="h-4 w-4" />
                                    {errors.qualityKor}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Notes (Optional)
                            </label>
                            <textarea
                                value={formData.notes || ""}
                                onChange={(e) => handleInputChange("notes", e.target.value)}
                                placeholder="Add any notes here..."
                                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-primary focus:ring-2 focus:outline-none transition-all bg-white dark:bg-slate-800 resize-none h-20"
                            />
                        </div>

                        {errors.general && (
                            <div className="p-3 bg-accent/10 border border-accent rounded-lg">
                                <p className="text-sm text-accent flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4" />
                                    {errors.general}
                                </p>
                            </div>
                        )}

                        <div className="flex gap-3 pt-2">
                            <Button
                                onClick={handleCalculate}
                                disabled={isCalculating}
                                className="flex-1 bg-primary hover:bg-primary/90 text-white"
                            >
                                {isCalculating ? (
                                    <>
                                        <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                                        Calculating...
                                    </>
                                ) : (
                                    <>
                                        <Calculator className="mr-2 h-4 w-4" />
                                        Calculate
                                    </>
                                )}
                            </Button>
                            <Button
                                onClick={handleClear}
                                variant="outline"
                                className="border-slate-300"
                            >
                                Reset
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card border border-border shadow-none">
                    <CardHeader>
                        <CardTitle className="text-lg">Calculation Result</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {result ? (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl border-2 border-primary/20 flex flex-col items-center text-center">
                                        <div className="flex items-center gap-2 mb-2">
                                            <CheckCircle2 className="h-6 w-6 text-success" />
                                            <p className="text-base font-medium text-muted-foreground">
                                                Parity Price (Ck/lb)
                                            </p>
                                        </div>
                                        <p className="text-4xl font-bold text-primary">
                                            ${result.priceCkLb !== null && result.priceCkLb !== undefined ? result.priceCkLb.toFixed(2) : '0.00'}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-4 border-t">
                                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                        Input Summary
                                    </h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-muted-foreground">Origin</span>
                                            <span className="font-medium">{result.origin}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-muted-foreground">RCN CFR</span>
                                            <span className="font-medium">${result.rcnCfr}/MT</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-muted-foreground">Quality KOR</span>
                                            <span className="font-medium">{result.qualityKor} lbs/bag</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-64 text-center">
                                <Calculator className="h-16 w-16 text-muted-foreground/30 mb-4" />
                                <p className="text-muted-foreground">
                                    Enter parameters and click Calculate
                                    <br />
                                    to see the result
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* History Section */}
            {showHistory && (
                <Card className="glass-card border-none mt-6 animate-in fade-in slide-in-from-bottom-4">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Calculation History</CardTitle>
                        <div className="relative w-64">
                            <input
                                type="text"
                                placeholder="Search history..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-primary focus:ring-2 focus:outline-none bg-white dark:bg-slate-800 text-sm"
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoadingHistory ? (
                            <div className="text-center py-4">Loading history...</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-muted-foreground uppercase bg-secondary/50">
                                        <tr>
                                            <th className="px-4 py-3 cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('timestamp')}>
                                                <div className="flex items-center gap-1">
                                                    Time
                                                    {sortConfig.key === 'timestamp' && (
                                                        sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                                                    )}
                                                </div>
                                            </th>
                                            <th className="px-4 py-3 cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('origin')}>
                                                <div className="flex items-center gap-1">
                                                    Origin
                                                    {sortConfig.key === 'origin' && (
                                                        sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                                                    )}
                                                </div>
                                            </th>
                                            <th className="px-4 py-3 cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('rcn_cfr')}>
                                                <div className="flex items-center gap-1">
                                                    RCN Price
                                                    {sortConfig.key === 'rcn_cfr' && (
                                                        sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                                                    )}
                                                </div>
                                            </th>
                                            <th className="px-4 py-3 cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('quality_kor')}>
                                                <div className="flex items-center gap-1">
                                                    KOR
                                                    {sortConfig.key === 'quality_kor' && (
                                                        sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                                                    )}
                                                </div>
                                            </th>
                                            <th className="px-4 py-3 text-right cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('price_per_lbs')}>
                                                <div className="flex items-center justify-end gap-1">
                                                    Price (Ck/lb)
                                                    {sortConfig.key === 'price_per_lbs' && (
                                                        sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                                                    )}
                                                </div>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredHistory.length > 0 ? (
                                            filteredHistory.map((item, index) => (
                                                <tr key={index} className="border-b border-border/50 hover:bg-secondary/20">
                                                    <td className="px-4 py-3">
                                                        {new Date(item.timestamp || item.calculation_time || item.created_at).toLocaleString()}
                                                    </td>
                                                    <td className="px-4 py-3 capitalize">{item.origin}</td>
                                                    <td className="px-4 py-3">${item.rcn_cfr}</td>
                                                    <td className="px-4 py-3">{item.quality_kor}</td>
                                                    <td className="px-4 py-3 text-right font-medium text-primary">${Number(item.price_per_lbs).toFixed(2)}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="5" className="px-4 py-8 text-center text-muted-foreground">
                                                    No history found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default ParityTool;
