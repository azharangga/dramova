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
        <span className="text-[11px] font-semibold tracking-wider uppercase text-zinc-500 dark:text-zinc-400">
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
        "h-4 rounded-md skeleton",
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

// 7. Full-Width Edge-to-Edge Interactive Area Chart
export function InteractiveAreaChart({
  data,
  title,
  subtitle,
}: {
  data: Array<{ label: string; value: number }>;
  title: string;
  subtitle?: string;
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Prevent divide by zero
  const maxValue = Math.max(...data.map((d) => d.value), 10);
  const width = 600;
  const height = 180;
  const paddingX = 20; 
  const paddingY = 20;

  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  const points = data.map((d, i) => {
    const x = paddingX + (i / Math.max(data.length - 1, 1)) * chartWidth;
    const y = height - paddingY - (d.value / maxValue) * chartHeight;
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
    ? `${pathD} L ${points[points.length - 1].x},${height} L ${points[0].x},${height} Z`
    : "";

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] p-5 shadow-2xs overflow-hidden flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[11px] font-semibold tracking-wider uppercase text-zinc-500 dark:text-zinc-400">
            {title}
          </span>
          {subtitle && (
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mt-0.5">
              {subtitle}
            </h3>
          )}
        </div>
        {hoveredIdx !== null && (
          <div className="text-xs font-mono bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100">
            <span className="text-zinc-500 dark:text-zinc-400">{data[hoveredIdx].label}:</span>{" "}
            <span className="font-bold text-[#2BA641]">{data[hoveredIdx].value}</span> sesi
          </div>
        )}
      </div>

      <div className="relative w-full pt-2">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-44 sm:h-52 overflow-visible"
        >
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2BA641" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#2BA641" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0.25, 0.5, 0.75].map((ratio, idx) => {
            const y = paddingY + ratio * chartHeight;
            return (
              <line
                key={idx}
                x1={0}
                y1={y}
                x2={width}
                y2={y}
                className="stroke-zinc-200/80 dark:stroke-zinc-800/80"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
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
                r={hoveredIdx === i ? 6 : 3.5}
                className={cn(
                  "transition-all duration-150",
                  hoveredIdx === i
                    ? "fill-[#2BA641] stroke-white dark:stroke-[#18181b] stroke-2"
                    : "fill-white dark:fill-[#18181b] stroke-[#2BA641] stroke-2"
                )}
              />
            </g>
          ))}
        </svg>

        {/* X Axis Labels under SVG */}
        <div className="flex justify-between pt-3 text-[11px] font-mono text-zinc-400 dark:text-zinc-500 border-t border-zinc-100 dark:border-zinc-800/60 mt-1">
          {data.map((d, i) => (
            <span
              key={i}
              className={cn(
                "cursor-pointer transition-colors w-full text-center",
                hoveredIdx === i ? "text-[#2BA641] font-bold" : ""
              )}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {d.label}
            </span>
          ))}
        </div>
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
    "#2BA641", // User green #2BA641
    "#0284c7", // sky
    "#f59e0b", // amber
    "#8b5cf6", // purple
    "#ec4899", // pink
    "#14b8a6", // teal
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
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] p-5 shadow-2xs flex flex-col justify-between">
      <div>
        <span className="text-[11px] font-semibold tracking-wider uppercase text-zinc-500 dark:text-zinc-400">
          {title}
        </span>
        {subtitle && (
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mt-0.5">
            {subtitle}
          </h3>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-around gap-4 my-2">
        {/* Donut Graphic */}
        <div className="relative w-[150px] h-[150px] flex items-center justify-center">
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
              {total}
            </span>
          </div>
        </div>

        {/* Legend List */}
        <div className="space-y-1.5 flex-1 min-w-[140px]">
          {slices.map((s, idx) => (
            <div
              key={idx}
              onMouseEnter={() => setHoveredLabel(s.label)}
              onMouseLeave={() => setHoveredLabel(null)}
              className={cn(
                "flex items-center justify-between text-xs px-2 py-1 rounded transition-colors cursor-pointer",
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
                {s.value} ({s.percentage}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
