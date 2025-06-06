"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import styles from "./label.module.css";

// Helper function to join class names
const cn = (...classNames: (string | undefined)[]) => {
  return classNames.filter(Boolean).join(" ");
};

const Label = React.forwardRef<
  React.ComponentRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(styles.label, className)}
    {...props}
  />
));

Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
