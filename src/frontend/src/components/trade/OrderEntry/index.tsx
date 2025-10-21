import { Tab } from "@headlessui/react";
import React, { useState } from "react";

import { type ApiMarket } from "@/types/api";
import { type Side } from "@/types/global";

import { LimitOrderEntry } from "./LimitOrderEntry";
import { MarketOrderEntry } from "./MarketOrderEntry";
import { CustomSelect } from "@/components/Select";

export const OrderEntry: React.FC<{
  marketData: ApiMarket;
  defaultSide?: "buy" | "sell";
  onDepositWithdrawClick?: () => void;
}> = ({ marketData, defaultSide = "buy", onDepositWithdrawClick }) => {
  const [side, setSide] = useState<Side>(defaultSide);

  const [tab, setTab] = useState<"Market" | "Limit">("Market");

  return (
    <div className="flex flex-1 grow flex-col">
      <div className="mt-3 grid grid-cols-2 gap-2 md:mx-4">
        <CustomSelect
          options={["Cross", "Fit", "Club"]}
          value="Cross"
          onChange={() => {}}
          padding="py-1.5 px-2"
        />
        <CustomSelect
          options={[
            "1x",
            "2x",
            "5x",
            "10x",
            "20x",
            "25x",
            "30x",
            "50x",
            "100x",
          ]}
          value="20x"
          onChange={() => {}}
          padding="py-1.5 px-2"
        />
      </div>

      <div className="mt-3 grid grid-cols-2 font-roboto-mono text-base text-white md:mx-4">
        <div
          className={`flex cursor-pointer items-center justify-center rounded-t-md p-2.5 transition-colors ${
            tab === "Market"
              ? "border-b-[3px] border-greenPrimary bg-greenPrimary/20 text-greenPrimary"
              : "border-b border-greenSecondary hover:border-b-2"
          }`}
          onClick={() => setTab("Market")}
        >
          Market
        </div>
        <div
          className={`flex cursor-pointer items-center justify-center rounded-t-md p-2.5 transition-colors ${
            tab === "Limit"
              ? "border-b-[3px] border-greenPrimary bg-greenPrimary/20 text-greenPrimary"
              : "border-b border-greenSecondary hover:border-b-2"
          }`}
          onClick={() => setTab("Limit")}
        >
          Limit
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 rounded-md bg-greenTertiary p-1 font-roboto-mono text-base text-white md:mx-4">
        <div className="flex items-center justify-center whitespace-nowrap rounded-md bg-greenPrimary px-2.5 py-2 font-medium text-black">
          Buy/Long
        </div>
        <div className="flex items-center justify-center font-roboto-mono">
          Sell/Short
        </div>
      </div>
      <Tab.Group>
        <Tab.Panels>
          <Tab.Panel>
            <LimitOrderEntry
              tab={tab}
              marketData={marketData}
              side={side}
              onDepositWithdrawClick={onDepositWithdrawClick}
            />
          </Tab.Panel>
          <Tab.Panel>
            <MarketOrderEntry
              marketData={marketData}
              side={side}
              onDepositWithdrawClick={onDepositWithdrawClick}
            />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};
