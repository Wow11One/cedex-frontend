"use client";

interface CryptoCheckboxProps {
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function Checkbox({ id, checked, onChange }: CryptoCheckboxProps) {
  return (
    <label className="group flex cursor-pointer items-center gap-3">
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          id={id}
          className="hidden"
        />
        <div
          className={`flex h-4 w-4 items-center justify-center rounded border bg-transparent transition-colors duration-200 ${
            checked ? "border-greenPrimary" : "border-greenSecondary"
          }`}
        >
          {checked && <CheckboxIcon />}
        </div>
      </div>
    </label>
  );
}

const CheckboxIcon = () => (
  <svg width="10" height="10" viewBox="0 0 10 7" fill="none">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M3.50007 5.08503L1.76507 3.35003C1.57007 3.15503 1.25507 3.15503 1.06007 3.35003C0.865068 3.54503 0.865068 3.86003 1.06007 4.05503L3.15007 6.14503C3.34507 6.34003 3.66007 6.34003 3.85507 6.14503L9.14507 0.855034C9.34007 0.660034 9.34007 0.345034 9.14507 0.150034C8.95007 -0.0449658 8.63507 -0.0449658 8.44007 0.150034L3.50007 5.08503Z"
      fill="#01FE91"
    />
  </svg>
);
