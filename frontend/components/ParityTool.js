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
                priceCkLb: response.data.data.priceCkLb,
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

    const handleBlur = (field) => {
        const value = parseFloat(formData[field]);
        if (!isNaN(value)) {
            handleInputChange(field, value.toFixed(2));
        }
    };

    const handleClear = () => {
        setFormData({ origin: "", rcnCfr: "", qualityKor: "" });
        setErrors({});
        setResult(null);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleCalculate();
        }
    };

    const isFormEmpty = !formData.origin && !formData.rcnCfr && !formData.qualityKor && !formData.notes;

    return (
        <div className="space-y-6">
            <Card className="glass-card border-none">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary opacity-50" />
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Calculator className="h-5 w-5 text-primary" />
                            RCN GPT - Kit
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" onKeyDown={handleKeyDown}>
                <Card className="glass-card border-none">
                    <CardHeader>
                        <CardTitle className="text-lg">Input Parameters</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                * Origin
                            </label>
                            <select
                                value={formData.origin}
                                onChange={(e) => handleInputChange("origin", e.target.value)}
                                className={`w-full px-4 py-2.5 rounded-lg border ${errors.origin
                                    ? "border-red-500 focus:ring-red-500"
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
                                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                                    <AlertCircle className="h-4 w-4" />
                                    {errors.origin}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                * RCN CFR ($/MT)
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                                <input
                                    type="number"
                                    value={formData.rcnCfr}
                                    onChange={(e) => handleInputChange("rcnCfr", e.target.value)}
                                    onBlur={() => handleBlur("rcnCfr")}
                                    placeholder="1000 - 2500"
                                    step="0.01"
                                    className={`w-full pl-8 pr-4 py-2.5 rounded-lg border ${errors.rcnCfr
                                        ? "border-red-500 focus:ring-red-500"
                                        : "border-slate-300 focus:ring-primary"
                                        } focus:ring-2 focus:outline-none transition-all bg-white dark:bg-slate-800`}
                                />
                            </div>
                            {errors.rcnCfr && (
                                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                                    <AlertCircle className="h-4 w-4" />
                                    {errors.rcnCfr}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                * Quality KOR (lbs/bag)
                            </label>
                            <input
                                type="number"
                                value={formData.qualityKor}
                                onChange={(e) => handleInputChange("qualityKor", e.target.value)}
                                onBlur={() => handleBlur("qualityKor")}
                                placeholder="40 - 60"
                                step="0.01"
                                className={`w-full px-4 py-2.5 rounded-lg border ${errors.qualityKor
                                    ? "border-red-500 focus:ring-red-500"
                                    : "border-slate-300 focus:ring-primary"
                                    } focus:ring-2 focus:outline-none transition-all bg-white dark:bg-slate-800`}
                            />
                            {errors.qualityKor && (
                                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
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
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-600 flex items-center gap-2">
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
                                        Checking...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                        Check
                                    </>
                                )}
                            </Button>
                            <Button
                                onClick={handleClear}
                                disabled={isFormEmpty}
                                variant="outline"
                                className={`border-slate-300 ${isFormEmpty ? 'opacity-50 cursor-not-allowed' : 'text-muted-foreground hover:text-accent hover:border-accent'}`}
                            >
                                <Eraser className={`mr-2 h-4 w-4 ${isFormEmpty ? '' : 'text-red-500'}`} />
                                Clear data
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card border-none">
                    <CardHeader>
                        <CardTitle className="text-lg">Result</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {result ? (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="p-8 bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl border-2 border-primary/20 flex flex-col items-center justify-center text-center">
                                    <div className="flex items-center gap-2 mb-3">
                                        <CheckCircle2 className="h-6 w-6 text-success" />
                                        <p className="text-lg font-medium text-muted-foreground">
                                            Price Ck/lb
                                        </p>
                                    </div>
                                    <div className="flex items-baseline justify-center">
                                        <span className="text-5xl font-bold text-primary mr-1">$</span>
                                        <p className="text-5xl font-bold text-primary">
                                            {parseFloat(result.priceCkLb).toFixed(2)}
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
                                            <span className="font-medium">${parseFloat(result.rcnCfr).toFixed(2)}/MT</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-muted-foreground">Quality KOR</span>
                                            <span className="font-medium">{parseFloat(result.qualityKor).toFixed(2)} lbs/bag</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-64 text-center">
                                <AlertCircle className="h-16 w-16 text-muted-foreground/30 mb-4" />
                                <p className="text-muted-foreground">
                                    No result yet.
                                    <br />
                                    Please fill inputs and click Check.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* History Section */}
            {showHistory && (
                <Card className="glass-card border-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <History className="h-5 w-5 text-primary" />
                            Calculation History
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoadingHistory ? (
                            <div className="flex justify-center py-8">
                                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
                            </div>
                        ) : history.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-muted-foreground uppercase bg-slate-50 dark:bg-slate-900/50">
                                        <tr>
                                            <th className="px-4 py-3 rounded-tl-lg">Time</th>
                                            <th className="px-4 py-3">Origin</th>
                                            <th className="px-4 py-3">RCN CFR</th>
                                            <th className="px-4 py-3">KOR</th>
                                            <th className="px-4 py-3 text-right rounded-tr-lg">Price Ck/lb</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {history.map((item, index) => (
                                            <tr key={index} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                                <td className="px-4 py-3">
                                                    {new Date(item.timestamp || item.created_at).toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3 font-medium capitalize">{item.origin}</td>
                                                <td className="px-4 py-3">${parseFloat(item.rcn_cfr || 0).toFixed(2)}</td>
                                                <td className="px-4 py-3">{parseFloat(item.quality_kor || 0).toFixed(2)}</td>
                                                <td className="px-4 py-3 text-right font-bold text-primary">
                                                    ${parseFloat(item.price_per_lbs || 0).toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                No history found
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default ParityTool;
