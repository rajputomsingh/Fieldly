    // hooks/useRelease.ts
"use client";

import { useEffect, useState } from "react";
import type { ReleaseResponse } from "@/lib/types/release";

const FALLBACK_RELEASE: ReleaseResponse = {
  version: "v0.6.0-beta",
  name: "Fieldly v0.6.0-beta — Catalyst",
  url: "https://github.com/rajputomsingh/Fieldly/releases",
  publishedAt: "2026-06-22T00:00:00Z",
  prerelease: true,
};

export function useRelease() {
  const [release, setRelease] = useState<ReleaseResponse>(FALLBACK_RELEASE);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchRelease() {
      try {
        setIsError(false);

        const res = await fetch("/api/release", {
          signal: controller.signal,
          headers: {
            Accept: "application/json",
          },
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error();
        }

        const data: ReleaseResponse = await res.json();
        setRelease(data);
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        setIsError(true);
        setRelease(FALLBACK_RELEASE);
      } finally {
        setIsLoading(false);
      }
    }

    fetchRelease();

    const interval = setInterval(fetchRelease, 30 * 60 * 1000);

    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, []);

  return {
    release,
    isLoading,
    isError,
  };
}