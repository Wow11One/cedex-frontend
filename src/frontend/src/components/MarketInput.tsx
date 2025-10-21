"use client";
import { useState, useRef, useEffect } from "react";
import { ChevronDownIcon } from "./icons/ChevronDownIcon";

interface CryptoInputProps {
  className?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  rightText?: string;
  rightTextColor?: "default" | "accent";
  selectOptions?: string[];
  onSelectChange?: (option: string) => void;
  placeholder?: string;
}

export function MarketInput({
  label,
  value,
  className,
  onChange,
  rightText,
  rightTextColor = "default",
  selectOptions,
  onSelectChange,
  placeholder = "0,00",
}: CryptoInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const hasDropdown = selectOptions && selectOptions.length > 0;

  return (
    <div className="space-y-2">
      <div className="relative" ref={dropdownRef}>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`bg-background w-full rounded border border-greenSecondary bg-transparent px-4
            py-1.5 text-right font-roboto-mono text-sm outline-none ring-0 focus:outline-none
            ${rightText ? "pr-[72px]" : ""} ${className}
          `}
        />

        {rightText && (
          <div className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-2 text-greenPrimary">
            <span
              className={`font-mono text-sm font-medium
                ${
                  rightTextColor === "accent"
                    ? "text-primary"
                    : "text-muted-foreground"
                }
                ${hasDropdown ? "text-white" : ""}
              `}
            >
              {rightText}
            </span>
            {hasDropdown && (
              <button
                onClick={(event) => {
                  event.preventDefault();
                  setIsOpen(!isOpen);
                }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronDownIcon
                  className={`h-2.5 w-2.5 text-graySecondary transition-transform
                    ${isOpen ? "rotate-180" : ""}
                  `}
                />
              </button>
            )}
          </div>
        )}

        {hasDropdown && isOpen && (
          <div className="absolute right-0 top-full z-50 mt-2 w-28 overflow-hidden rounded border border-greenPrimary bg-greenBackground font-roboto-mono text-white">
            {selectOptions.map((option) => (
              <button
                key={option}
                onClick={(event) => {
                  event.preventDefault();
                  onSelectChange?.(option);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2.5 text-left font-mono text-sm
                  transition-colors hover:bg-white/10
                  ${
                    option === rightText
                      ? "bg-primary/20 text-primary"
                      : "text-foreground"
                  }
                `}
              >
                {option}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
