// import { useWindowSize } from "@uidotdev/usehooks";
import Tooltip from "rc-tooltip";
import React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useWindowSize } from "usehooks-ts";

import Skeleton from "@/components/Skeleton";
import { useOrderEntry } from "@/contexts/OrderEntryContext";
import { useOrderBookData } from "@/features/hooks";
import { type ApiMarket } from "@/types/api";
import { type Orderbook, type PriceLevel } from "@/types/global";
import { toDecimalPrice, toDecimalSize } from "@/utils/econia";
import { calculateSpread } from "@/utils/formatter";

import { CustomSelect } from "./Select";

const testAsks: PriceLevel[] = [
  { price: 5000, size: 403929.6049, total: 60665.7335 },
  { price: 5000, size: 55784.6672, total: 67524.7706 },
  { price: 5000, size: 55784.6672, total: 798003.7986 },
  { price: 5000, size: 90468.332, total: 349896.4601 },
  { price: 5000, size: 661245.5997, total: 578519.4364 },
  { price: 5000, size: 3442.6001, total: 139372.0233 },
  { price: 5000, size: 90468.332, total: 942753.7134 },
  { price: 5000, size: 866955.0945, total: 392532.2637 },
  { price: 5000, size: 67524.7706, total: 619503.7901 },
  { price: 5000, size: 371916.1087, total: 661245.5997 },
];

const testBids: PriceLevel[] = [
  { price: 5000, size: 918298.4098, total: 75922.9667 },
  { price: 5000, size: 686534.0646, total: 587945.7097 },
  { price: 5000, size: 3442.6001, total: 67524.7706 },
  { price: 5000, size: 989709.8497, total: 876925.1819 },
  { price: 5000, size: 349896.4601, total: 217224.113 },
  { price: 5000, size: 899627.8559, total: 403929.6049 },
  { price: 5000, size: 22328.6394, total: 619503.7901 },
  { price: 5000, size: 815475.2709, total: 578519.4364 },
  { price: 5000, size: 403929.6049, total: 661245.5997 },
  { price: 5000, size: 22328.6394, total: 942753.7134 },
];

const Row: React.FC<{
  level: PriceLevel;
  type: "bid" | "ask";
  highestSize: number;
  marketData: ApiMarket;
  updatedLevel: PriceLevel | undefined;
}> = ({ level, type, highestSize, marketData, updatedLevel }) => {
  const { setPrice } = useOrderEntry();
  const [flash, setFlash] = useState<"flash-red" | "flash-green" | "">("");

  useEffect(() => {
    if (updatedLevel == undefined) {
      return;
    }
    if (updatedLevel.price == level.price) {
      setFlash(type === "ask" ? "flash-red" : "flash-green");
      setTimeout(() => {
        setFlash("");
      }, 100);
    }
  }, [type, updatedLevel, level.price]);

  const price = toDecimalPrice({
    price: level.price,
    marketData,
  }).toNumber();

  const size = toDecimalSize({
    size: level.size,
    marketData: marketData,
  });
  return (
    <div
      className={`flash-bg-once relative w-full pl-[17.03px] pr-[17.57px] ${flash} relative grid h-6 cursor-pointer grid-cols-3 py-[1px] hover:bg-greenSecondary`}
      onClick={() => {
        setPrice(price.toString());
      }}
    >
      <div className={`flex w-full justify-between  lg:flex-row`}>
        <div
          className={`z-10 text-right font-roboto-mono text-xs ${
            type === "ask" ? "text-redPrimary" : "text-greenPrimary"
          }`}
        >
          {price.toLocaleString()}
        </div>
      </div>
      <div
        className={`z-10  py-0.5 text-right font-roboto-mono text-xs text-white`}
      >
        {Number(size).toLocaleString()}
      </div>
      <div
        className={`z-10  py-0.5 text-right font-roboto-mono text-xs text-white`}
      >
        {Number(size).toLocaleString()}
      </div>

      {/* <div
          className={`absolute  z-0 h-full ${
            type === "ask"
              ? "left-0 bg-red/30 lg:left-[unset] lg:right-0"
              : "right-0 bg-green/30"
          }`}
          // dynamic taillwind?

          style={{ width: `${(100 * level.size) / highestSize}%` }}
        ></div>
        <div
          className={`mask pointer-events-none absolute left-0 top-0 w-full bg-white/[0.1] ${
            (focus.side === "ask" && type === "ask" && price <= focus.price) ||
            (focus.side === "bid" && type === "bid" && price >= focus.price)
              ? "h-full"
              : "h-0"
          }`}
        ></div> */}
    </div>
  );
};

