"use client";

import { LoaderCircle } from "lucide-react";
import { Button, type ButtonProps } from "./Button";

export function LoadingButton({
  loading,
  children,
  ...props
}: ButtonProps & { loading?: boolean }) {
  return (
    <Button
      {...props}
      disabled={loading || props.disabled}
      startIcon={
        loading ? (
          <LoaderCircle className="animate-spin" size={16} />
        ) : (
          props.startIcon
        )
      }
    >
      {loading ? "Working..." : children}
    </Button>
  );
}
