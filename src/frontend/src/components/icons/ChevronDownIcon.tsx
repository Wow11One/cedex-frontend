export const ChevronDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({
  className,
  id,
}) => {
  return (
    <svg
      width="10"
      height="6"
      viewBox="0 0 10 6"
      fill="none"
      className={className}
      id={id}
    >
      <path
        d="M1 1L5 5L9 1"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
