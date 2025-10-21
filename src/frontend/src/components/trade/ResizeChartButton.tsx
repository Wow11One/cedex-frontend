import React from "react";

export interface ResizeChartButtonProps {
  /* eslint-disable-next-line  @typescript-eslint/no-explicit-any */
  handleClick: () => void;
  priceScaleWidth: number;
}

export const ResizeChartButton = (props: ResizeChartButtonProps) => {
  return (
    <div
      style={{
        position: "absolute",
        top: "1ch",
        right: `${props.priceScaleWidth + 12}px`,
        zIndex: 3,
        cursor: "pointer",
      }}
      className="timeframe-selector font-roboto-mono text-base"
    >
      <div className="hidden items-center gap-6 font-roboto-mono text-xs text-white lg:flex">
        <div>DiamondFx</div>
        <div>
          O <span className="text-greenPrimary">0.00933</span>
        </div>

        <div>
          L <span className="text-greenPrimary">0.00933</span>
        </div>

        <div>
          H <span className="text-greenPrimary">0.00933</span>
        </div>

        <div>
          C <span className="text-greenPrimary">0.00933</span>
        </div>
      </div>
    </div>
  );
};

export default ResizeChartButton;
