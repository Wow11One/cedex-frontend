import { useQuery } from "@tanstack/react-query";
import { useWindowSize } from "@uidotdev/usehooks";
import BigNumber from "bignumber.js";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";

import Skeleton from "@/components/Skeleton";
import { useAptos } from "@/contexts/AptosContext";
import { useOrderEntry } from "@/contexts/OrderEntryContext";
import { API_URL } from "@/env";
import { useOrderBookData } from "@/features/hooks";
import { setPriceStats } from "@/features/priceStatsSlice";
import { type ApiMarket } from "@/types/api";
import { toDecimalPrice, toDecimalQuote, toDecimalSize } from "@/utils/econia";
import { plusMinus } from "@/utils/formatter";
import { TypeTag } from "@/utils/TypeTag";

import { DiscordIcon } from "./icons/DiscordIcon";
import { MediumIcon } from "./icons/MediumIcon";
import { TwitterIcon } from "./icons/TwitterIcon";
import { MarketIconPair } from "./MarketIconPair";
import { BaseModal } from "./modals/BaseModal";
import { TokenSymbol } from "./TokenSymbol";
import { SelectMarketContent } from "./trade/DepositWithdrawModal/SelectMarketContent";
import { SmallArrowUpIcon } from "./icons/SmallArrowUpIcon";
import { PythNetworkIcon } from "./icons/PythNetworkIcon";
import { ChevronDownIcon } from "./icons/ChevronDownIcon";

const DEFAULT_TOKEN_ICON = "/tokenImages/default.svg";

const SocialMediaIcons: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={className}>
      <div className="flex">
        <a
          href="https://twitter.com/EconiaLabs"
          target="_blank"
          rel="noreferrer"
          className="mx-3 aspect-square h-[18px] w-[18px] cursor-pointer text-white hover:text-blue"
        >
          <TwitterIcon />
        </a>
        <a
          href="https://discord.com/invite/Z7gXcMgX8A"
          target="_blank"
          rel="noreferrer"
          className="mx-3 aspect-square h-[18px] w-[18px] cursor-pointer text-white hover:text-blue"
        >
          <DiscordIcon />
        </a>
        <a
          href="https://medium.com/econialabs"
          target="_blank"
          rel="noreferrer"
          className="mx-3 aspect-square h-[18px] w-[18px] cursor-pointer text-white hover:text-blue"
        >
          <MediumIcon />
        </a>
      </div>
    </div>
  );
};

