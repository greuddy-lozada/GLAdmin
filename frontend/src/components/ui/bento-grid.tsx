import { cn } from '@/lib/utils';

export const BentoGrid = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-4 md:grid-cols-6',
        className,
      )}
    >
      {children}
    </div>
  );
};

export const BentoGridItem = ({
  className,
  title,
  description,
  header,
  icon,
  children,
}: {
  className?: string;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  header?: React.ReactNode;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}) => {
  return (
    <div
      data-slot="bento-item"
      className={cn(
        'group/bento row-span-1 flex flex-col justify-between rounded-2xl border-0 bg-card p-5 shadow-none transition duration-200 overflow-hidden',
        className,
      )}
    >
      {header}
      <div className="transition duration-200 group-hover/bento:translate-x-2">
        {icon && <div className="tilt-layer mb-2">{icon}</div>}
        {title && (
          <div className="tilt-layer mb-1 font-sans font-bold text-foreground">
            {title}
          </div>
        )}
        {description && (
          <div className="tilt-layer font-sans text-xs font-normal text-muted-foreground">
            {description}
          </div>
        )}
        {children}
      </div>
    </div>
  );
};
