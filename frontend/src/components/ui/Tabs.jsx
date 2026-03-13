import { createContext, useContext, useState } from "react";
import { cn } from "@/lib/utils";

const TabsContext = createContext();

function Tabs({ defaultValue, children, className, ...props }) {
    const [activeTab, setActiveTab] = useState(defaultValue);
    return (
        <TabsContext.Provider value={{ activeTab, setActiveTab }}>
            <div className={cn("w-full", className)} {...props}>
                {children}
            </div>
        </TabsContext.Provider>
    );
}

function TabsList({ children, className, ...props }) {
    return (
        <div
            className={cn(
                "inline-flex items-center gap-1 rounded-xl bg-primary-dark/50 p-1",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}

function TabsTrigger({ value, children, className, ...props }) {
    const { activeTab, setActiveTab } = useContext(TabsContext);
    const isActive = activeTab === value;

    return (
        <button
            className={cn(
                "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all duration-300",
                isActive
                    ? "bg-white text-dark shadow-sm"
                    : "text-dark/50 hover:text-dark/80 hover:bg-white/50",
                className
            )}
            onClick={() => setActiveTab(value)}
            {...props}
        >
            {children}
        </button>
    );
}

function TabsContent({ value, children, className, ...props }) {
    const { activeTab } = useContext(TabsContext);
    if (activeTab !== value) return null;

    return (
        <div className={cn("mt-4 animate-fade-in", className)} {...props}>
            {children}
        </div>
    );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
