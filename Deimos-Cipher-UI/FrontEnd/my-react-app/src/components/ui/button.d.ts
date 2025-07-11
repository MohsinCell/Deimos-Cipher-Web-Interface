import * as React from "react";
import { motion } from "framer-motion";
type ButtonProps = React.ComponentProps<"button"> & {
    asChild?: boolean;
    asMotion?: boolean;
} & React.ComponentProps<typeof motion.button>;
declare function Button({ className, asChild, asMotion, ...props }: ButtonProps): import("react/jsx-runtime").JSX.Element;
export { Button };
