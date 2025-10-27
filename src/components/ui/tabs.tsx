// src/components/ui/tabs.tsx
import * as TabsPrimitive from "@radix-ui/react-tabs";
import React from "react";
import clsx from "clsx";

export const Tabs = TabsPrimitive.Root;
export const TabsList = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={clsx(
      "inline-flex items-center justify-center rounded-md bg-gray-800 p-1 text-gray-400",
      className
    )}
    {...props}
  />
));
TabsList.displayName = "TabsList";

export const TabsTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={clsx(
      "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
      "data-[state=active]:bg-gray-900 data-[state=active]:text-white",
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = "TabsTrigger";

export const TabsContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={clsx("mt-2 focus:outline-none", className)}
    {...props}
  />
));
TabsContent.displayName = "TabsContent";
