    // hooks/useRelease.ts
    import { useState, useEffect } from 'react';
    import type { GitHubRelease } from '@/lib/types/release';

    const FALLBACK_RELEASE: GitHubRelease = {
    tag_name: 'v0.6.0-beta',
    name: 'Fieldly v0.6.0-beta — Catalyst',
    published_at: '2026-06-22T00:00:00Z',
    html_url: 'https://github.com/rajputomsingh/Fieldly/releases',
    prerelease: true,
    };

    export function     useRelease() {
    const [release, setRelease] = useState<GitHubRelease | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        let mounted = true;

        async function fetchRelease() {
        try {
            console.log('🔄 Fetching release...');
            const res = await fetch('/api/release');
            
            if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
            
            const data: GitHubRelease = await res.json();
            console.log('✅ Release data:', data);
            
            if (mounted) {
            setRelease(data);
            setError(null);
            }
        } catch (err) {
            console.error('❌ Error fetching release:', err);
            if (mounted) {
            setError(err as Error);
            setRelease(FALLBACK_RELEASE);
            }
        } finally {
            if (mounted) {
            setIsLoading(false);
            }
        }
        }

        fetchRelease();
        
        // Refetch every 5 minutes in development to catch changes
        const interval = setInterval(fetchRelease, 300000);

        return () => {
        mounted = false;
        clearInterval(interval);
        };
    }, []);

    return {
        release,
        isLoading,
        isError: error,
        version: release?.tag_name || FALLBACK_RELEASE.tag_name,
        releaseUrl: release?.html_url || FALLBACK_RELEASE.html_url,
    };
    }