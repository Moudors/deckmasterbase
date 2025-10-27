import * as React from "react";
import clsx from "clsx";

export const Avatar = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={clsx("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)}
      {...props}
    />
  )
);
Avatar.displayName = "Avatar";

export const AvatarImage = (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
  <img className="aspect-square h-full w-full" {...props} />
);

export const AvatarFallback = ({ children }: { children: React.ReactNode }) => (
  <span className="flex h-full w-full items-center justify-center bg-gray-700 text-sm text-white">
    {children}
  </span>
);
