import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

type ButtonProps = React.ComponentProps<"button"> & {
  asChild?: boolean;
  asMotion?: boolean;
} & React.ComponentProps<typeof motion.button>;

function Button({
  className,
  asChild = false,
  asMotion = false,
  ...props
}: ButtonProps) {
  if (asChild) {
    return <Slot data-slot="button" className={cn(className)} {...props} />;
  }

  if (asMotion) {
    // Only pass motion.button props
    return (
      <motion.button data-slot="button" className={cn(className)} {...props} />
    );
  }

  // Default to regular button
  return <button data-slot="button" className={cn(className)} {...props} />;
}

export { Button };
