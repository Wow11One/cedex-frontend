import { useWallet } from "@aptos-labs/wallet-adapter-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import React, {
  type MouseEventHandler,
  type PropsWithChildren,
  useState,
} from "react";

import { shortenAddress } from "@/utils/formatter";
import { Button } from "./Button";
import { ConnectedButton } from "./ConnectedButton";
import OpenMenuIcon from "./icons/OpenMenuIcon";
import { LikeIcon } from "./icons/LikeIcon";
import { TwitterIcon } from "./icons/TwitterIcon";
import { TelegramIcon } from "./icons/TelegramIcon";
import { ChevronDownIcon } from "./icons/ChevronDownIcon";
import { SmallWalletIcon } from "./icons/SmallWalletIcon";
import { ExitIcon } from "./icons/ExitIcon";
import { NetworkSelector } from "./NetworkSelector";

const NavItem: React.FC<
  PropsWithChildren<{
    className?: string;
    href: string;
    active?: boolean;
    external?: boolean;
  }>
> = ({ className, href, active, external, children }) => {
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className={`cursor-pointer font-roboto-mono text-xl font-medium uppercase tracking-wide transition-all lg:text-lg ${
          active ? "text-neutral-100" : "text-neutral-500 hover:text-blue"
        } ${className ? className : ""}`}
      >
        {children}
      </a>
    );
  }

  return (
    <Link
      href={href}
      className={`cursor-pointer font-roboto-mono text-xl font-medium  uppercase tracking-wide transition-all lg:text-lg ${
        active ? "text-neutral-100" : "text-neutral-500 hover:text-blue"
      }`}
    >
      {children}
    </Link>
  );
};

type HeaderProps = {
  logoHref: string;
  onDepositWithdrawClick?: MouseEventHandler<HTMLButtonElement>;
  onWalletButtonClick?: MouseEventHandler<HTMLButtonElement>;
};

