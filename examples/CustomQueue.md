```js
// Queue.js

const { DefaultQueue } = require('vulkava');

module.exports = class Queue extends DefaultQueue {
  constructor() {
    super();
  }

  peek() {
    return this.tracks[0];
  }

  removeTrackAt(index) {
    this.tracks.splice(index, 1);
  }

  getTrackAt(index) {
    return this.tracks[index];
  }

  getQueueDetails(pos, pos2) {
    const data = [];

    for (; pos < pos2 && this.tracks[pos]; pos++) {
      const req = this.tracks[pos].requester;
      data.push(`${pos + 1}º - \`${this.tracks[pos].title}\` (Requested by: \`${req.username}#${req.discriminator}\`)`)
    }
    return data.join('\n');
  }
}
```

```js
// PlayCommand
const Queue = require('./Queue');

// ...

// When creating the player, inject your custom queue
const player = client.vulkava.createPlayer({
  guildId: interaction.guild.id,
  voiceChannelId: interaction.member.voice.channelId,
  textChannelId: interaction.channel.id,
  selfDeaf: true,
  queue: new Queue()
});

// ...
```

```js
// Queue details command

// ...

const player = client.vulkava.players.get(interaction.guild.id);
const queueDetails = player.queue.getQueueDetails(0, 10);

interaction.reply(queueDetails);
```