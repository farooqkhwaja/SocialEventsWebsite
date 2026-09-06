interface EmptyStateProps {
  title: string;
  message: string;
}

export function EmptyState({ title, message }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-border-strong bg-surface/60 p-8 text-center">
      <p className="font-display text-lg text-ink mb-1">{title}</p>
      <p className="text-sm text-muted">{message}</p>
    </div>
  );
}
