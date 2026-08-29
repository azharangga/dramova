"use client";

import React, { ReactNode, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// 1. Page Header
export function DashboardPageHeader({
  title,
  description,
  count,
  actions,
}: {
  title: string;
  description?: string;
  count?: number;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 sm:flex sm:flex-wrap sm:items-end sm:justify-between sm:gap-4 font-sans">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {title}
          </h1>
          {count !== undefined && (
            <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 text-[10px] sm:text-[11px] font-semibold rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 tabular-nums">
              {count}
            </span>
          )}
        </div>
        {description && (
          <p className="mt-1 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-2xl line-clamp-2">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

// 2. Stat Card
export function DashboardStatCard({
  label,
  value,
  hint,
  icon,
  trend,
  className,
  onClick,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  trend?: { value: string; positive?: boolean };
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative rounded-lg border p-5 select-none transition-shadow",
        "bg-white dark:bg-[#18181b]",
        "border-zinc-200 dark:border-zinc-800",
        "shadow-2xs hover:shadow-xs",
        onClick && "cursor-pointer",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold tracking-wider text-zinc-500 dark:text-zinc-400">
          {label}
        </span>
        {icon && <span className="text-zinc-500 dark:text-zinc-400">{icon}</span>}
      </div>
      <div className="mt-2.5 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 tabular-nums">
        {value}
      </div>
      {(hint || trend) && (
        <div className="mt-1.5 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          {trend && (
            <span
              className={cn(
                "font-semibold",
                trend.positive ? "text-[#2BA641]" : "text-[#ff2201]"
              )}
            >
              {trend.positive ? "↑" : "↓"} {trend.value}
            </span>
          )}
          <span>{hint}</span>
        </div>
      )}
    </div>
  );
}

// 3. Empty State
export function DashboardEmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-14 px-6 text-center",
        "bg-zinc-50/50 dark:bg-zinc-900/30",
        "border-zinc-200 dark:border-zinc-800",
        className
      )}
    >
      {icon && <div className="text-zinc-400 dark:text-zinc-500 text-2xl">{icon}</div>}
      <h3 className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
      {description && <p className="max-w-xs text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">{description}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

// 4. Shimmer Skeleton Component
// Added transition colors to prevent glitch. Reverts to standard CSS logic defined in app.css that avoids react hydration mismatch
export function ShimmerBar({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "h-4 rounded-md skeleton transition-none",
        className
      )}
    />
  );
}

// 5. Active Status Dot
export function StatusDot({ active = true }: { active?: boolean }) {
  return (
    <span className="relative flex h-2 w-2 shrink-0">
      {active && (
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2BA641] opacity-75" />
      )}
      <span
        className={cn(
          "relative inline-flex rounded-full h-2 w-2",
          active ? "bg-[#2BA641]" : "bg-zinc-400 dark:bg-zinc-600"
        )}
      />
    </span>
  );
}

