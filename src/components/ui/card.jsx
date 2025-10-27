// src/components/ui/card.jsx
import React from "react";
import clsx from "clsx";

export const Card = React.forwardRef(function Card({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={clsx(
        "rounded-lg border border-gray-700 bg-gray-900 text-white shadow",
        className
      )}
      {...props}
    />
  );
});

export const CardHeader = React.forwardRef(function CardHeader({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={clsx("p-4 border-b border-gray-700", className)}
      {...props}
    />
  );
});

export const CardTitle = React.forwardRef(function CardTitle({ className, ...props }, ref) {
  return (
    <h3
      ref={ref}
      className={clsx("text-lg font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  );
});

export const CardContent = React.forwardRef(function CardContent({ className, ...props }, ref) {
  return (
    <div ref={ref} className={clsx("p-4", className)} {...props} />
  );
});
