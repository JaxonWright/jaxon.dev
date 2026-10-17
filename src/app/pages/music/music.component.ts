import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { NgTemplateOutlet } from '@angular/common';
import { SPOTIFY_PLAYLISTS } from '@services/playlist-data';
import { SpotifyPlaylist } from '@services/playlist';

export interface PlaylistGroups { prime: SpotifyPlaylist[]; goated: SpotifyPlaylist[]; other: SpotifyPlaylist[]; }

/** Everything before "We Are Friends", minus "bangers" lists, split into prime/cream, GOAT and the rest. */
export function groupPlaylists(all: SpotifyPlaylist[]): PlaylistGroups {
  const cutoff = all.findIndex(p => p.name.toLowerCase().includes('we are friends'));
  const shown = (cutoff >= 0 ? all.slice(0, cutoff) : all)
    .filter(p => !p.name.toLowerCase().replace(/\s/g, '').includes('bangers'));
  const isPrime = (p: SpotifyPlaylist) => /prime|cream/i.test(p.name);
  const isGoated = (p: SpotifyPlaylist) => /goat/i.test(p.name);
  return {
    prime: shown.filter(isPrime),
    goated: shown.filter(p => !isPrime(p) && isGoated(p)),
    other: shown.filter(p => !isPrime(p) && !isGoated(p)),
  };
}

@Component({
  selector: 'app-music',
  imports: [NgTemplateOutlet],
  templateUrl: './music.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './music.component.scss',
})
export class MusicComponent {
  readonly groups = groupPlaylists(SPOTIFY_PLAYLISTS);

  constructor(private title: Title) {
    this.title.setTitle('Jaxon Wright - Playlists');
  }
}
