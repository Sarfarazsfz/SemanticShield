import { forwardRef } from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:pointer-events-none disabled:opacity-50",
    {
        variants: {
            variant: {
                default:
                    "bg-accent text-white shadow-md hover:bg-hover hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-md",
                secondary:
                    "bg-white text-accent border-2 border-accent hover:bg-accent hover:text-white",
                ghost:
                    "text-dark/50 hover:text-dark hover:bg-accent/5",
                link:
                    "text-accent underline-offset-4 hover:underline",
            },
            size: {
                default: "px-6 py-3",
                sm: "px-4 py-2 text-xs",
                lg: "px-10 py-4 text-lg",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);

const Button = forwardRef(
    ({ className, variant, size, ...props }, ref) => {
        return (
            <button
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        );
    }
);
Button.displayName = "Button";

export { Button, buttonVariants };
