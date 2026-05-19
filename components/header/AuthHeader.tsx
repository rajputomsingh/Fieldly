// components/AuthHeader.tsx
"use client";

import {
  ChevronDown,
  Globe,
  ArrowUpRight,
  Menu,
  X,
  BookOpen,
  BarChart,
  HelpCircle,
  Leaf,
  Users,
  Building,
  Satellite,
  TrendingUp,
  Target,
  LucideIcon,
  IndianRupee,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { useHeaderVisibility } from "./HeaderVisibility";
import { SignedOut, SignedIn, UserButton } from "@clerk/nextjs";
import { DashboardButton } from "@/components/DashboardButton";
import { MobileAuthSection } from "@/components/MobileAuthSection";

/* ================= TYPES ================= */

interface NavItem {
  label: string;
  desc?: string;
  icon: LucideIcon;
  href: string;
}

interface NavSection {
  label: string;
  items: NavItem[];
  feature?: {
    title: string;
    desc: string;
    button: string;
    href: string;
  };
}

type NavKey = "farmers" | "institutional" | "resources" | "more";

/* ================= DATA ================= */

const NAV_DATA: Record<NavKey, NavSection> = {
  farmers: {
    label: "Farmers",
    items: [
      {
        label: "Agri Loans",
        desc: "Flexible financial support for farmers",
        icon: IndianRupee,
        href: "/farmers/agri-loans",
      },
      {
        label: "Green Loans",
        desc: "Sustainable agriculture financing",
        icon: Leaf,
        href: "/farmers/green-loans",
      },
      {
        label: "Carbon Farming",
        desc: "Earn through regenerative farming",
        icon: Satellite,
        href: "/farmers/carbon",
      },
    ],
    feature: {
      title: "Farmers",
      desc: "Financial solutions that support farmers on their journey towards regenerative agriculture.",
      button: "Get A Loan",
      href: "/farmers",
    },
  },
  institutional: {
    label: "Institutional Investors",
    items: [
      {
        label: "Investment Opportunities",
        desc: "Farmland portfolio access",
        icon: TrendingUp,
        href: "/institutional/investments",
      },
      {
        label: "Portfolio Management",
        desc: "Track farmland assets",
        icon: BarChart,
        href: "/institutional/portfolio",
      },
      {
        label: "Impact Reporting",
        desc: "Transparent ESG metrics",
        icon: Target,
        href: "/institutional/impact",
      },
    ],
    feature: {
      title: "Institutional Investors",
      desc: "Access farmland investment opportunities and climate-positive portfolios.",
      button: "Explore Investments",
      href: "/company/institutional",
    },
  },
  resources: {
    label: "Resources",
    items: [
      {
        label: "News",
        icon: BookOpen,
        href: "/resources/news",
      },
      {
        label: "MRV Technology",
        icon: Satellite,
        href: "/resources/mrv",
      },
      {
        label: "FAQ",
        icon: HelpCircle,
        href: "/resources/faq",
      },
    ],
    feature: {
      title: "Resources",
      desc: "Insights, research and knowledge from the Fieldly ecosystem.",
      button: "Insights From Fieldly",
      href: "/company/insights",
    },
  },
  more: {
    label: "More",
    items: [
      {
        label: "About Us",
        icon: Building,
        href: "/company/about",
      },
      {
        label: "Careers",
        icon: Users,
        href: "/company/careers",
      },
      {
        label: "Contact",
        icon: ArrowUpRight,
        href: "/company/contact",
      },
      {
        label: "Fieldly Finance",
        icon: IndianRupee,
        href: "/company/Finance",
      },
    ],
    feature: {
      title: "Company",
      desc: "Explore Fieldly's mission to modernize agricultural land leasing with a trusted digital ecosystem for farmers, landowners, and rural communities.",
      button: "About Fieldly",
      href: "/company/about",
    },
  },
};

// ================= DESKTOP AUTH CTA =================
function AuthCTA() {
  return (
    <div className="flex items-center gap-4">
      <DashboardButton />
      <UserButton
        appearance={{
          elements: {
            avatarBox: "h-9 w-9",
            userButtonAvatarBox: "h-9 w-9",
          },
        }}
      />
    </div>
  );
}

export default function AuthHeader() {
  const { scrollY } = useScroll();
  const { setAuthHidden, mainVisible } = useHeaderVisibility();
  const [hidden, setHidden] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<NavKey | null>(null);
  const [languageOpen, setLanguageOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);

  // Mobile dropdown state
  const [mobileActiveDropdown, setMobileActiveDropdown] =
    useState<NavKey | null>(null);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        activeDropdown &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setActiveDropdown(null);
      }
      if (
        languageOpen &&
        !(event.target as Element).closest(".language-container")
      ) {
        setLanguageOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeDropdown, languageOpen]);

  // Scroll hide/show logic - optimized
  useMotionValueEvent(scrollY, "change", (latest) => {
    const scrollDirection = latest > lastScrollY.current ? "down" : "up";
    lastScrollY.current = latest;

    const shouldHide = scrollDirection === "down" && latest > 100;
    const shouldShow = scrollDirection === "up" || latest < 50;

    if (shouldHide) {
      setHidden(true);
      setAuthHidden(true);
    } else if (shouldShow || !mainVisible) {
      setHidden(false);
      setAuthHidden(false);
    }
  });

  // Desktop hover handlers
  const handleMouseEnter = (key: NavKey) => {
    setActiveDropdown(key);
  };

  const handleMouseLeave = () => {
    setTimeout(() => {
      if (
        !document.querySelector(".dropdown-content:hover") &&
        !document.querySelector(".dropdown-trigger:hover")
      ) {
        setActiveDropdown(null);
      }
    }, 100);
  };

  const toggleDesktopDropdown = (key: NavKey) => {
    setActiveDropdown(activeDropdown === key ? null : key);
  };

  // Mobile dropdown handlers
  const toggleMobileDropdown = (key: NavKey) => {
    setMobileActiveDropdown(mobileActiveDropdown === key ? null : key);
  };

  const handleLanguageToggle = () => {
    setLanguageOpen(!languageOpen);
  };

  // Close all dropdowns when mobile menu closes
  useEffect(() => {
    if (!mobileOpen) {
      setTimeout(() => setMobileActiveDropdown(null), 0);
    }
  }, [mobileOpen]);

  const handleMobileMenuClose = () => {
    setMobileOpen(false);
    setMobileActiveDropdown(null);
    setLanguageOpen(false);
  };

  return (
    <>
      <motion.header
        initial={false}
        animate={hidden && !mobileOpen ? "hidden" : "visible"}
        variants={{
          visible: { y: 0, opacity: 1 },
          hidden: { y: -80, opacity: 0 },
        }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="fixed top-4 inset-x-0 z-[100]"
        style={{ pointerEvents: "auto" }}
      >
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 md:px-8">
          {/* ========== MOBILE ========== */}
          <div className="flex md:hidden items-center justify-between rounded-full bg-white/90 px-4 py-2 shadow-[0_12px_40px_rgba(0,0,0,0.12)] backdrop-blur-md">
            <Link
              href="/"
              className="flex items-center gap-2"
              onClick={handleMobileMenuClose}
            >
              <Image
                src="/hicon.png"
                alt="Fieldly"
                width={28}
                height={28}
                priority
              />
              <span className="text-base font-semibold">Fieldly</span>
            </Link>
            <div className="flex items-center gap-1 rounded-full bg-black/5 p-1">
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-black/10 transition-colors"
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
              >
                {mobileOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>

          {/* ========== DESKTOP ========== */}
          <div className="hidden md:flex items-center justify-between gap-8">
            {/* ========== CONTAINER 1: LOGO ========== */}
            <Link
              href="/"
              className="flex h-16 items-center rounded-full bg-white/90 px-8 shadow-xl backdrop-blur-md hover:bg-white/95 transition-colors"
            >
              <Image
                src="/hicon.png"
                alt="Fieldly"
                width={32}
                height={32}
                priority
              />
              <span className="ml-1 text-xl font-semibold">Fieldly</span>
            </Link>

            {/* ========== CONTAINER 2: NAVIGATION ========== */}
            <nav
              className="relative flex h-16 items-center gap-12 rounded-full bg-white/90 px-8 shadow-xl backdrop-blur-md"
              ref={dropdownRef}
            >
              {(Object.keys(NAV_DATA) as NavKey[]).map((key) => {
                const section = NAV_DATA[key];

                return (
                  <div
                    key={key}
                    className="relative"
                    onMouseEnter={() => handleMouseEnter(key)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <button
                      onClick={() => toggleDesktopDropdown(key)}
                      className="dropdown-trigger flex items-center gap-2 text-base font-medium text-black hover:text-black transition-colors"
                      aria-expanded={activeDropdown === key}
                      aria-haspopup="true"
                    >
                      {section.label}
                      <ChevronDown
                        className={`h-5 w-5 opacity-70 transition-transform duration-200 ${
                          activeDropdown === key ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {/* Desktop Dropdown Menu */}
                    {activeDropdown === key && (
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="dropdown-content absolute left-1/2 top-full mt-6 -translate-x-1/2 w-[680px] rounded-3xl bg-white shadow-[0_20px_60px_rgba(0,0,0,0.12)] border border-gray-100/50 p-6 z-[150]"
                        onMouseEnter={() => setActiveDropdown(key)}
                        onMouseLeave={handleMouseLeave}
                        role="menu"
                      >
                        <div className="grid grid-cols-2 gap-6">
                          {/* Left Column - Navigation Links */}
                          <div className="space-y-1">
                            {section.items.map((item) => {
                              const Icon = item.icon;
                              return (
                                <Link
                                  key={item.label}
                                  href={item.href}
                                  prefetch={false}
                                  onClick={() => setActiveDropdown(null)}
                                  className="group flex items-center justify-between px-4 py-3 rounded-xl hover:bg-gray-50 transition-all duration-200"
                                  role="menuitem"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50 group-hover:bg-white transition-colors">
                                      <Icon className="h-4 w-4 text-gray-600 group-hover:text-black" />
                                    </div>
                                    <div>
                                      <div className="font-medium text-sm text-gray-900 group-hover:text-black">
                                        {item.label}
                                      </div>
                                      {item.desc && (
                                        <div className="text-xs text-gray-500 mt-0.5 max-w-[180px]">
                                          {item.desc}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                                </Link>
                              );
                            })}
                          </div>

                          {/* Right Column - Feature Card */}
                          {section.feature && (
                            <div className="bg-[#b7cf8a] rounded-2xl p-6 flex flex-col justify-between min-h-[280px]">
                              <div>
                                <h3 className="text-2xl font-semibold mb-3 text-gray-900">
                                  {section.feature.title}
                                </h3>
                                <p className="text-sm text-gray-700 leading-relaxed">
                                  {section.feature.desc}
                                </p>
                              </div>

                              <Link
                                href={section.feature.href}
                                prefetch={false}
                                onClick={() => setActiveDropdown(null)}
                                className="group mt-6 flex items-center justify-between bg-black text-white rounded-full px-5 py-3 text-sm font-medium hover:bg-gray-900 transition-colors"
                              >
                                <span>{section.feature.button}</span>
                                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-[#b7cf8a] text-black group-hover:bg-[#a8c07a] transition-colors">
                                  <ArrowUpRight size={14} />
                                </span>
                              </Link>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </nav>

            {/* ========== CONTAINER 3: CTA ========== */}
            <div className="flex h-16 items-center gap-4 rounded-full bg-white/90 px-12 shadow-xl backdrop-blur-md min-w-[440px] justify-between">
              {/* Language Dropdown */}
              <div className="language-container relative">
                <button
                  onClick={handleLanguageToggle}
                  className="flex items-center gap-2 text-base font-medium text-black hover:text-black transition-colors"
                  aria-expanded={languageOpen}
                >
                  <Globe className="h-5 w-5" />
                  <ChevronDown className="h-4 w-4" />
                </button>

                {languageOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute left-0 top-full mt-6 w-48 rounded-xl bg-white shadow-lg border border-gray-100 overflow-hidden z-[150]"
                  >
                    <button
                      onClick={() => setLanguageOpen(false)}
                      className="w-full px-4 py-3 text-left text-sm text-zinc-700 hover:bg-gray-50 hover:text-black transition-colors"
                    >
                      English (EN)
                    </button>
                    <button
                      onClick={() => setLanguageOpen(false)}
                      className="w-full px-4 py-3 text-left text-sm text-zinc-700 hover:bg-gray-50 hover:text-black transition-colors border-t border-gray-100"
                    >
                      Español (ES)
                    </button>
                  </motion.div>
                )}
              </div>

              <Link
                href="/marketplace"
                className="hidden lg:flex items-center gap-2 h-11 px-6 rounded-full backdrop-blur-xl bg-white/40 border border-white/30 text-black font-semibold text-sm shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:bg-white/60 hover:shadow-[0_12px_30px_rgba(0,0,0,0.12)] transition-all duration-300 group"
              >
                Marketplace
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
              </Link>

              {/* Auth CTA Section */}
              <div className="flex items-center gap-3 min-w-[110px]">
                <SignedOut>
                  <Link
                    href="/sign-in"
                    prefetch={false}
                    className="group flex items-center gap-2 rounded-full bg-[#b7cf8a] px-4 py-1 text-sm font-semibold text-black transition-all duration-300 hover:bg-[#a9c27b] whitespace-nowrap"
                  >
                    <span>Sign In</span>
                    <span className="flex items-center justify-center h-7 w-7 rounded-full bg-black text-white transition-all duration-300 group-hover:bg-[#2a2f1f]">
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </Link>
                </SignedOut>
                <SignedIn>
                  <AuthCTA />
                </SignedIn>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* ================= MOBILE MENU ================= */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-[90] bg-black/30 backdrop-blur-sm md:hidden"
            onClick={handleMobileMenuClose}
          />

          <motion.div
            initial={{ y: -16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed top-24 left-4 right-4 z-[200] rounded-2xl bg-white p-6 shadow-[0_30px_80px_rgba(0,0,0,0.18)] md:hidden max-h-[80vh] overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation menu"
          >
            {/* Mobile Navigation with Dropdowns */}
            <div className="space-y-2">
              {(Object.keys(NAV_DATA) as NavKey[]).map((key) => (
                <div
                  key={key}
                  className="border-b border-gray-100 pb-2 last:border-b-0"
                >
                  <button
                    onClick={() => toggleMobileDropdown(key)}
                    className="flex w-full items-center justify-between py-4 px-2 text-base font-medium text-black hover:text-black transition-colors"
                    aria-expanded={mobileActiveDropdown === key}
                  >
                    {NAV_DATA[key].label}
                    <ChevronDown
                      className={`h-5 w-5 opacity-70 transition-transform duration-200 ${
                        mobileActiveDropdown === key ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Mobile Dropdown Content */}
                  {mobileActiveDropdown === key && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pb-4 pl-2 pr-2">
                        {/* Feature Card for Mobile */}
                        {NAV_DATA[key].feature && (
                          <div className="bg-[#b7cf8a] rounded-xl p-4 mb-4">
                            <h4 className="font-semibold text-base mb-1">
                              {NAV_DATA[key].feature?.title}
                            </h4>
                            <p className="text-xs text-gray-700 mb-3">
                              {NAV_DATA[key].feature?.desc}
                            </p>
                            <Link
                              href={NAV_DATA[key].feature?.href || "#"}
                              prefetch={false}
                              onClick={handleMobileMenuClose}
                              className="inline-flex items-center gap-1 text-xs font-medium bg-black text-white rounded-full px-4 py-2"
                            >
                              {NAV_DATA[key].feature?.button}
                              <ArrowUpRight className="h-3 w-3" />
                            </Link>
                          </div>
                        )}

                        {/* Navigation Items */}
                        {NAV_DATA[key].items.map((item) => {
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.label}
                              href={item.href}
                              prefetch={false}
                              onClick={handleMobileMenuClose}
                              className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-zinc-600 hover:bg-gray-50 hover:text-black mb-1 last:mb-0 transition-colors"
                            >
                              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-50">
                                <Icon className="h-3.5 w-3.5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">
                                  {item.label}
                                </div>
                                {item.desc && (
                                  <div className="text-xs text-zinc-500 mt-0.5 line-clamp-2">
                                    {item.desc}
                                  </div>
                                )}
                              </div>
                              <ArrowUpRight className="h-3.5 w-3.5 opacity-50" />
                            </Link>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </div>
              ))}
            </div>

            {/* Mobile Language Selector */}
            <div className="mt-6 mb-4">
              <button
                onClick={handleLanguageToggle}
                className="flex w-full items-center justify-between py-3 px-4 rounded-lg bg-gray-50 text-sm font-medium text-zinc-700 hover:bg-gray-100 transition-colors"
                aria-expanded={languageOpen}
              >
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Language
                </div>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${
                    languageOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {languageOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-2 rounded-lg bg-gray-50 overflow-hidden"
                >
                  <button
                    onClick={() => {
                      setLanguageOpen(false);
                    }}
                    className="w-full px-4 py-3 text-left text-sm text-zinc-700 hover:bg-gray-100 transition-colors"
                  >
                    English (EN)
                  </button>
                  <button
                    onClick={() => {
                      setLanguageOpen(false);
                    }}
                    className="w-full px-4 py-3 text-left text-sm text-zinc-700 hover:bg-gray-100 transition-colors border-t border-gray-200"
                  >
                    Español (ES)
                  </button>
                </motion.div>
              )}
            </div>

            {/* Marketplace CTA (Mobile - Glass) */}
            <div className="mt-4 mb-6 px-2">
              <Link
                href="/marketplace"
                prefetch={false}
                onClick={handleMobileMenuClose}
                className="group flex items-center justify-between w-full h-11 px-5 rounded-full backdrop-blur-2xl bg-gradient-to-b from-white/60 to-white/30 border border-white/40 text-black text-sm font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_8px_20px_rgba(0,0,0,0.08)] active:scale-[0.97] transition-all duration-200"
              >
                <span>Explore Marketplace</span>
                <span className="flex items-center justify-center h-7 w-7 rounded-full bg-white/60 border border-white/50 transition-transform duration-200 group-active:translate-x-1 group-active:-translate-y-1">
                  <ArrowUpRight className="h-4 w-4 opacity-80" />
                </span>
              </Link>
            </div>

            {/* Mobile Auth Section */}
            <MobileAuthSection onClose={handleMobileMenuClose} />
          </motion.div>
        </>
      )}
    </>
  );
}
