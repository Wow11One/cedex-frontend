"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { ChevronDownIcon } from "./icons/ChevronDownIcon";
import Image from "next/image";

type Network = {
  id: string;
  name: string;
  icon: string | ReactNode;
  color: string;
};

const networks: Network[] = [
  {
    id: "tether",
    name: "Tether",
    icon: (
      <Image
        src="/profile-image.png"
        alt="profile image"
        width={20}
        height={20}
      />
    ),
    color: "bg-emerald-500",
  },
  {
    id: "binance",
    name: "Binance Chain",
    icon: (
      <Image src="/binance.png" alt="binance image" width={20} height={20} />
    ),
    color: "bg-yellow-500",
  },
  {
    id: "bitcoin",
    name: "Bitcoin Cash",
    icon: (
      <Image src="/bitcoin.png" alt="bitcoin image" width={20} height={20} />
    ),
    color: "bg-orange-500",
  },
  {
    id: "etherium",
    name: "Etherium Classic",
    icon: (
      <Image src="/etherium.png" alt="etherium image" width={20} height={20} />
    ),
    color: "bg-emerald-500",
  },
];

export function NetworkSelector() {
  const [selectedNetwork, setSelectedNetwork] = useState<Network>(networks[0]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 transition-opacity hover:opacity-80"
      >
        <div className="mx-2 flex items-center gap-1.5">
          <Image
            src="/profile-image.png"
            alt="profile image"
            width={24}
            height={24}
          />
          <ChevronDownIcon className="text-white" />
        </div>
      </button>

      {/* Network Selection Modal */}
      {isOpen && (
        <div className="bg-popover animate-in fade-in slide-in-from-top-2 absolute left-0 right-0 top-full z-50 mt-2 w-60 rounded-2xl border border-greenSecondary bg-greenBackground p-3 font-roboto-mono text-sm font-medium text-white duration-200">
          <div className="space-y-2">
            {networks.map((network) => (
              <button
                key={network.id}
                onClick={() => {
                  setSelectedNetwork(network);
                  setIsOpen(false);
                }}
                className="hover:bg-secondary/50 group flex w-full items-center gap-3 rounded-xl p-1.5 transition-colors"
              >
                {/* Radio Button */}
                <div className="relative h-4 w-4 flex-shrink-0">
                  <div
                    className={`
                      h-4 w-4 rounded-full border transition-colors
                      ${
                        selectedNetwork.id === network.id
                          ? "border-greenPrimary"
                          : "border-greenPrimary"
                      }
                    `}
                  />
                  {network.id === "tether" && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-greenPrimary" />
                    </div>
                  )}
                </div>

                {/* Network Icon */}
                <div
                  className={`
                    text-background flex  items-center justify-center
                  `}
                >
                  {network.icon}
                </div>

                {/* Network Name */}
                <span
                  className={`
                    text-sm font-medium transition-colors
                    ${
                      selectedNetwork.id === network.id
                        ? "text-foreground"
                        : "text-muted-foreground group-hover:text-foreground"
                    }
                  `}
                >
                  {network.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
