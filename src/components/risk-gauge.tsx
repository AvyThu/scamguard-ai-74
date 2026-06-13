interface RiskGaugeProps {
  score: number; // 0..100
  risk: "SAFE" | "SUSPICIOUS" | "DANGEROUS" | "UNKNOWN";
}

export function RiskGauge({ score, risk }: RiskGaugeProps) {
  const angle = Math.min(180, Math.max(0, (score / 100) * 180));
  const color =
    risk === "DANGEROUS" ? "hsl(var(--destructive))"
    : risk === "SUSPICIOUS" ? "hsl(var(--warning, 38 92% 50%))"
    : risk === "SAFE" ? "hsl(var(--success, 142 71% 45%))"
    : "hsl(var(--muted-foreground))";
  const label =
    risk === "DANGEROUS" ? "NGUY HIỂM"
    : risk === "SUSPICIOUS" ? "NGHI NGỜ"
    : risk === "SAFE" ? "AN TOÀN"
    : "KHÔNG XÁC ĐỊNH";

  // semicircular SVG gauge
  const r = 80;
  const cx = 100;
  const cy = 100;
  const startA = Math.PI;
  const endA = Math.PI - (angle * Math.PI) / 180;
  const x2 = cx + r * Math.cos(endA);
  const y2 = cy + r * Math.sin(endA);
  const largeArc = angle > 180 ? 1 : 0;
  const trackPath = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
  const valuePath = `M ${cx - r} ${cy} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 120" className="w-full max-w-[260px]">
        <defs>
          <linearGradient id="riskGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(142 71% 45%)" />
            <stop offset="50%" stopColor="hsl(38 92% 50%)" />
            <stop offset="100%" stopColor="hsl(0 84% 60%)" />
          </linearGradient>
        </defs>
        <path d={trackPath} fill="none" stroke="hsl(var(--muted))" strokeWidth="14" strokeLinecap="round" />
        <path d={valuePath} fill="none" stroke="url(#riskGrad)" strokeWidth="14" strokeLinecap="round" />
        <circle cx={x2} cy={y2} r="8" fill={color} stroke="white" strokeWidth="2" />
        <text x={cx} y={cy - 10} textAnchor="middle" className="fill-foreground" fontSize="28" fontWeight="700">
          {score}
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" className="fill-muted-foreground" fontSize="10">
          / 100
        </text>
      </svg>
      <div
        className="mt-1 rounded-full px-4 py-1 text-sm font-bold tracking-wide"
        style={{ backgroundColor: color, color: "white" }}
      >
        {label}
      </div>
    </div>
  );
}
