"use client";

import { memo } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { QuickAction } from "@/interfaces/QuickAction.interface";

interface FeatureCardProps {
  action: QuickAction;
  icon: LucideIcon;
  color: string;
}

const colorClasses: Record<string, string> = {
  blue: "from-blue-500 to-cyan-500 shadow-blue-500/20 hover:shadow-blue-500/40",
  purple: "from-purple-500 to-pink-500 shadow-purple-500/20 hover:shadow-purple-500/40",
  green: "from-green-500 to-emerald-500 shadow-green-500/20 hover:shadow-green-500/40",
  orange: "from-orange-500 to-red-500 shadow-orange-500/20 hover:shadow-orange-500/40",
  yellow: "from-yellow-500 to-orange-500 shadow-yellow-500/20 hover:shadow-yellow-500/40",
  cyan: "from-cyan-500 to-blue-500 shadow-cyan-500/20 hover:shadow-cyan-500/40",
  pink: "from-pink-500 to-rose-500 shadow-pink-500/20 hover:shadow-pink-500/40",
  teal: "from-teal-500 to-cyan-500 shadow-teal-500/20 hover:shadow-teal-500/40",
  indigo: "from-indigo-500 to-blue-500 shadow-indigo-500/20 hover:shadow-indigo-500/40",
};

const FeatureCard = memo(function FeatureCard({
  action,
  icon: Icon,
  color,
}: FeatureCardProps) {
  const colorClass =
    colorClasses[color as keyof typeof colorClasses] || colorClasses.blue;

  const cardContent = (
    <>
      {/* Gradient Border Top */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${colorClass}`} />

      {/* Background Glow */}
      <div
        className={`absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br ${colorClass} opacity-0 group-hover:opacity-10 blur-3xl transition-opacity duration-500`}
      />

      {/* Icon */}
      <div className="relative mb-4">
        <div
          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClass} flex items-center justify-center shadow-lg`}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>

      {/* Content */}
      <div className="relative">
        <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-white transition-colors">
          {action.title}
        </h3>
        <p className="text-sm text-slate-400 leading-relaxed">
          {action.description}
        </p>
      </div>
    </>
  );

  // onClick has priority over href
  if (action.onClick) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          action.onClick?.();
        }}
        className="group relative bg-slate-800/40 backdrop-blur-sm rounded-2xl p-6 text-left border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300 shadow-lg hover:shadow-xl overflow-hidden hover:scale-[1.02] hover:-translate-y-1 active:scale-[0.98] w-full"
      >
        {cardContent}
      </button>
    );
  }

  if (!action.href) {
    return null;
  }

  return (
    <Link
      href={action.href}
      className="group relative bg-slate-800/40 backdrop-blur-sm rounded-2xl p-6 text-left border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300 shadow-lg hover:shadow-xl overflow-hidden hover:scale-[1.02] hover:-translate-y-1 active:scale-[0.98]"
    >
      {cardContent}
    </Link>
  );
});

export default FeatureCard;
