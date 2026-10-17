import { TestBed } from '@angular/core/testing';
import { MusicComponent, groupPlaylists } from './music.component';
import { SpotifyPlaylist } from '@services/playlist';

const pl = (name: string): SpotifyPlaylist => ({ id: name, name, description: '', url: `https://open.spotify.com/${name}`, imageUrl: '', trackCount: 1 });
const names = (list: SpotifyPlaylist[]) => list.map(p => p.name);

describe('groupPlaylists', () => {
  it('splits prime/cream, GOAT and everything else', () => {
    const groups = groupPlaylists(['Prime Rock', 'Indie Cream', 'GOAT 2019', 'Chillwave', 'Prime GOAT'].map(pl));
    expect(names(groups.prime)).toEqual(['Prime Rock', 'Indie Cream', 'Prime GOAT']);
    expect(names(groups.goated)).toEqual(['GOAT 2019']);
    expect(names(groups.other)).toEqual(['Chillwave']);
  });

  it('drops everything from "We Are Friends" on, and any bangers list', () => {
    const groups = groupPlaylists(['Synth', 'Summer BANGERS', 'Bang ers 2', 'We Are Friends', 'Old Stuff'].map(pl));
    expect(names(groups.other)).toEqual(['Synth']);
  });
});

describe('MusicComponent', () => {
  it('decodes HTML entities from Spotify text', () => {
    const page = TestBed.createComponent(MusicComponent).componentInstance;
    expect(page.decode('Rock &amp; Roll &#x2F; Blues')).toBe('Rock & Roll / Blues');
  });

  it('renders each group, or says none are loaded', async () => {
    const fixture = TestBed.createComponent(MusicComponent);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const { prime, goated, other } = fixture.componentInstance.groups;
    expect(el.querySelectorAll('ul.playlists li').length).toBe(prime.length + goated.length + other.length);
    expect(!!el.querySelector('.empty-state')).toBe(other.length === 0);
  });
});
