# Example recorder bot

```js
const { Client } = require('discord.js');
const { Vulkava } = require('vulkava');

// guildId <-> textchannel
const records = new Map();

const client = new Client({
  intents: ['GUILDS', 'GUILD_MESSAGES', 'GUILD_VOICE_STATES']
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
    client.guilds.cache.get(guildId).shard.send(payload);
  }
});

client.vulkava.on('recordFinished', async (node, guildId, id) => {
  const file = await node.getRecord(guildId, id);

  records.get(guildId).send({
    content: 'Record finished!',
    files: [
      {
        name: 'rec.mp3',
        attachment: file
      }
    ]
  });

  records.delete(guildId);
  node.deleteRecord(guildId, id);
});

client.on('raw', (packet) => client.vulkava.handleVoiceUpdate(packet));
client.on('ready', () => {
  client.vulkava.start(client.user.id);
  console.log('Ready!');
})

client.on('messageCreate', msg => {
  if (msg.content === '!rec') {
    if (!records.has(msg.guild.id)) {
      const player = client.vulkava.createPlayer({
        guildId: msg.guild.id,
        textChannelId: msg.channel.id,
        voiceChannelId: msg.member.voice.channelId
      });

      player.connect();

      player.recorder.start({
        id: msg.member.voice.channelId,
        bitrate: msg.member.voice.channel.bitrate
      });

      msg.channel.send(':red_circle: Started recording!');

      records.set(msg.guild.id, msg.channel);
    } else {
      const player = client.vulkava.players.get(msg.guild.id);
      player.destroy();
    }
  }
});

client.login('TOKEN');
```