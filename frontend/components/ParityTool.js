import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Calculator, AlertCircle, CheckCircle2 } from "lucide-react";

const ORIGINS = [
    { value: "", label: "Select Origin" },
    { value: "vietnam", label: "Vietnam" },
    { value: "cambodia", label: "Cambodia" },
    { value: "ivory_coast", label: "Ivory Coast" },
    { value: "tanzania", label: "Tanzania" },
    { value: "benin", label: "Benin" },
    { value: "burkina_faso", label: "Burkina Faso" },
    { value: "ghana", label: "Ghana" },
    { value: "nigeria", label: "Nigeria" },
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

    const handleReset = () => {
        setFormData({ origin: "", rcnCfr: "", qualityKor: "" });
        setErrors({});
        setResult(null);
    };

    return (
        <div className="space-y-6">
            <Card className="glass-card border-none">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary opacity-50" />
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calculator className="h-5 w-5 text-primary" />
                        Parity Tool
                    </CardTitle>
                    <CardDescription>
                        Calculate Price Ck/lb based on RCN CFR and Quality KOR
                    </CardDescription>
                </CardHeader>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="glass-card border-none">
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
                                onClick={handleReset}
                                variant="outline"
                                className="border-slate-300"
                            >
                                Reset
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card border-none">
                    <CardHeader>
                        <CardTitle className="text-lg">Calculation Result</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {result ? (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl border-2 border-primary/20">
                                    <div className="flex items-center gap-2 mb-2">
                                        <CheckCircle2 className="h-5 w-5 text-success" />
                                        <p className="text-sm font-medium text-muted-foreground">
                                            Price Ck/lb
                                        </p>
                                    </div>
                                    <p className="text-4xl font-bold text-primary">
                                        ${result.priceCkLb}
                                    </p>
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
        </div>
    );
};

export default ParityTool;
