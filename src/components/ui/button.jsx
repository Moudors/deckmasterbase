import React from "react";
import clsx from "clsx";

export const Button = ({ children, variant = "default", size = "default", className, ...props }) => {
  const baseStyle = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variantStyle = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    ghost: "bg-transparent hover:bg-gray-800 text-white",
    outline: "border border-gray-700 text-white hover:bg-gray-800"
  };

  const sizeStyle = {
    default: "px-4 py-2 text-sm",
    icon: "p-2",
  };

  return (
    <button
      className={clsx(baseStyle, variantStyle[variant], sizeStyle[size], className)}
      {...props}
    >
      {children}
    </button>
  );
};
