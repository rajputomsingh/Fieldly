// app/api/release/route.ts
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import type { GitHubRelease } from '@/lib/types/release';

const FALLBACK_RELEASE: GitHubRelease = {
  tag_name: 'v0.6.0-beta',
  name: 'Fieldly v0.6.0-beta — Catalyst',
  published_at: '2026-06-22T00:00:00Z',
  html_url: 'https://github.com/rajputomsingh/Fieldly/releases',
  prerelease: true,
};

// Track last successful fetch to avoid rate limits
let lastFetch = 0;
let cachedData: GitHubRelease | null = null;

export async function GET() {
  try {
    // Use in-memory cache for 30 minutes to avoid GitHub rate limits
    const now = Date.now();
    if (cachedData && (now - lastFetch) < 1800000) {
      console.info('[release] serving from memory cache');
      return NextResponse.json(cachedData);
    }

    console.info('[release] fetching from GitHub API');
    
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
    };

    if (process.env.GITHUB_RELEASES_TOKEN) {
      headers['Authorization'] = `Bearer ${process.env.GITHUB_RELEASES_TOKEN}`;
    }

    const res = await fetch(
      'https://api.github.com/repos/rajputomsingh/Fieldly/releases/latest',
      { headers }
    );

    if (res.ok) {
      const release: GitHubRelease = await res.json();
      cachedData = release;
      lastFetch = now;
      console.info(`[release] fetched ${release.tag_name}`);
      return NextResponse.json(release);
    }

    // Rate limited - use fallback
    if (res.status === 403) {
      console.warn('[release] rate limited, using fallback');
      return NextResponse.json(cachedData || FALLBACK_RELEASE);
    }

    throw new Error(`GitHub API error: ${res.status}`);

  } catch (error) {
    console.error('[release] error:', error);
    return NextResponse.json(cachedData || FALLBACK_RELEASE);
  }
}