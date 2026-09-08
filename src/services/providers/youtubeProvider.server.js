/**
 * YouTube Data API adapter for the Music Videos section.
 * Server-side only — see movieProvider.server.js for why.
 *
 * Populate YT_API_KEY_1, YT_API_KEY_2, ... in your environment. Each one is
 * a separate key created in Google Cloud Console under the same or
 * different projects; the pool spreads search/video-detail calls across all
 * of them so YouTube's per-key daily quota units aren't a single point of
 * exhaustion. This still must follow YouTube's Terms of Service and API
 * Services Terms, including required attribution and embedding rules —
 * spreading load across keys is not a way around those terms.
 */
import { ApiKeyPool, fetchWithKeyPool } from "../apiKeyPool.js";

const YT_BASE_URL = "https://www.googleapis.com/youtube/v3";

const youtubeKeyPool = new ApiKeyPool(
  Object.keys(process.env)
    .filter((k) => k.startsWith("YT_API_KEY_"))
    .map((k) => process.env[k]),
  { cooldownMs: 90_000 }
);

export async function searchMusicVideos(query, { maxResults = 20 } = {}) {
  const res = await fetchWithKeyPool(youtubeKeyPool, (key) => ({
    url: `${YT_BASE_URL}/search?part=snippet&type=video&videoCategoryId=10&maxResults=${maxResults}&q=${encodeURIComponent(query)}&key=${key}`,
    init: {},
  }));
  const data = await res.json();
  return (data.items ?? []).map((item) => ({
    id: item.id?.videoId,
    title: item.snippet?.title,
    channelTitle: item.snippet?.channelTitle,
    thumbnailUrl: item.snippet?.thumbnails?.medium?.url ?? null,
    publishedAt: item.snippet?.publishedAt ?? null,
    source: "youtube",
    // Embedding must go through the official YouTube IFrame Player API on
    // the frontend — never proxy or re-host the media stream yourself.
  }));
}

export const _internal = { youtubeKeyPool };
