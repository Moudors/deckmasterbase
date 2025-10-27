import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import React from "react";

export const ScrollArea = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <ScrollAreaPrimitive.Root className={`overflow-hidden ${className || ""}`}>
    <ScrollAreaPrimitive.Viewport className="h-full w-full">{children}</ScrollAreaPrimitive.Viewport>
    <ScrollAreaPrimitive.Scrollbar orientation="vertical" className="flex w-2 bg-gray-800">
      <ScrollAreaPrimitive.Thumb className="flex-1 rounded-full bg-gray-600" />
    </ScrollAreaPrimitive.Scrollbar>
  </ScrollAreaPrimitive.Root>
);
