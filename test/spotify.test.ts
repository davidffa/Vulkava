import { Vulkava } from '../lib/Vulkava';

describe('Spotify track loading', () => {
  const vulkava = new Vulkava({
    nodes: [
      {
        hostname: 'localhost',
        port: 2333
      }
    ],
    sendWS: () => {
      //
    },
    disabledSources: ['APPLE_MUSIC', 'DEEZER']
  });

  it('should be able to load a track', async () => {
    await expect(vulkava.search('https://open.spotify.com/track/5bBQI31u2eqXJE5OyP4hxq').then(r => r.loadType)).resolves.toBe('TRACK_LOADED');
  });

  it('should be able to load a track (intl- URLs)', async () => {
    await expect(vulkava.search('https://open.spotify.com/intl-pt/track/2FDTHlrBguDzQkp7PVj16Q?si=049d306d96c140cd').then(r => r.loadType)).resolves.toBe('TRACK_LOADED');
  });

  it('should be able to load an album', async () => {
    await expect(vulkava.search('https://open.spotify.com/album/2PQwfmnKL23wejkx0qArUw').then(r => r.loadType)).resolves.toBe('PLAYLIST_LOADED');
  });

  it('should be able to load an album with > 50 tracks', async () => {
    await expect(vulkava.search('https://open.spotify.com/album/1OE2i6an7dEiNgl77Hz4k0').then(r => r.tracks.length)).resolves.toBe(100);
  });

  it('should be able to load a playlist', async () => {
    await expect(vulkava.search('spotify:playlist:37i9dQZF1DXdpF2suW27SP').then(r => r.loadType)).resolves.toBe('PLAYLIST_LOADED');
  });

  it('should be able to load a playlist with > 100 tracks', async () => {
    await expect(vulkava.search('https://open.spotify.com/playlist/2ua9P1PJZ8vNU1ZOZq6tqe').then(r => r.tracks.length)).resolves.toBe(196);
  });

  it('should be able to load a list of the artist\'s top tracks', async () => {
    await expect(vulkava.search('https://open.spotify.com/artist/4IVAbR2w4JJNJDDRFP3E83').then(r => r.loadType)).resolves.toBe('PLAYLIST_LOADED');
  });

  it('should fail to load', async () => {
    await expect(vulkava.search('https://open.spotify.com/track/abcdef').then(r => r.loadType)).resolves.toBe('LOAD_FAILED');
    await expect(vulkava.search('https://open.spotify.com/album/abcdef').then(r => r.loadType)).resolves.toBe('LOAD_FAILED');
    await expect(vulkava.search('https://open.spotify.com/playlist/abcdef').then(r => r.loadType)).resolves.toBe('LOAD_FAILED');
    await expect(vulkava.search('https://open.spotify.com/artist/abcdef').then(r => r.loadType)).resolves.toBe('LOAD_FAILED');
  });
});