import React from "react";
import clsx from "clsx";

export const Badge = ({ children, variant = "default", className, ...props }) => {
  const baseStyle = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";

  const variantStyle = {
    default: "bg-gray-700 text-gray-200",
    secondary: "bg-gray-700 text-gray-200 border border-gray-600",
    green: "bg-green-600 text-white",
    red: "bg-red-600 text-white",
  };

  return (
    <span className={clsx(baseStyle, variantStyle[variant], className)} {...props}>
      {children}
    </span>
  );
};
