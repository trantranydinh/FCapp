import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { ArrowDown } from "lucide-react";

const Layer = ({ name, type, units, activation, isLast }) => (
    <div className="flex flex-col items-center">
        <div className="w-64 p-4 rounded-xl border border-border/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm shadow-sm hover:shadow-md hover:border-primary/30 transition-all group">
            <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm">{name}</span>
                <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">
                    {type}
                </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div className="flex flex-col">
                    <span className="opacity-70">Units</span>
                    <span className="font-medium text-foreground">{units}</span>
                </div>
                <div className="flex flex-col">
                    <span className="opacity-70">Activation</span>
                    <span className="font-medium text-foreground">{activation}</span>
                </div>
            </div>
        </div>
        {!isLast && (
            <div className="h-8 flex items-center justify-center">
                <ArrowDown className="h-4 w-4 text-muted-foreground/50" />
            </div>
        )}
    </div>
);

export default function ModelArchitectureViewer() {
    const layers = [
        { name: "Input Layer", type: "Input", units: "30 (Sequence Length)", activation: "-" },
        { name: "LSTM Layer 1", type: "LSTM", units: "50", activation: "Tanh" },
        { name: "Dropout Layer 1", type: "Dropout", units: "Rate: 0.2", activation: "-" },
        { name: "LSTM Layer 2", type: "LSTM", units: "50", activation: "Tanh" },
        { name: "Dropout Layer 2", type: "Dropout", units: "Rate: 0.2", activation: "-" },
        { name: "Dense Output", type: "Dense", units: "1", activation: "Linear" },
    ];

    return (
        <Card className="glass-card border-none h-full">
            <CardHeader>
                <CardTitle className="text-base">Model Architecture</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center py-2">
                    {layers.map((layer, index) => (
                        <Layer
                            key={index}
                            {...layer}
                            isLast={index === layers.length - 1}
                        />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
