"use client";

import { useState, useRef, useEffect, FC } from "react";
import { ChevronDownIcon } from "./icons/ChevronDownIcon";
import { CheckIcon } from "./icons/CheckIcon";

export function CustomSelect({
  disableCheckIcon = false,
  value,
  onChange,
  options,
  className,
  padding,
  position = "bottom",
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        selectRef.current &&
        !selectRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (option: string) => {
    onChange(option);
    setIsOpen(false);
  };

  return (
    <div
      ref={selectRef}
      className={`relative inline-block font-roboto-mono ${className}`}
    >
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex w-full items-center gap-2 rounded bg-[#0a1f1a] ${padding} text-white transition-colors
          ${
            isOpen
              ? `${
                  position === "top"
                    ? "rounded-t-none border-t-0"
                    : "rounded-b-none border-b-0"
                } border-2 !border-greenPrimary`
              : "border-2 border-greenSecondary hover:border-greenPrimary/60"
          }
        `}
      >
        <div className="flex-1 text-center">{value}</div>
        {isOpen ? (
          <ChevronDownIcon className="rotate-180 text-greenPrimary" />
        ) : (
          <ChevronDownIcon className="text-graySecondary" />
        )}
      </button>

      {isOpen && (
        <div
          className={`max-h-90 absolute left-0 right-0 ${
            position === "top"
              ? "bottom-[calc(100%-2px)] rounded-t-lg border-b-0"
              : "top-[calc(100%-2px)] rounded-b-lg border-t-0"
          } z-50 overflow-y-auto border-2 border-greenPrimary bg-[#0a1f1a] pt-2`}
        >
          {options.map((option) => (
            <button
              key={option}
              onClick={() => handleSelect(option)}
              className={`relative flex w-full items-center gap-2 ${padding} text-left transition-colors
                ${
                  option === value
                    ? "bg-greenPrimary/10 text-emerald-400"
                    : "text-emerald-100/80 hover:bg-greenPrimary/5"
                }
              `}
            >
              {option === value && !disableCheckIcon && (
                <div className="absolute">
                  <CheckIcon />
                </div>
              )}
              <div className="w-full text-center">{option}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface CustomSelectProps {
  disableCheckIcon?: boolean;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  className?: string;
  padding?: string;
  position?: "bottom" | "top";
}
