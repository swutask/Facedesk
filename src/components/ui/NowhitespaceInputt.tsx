import React from "react";
import { Input } from "./input";

type InputProps = React.ComponentPropsWithRef<typeof Input>;

const NoWhitespaceInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ onChange, onKeyDown, ...props }, ref) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Prevent space ONLY if cursor is at the start
      if (e.key === " " && e.currentTarget.selectionStart === 0) {
        e.preventDefault();
      }

     

      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();

        const currentValue = Number(e.currentTarget.value) || 0;
        let newValue = currentValue;

        if (e.key === "ArrowDown") {
          newValue = currentValue > 0 ? currentValue - 1 : 0;
        } else if (e.key === "ArrowUp") {
          newValue = currentValue + 1;
        }

        const syntheticEvent = {
          ...e,
          target: {
            ...e.target,
            value: String(newValue),
          },
        } as unknown as React.ChangeEvent<HTMLInputElement>;

        onChange?.(syntheticEvent);
      }

      onKeyDown?.(e);
    };



const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const value = e.target.value;
  const sanitized = value.replace(/^\s+/, ""); // Removes only leading spaces
  onChange?.({
    ...e,
    target: { ...e.target, value: sanitized },
  });
};


    return (
      <Input
        {...props}
        ref={ref}
        onKeyDown={handleKeyDown}
        onChange={handleChange}
      />
    );
  }
);













NoWhitespaceInput.displayName = "NoWhitespaceInput";

export default NoWhitespaceInput;
