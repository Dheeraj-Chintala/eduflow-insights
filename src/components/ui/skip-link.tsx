import { cn } from "@/lib/utils";

interface SkipLinkProps {
  href?: string;
  className?: string;
  children?: React.ReactNode;
}

export function SkipLink({ 
  href = "#main-content", 
  className,
  children = "Skip to main content" 
}: SkipLinkProps) {
  return (
    <a
      href={href}
      className={cn(
        "sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-4 focus:left-4",
        "focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground",
        "focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring",
        "transition-all",
        className
      )}
    >
      {children}
    </a>
  );
}
