export default function ProgressBar({ value = 0, size = 'md', color = 'primary', showLabel = false, className = '' }) {
  const sizeMap = { sm: 'h-1', md: 'h-2', lg: 'h-3' };
  const colorMap = {
    primary: 'bg-primary-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500'
  };

  const getColor = () => {
    if (value >= 80) return colorMap.success;
    if (value >= 50) return colorMap.primary;
    if (value >= 25) return colorMap.warning;
    return colorMap.danger;
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`flex-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden ${sizeMap[size]}`}>
        <div
          className={`${sizeMap[size]} ${color === 'auto' ? getColor() : colorMap[color] || colorMap.primary} rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-slate-600 dark:text-slate-400 w-8 text-right">{value}%</span>
      )}
    </div>
  );
}