// 6. Refined Status Badge Component (Solid for success)
export function DashboardBadge({
  children,
  variant = "neutral",
  size = "sm",
  dot = false,
  className,
}: {
  children: React.ReactNode;
  variant?: "success" | "warning" | "danger" | "info" | "neutral";
  size?: "sm" | "md";
  dot?: boolean;
  className?: string;
}) {
  const variantStyles = {
    // Solid green variant per user request
    success: "bg-[#2BA641] text-white border-transparent",
    // Keep other variants clean
    warning: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/25",
    danger: "bg-[#ff2201] text-white border-transparent",
    info: "bg-sky-500/10 text-sky-600 border-sky-500/20 dark:bg-sky-500/15 dark:text-sky-400 dark:border-sky-500/25",
    neutral: "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800/70 dark:text-zinc-300 dark:border-zinc-700/60",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[10px] sm:text-[11px] rounded-md border font-medium",
    md: "px-2.5 py-1 text-xs rounded-md border font-medium",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 font-medium tracking-wide font-sans select-none",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full shrink-0",
            variant === "success" && "bg-white",
            variant === "warning" && "bg-amber-500 dark:bg-amber-400",
            variant === "danger" && "bg-white",
            variant === "info" && "bg-sky-500 dark:bg-sky-400",
            variant === "neutral" && "bg-zinc-400 dark:bg-zinc-600"
          )}
        />
      )}
      <span className="truncate">{children}</span>
    </div>
  );
}

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// 7. Full-Width Edge-to-Edge Interactive Area Chart
export function InteractiveAreaChart({
  data,
  title,
  subtitle,
  years = [],
  selectedYear,
  onSelectYear,
}: {
  data: Array<{ label: string; value: number }>;
  title: string;
  subtitle?: string;
  years?: number[];
  selectedYear?: number;
  onSelectYear?: (year: number) => void;
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Prevent divide by zero
  const maxValue = Math.max(...data.map((d) => d.value), 5);
  const width = 600;
  const height = 195;
  const paddingLeft = 35;
  const paddingRight = 20;
  const paddingTop = 15;
  const paddingBottom = 35;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const points = data.map((d, i) => {
    const x = paddingLeft + (i / Math.max(data.length - 1, 1)) * chartWidth;
    const y = height - paddingBottom - (d.value / maxValue) * chartHeight;
    return { x, y, label: d.label, value: d.value };
  });

  // Smooth bezier curve path
  const pathD = points.reduce((acc, point, i, arr) => {
    if (i === 0) return `M ${point.x},${point.y}`;
    const prev = arr[i - 1];
    const cp1x = prev.x + (point.x - prev.x) / 2;
    const cp1y = prev.y;
    const cp2x = prev.x + (point.x - prev.x) / 2;
    const cp2y = point.y;
    return `${acc} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${point.x},${point.y}`;
  }, "");

  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x},${height - paddingBottom} L ${points[0].x},${height - paddingBottom} Z`
    : "";

  const yTicks = [1, 0.75, 0.5, 0.25, 0].map((ratio) => Math.round(ratio * maxValue));

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] p-5 shadow-2xs overflow-hidden flex flex-col justify-between h-full">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <span className="text-[11px] font-semibold tracking-wider text-zinc-500 dark:text-zinc-400">
            {title}
          </span>
          {subtitle && (
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mt-0.5">
              {subtitle}
            </h3>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {years.length > 0 && selectedYear !== undefined && onSelectYear && (
            <Select
              value={selectedYear.toString()}
              onValueChange={(val) => onSelectYear(Number(val))}
            >
              <SelectTrigger className="h-8 w-[120px] text-[11px] font-bold bg-[var(--bg-raised)] dark:bg-[#18181b] border-zinc-200 dark:border-zinc-800 rounded-full px-3 transition hover:opacity-80">
                <SelectValue placeholder="Pilih Tahun" />
              </SelectTrigger>
              <SelectContent className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] rounded-xl shadow-md p-1">
                <SelectItem value="0">Semua Tahun</SelectItem>
                {years.map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    Tahun {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <div className="relative w-full flex-1 flex flex-col justify-center">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-48 sm:h-56 overflow-visible"
        >
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2BA641" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#2BA641" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Y Axis Tick Numbers & Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = paddingTop + ratio * chartHeight;
            const val = yTicks[idx];
            return (
              <g key={idx}>
                <text
                  x={paddingLeft - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-zinc-400 dark:fill-zinc-500 text-[10px] font-mono select-none"
                >
                  {val}
                </text>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  className="stroke-zinc-200/80 dark:stroke-zinc-800/80"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
              </g>
            );
          })}

          {/* Area Fill */}
          {areaD && (
            <path d={areaD} fill="url(#areaGradient)" />
          )}

          {/* Line Stroke */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke="#2BA641"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Interactive Data Points */}
          {points.map((p, i) => (
            <g
              key={i}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <circle
                cx={p.x}
                cy={p.y}
                r={hoveredIdx === i ? 5.5 : 3}
                className={cn(
                  "transition-all duration-150",
                  hoveredIdx === i
                    ? "fill-[#2BA641] stroke-white dark:stroke-[#18181b] stroke-2"
                    : "fill-white dark:fill-[#18181b] stroke-[#2BA641] stroke-2"
                )}
              />
            </g>
          ))}

          {/* SVG Tooltip on Hover */}
          {hoveredIdx !== null && (
            <g
              transform={`translate(${
                points[hoveredIdx].x > width - 70
                  ? points[hoveredIdx].x - 65
                  : points[hoveredIdx].x < 70
                  ? points[hoveredIdx].x + 5
                  : points[hoveredIdx].x - 30
              }, ${
                points[hoveredIdx].y - 35 < 5
                  ? points[hoveredIdx].y + 12
                  : points[hoveredIdx].y - 35
              })`}
              className="pointer-events-none transition-all duration-150"
            >
              <rect
                width="60"
                height="26"
                rx="4"
                className="fill-zinc-900/90 dark:fill-zinc-100/95 stroke-zinc-700/50 shadow-md"
              />
              <text
                x="30"
                y="11"
                textAnchor="middle"
                className="fill-zinc-300 dark:fill-zinc-600 text-[9px] font-mono select-none"
              >
                {points[hoveredIdx].label}
              </text>
              <text
                x="30"
                y="21"
                textAnchor="middle"
                className="fill-white dark:fill-zinc-900 text-[10px] font-bold font-mono select-none"
              >
                {points[hoveredIdx].value} sesi
              </text>
            </g>
          )}

          {/* X Axis Labels inside SVG for exact alignment */}
          {points.map((p, i) => (
            <text
              key={i}
              x={p.x}
              y={height - 8}
              textAnchor="middle"
              className={cn(
                "cursor-pointer transition-colors text-[11px] font-mono select-none",
                hoveredIdx === i
                  ? "fill-[#2BA641] font-bold"
                  : "fill-zinc-400 dark:fill-zinc-500"
              )}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {p.label}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}

// 8. Interactive Donut Chart
export function InteractiveDonutChart({
  data,
  title,
  subtitle,
}: {
  data: Array<{ label: string; value: number; color?: string }>;
  title: string;
  subtitle?: string;
}) {
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);

  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
  const colors = [
    "#2BA641", // Emerald Green
    "#f59e0b", // Warm Amber
    "#8b5cf6", // Purple
    "#ec4899", // Pink
    "#14b8a6", // Teal
  ];

  let cumulativeAngle = 0;
  const size = 160;
  const radius = 60;
  const strokeWidth = 22;
  const center = size / 2;

  const slices = data.map((d, i) => {
    const percentage = d.value / total;
    const strokeDasharray = 2 * Math.PI * radius;
    const strokeDashoffset = strokeDasharray * (1 - percentage);
    const rotation = cumulativeAngle * 360;
    cumulativeAngle += percentage;

    return {
      label: d.label,
      value: d.value,
      percentage: Math.round(percentage * 100),
      color: d.color || colors[i % colors.length],
      strokeDasharray,
      strokeDashoffset,
      rotation,
    };
  });

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] p-5 shadow-2xs flex flex-col justify-between h-full">
      <div>
        <span className="text-[11px] font-semibold tracking-wider text-zinc-500 dark:text-zinc-400">
          {title}
        </span>
        {subtitle && (
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mt-0.5">
            {subtitle}
          </h3>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-around gap-4 my-auto py-3">
        {/* Donut Graphic */}
        <div className="relative w-[150px] h-[150px] flex items-center justify-center shrink-0">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
            {slices.map((s, idx) => (
              <circle
                key={idx}
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke={s.color}
                strokeWidth={hoveredLabel === s.label ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={s.strokeDasharray}
                strokeDashoffset={s.strokeDashoffset}
                transform={`rotate(${s.rotation} ${center} ${center})`}
                className="transition-all duration-200 cursor-pointer"
                onMouseEnter={() => setHoveredLabel(s.label)}
                onMouseLeave={() => setHoveredLabel(null)}
              />
            ))}
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase font-mono">Total</span>
            <span className="text-base font-bold text-zinc-900 dark:text-zinc-50 tabular-nums">
              {total.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Legend List */}
        <div className="space-y-1.5 flex-1 min-w-[140px] w-full">
          {slices.map((s, idx) => (
            <div
              key={idx}
              onMouseEnter={() => setHoveredLabel(s.label)}
              onMouseLeave={() => setHoveredLabel(null)}
              className={cn(
                "flex items-center justify-between text-xs px-2 py-1.5 rounded transition-colors cursor-pointer",
                hoveredLabel === s.label
                  ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold"
                  : "text-zinc-600 dark:text-zinc-400"
              )}
            >
              <div className="flex items-center gap-2 truncate">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                <span className="capitalize truncate">{s.label}</span>
              </div>
              <span className="font-mono tabular-nums text-zinc-700 dark:text-zinc-300 shrink-0 ml-2">
                {s.value.toLocaleString()} ({s.percentage}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
