import { Vulkava } from '../lib/Vulkava';

describe('Deezer track loading', () => {
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
    disabledSources: ['APPLE_MUSIC', 'SPOTIFY']
  });

  it('should be able to load a track', async () => {
    await expect(vulkava.search('https://www.deezer.com/pt/track/1493915862').then(r => r.loadType)).resolves.toBe('TRACK_LOADED');
  });

  it('should be able to load an album', async () => {
    await expect(vulkava.search('https://www.deezer.com/pt/album/258772832').then(r => r.loadType)).resolves.toBe('PLAYLIST_LOADED');
  });

  it('should be able to load a playlist', async () => {
    await expect(vulkava.search('https://www.deezer.com/en/playlist/3155776842').then(r => r.tracks.length)).resolves.toBe(100);
  });

  it('should fail to load', async () => {
    await expect(vulkava.search('https://www.deezer.com/pt/track/1111').then(r => r.loadType)).resolves.toBe('LOAD_FAILED');
    await expect(vulkava.search('https://www.deezer.com/pt/album/1111').then(r => r.loadType)).resolves.toBe('LOAD_FAILED');
    await expect(vulkava.search('https://www.deezer.com/pt/playlist/1111').then(r => r.loadType)).resolves.toBe('LOAD_FAILED');
  });
});