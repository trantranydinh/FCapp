import { cn } from "../lib/utils";

const sectors = [
    { name: "Raw Cashew Nut", change: +5.2, volume: "High", color: "bg-emerald-500" },
    { name: "Kernels W320", change: +2.1, volume: "Med", color: "bg-emerald-400" },
    { name: "Kernels W240", change: -1.5, volume: "Low", color: "bg-red-400" },
    { name: "Broken Grades", change: +0.8, volume: "Med", color: "bg-emerald-300/80" },
    { name: "Roasted/Salted", change: -3.2, volume: "High", color: "bg-red-500" },
    { name: "Organic", change: +8.5, volume: "Low", color: "bg-emerald-600" },
    { name: "Fair Trade", change: +1.2, volume: "Low", color: "bg-emerald-300" },
    { name: "By-products", change: -0.5, volume: "Med", color: "bg-red-300/80" },
];

export default function MarketHeatmap() {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1 h-[300px] w-full p-1 rounded-xl bg-muted/20 border border-white/10">
            {sectors.map((sector, idx) => (
                <div
                    key={idx}
                    className={cn(
                        "relative flex flex-col items-center justify-center p-4 rounded-lg transition-all duration-300 hover:scale-[1.02] hover:z-10 cursor-pointer group overflow-hidden",
                        sector.color,
                        "bg-opacity-20 hover:bg-opacity-30 backdrop-blur-sm border border-white/5"
                    )}
                >
                    {/* Background fill based on change intensity */}
                    <div
                        className={cn("absolute inset-0 opacity-20 transition-opacity group-hover:opacity-30", sector.color)}
                    />

                    <span className="relative z-10 font-bold text-foreground/90 text-center leading-tight">
                        {sector.name}
                    </span>
                    <span className={cn(
                        "relative z-10 text-lg font-bold mt-1",
                        sector.change > 0 ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"
                    )}>
                        {sector.change > 0 ? "+" : ""}{sector.change}%
                    </span>
                    <span className="relative z-10 text-[10px] uppercase tracking-wider opacity-60 mt-2">
                        Vol: {sector.volume}
                    </span>
                </div>
            ))}
        </div>
    );
}
