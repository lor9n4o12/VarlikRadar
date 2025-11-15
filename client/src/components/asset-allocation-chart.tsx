import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import type { AssetAllocation } from "@shared/schema";

interface AssetAllocationChartProps {
  data: AssetAllocation[];
}

const COLORS = {
  hisse: "hsl(var(--chart-1))",
  etf: "hsl(var(--chart-2))",
  kripto: "hsl(var(--chart-4))",
  gayrimenkul: "hsl(var(--chart-5))",
};

export function AssetAllocationChart({ data }: AssetAllocationChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        Varlık bulunmamaktadır
      </div>
    );
  }

  const chartData = data.map((item) => ({
    name: item.name,
    value: item.value,
    percentage: item.percentage,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-popover-border rounded-md p-3 shadow-md">
          <p className="font-medium">{payload[0].name}</p>
          <p className="text-sm text-muted-foreground">
            {payload[0].value.toLocaleString("tr-TR", {
              style: "currency",
              currency: "TRY",
            })}
          </p>
          <p className="text-sm font-medium">{payload[0].payload.percentage.toFixed(1)}%</p>
        </div>
      );
    }
    return null;
  };

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null;

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        className="text-sm font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={CustomLabel}
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((entry, index) => {
            const type = data[index].type as keyof typeof COLORS;
            return <Cell key={`cell-${index}`} fill={COLORS[type] || COLORS.hisse} />;
          })}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          verticalAlign="bottom"
          height={36}
          formatter={(value, entry: any) => (
            <span className="text-sm">
              {value} ({entry.payload.percentage.toFixed(1)}%)
            </span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
