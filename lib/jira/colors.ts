/**
 * Jira Status and Priority Color Utilities
 * Standardized color palette for consistent UI across the Jira module
 */

export type StatusColor = "green" | "yellow" | "blue" | "blue-gray" | "gray";

export type PriorityLevel = "highest" | "high" | "medium" | "low" | "lowest";

/**
 * Get status badge color classes
 */
export function getStatusColorClasses(statusColor: StatusColor | string): string {
  const normalized = statusColor.toLowerCase().replace(/\s+/g, "-");

  switch (normalized) {
    case "green":
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    case "yellow":
    case "amber":
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
    case "blue":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    case "blue-gray":
    case "bluegrey":
      return "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400";
    case "gray":
    case "grey":
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
  }
}

/**
 * Get status badge color classes with gradient (for modern cards)
 */
export function getStatusColorClassesGradient(statusColor: StatusColor | string): string {
  const normalized = statusColor.toLowerCase().replace(/\s+/g, "-");

  switch (normalized) {
    case "green":
      return "bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 dark:from-green-900/30 dark:to-emerald-900/30 dark:text-green-400";
    case "yellow":
    case "amber":
      return "bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-700 dark:from-yellow-900/30 dark:to-amber-900/30 dark:text-yellow-400";
    case "blue":
      return "bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 dark:from-blue-900/30 dark:to-cyan-900/30 dark:text-blue-400";
    case "blue-gray":
    case "bluegrey":
      return "bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 dark:from-slate-900/30 dark:to-slate-800/30 dark:text-slate-400";
    case "gray":
    case "grey":
    default:
      return "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 dark:from-gray-700 dark:to-gray-800 dark:text-gray-300";
  }
}

/**
 * Get priority badge color classes
 */
export function getPriorityColorClasses(priority?: string): string {
  if (!priority) {
    return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
  }

  const lowerPriority = priority.toLowerCase();

  if (lowerPriority.includes("highest") || lowerPriority.includes("critical") || lowerPriority.includes("blocker")) {
    return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  }
  if (lowerPriority.includes("high") || lowerPriority.includes("major")) {
    return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
  }
  if (lowerPriority.includes("medium") || lowerPriority.includes("normal")) {
    return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
  }
  if (lowerPriority.includes("low") || lowerPriority.includes("minor")) {
    return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
  }
  if (lowerPriority.includes("lowest") || lowerPriority.includes("trivial")) {
    return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
  }

  return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
}

/**
 * Get priority badge color classes with gradient (for modern cards)
 */
export function getPriorityColorClassesGradient(priority?: string): string {
  if (!priority) {
    return "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 dark:from-gray-700 dark:to-gray-800 dark:text-gray-300";
  }

  const lowerPriority = priority.toLowerCase();

  if (lowerPriority.includes("highest") || lowerPriority.includes("critical") || lowerPriority.includes("blocker")) {
    return "bg-gradient-to-r from-red-100 to-rose-100 text-red-700 dark:from-red-900/30 dark:to-rose-900/30 dark:text-red-400";
  }
  if (lowerPriority.includes("high") || lowerPriority.includes("major")) {
    return "bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 dark:from-orange-900/30 dark:to-amber-900/30 dark:text-orange-400";
  }
  if (lowerPriority.includes("medium") || lowerPriority.includes("normal")) {
    return "bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-700 dark:from-yellow-900/30 dark:to-amber-900/30 dark:text-yellow-400";
  }
  if (lowerPriority.includes("low") || lowerPriority.includes("minor")) {
    return "bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 dark:from-blue-900/30 dark:to-cyan-900/30 dark:text-blue-400";
  }
  if (lowerPriority.includes("lowest") || lowerPriority.includes("trivial")) {
    return "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 dark:from-gray-700 dark:to-gray-800 dark:text-gray-300";
  }

  return "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 dark:from-gray-700 dark:to-gray-800 dark:text-gray-300";
}

