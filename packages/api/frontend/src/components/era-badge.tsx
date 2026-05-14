import { getEraColor } from '../lib/eras';

interface EraBadgeProps {
  slug: string;
  label?: string;
}

export function EraBadge({ slug, label }: Readonly<EraBadgeProps>) {
  const color = getEraColor(slug);
  return (
    <span
      class="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-2.5 py-0.5 text-xs font-medium text-stone-700"
      style={{ borderColor: `${color}40` }}
    >
      <span class="h-2 w-2 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
      {label ?? slug}
    </span>
  );
}
