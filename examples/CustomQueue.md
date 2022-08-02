```js
// Queue.js

const { DefaultQueue } = require('vulkava');

module.exports = class Queue extends DefaultQueue {
  constructor() {
    super();
  }

  public peek() {
    return this.tracks[0];
  }

  public removeTrackAt(index: number) {
    this.tracks.splice(index, 1);
  }

  public getTrackAt(index: number) {
    return this.tracks[index];
  }

  public getQueueDetails(pos: number, pos2: number) {
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