export function OrderbookTable({
  marketData,
  data,
  isFetching,
  isLoading,
}: {
  marketData: ApiMarket;
  data: Orderbook | undefined;
  isFetching: boolean;
  isLoading: boolean;
}) {
  const [isSmallWindow, setIsSmallWindow] = useState(false);

  const { width } = useWindowSize();

  const centerRef = useRef<HTMLDivElement>(null);

  const [tab, setTab] = useState<"Order book" | "Trades">("Order book");

  useEffect(() => {
    setIsSmallWindow(width! < 1024);
  }, [width]);

  useEffect(() => {
    centerRef.current?.scrollTo({
      behavior: "smooth",
      top: width! < 1024 ? 0 : 10000,
    });
  }, [isFetching, width]);

  const spread: PriceLevel | undefined = useMemo(() => {
    if (data == null) {
      return undefined;
    }
    const minAsk = data.asks ? data.asks[0] : undefined;
    const maxBid = data.bids ? data.bids[0] : undefined;
    return calculateSpread(minAsk, maxBid);
  }, [data]);

  const highestSize = useMemo(() => {
    if (!data) return 0;

    const asks = data.asks || [];
    const bids = data.bids || [];

    const askSizes = asks.map((order) => order.size);
    const bidSizes = bids.map((order) => order.size);

    const allSizes = [...askSizes, ...bidSizes];

    return Math.max(...allSizes);
  }, [data]);

  return (
    <div className="flex grow flex-col">
      <div className="flex flex-col justify-center">
        <div className="grid grid-cols-2 font-roboto-mono text-base text-white">
          <div
            className={`flex cursor-pointer items-center justify-center whitespace-nowrap rounded-t-md p-2.5 transition-colors ${
              tab === "Order book"
                ? "border-b-[3px] border-greenPrimary bg-greenPrimary/20 text-greenPrimary"
                : "border-b border-greenSecondary hover:border-b-2"
            }`}
            onClick={() => setTab("Order book")}
          >
            Order book
          </div>
          <div
            className={`flex cursor-pointer items-center justify-center whitespace-nowrap rounded-t-md p-2.5 transition-colors ${
              tab === "Trades"
                ? "border-b-[3px] border-greenPrimary bg-greenPrimary/20 text-greenPrimary"
                : "border-b border-greenSecondary hover:border-b-2"
            }`}
            onClick={() => setTab("Trades")}
          >
            Trades
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <CustomSelect
          options={["10", "20", "50", "100"]}
          value="100"
          onChange={() => {}}
          padding="py-1.5 px-2"
        />
        <CustomSelect
          options={["ETH", "SOL", "ICP"]}
          value="ETH"
          onChange={() => {}}
          padding="py-1.5 px-2"
        />
      </div>

      <div className="mt-3 grid grid-cols-3">
        <p className="ml-4 text-left font-roboto-mono text-xs font-light text-graySecondary">
          Price
        </p>
        <p className="text-right font-roboto-mono text-xs font-light text-graySecondary">
          Size (ETH)
        </p>
        <p className="mr-4 text-right font-roboto-mono text-xs font-light text-graySecondary">
          Total
        </p>
      </div>
      {/* <div className="flex h-[30px] lg:mb-2 lg:hidden">
        <div className="flex w-[50%] justify-between px-3 pl-4 pt-[7px] lg:px-3 lg:pt-[12px]">
          <p className="whitespace-nowrap font-roboto-mono text-xs text-neutral-500">
            BID <TokenSymbol symbol={marketData.quote?.symbol} />
          </p>
          <p className="whitespace-nowrap font-roboto-mono text-xs text-neutral-500">
            AMOUNT <TokenSymbol symbol={marketData.base.symbol} />
          </p>
        </div>
        <div className="flex w-[50%] justify-between px-3 pl-4 pt-[7px] lg:px-3 lg:pt-[12px]">
          <p className="whitespace-nowrap font-roboto-mono text-xs text-neutral-500">
            ASK <TokenSymbol symbol={marketData.quote?.symbol} />
          </p>
          <p className="whitespace-nowrap font-roboto-mono text-xs text-neutral-500">
            AMOUNT <TokenSymbol symbol={marketData.base.symbol} />
          </p>
        </div>
      </div> */}
      <div
        className={`scrollbar-none relative flex h-[173px] grow pt-[6.53px] lg:flex-col ${
          (testAsks.length ?? 0) < 12 || (testAsks.length ?? 0) < 14
            ? "flex items-center"
            : ""
        }`}
      >
        {isLoading ? (
          <div className="absolute w-full">
            {Array.from({ length: 60 }, (_, i) => (
              <div
                className="relative flex h-6 w-full cursor-pointer items-center justify-between py-[1px] hover:ring-1 hover:ring-neutral-600"
                key={"skeleton-" + i}
              >
                <Skeleton
                  containerClassName={`z-10 ml-2 font-roboto-mono text-xs text-left`}
                  style={{
                    width: `${i % 2 == 0 ? 90 : 70}px`,
                  }}
                />
                <Skeleton
                  containerClassName="z-10 mr-2 py-0.5 font-roboto-mono text-xs text-white text-right"
                  style={{
                    width: `${i % 2 == 0 ? 90 : 70}px`,
                  }}
                />

                <div className={`absolute right-0 z-0 h-full opacity-30`}></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="absolute flex h-full w-full flex-row-reverse pb-2 lg:block">
            <div
              className=" scrollbar-none flex h-full max-h-full w-[calc(50%-0.5px)] grow flex-col overflow-auto lg:h-[calc((100%-26px)/2)] lg:w-auto"
              ref={centerRef}
            >
              <div className="grow"></div>
              {isSmallWindow
                ? testAsks
                    ?.slice()
                    .map((level) => (
                      <Row
                        level={level}
                        type={"ask"}
                        key={`ask-${level.price}-${level.size}`}
                        highestSize={highestSize}
                        marketData={marketData}
                        updatedLevel={data!.updatedLevel}
                      />
                    ))
                : testAsks
                    ?.slice()
                    .reverse()
                    .map((level) => (
                      <Row
                        level={level}
                        type={"ask"}
                        key={`ask-${level.price}-${level.size}`}
                        highestSize={highestSize}
                        marketData={marketData}
                        updatedLevel={data!.updatedLevel}
                      />
                    ))}
            </div>
            <div className="hidden grid-cols-3 bg-greenSecondary py-1 lg:grid">
              <div className="z-10 ml-4 text-left font-roboto-mono text-xs text-white">
                Spread
              </div>
              <div className="z-10 ml-4 text-right font-roboto-mono text-xs text-white">
                100.00
              </div>
              <div className="mr-4 text-right font-roboto-mono text-xs text-white">
                2,456%
              </div>
            </div>
            <div className="scrollbar-none flex h-full w-[calc(50%+0.5px)] grow flex-col overflow-y-auto lg:h-[calc((100%-26px)/2)] lg:w-auto">
              {testBids.map((level) => (
                <Row
                  level={level}
                  type={"bid"}
                  key={`bid-${level.price}-${level.size}`}
                  highestSize={highestSize}
                  marketData={marketData}
                  updatedLevel={data!.updatedLevel}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