export const StatsBar: React.FC<{
  allMarketData: ApiMarket[];
  selectedMarket: ApiMarket;
}> = ({ allMarketData, selectedMarket }) => {
  const dispatch = useDispatch();
  const [isFirstFetch, setIsFirstFetch] = useState(true);
  const { market_id: marketId, base, quote } = selectedMarket;
  const baseSymbol = base?.symbol;
  const quoteSymbol = quote?.symbol;
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { coinListClient } = useAptos();
  const { highestBid, lowestAsk, orderBook } = useOrderBookData(selectedMarket);
  const { setPrice } = useOrderEntry();

  useEffect(() => {
    if (router.asPath.includes("?recognized=false")) {
      setIsModalOpen(true);
    }
  }, [router.asPath]);

  useEffect(() => {
    setIsFirstFetch(true);
  }, [selectedMarket]);

  const { data: iconData } = useQuery(
    ["iconData", selectedMarket],
    async () => {
      const baseAssetIcon = selectedMarket.base
        ? coinListClient.getCoinInfoByFullName(
            TypeTag.fromApiCoin(selectedMarket.base).toString(),
          )?.logo_url
        : DEFAULT_TOKEN_ICON;
      const quoteAssetIcon =
        coinListClient.getCoinInfoByFullName(
          TypeTag.fromApiCoin(selectedMarket.quote).toString(),
        )?.logo_url ?? DEFAULT_TOKEN_ICON;
      return { baseAssetIcon, quoteAssetIcon };
    },
  );

  const { data: priceInfo, isFetching: isFetchingPriceInfo } = useQuery(
    ["marketStats", marketId],
    async () => {
      const response = await fetch(
        `${API_URL}/rpc/market_aggregated_info?market=${marketId}&seconds=86400`,
      );
      const data = await response.json();
      const priceStats = data[0];
      if (!priceStats) {
        return {};
      }
      dispatch(setPriceStats(data[0]));

      const formattedPriceStats = Object.keys(priceStats).reduce(
        (acc: { [key: string]: number }, key) => {
          if (key === "price_change_percentage") {
            acc[key] = priceStats[key];
          } else if (key.includes("price")) {
            acc[key] = toDecimalPrice({
              price: priceStats[key],
              marketData: selectedMarket,
            }).toNumber();
          }
          if (key.includes("quote_volume")) {
            acc[key] = toDecimalQuote({
              ticks: BigNumber(priceStats[key]),
              tickSize: BigNumber(selectedMarket.tick_size),
              quoteCoinDecimals: BigNumber(selectedMarket.quote.decimals),
            }).toNumber();
          } else {
            acc[key] = toDecimalSize({
              size: priceStats[key],
              marketData: selectedMarket,
            }).toNumber();
          }
          return acc;
        },
        {},
      );
      if (formattedPriceStats.last_price) {
        setPrice(formattedPriceStats.last_price.toString());
      }
      setIsFirstFetch(false);
      return formattedPriceStats;
    },
    {
      keepPreviousData: false,
      refetchOnWindowFocus: false,
      refetchInterval: 10 * 1000,
    },
  );

  useEffect(() => {
    if (!isFetchingPriceInfo) setIsFirstFetch(false);
  }, [isFetchingPriceInfo]);

  const [isSmallWindow, setIsSmallWindow] = useState(false);

  const { width } = useWindowSize();

  useEffect(() => {
    //setIsSmallWindow(width! < 640);
  }, [width]);

  return (
    <>
      <BaseModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
        }}
        showCloseButton={false}
        className={"!p-0 sm:w-[547px] md:w-[686px] lg:w-[786px]"}
      >
        <SelectMarketContent
          allMarketData={allMarketData}
          onSelectMarket={(id, name) => {
            setIsModalOpen(false);
            if (name == undefined) {
              toast.error("Selected market is undefined, please try again.");
              return;
            }
            router.push(`/dashboard/${name}`);
          }}
        />
      </BaseModal>
      {isModalOpen && isSmallWindow && (
        <div
          className={`fixed inset-0 z-[60] flex h-full w-full items-center justify-center overflow-hidden bg-black text-center font-jost text-2xl font-bold text-white`}
        >
          For the best experience,
          <br />
          please use a larger screen.
        </div>
      )}
      <div className="justify-between border-b border-greenSecondary  py-3">
        <div className="flex whitespace-nowrap">
          <button
            className={`flex w-full items-center gap-2 rounded bg-[#0a1f1a] px-2 py-1.5 text-white  transition-colors lg:w-auto
                    ${
                      false
                        ? "rounded-b-none border-2 border-b-0 !border-greenPrimary"
                        : "border-2 border-greenSecondary hover:border-greenPrimary/60"
                    }
                  `}
          >
            <div className="flex flex-1 items-center gap-2">
              <img width={32} src="/eth.png" alt="eth" />
              <div className="w-16 text-left">ETH</div>
            </div>
            {false ? (
              <ChevronDownIcon className="rotate-180 text-greenPrimary" />
            ) : (
              <ChevronDownIcon className="text-graySecondary" />
            )}
          </button>
          {/* <div className="block md:hidden">
            <p className="font-roboto-mono font-light">
              <span className="inline-block min-w-[4em] text-xl text-white">
                {isFetchingPriceInfo && isFirstFetch ? (
                  <Skeleton />
                ) : priceInfo?.last_price != undefined ? (
                  priceInfo.last_price
                ) : (
                  "-"
                )}
              </span>
              <span
                className={`ml-1 inline-block min-w-[6em] text-base ${
                  (priceInfo?.price_change_nominal || 0) < 0
                    ? "text-red"
                    : "text-green"
                }`}
              >
                {isFetchingPriceInfo && isFirstFetch ? (
                  <Skeleton />
                ) : priceInfo?.price_change_nominal != undefined ? (
                  plusMinus(priceInfo.price_change_nominal) +
                  priceInfo.price_change_nominal
                ) : (
                  "-"
                )}
              </span>
            </p>
          </div> */}
          <div className="ml-4 hidden md:block">
            <span className="font-roboto-mono text-xs font-light text-graySecondary">
              Market price
            </span>
            <p className="font-roboto-mono text-xs font-light text-white">
              {isFetchingPriceInfo && isFirstFetch ? (
                <Skeleton />
              ) : priceInfo?.last_price != undefined ? (
                priceInfo.last_price
              ) : (
                <div className="flex items-center gap-1.5">
                  <div>$4,312.9076</div>
                  <div className="flex items-center gap-0.5 rounded-sm bg-greenPrimary/20 px-1 py-0.5 text-greenPrimary">
                    <SmallArrowUpIcon />
                    <div>0.099</div>
                  </div>
                </div>
              )}
            </p>
          </div>
          <div className="ml-4 hidden md:block ">
            <span className="font-roboto-mono text-xs font-light text-graySecondary">
              Oracle price
            </span>
            <p className="font-roboto-mono text-xs font-light text-white">
              <span className="inline-block min-w-[70px] text-white">
                {isFetchingPriceInfo && isFirstFetch ? (
                  <Skeleton />
                ) : priceInfo?.price_change_nominal != undefined ? (
                  plusMinus(priceInfo.price_change_nominal) +
                  priceInfo.price_change_nominal
                ) : (
                  <div className="flex items-center gap-0.5">
                    <div>$4,312.9076</div>
                    <div className="px-1 py-0.5">
                      <PythNetworkIcon />
                    </div>
                  </div>
                )}
              </span>
              {priceInfo?.price_change_percentage != undefined && (
                <span
                  className={`ml-2 ${
                    (priceInfo?.price_change_percentage || 0) < 0
                      ? "text-red"
                      : "text-green"
                  }`}
                >
                  {isFetchingPriceInfo && isFirstFetch ? (
                    <Skeleton />
                  ) : priceInfo?.price_change_percentage != undefined ? (
                    plusMinus(priceInfo.price_change_percentage) +
                    priceInfo.price_change_percentage.toFixed(2) +
                    "%"
                  ) : (
                    "-"
                  )}
                </span>
              )}
            </p>
          </div>
          <div className="ml-4 hidden md:block">
            <span className="font-roboto-mono text-xs font-light text-graySecondary">
              24h volume
            </span>
            <p className="font-roboto-mono text-xs font-light text-white">
              {isFetchingPriceInfo && isFirstFetch ? (
                <Skeleton />
              ) : priceInfo?.high_price != undefined ? (
                priceInfo.high_price
              ) : (
                <div className="flex items-center gap-1.5">
                  <div>$224,312.9</div>
                  <div className="invisible px-1 py-1">a</div>
                  {/* <div className="flex items-center gap-0.5 rounded-sm bg-greenPrimary/20 px-1 py-0.5 text-greenPrimary">
                    </div> */}
                </div>
              )}
            </p>
          </div>
          <div className="ml-4 hidden md:block">
            <span className="font-roboto-mono text-xs font-light uppercase text-graySecondary">
              Funding rate
            </span>
            <p className="font-roboto-mono text-xs font-light text-white">
              {isFetchingPriceInfo && isFirstFetch ? (
                <Skeleton />
              ) : priceInfo?.low_price != undefined ? (
                priceInfo.low_price
              ) : (
                <div className="flex items-center gap-1">
                  <div className="text-greenPrimary">+0.00044%</div>
                  <div>/</div>
                  <div>07:54:19</div>
                  <div className="invisible px-1 py-1">a</div>
                </div>
              )}
            </p>
          </div>
        </div>
      </div>
      <div className="my-3 flex items-center gap-8 font-roboto-mono text-sm">
        <div className="grid grid-cols-3 rounded-md bg-greenTertiary p-1 font-roboto-mono text-white">
          <div className="flex items-center justify-center">15m</div>
          <div className="flex items-center justify-center font-roboto-mono">
            1h
          </div>
          <div className="flex items-center justify-center whitespace-nowrap rounded-md bg-greenPrimary px-2.5 py-0.5 font-medium text-black">
            4h
          </div>
        </div>

        <div className="flex items-center gap-2">
          <img className="h-4 w-4" src="/candlestick.png" alt="candlestick" />
          <img className="h-4 w-4" src="/combo-chart.png" alt="combo" />
        </div>

        <div className="flex items-center gap-1.5">
          <img className="h-4 w-4" src="/formula-fx.png" alt="candlestick" />
          <div className="text-white">Indicators</div>
          <ChevronDownIcon className="ml-4 text-white" />
        </div>
      </div>
    </>
  );
};
