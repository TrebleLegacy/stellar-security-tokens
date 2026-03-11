import React from 'react';

export function FilterChip({
    active,
    count,
    label,
    icon,
    onClick,
}: {
    active: boolean;
    count: number;
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${active
                ? 'bg-white/10 text-white border border-white/20'
                : 'bg-white/[0.03] text-zinc-400 border border-white/[0.06] hover:bg-white/[0.06]'
                }`}
        >
            {icon}
            {label}
            {count > 0 && (
                <span
                    className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${active ? 'bg-white/20 text-white' : 'bg-white/[0.06] text-zinc-500'
                        }`}
                >
                    {count}
                </span>
            )}
        </button>
    );
}
