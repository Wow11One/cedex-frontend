import { useState } from "react";

export const Button: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant: "primary" | "outlined" | "secondary" | "green" | "red" | "blue";
    disabledReason?: string | null;
    loadingText?: string;
  }
> = ({
  variant,
  disabled,
  disabledReason,
  loadingText,
  children,
  onClick,
  ...props
}) => {
  const variantStyle =
    variant === "primary"
      ? "bg-greenPrimary text-greenBackground font-bold rounded-md"
      : variant === "green"
      ? "bg-green text-neutral-800 font-bold"
      : variant === "red"
      ? "bg-red text-neutral-800 font-bold"
      : variant === "blue"
      ? "bg-blue text-neutral-800 font-bold"
      : variant === "outlined"
      ? "bg-transparent text-neutral-100 transition-colors hover:text-greenPrimary border-b"
      : "bg-greenTertiary rounded-md text-greenPrimary border border-greenPrimary transition-colors hover:bg-greenSecondary"; // secondary
  const [loading, setLoading] = useState(false);

  return (
    <button
      {...props}
      className={[
        "px-4 py-2 text-center font-roboto-mono text-base disabled:cursor-not-allowed",
        variantStyle,
        props.className,
      ].join(" ")}
      onClick={async (e) => {
        setLoading(true);
        try {
          await onClick?.(e);
          // eslint-disable-next-line no-useless-catch
        } catch (e) {
          throw e;
        } finally {
          setLoading(false);
        }
      }}
      disabled={disabled || !!disabledReason || loading}
    >
      {disabledReason
        ? disabledReason
        : loading
        ? loadingText || "Loading..."
        : children}
    </button>
  );
};
