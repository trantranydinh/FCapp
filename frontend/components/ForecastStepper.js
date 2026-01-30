import { Check, UploadCloud, FileText, Cpu, BarChart, Zap } from "lucide-react";
import { cn } from "../lib/utils";

const steps = [
    { id: 1, label: "Upload", icon: UploadCloud },
    { id: 2, label: "Preprocess", icon: FileText },
    { id: 3, label: "Processing", icon: Cpu },
    { id: 4, label: "Evaluate", icon: BarChart },
    { id: 5, label: "Forecast", icon: Zap },
];

export default function ForecastStepper({ currentStep = 1 }) {
    return (
        <div className="w-full py-4">
            <div className="relative flex items-center justify-between w-full">
                {/* Connecting Line */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-muted rounded-full -z-10">
                    <div
                        className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500 ease-out rounded-full"
                        style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                    />
                </div>

                {steps.map((step) => {
                    const Icon = step.icon;
                    const isCompleted = step.id < currentStep;
                    const isCurrent = step.id === currentStep;

                    return (
                        <div key={step.id} className="flex flex-col items-center gap-2 group">
                            <div
                                className={cn(
                                    "relative flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 bg-background",
                                    isCompleted ? "border-primary bg-primary text-primary-foreground scale-110" :
                                        isCurrent ? "border-accent text-accent ring-4 ring-accent/20 scale-125" :
                                            "border-muted-foreground/30 text-muted-foreground"
                                )}
                            >
                                {isCompleted ? (
                                    <Check className="h-5 w-5 animate-in zoom-in duration-300" />
                                ) : (
                                    <Icon className="h-5 w-5" />
                                )}

                                {/* Pulse effect for current step */}
                                {isCurrent && (
                                    <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-20 animate-ping" />
                                )}
                            </div>

                            <span
                                className={cn(
                                    "text-xs font-medium transition-colors duration-300 absolute -bottom-6 whitespace-nowrap",
                                    isCurrent ? "text-accent font-bold" :
                                        isCompleted ? "text-primary" : "text-muted-foreground"
                                )}
                            >
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
