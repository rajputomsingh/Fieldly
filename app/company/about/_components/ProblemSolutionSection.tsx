"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

export default function ProblemSolutionSection() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <section className="py-16">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-8 animate-pulse">
            {/* Featured Skeleton */}

            <div className="overflow-hidden rounded-[24px] bg-white shadow-sm">
              <div className="h-[240px] bg-gray-200" />
              <div className="p-6 space-y-3">
                <div className="h-6 w-32 bg-gray-200 rounded-full" />
                <div className="h-6 w-3/4 bg-gray-200 rounded" />
                <div className="h-4 w-full bg-gray-200 rounded" />
                <div className="h-4 w-5/6 bg-gray-200 rounded" />
              </div>
            </div>

            {/* Right Skeleton */}

            <div className="flex flex-col gap-5">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex overflow-hidden rounded-[20px] bg-white shadow-sm"
                >
                  <div className="h-[140px] w-[140px] bg-gray-200" />
                  <div className="p-5 flex-1 space-y-2">
                    <div className="h-5 w-32 bg-gray-200 rounded-full" />
                    <div className="h-4 w-3/4 bg-gray-200 rounded" />
                    <div className="h-4 w-2/3 bg-gray-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 md:px-8">
        {/* HEADER */}

        <div className="mb-10">
          <h2 className="text-[36px] font-semibold tracking-tight text-black">
            The Land Access Problem
          </h2>

          <p className="mt-2 text-[15px] text-zinc-600 max-w-[620px]">
            Across many regions, productive farmland remains unused while
            farmers struggle to access land. Fieldly bridges this gap through a
            transparent digital marketplace that connects landowners with
            farmers.
          </p>
        </div>

        {/* GRID */}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-8">
          {/* FEATURED PROBLEM CARD */}

          <article className="group relative overflow-hidden rounded-[24px] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_30px_80px_rgba(0,0,0,0.12)]">
            <div className="absolute inset-0 bg-gradient-to-t from-[#b7cf8a]/0 via-[#b7cf8a]/0 to-[#b7cf8a]/0 group-hover:via-[#b7cf8a]/5 group-hover:to-[#b7cf8a]/10 transition-all duration-500 z-10" />

            <div className="relative h-[240px] w-full overflow-hidden">
              <Image
                src="/maintracblog.avif"
                alt="Idle farmland"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>

            <div className="p-6 relative z-20">
              <span className="inline-flex rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 group-hover:bg-[#b7cf8a]/20 transition-colors">
                THE PROBLEM
              </span>

              <h3 className="mt-3 text-[22px] font-semibold leading-snug text-black">
                Millions of Acres of Cultivable Land Remain Idle
              </h3>

              <p className="mt-2 text-[15px] leading-6 text-zinc-600">
                Landowners often struggle to find trustworthy farmers, while
                farmers struggle to discover available farmland. This disconnect
                leaves large areas of productive land unused.
              </p>
            </div>
          </article>

          {/* RIGHT STACKED SOLUTIONS */}

          <div className="flex flex-col gap-5">
            {[
              {
                img: "/blog-b78.webp",
                tag: "FIELDLY SOLUTION",
                title: "Transparent Digital Land Listings",
                desc: "Landowners can list farmland digitally with verified information and clear leasing terms.",
              },
              {
                img: "/blogfarmers.jpg",
                tag: "FIELDLY SOLUTION",
                title: "Direct Farmer Discovery",
                desc: "Farmers can explore farmland listings and apply directly without relying on intermediaries.",
              },
              {
                img: "/blogtractor.avif",
                tag: "FIELDLY SOLUTION",
                title: "Unlocking Productive Land Use",
                desc: "Fieldly connects farmers and landowners to transform idle land into productive farmland.",
              },
            ].map((card, i) => (
              <article
                key={i}
                className="group relative flex overflow-hidden rounded-[20px] bg-white shadow-[0_12px_32px_rgba(0,0,0,0.06)] transition-all duration-400 hover:-translate-y-0.5 hover:shadow-[0_20px_48px_rgba(0,0,0,0.1)]"
              >
                <div className="absolute inset-0 bg-[#b7cf8a]/0 group-hover:bg-[#b7cf8a]/5 transition-colors duration-300" />

                <div className="relative h-[140px] w-[140px] shrink-0 overflow-hidden">
                  <Image
                    src={card.img}
                    alt={card.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 140px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>

                <div className="relative p-5 flex flex-col justify-center">
                  <span className="inline-flex w-fit rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 group-hover:bg-[#b7cf8a]/20 transition-colors">
                    {card.tag}
                  </span>

                  <h4 className="mt-2 text-[16px] font-semibold leading-snug text-black">
                    {card.title}
                  </h4>

                  <p className="text-sm text-zinc-600 mt-1">{card.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
