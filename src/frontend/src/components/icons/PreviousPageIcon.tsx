export const PreviousPageIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({
  className,
  id,
}) => {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className={className}
      id={id}
    >
      <path
        d="M10 12L6 8L10 4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
