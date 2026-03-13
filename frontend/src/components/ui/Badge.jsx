import { forwardRef } from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
    {
        variants: {
            variant: {
                default: "bg-accent/10 text-accent",
                success: "bg-success/10 text-success",
                warning: "bg-warning/10 text-warning",
                danger: "bg-danger/10 text-danger",
                outline: "text-dark/70 border border-accent/20",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
);

const Badge = forwardRef(({ className, variant, ...props }, ref) => {
    return (
        <span
            ref={ref}
            className={cn(badgeVariants({ variant }), className)}
            {...props}
        />
    );
});
Badge.displayName = "Badge";

export { Badge, badgeVariants };
