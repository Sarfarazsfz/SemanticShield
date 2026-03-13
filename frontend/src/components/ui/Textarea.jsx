import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const Textarea = forwardRef(({ className, ...props }, ref) => {
    return (
        <textarea
            className={cn(
                "flex min-h-[200px] w-full rounded-xl border-2 border-accent/20 bg-white/50 px-4 py-3 text-sm text-dark font-mono placeholder:text-accent/40 focus:border-accent focus:ring-2 focus:ring-accent/20 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 resize-y",
                className
            )}
            ref={ref}
            {...props}
        />
    );
});
Textarea.displayName = "Textarea";

export { Textarea };
