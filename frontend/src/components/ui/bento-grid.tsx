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
        'grid grid-cols-1 gap-4 md:grid-cols-3',
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
      className={cn(
        'group/bento row-span-1 flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-none transition duration-200',
        className,
      )}
    >
      {header}
      <div className="transition duration-200 group-hover/bento:translate-x-2">
        {icon && <div className="mb-2">{icon}</div>}
        {title && (
          <div className="mb-1 font-sans font-bold text-foreground">
            {title}
          </div>
        )}
        {description && (
          <div className="font-sans text-xs font-normal text-muted-foreground">
            {description}
          </div>
        )}
        {children}
      </div>
    </div>
  );
};
