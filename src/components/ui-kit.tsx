import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Baby, Calendar, AlertCircle, Sparkles } from "lucide-react";

export function PageHeader({
  title,
  subtitle,
  action,
  backAction,
  badge,
  className,
}: {
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
  backAction?: ReactNode;
  badge?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", className)}>
      <div className="flex items-start gap-3 min-w-0">
        {backAction}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl leading-tight">
              {title}
            </h1>
            {badge}
          </div>
          {subtitle && (
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed max-w-prose">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && (
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {action}
        </div>
      )}
    </div>
  );
}

const pillVariants = {
  urgent: "bg-destructive-soft text-destructive border-destructive/20",
  warning: "bg-warning-soft text-warning border-warning/25",
  success: "bg-success-soft text-success border-success/20",
  neutral: "bg-muted text-muted-foreground border-border/60",
  primary: "bg-primary-soft text-primary border-primary/20",
};

const dotVariants = {
  urgent: "bg-destructive",
  warning: "bg-warning",
  success: "bg-success",
  neutral: "bg-muted-foreground",
  primary: "bg-primary",
};

export function Pill({
  tone = "neutral",
  children,
  withDot = false,
  className,
}: {
  tone?: keyof typeof pillVariants;
  children: ReactNode;
  withDot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold tracking-wide transition-colors",
        pillVariants[tone],
        className,
      )}
    >
      {withDot && (
        <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", dotVariants[tone])} />
      )}
      {children}
    </span>
  );
}

export function riskTone(r?: string | null): keyof typeof pillVariants {
  return r === "high" ? "urgent" : r === "moderate" ? "warning" : "success";
}

export function Section({
  title,
  subtitle,
  icon: Icon,
  action,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  icon?: any;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("card-surface p-4 sm:p-5 transition-all", className)}>
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-border/50 pb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {Icon && (
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary shadow-xs">
              <Icon className="h-4 w-4" />
            </div>
          )}
          <div className="min-w-0">
            <h2 className="text-sm font-bold tracking-tight text-foreground truncate">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function MetricCard({
  label,
  value,
  icon: Icon,
  hint,
  tone = "neutral",
  onClick,
  className,
}: {
  label: string;
  value: ReactNode;
  icon?: any;
  hint?: ReactNode;
  tone?: "primary" | "success" | "warning" | "urgent" | "neutral";
  onClick?: () => void;
  className?: string;
}) {
  const toneBg = {
    primary: "bg-primary-soft text-primary",
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning",
    urgent: "bg-destructive-soft text-destructive",
    neutral: "bg-muted text-muted-foreground",
  }[tone];

  return (
    <div
      onClick={onClick}
      className={cn(
        "card-interactive p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden rounded-2xl",
        onClick && "cursor-pointer",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-bold text-muted-foreground tracking-widest uppercase">{label}</p>
        {Icon && (
          <div className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl shadow-xs", toneBg)}>
            <Icon className="h-4.5 w-4.5" />
          </div>
        )}
      </div>
      <div className="mt-3">
        <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-display leading-none">
          {value}
        </div>
        {hint && <div className="mt-1.5 text-xs font-medium text-muted-foreground">{hint}</div>}
      </div>
    </div>
  );
}

export function GestationalTracker({
  ga,
  riskLevel,
  edd,
  className,
}: {
  ga?: { weeks: number; days: number } | null | undefined;
  riskLevel?: string | null | undefined;
  edd?: string | null | undefined;
  className?: string | undefined;
}) {
  if (!ga) {
    return (
      <div className={cn("rounded-2xl border border-dashed border-border/80 p-4 text-center text-xs text-muted-foreground", className)}>
        No active pregnancy gestational information recorded
      </div>
    );
  }

  const weeks = ga.weeks;
  const days = ga.days;
  const progressPercent = Math.min(Math.max(Math.round((weeks / 40) * 100), 2), 100);

  const trimester =
    weeks < 13
      ? { label: "1st Trimester", badge: "Weeks 1–12" }
      : weeks < 28
        ? { label: "2nd Trimester", badge: "Weeks 13–27" }
        : { label: "3rd Trimester", badge: "Weeks 28–40" };

  return (
    <div className={cn("card-surface p-4 sm:p-5 bg-gradient-to-br from-card to-primary-soft/20", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary-soft text-primary shadow-xs">
            <Baby className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Current Gestation
            </span>
            <div className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight leading-tight">
              {weeks}w {days}d
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Pill tone="primary">{trimester.label}</Pill>
          <Pill tone={riskTone(riskLevel)} withDot>
            {riskLevel || "standard"} risk
          </Pill>
        </div>
      </div>

      <div className="mt-4 space-y-1.5">
        <div className="flex justify-between text-[10px] font-semibold text-muted-foreground">
          <span>Week 1</span>
          <span>Week 13 (T2)</span>
          <span>Week 28 (T3)</span>
          <span>Week 40</span>
        </div>
        <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted/80">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {edd && (
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground border-t border-border/50 pt-2.5">
          <span className="flex items-center gap-1.5 font-medium">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            EDD: <strong className="text-foreground ml-0.5">{edd}</strong>
          </span>
          <span className="font-bold text-primary">
            {weeks >= 36 ? "Near term" : `${40 - weeks} weeks remaining`}
          </span>
        </div>
      )}
    </div>
  );
}

export function Empty({
  children,
  icon: Icon = AlertCircle,
  className,
}: {
  children: ReactNode;
  icon?: any;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-border/80 bg-card/40 p-8 text-center transition-all",
        className,
      )}
    >
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-muted/70 text-muted-foreground">
        <Icon className="h-6 w-6 opacity-75" />
      </div>
      <p className="mt-3 text-sm font-medium text-muted-foreground max-w-sm mx-auto">
        {children}
      </p>
    </div>
  );
}

export function Loading({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="card-surface animate-pulse rounded-2xl p-5 space-y-3"
        >
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-3/4 rounded-full bg-muted" />
              <div className="h-2.5 w-1/2 rounded-full bg-muted" />
            </div>
          </div>
          <div className="h-2 w-full rounded-full bg-muted" />
          <div className="h-2 w-5/6 rounded-full bg-muted" />
        </div>
      ))}
    </div>
  );
}
