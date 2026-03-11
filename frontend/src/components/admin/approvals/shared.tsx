import React from 'react';

export function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">{label}</p>
            <p className="text-sm text-white">{value || '—'}</p>
        </div>
    );
}

export function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="space-y-3">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{title}</h3>
            <div className="bg-white/[0.03] rounded-lg p-4 space-y-3">{children}</div>
        </div>
    );
}
