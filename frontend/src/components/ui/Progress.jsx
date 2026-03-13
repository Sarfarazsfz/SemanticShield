import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const Progress = forwardRef(({ className, value = 0, color, ...props }, ref) => {
    return (
        <div
            ref={ref}
            className={cn(
                "relative h-2 w-full overflow-hidden rounded-full bg-primary-dark",
                className
            )}
            {...props}
        >
            <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                    width: `${Math.min(Math.max(value, 0), 100)}%`,
                    backgroundColor: color || '#A79277',
                }}
            />
        </div>
    );
});
Progress.displayName = "Progress";

export { Progress };
