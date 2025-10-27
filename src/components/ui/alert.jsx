import React from "react";
import clsx from "clsx";

export const Alert = ({ children, className, ...props }) => {
  return (
    <div className={clsx("flex items-center gap-2 p-3 border rounded-md", className)} {...props}>
      {children}
    </div>
  );
};

export const AlertDescription = ({ children, className, ...props }) => {
  return (
    <p className={clsx("text-sm", className)} {...props}>
      {children}
    </p>
  );
};
