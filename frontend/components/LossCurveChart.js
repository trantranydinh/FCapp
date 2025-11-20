import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

export default function LossCurveChart() {
    // Mock training data
    const epochs = Array.from({ length: 50 }, (_, i) => i + 1);
    const trainingLoss = epochs.map(e => 0.5 * Math.exp(-0.1 * e) + 0.05 + Math.random() * 0.02);
    const validationLoss = epochs.map(e => 0.55 * Math.exp(-0.09 * e) + 0.08 + Math.random() * 0.03);

    const data = {
        labels: epochs,
        datasets: [
            {
                label: "Training Loss",
                data: trainingLoss,
                borderColor: "#3b82f6", // Blue
                backgroundColor: "rgba(59, 130, 246, 0.5)",
                tension: 0.4,
                pointRadius: 0,
                borderWidth: 2,
            },
            {
                label: "Validation Loss",
                data: validationLoss,
                borderColor: "#ef4444", // Red
                backgroundColor: "rgba(239, 68, 68, 0.5)",
                tension: 0.4,
                pointRadius: 0,
                borderWidth: 2,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: "top",
                labels: {
                    usePointStyle: true,
                    boxWidth: 6,
                    font: { size: 11 }
                }
            },
            tooltip: {
                mode: "index",
                intersect: false,
            },
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { maxTicksLimit: 10 }
            },
            y: {
                grid: { color: "rgba(255, 255, 255, 0.05)" },
                min: 0,
            },
        },
        interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false
        }
    };

    return (
        <Card className="glass-card border-none h-full">
            <CardHeader>
                <CardTitle className="text-base">Training Loss Curve</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
                <Line data={data} options={options} />
            </CardContent>
        </Card>
    );
}
