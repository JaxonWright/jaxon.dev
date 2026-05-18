#!/usr/bin/env node

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const envPath = resolve(import.meta.dirname, '..', '.env');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eq = trimmed.indexOf('=');
      if (eq > 0) process.env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
    }
  }
}

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const SPOTIFY_USER_ID = process.env.SPOTIFY_USER_ID || '1265176482';

if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
  console.warn(
    '⚠ Skipping Spotify playlist fetch: SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET not set.\n' +
    '  Set them in .env or environment to fetch live playlists:\n' +
    '  SPOTIFY_CLIENT_ID=your_id SPOTIFY_CLIENT_SECRET=your_secret\n'
  );
  process.exit(0);
}

async function main() {
  const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64'),
    },
    body: 'grant_type=client_credentials',
  });

  if (!tokenResponse.ok) {
    console.error('Failed to get Spotify token:', await tokenResponse.text());
    process.exit(1);
  }

  const { access_token } = await tokenResponse.json();

  let allPlaylists = [];
  let url = `https://api.spotify.com/v1/users/${SPOTIFY_USER_ID}/playlists?limit=50`;

  while (url) {
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${access_token}` },
    });

    if (!response.ok) {
      console.error('Failed to fetch playlists:', await response.text());
      process.exit(1);
    }

    const { items, next } = await response.json();
    allPlaylists = allPlaylists.concat(items);
    url = next;
  }

  const playlists = allPlaylists.map(p => ({
    id: p.id,
    name: p.name,
    description: p.description || '',
    url: p.external_urls.spotify,
    imageUrl: p.images?.[0]?.url || '',
    trackCount: p.tracks?.total || 0,
  }));

  const { writeFileSync } = await import('fs');
  const { resolve, relative } = await import('path');

  const file = resolve(import.meta.dirname, '..', 'src', 'app', 'services', 'playlist-data.ts');
  const content =
`// IMPORTANT: THIS FILE IS AUTO GENERATED! DO NOT MANUALLY EDIT OR CHECKIN!
// Run \`npm run fetch:playlists\` to regenerate from Spotify.
import { SpotifyPlaylist } from './playlist';

export const SPOTIFY_PLAYLISTS: SpotifyPlaylist[] = ${JSON.stringify(playlists, null, 2)};
`;

  writeFileSync(file, content, 'utf-8');
  console.log(`Wrote ${playlists.length} playlists to ${relative(resolve(import.meta.dirname, '..'), file)}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
