const sizeMap = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl'
};

const colorMap = [
  'bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-pink-500', 'bg-indigo-500'
];

function getColor(name = '') {
  const idx = name.charCodeAt(0) % colorMap.length;
  return colorMap[idx];
}

function getInitials(name = '') {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function Avatar({ user, size = 'md', className = '' }) {
  const sizeClass = sizeMap[size] || sizeMap.md;
  const colorClass = getColor(user?.name);

  if (user?.avatar) {
    return (
      <img
        src={user.avatar.startsWith('http') ? user.avatar : user.avatar}
        alt={user.name}
        className={`${sizeClass} rounded-full object-cover flex-shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} ${colorClass} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 ${className}`}
    >
      {getInitials(user?.name || '?')}
    </div>
  );
}

export function AvatarGroup({ users = [], max = 3, size = 'sm' }) {
  const visible = users.slice(0, max);
  const remaining = users.length - max;

  return (
    <div className="flex -space-x-2">
      {visible.map((user, i) => (
        <div key={user._id || i} className="ring-2 ring-white dark:ring-slate-900 rounded-full">
          <Avatar user={user} size={size} />
        </div>
      ))}
      {remaining > 0 && (
        <div className={`${sizeMap[size]} bg-slate-200 dark:bg-slate-700 rounded-full ring-2 ring-white dark:ring-slate-900 flex items-center justify-center text-xs font-medium text-slate-600 dark:text-slate-300`}>
          +{remaining}
        </div>
      )}
    </div>
  );
}