export function Header({
  logoHref,
  onDepositWithdrawClick,
  onWalletButtonClick,
}: HeaderProps) {
  const { account, disconnect } = useWallet();
  const router = useRouter();

  return (
    <>
      <header className="hidden xl:block">
        <nav className="flex items-center gap-24 bg-greenBackground py-2.5 pl-[29.19px] pr-[20.02px]">
          <div className="flex items-center gap-10 lg:gap-20">
            <div className="my-auto flex  items-center gap-[29.95px]">
              <Link className="inline-flex items-center gap-3" href={logoHref}>
                <Image
                  width={67}
                  height={40}
                  alt="Econia Logo"
                  src="/logo.png"
                  priority
                />
                <div className="select-none text-[38px] font-semibold text-white">
                  Cedex
                </div>
              </Link>
            </div>
          </div>

          <div className="flex flex-1 items-center justify-between">
            <div className="flex items-center gap-10 font-roboto-mono text-white">
              <div
                className={`cursor-pointer transition-colors ${
                  router.pathname.startsWith("/dashboard")
                    ? "text-greenPrimary"
                    : ""
                }`}
                onClick={() => router.push("/dashboard")}
              >
                Dashboard
              </div>
              <div
                className={`cursor-pointer transition-colors ${
                  router.pathname.startsWith("/leaderboard")
                    ? "text-greenPrimary"
                    : ""
                }`}
                onClick={() => router.push("/leaderboard")}
              >
                Leaderboard
              </div>
              <div
                className={`cursor-pointer transition-colors ${
                  router.pathname.startsWith("/deposit-withdraw")
                    ? "text-greenPrimary"
                    : ""
                }`}
                onClick={() => router.push("/deposit-withdraw")}
              >
                Deposit/Withdraw
              </div>
            </div>

            <div className="flex items-center gap-5">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <LikeIcon />
                  <div className="font-roboto-mono text-white">Follow on</div>
                </div>
                <TwitterIcon className="text-white transition-colors hover:text-greenPrimary" />
                <TelegramIcon className="text-white transition-colors hover:text-greenPrimary" />
              </div>
              {/* <div className="mx-2 flex items-center gap-1.5">
                <Image
                  src="/profile-image.png"
                  alt="profile image"
                  width={24}
                  height={24}
                />
                <ChevronDownIcon className="text-white" />
              </div> */}

              <NetworkSelector />
              <ConnectedButton>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outlined"
                    onClick={onWalletButtonClick}
                    className="flex items-center gap-1.5 !border-b-greenPrimary px-[17.5px] pb-2 pt-[10px] uppercase !leading-[18px] tracking-[0.32px]"
                  >
                    <div className="rounded-full bg-[#05F88F47] p-1">
                      <SmallWalletIcon className="h-4 w-4 text-greenPrimary" />
                    </div>
                    <div className="text-greenPrimary">
                      {shortenAddress(account?.address)}
                    </div>
                  </Button>
                  <div>
                    <ExitIcon
                      onClick={() => disconnect()}
                      className="cursor-pointer text-greenPrimary"
                    />
                  </div>
                </div>
              </ConnectedButton>
            </div>
          </div>
        </nav>
      </header>
      <HeaderMobile
        logoHref={logoHref}
        onDepositWithdrawClick={onDepositWithdrawClick}
        onWalletButtonClick={onWalletButtonClick}
      />
    </>
  );
}
const SlidingMenu = ({
  isOpen,
  onWalletButtonClick,
  onDepositWithdrawClick,
}: {
  isOpen: boolean;
  toggleMenu: () => void;
  onWalletButtonClick?: MouseEventHandler<HTMLButtonElement>;
  onDepositWithdrawClick?: MouseEventHandler<HTMLButtonElement>;
}) => {
  const { account } = useWallet();
  const router = useRouter();

  return (
    <div
      className={`transition-width fixed right-0 top-16 z-30 flex h-full flex-col overflow-x-hidden bg-greenBackground pt-4 duration-300 ease-in-out ${
        isOpen ? "w-full" : "w-0"
      }`}
    >
      <div className="mb-8  flex flex-col  items-start justify-between gap-[23.68px] px-[29.28px]">
        <NavItem
          href="/dashboard"
          active={router.pathname.startsWith("/dashboard")}
          className="active:text-greenPrimary"
        >
          Dashboard
        </NavItem>
        <NavItem
          href="/leaderboard"
          active={router.pathname.startsWith("/leaderboard")}
          className="active:text-greenPrimary"
        >
          Leaderboard
        </NavItem>
        <NavItem
          href="/deposit-withdraw"
          active={router.pathname.startsWith("/deposit-withdraw")}
          className="flex items-center gap-1 active:text-greenPrimary"
        >
          <p>Docs</p>
        </NavItem>
      </div>
      <div className="px-[29.28px]">
        <ConnectedButton className="w-[182px] py-[7px] uppercase leading-[22px]">
          <div className="flex items-center gap-2">
            <Button
              variant="outlined"
              onClick={onWalletButtonClick}
              className="flex items-center gap-1.5 !border-b-greenPrimary px-[17.5px] pb-2 pt-[10px] uppercase !leading-[18px] tracking-[0.32px]"
            >
              <div className="rounded-full bg-[#05F88F47] p-1">
                <SmallWalletIcon className="h-4 w-4 text-greenPrimary" />
              </div>
              <div className="text-greenPrimary">
                {shortenAddress(account?.address)}
              </div>
            </Button>
            <div>
              <ExitIcon className="cursor-pointer text-greenPrimary" />
            </div>
          </div>
        </ConnectedButton>
      </div>
    </div>
  );
};

const HeaderMobile = ({
  logoHref,
  onDepositWithdrawClick,
  onWalletButtonClick,
}: HeaderProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const toggleMenu = () => {
    if (!isOpen) {
      window.scrollTo({
        behavior: "smooth",
        top: 0,
      });
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <header
      className={`flex h-[76px] items-center justify-between bg-greenBackground py-4 pl-[29.28px] pr-[30.85px] xl:hidden  ${
        isOpen && ""
      }`}
    >
      <div className="flex items-center">
        <Link className="inline-flex items-center gap-3" href={logoHref}>
          <Image
            width={50}
            height={40}
            alt="Econia Logo"
            src="/logo.png"
            priority
          />
          <div className="select-none text-[28px] font-semibold text-white">
            Cedex
          </div>
        </Link>
      </div>

      <div className="flex h-[69px] items-center  gap-5">
        <div
          className="flex flex-col items-end gap-[8px] text-white"
          onClick={toggleMenu}
        >
          <OpenMenuIcon
            className={`transition duration-300 ease-in-out ${
              isOpen ? "translate-y-[6px] rotate-[135deg]" : ""
            }`}
          />
          <OpenMenuIcon
            className={`transition duration-300 ease-in-out ${
              isOpen ? "-translate-y-[6.5px] rotate-45" : ""
            }`}
          />
        </div>
      </div>

      <SlidingMenu
        isOpen={isOpen}
        toggleMenu={toggleMenu}
        onWalletButtonClick={onWalletButtonClick}
        onDepositWithdrawClick={onDepositWithdrawClick}
      />
    </header>
  );
};
