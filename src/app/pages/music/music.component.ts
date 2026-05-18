import { Component, signal, computed } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { SPOTIFY_PLAYLISTS } from '@services/playlist-data';

@Component({
  selector: 'app-music',
  imports: [MatCardModule, MatButtonModule],
  templateUrl: './music.component.html',
  styleUrl: './music.component.scss',
})
export class MusicComponent {
  playlists = signal(this.truncatedPlaylists());

  private truncatedPlaylists(): typeof SPOTIFY_PLAYLISTS {
    const cutoff = SPOTIFY_PLAYLISTS.findIndex(p =>
      p.name.toLowerCase().includes('we are friends')
    );
    const result = cutoff >= 0 ? SPOTIFY_PLAYLISTS.slice(0, cutoff) : SPOTIFY_PLAYLISTS;
    return result.filter(p => !p.name.toLowerCase().replace(/\s/g, '').includes('bangers'));
  }

  private isPrime(name: string): boolean {
    const n = name.toLowerCase();
    return n.includes('prime') || n.includes('cream');
  }

  decode(value: string): string {
    const el = document.createElement('span');
    el.innerHTML = value;
    return el.textContent || value;
  }

  private isGoated(name: string): boolean {
    return name.toLowerCase().includes('goat');
  }

  primePlaylists = computed(() =>
    this.playlists().filter(p => this.isPrime(p.name))
  );

  goatedPlaylists = computed(() =>
    this.playlists().filter(p =>
      !this.isPrime(p.name) && this.isGoated(p.name)
    )
  );

  otherPlaylists = computed(() =>
    this.playlists().filter(p =>
      !this.isPrime(p.name) && !this.isGoated(p.name)
    )
  );

  constructor(private title: Title) {
    this.title.setTitle('Jaxon Wright - Music');
  }
}
