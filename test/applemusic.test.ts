import { Vulkava } from '../lib/Vulkava';

jest.setTimeout(10000);

describe('AppleMusic track loading', () => {
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
    disabledSources: ['DEEZER', 'SPOTIFY']
  });

  it('should be able to load a music-video', async () => {
    await expect(vulkava.search('https://music.apple.com/us/music-video/1553279848').then(r => r.loadType)).resolves.toBe('TRACK_LOADED');
  });

  it('should be able to load a track', async () => {
    await expect(vulkava.search('https://music.apple.com/us/album/malibu/1453581422?i=1453581718').then(r => r.loadType)).resolves.toBe('TRACK_LOADED');
  });

  it('should be able to load an album', async () => {
    await expect(vulkava.search('https://music.apple.com/pt/album/%C3%ADgneo/1604813268').then(r => r.loadType)).resolves.toBe('PLAYLIST_LOADED');
  });

  it('should be able to load a playlist', async () => {
    await expect(vulkava.search('https://music.apple.com/pt/playlist/play-portugal/pl.fdec33d0935a40d1879be160651195dd').then(r => r.loadType)).resolves.toBe('PLAYLIST_LOADED');
  });

  it('should be able to load a playlist with > 100 tracks', async () => {
    await expect(vulkava.search('https://music.apple.com/gb/playlist/200-most-streamed-songs-of-the-2000s/pl.0eb1559b2a614029aa9efe486d8ff293').then(r => r.tracks.length)).resolves.toBe(200);
  });

  it('should be able to load a list of the artist\'s top tracks', async () => {
    await expect(vulkava.search('https://music.apple.com/pt/artist/profjam/1124648900').then(r => r.loadType)).resolves.toBe('PLAYLIST_LOADED');
  });

  it('should fail to load', async () => {
    await expect(vulkava.search('https://music.apple.com/us/music-video/1234').then(r => r.loadType)).resolves.toBe('LOAD_FAILED');
    await expect(vulkava.search('https://music.apple.com/us/album/malibu/1453581422?i=1234').then(r => r.loadType)).resolves.toBe('LOAD_FAILED');
    await expect(vulkava.search('https://music.apple.com/pt/album/abcdef/12345').then(r => r.loadType)).resolves.toBe('LOAD_FAILED');
    await expect(vulkava.search('https://music.apple.com/pt/playlist/play-portugal/abcdef').then(r => r.loadType)).resolves.toBe('LOAD_FAILED');
    await expect(vulkava.search('https://music.apple.com/pt/artist/profjam/1234').then(r => r.loadType)).resolves.toBe('LOAD_FAILED');
  });
});