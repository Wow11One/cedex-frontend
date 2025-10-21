import { FC } from "react";

const Footer: FC = () => {
  return (
    <div className="z-20 flex items-center justify-between border-t border-greenSecondary bg-greenBackground px-6 py-4 font-roboto-mono">
      <div className="text-xs text-white">
        © 2025 Cedex. All rights reserved.
      </div>

      <div className="hidden items-center gap-6 text-xs  text-[#53706A] lg:flex">
        <div className="cursor-pointer transition-colors hover:text-greenPrimary">
          Follow on X
        </div>
        <div className="cursor-pointer transition-colors hover:text-greenPrimary">
          Docs
        </div>
        <div className="cursor-pointer transition-colors hover:text-greenPrimary">
          Support
        </div>
        <div className="cursor-pointer transition-colors hover:text-greenPrimary">
          Terms of Service
        </div>
        <div className="cursor-pointer transition-colors hover:text-greenPrimary">
          Primacy Policy
        </div>
        <div className="cursor-pointer transition-colors hover:text-greenPrimary">
          Cookie Settings
        </div>
      </div>
    </div>
  );
};

export default Footer;
