import { cn, getInitials } from '@/lib/utils';

export function Avatar({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-gold/30 to-gold/10 text-[14px] font-semibold text-gold',
        className
      )}
    >
      {getInitials(name)}
    </div>
  );
}
