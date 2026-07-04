// app/api/release/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import type { ReleaseResponse } from "@/lib/types/release";

const FALLBACK_RELEASE: ReleaseResponse = {
  version: "v0.6.0-beta",
  name: "Fieldly v0.6.0-beta — Catalyst",
  publishedAt: "2026-06-22T00:00:00Z",
  url: "https://github.com/rajputomsingh/Fieldly/releases",
  prerelease: true,
};

let cache: ReleaseResponse | null = null;
let cacheTimestamp = 0;

const CACHE_DURATION = 30 * 60 * 1000;
const FETCH_TIMEOUT = 5000;

export async function GET() {
  const now = Date.now();

  if (cache && now - cacheTimestamp < CACHE_DURATION) {
    return NextResponse.json(cache, {
      headers: {
        "Cache-Control":
          "public, s-maxage=1800, stale-while-revalidate=86400",
      },
    });
  }

  try {
    const headers: HeadersInit = {
      Accept: "application/vnd.github+json",
    };

    if (process.env.GITHUB_RELEASES_TOKEN) {
      headers.Authorization = `Bearer ${process.env.GITHUB_RELEASES_TOKEN}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, FETCH_TIMEOUT);

    const response = await fetch(
      "https://api.github.com/repos/rajputomsingh/Fieldly/releases/latest",
      {
        headers,
        signal: controller.signal,
        next: {
          revalidate: 1800,
        },
      }
    );

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`GitHub API returned ${response.status}`);
    }

    const githubRelease = await response.json();

    if (
      typeof githubRelease.tag_name !== "string" ||
      typeof githubRelease.name !== "string" ||
      typeof githubRelease.html_url !== "string" ||
      typeof githubRelease.published_at !== "string"
    ) {
      throw new Error("Invalid GitHub release payload");
    }

    const release: ReleaseResponse = {
      version: githubRelease.tag_name,
      name: githubRelease.name,
      url: githubRelease.html_url,
      publishedAt: githubRelease.published_at,
      prerelease: githubRelease.prerelease,
    };

    cache = release;
    cacheTimestamp = now;

    return NextResponse.json(release, {
      headers: {
        "Cache-Control":
          "public, s-maxage=1800, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("[release] Failed to fetch latest GitHub release:", error);

    return NextResponse.json(cache ?? FALLBACK_RELEASE, {
      headers: {
        "Cache-Control":
          "public, s-maxage=1800, stale-while-revalidate=86400",
      },
    });
  }
}