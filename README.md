# Vulkava
A lavalink wrapper in Node.JS

- [Documentation](https://docs.vulkava.tk)
- [Common errors/Issues](https://docs.vulkava.tk/common-issues)

## 🔌 Installation
You will need NodeJS v14+ and a running lavalink server.
- [Official Lavalink](https://github.com/freyacodes/Lavalink)
- [My custom version](https://github.com/davidffa/lavalink/releases)
```console
$ npm i vulkava
$ yarn add vulkava
$ pnpm add vulkava
```

## Getting started
Example music bot with discord.js
```js
const { Client } = require('discord.js');
const { Vulkava } = require('vulkava');

const client = new Client({
  intents: [
    'GUILDS',
    'GUILD_VOICE_STATES'
  ]
});

client.vulkava = new Vulkava({
  nodes: [
    {
      id: 'Node 1',
      hostname: '127.0.0.1',
      port: 2333,
      password: 'youshallnotpass'
    }
  ],
  sendWS: (guildId, payload) => {
    client.guilds.cache.get(guildId)?.shard.send(payload);
    // With eris
    // client.guilds.get(guildId)?.shard.sendWS(payload.op, payload.d);
  }
})

// -- Vulkava events --
// Fired when a track starts playing
client.vulkava.on('trackStart', (player, track) => {
  const channel = client.channels.cache.get(player.textChannelId);

  channel.send(`Now playing \`${track.title}\``);
});

// Fired when the queue ends
client.vulkava.on('queueEnd', (player) => {
  const channel = client.channels.cache.get(player.textChannelId);

  channel.send(`Queue ended!`);

  player.destroy();
});

// This event is needed to catch any errors that occur on Vulkava
client.vulkava.on('error', (node, err) => {
  console.error(`[Vulkava] Error on node ${node.identifier}`, err.message);
});

// -- Client events --
client.on('ready', () => {
  console.log('Ready!');
  // Starts the vulkava & connects to all lavalink nodes
  client.vulkava.start(client.user.id);
});

// IMPORTANT!
client.on('raw', (packet) => client.vulkava.handleVoiceUpdate(packet));
// On eris:
// client.on('rawWS', (packet) => client.vulkava.handleVoiceUpdate(packet));

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;
  if (!interaction.member.voice.channel) return interaction.reply({ content: `You need to join a voice channel first!`, ephemeral: true });

  const track = interaction.options.getString('track');

  const res = await client.vulkava.search(track);

  if (res.loadType === "LOAD_FAILED") {
    return interaction.reply(`:x: Load failed. Error: ${res.exception.message}`);
  } else if (res.loadType === "NO_MATCHES") {
    return interaction.reply(':x: No matches!');
  }

  // Creates the audio player
  const player = client.vulkava.createPlayer({
    guildId: interaction.guild.id,
    voiceChannelId: interaction.member.voice.channelId,
    textChannelId: interaction.channel.id,
    selfDeaf: true
  });
  
  player.connect(); // Connects to the voice channel

  if (res.loadType === 'PLAYLIST_LOADED') {
    for (const track of res.tracks) {
      track.setRequester(interaction.user);
      player.queue.push(track);
    }

    interaction.reply(`Playlist \`${res.playlistInfo.name}\` loaded!`);
  } else {
    const track = res.tracks[0];
    track.setRequester(interaction.user);

    player.queue.push(track);
    interacton.reply(`Queued \`${track.title}\``);
  }

  if (!player.playing) player.play();
});

client.login('TOKEN');
```