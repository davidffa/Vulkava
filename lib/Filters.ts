import {
  ChannelMixOptions,
  DistortionOptions,
  FilterOptions,
  KaraokeOptions,
  LowPassOptions,
  RotationOptions,
  TimescaleOptions,
  TremoloOptions,
  VibratoOptions
} from './@types';
import Player from './Player';

export default class Filters {
  private readonly player: Player;

  private options: FilterOptions;

  /**
   * Creates an instance of filters
   * @param player
   */
  constructor(player: Player) {
    this.player = player;
    this.options = {};
  }

  /** Checks if some filter is enabled */
  get enabled(): boolean {
    return !!Object.keys(this.options).length;
  }

  /** Gets a copy of active filters object */
  get active(): FilterOptions {
    return Object.assign({}, this.options);
  }

  /** Sets ChannelMix filter */
  public setChannelMix(options: ChannelMixOptions, apply = true): this {
    if (!options) throw new TypeError('ChannelMixOptions must not be empty!');
    if (typeof options !== 'object' || Array.isArray(options)) throw new TypeError('ChannelMixOptions must be an object.');

    this.options.channelMix = options;
    if (apply) this.apply();
    return this;
  }

  /** Sets Distortion filter */
  public setDistortion(options: DistortionOptions, apply = true): this {
    if (!options) throw new TypeError('DistortionOptions must not be empty!');
    if (typeof options !== 'object' || Array.isArray(options)) throw new TypeError('DistortionOptions must be an object.');

    this.options.distortion = options;
    if (apply) this.apply();
    return this;
  }

  /** Sets the Equalizer */
  public setEqualizer(options: number[], apply = true): this {
    if (!options) throw new TypeError('Equalizer must not be empty!');
    if (typeof options !== 'object' || !Array.isArray(options)) throw new TypeError('Equalizer must be an Array.');
    if (options.length > 15) throw new RangeError('Equalizer Array size must be less or equal than 15');

    this.options.equalizer = options;
    if (apply) this.apply();
    return this;
  }

  /** Sets Karaoke filter */
  public setKaraoke(options: KaraokeOptions, apply = true): this {
    if (!options) throw new TypeError('KaraokeOptions must not be empty!');
    if (typeof options !== 'object' || Array.isArray(options)) throw new TypeError('KaraokeOptions must be an object.');

    this.options.karaoke = options;
    if (apply) this.apply();
    return this;
  }

  /** Sets LowPass filter */
  public setLowPass(options: LowPassOptions, apply = true): this {
    if (!options) throw new TypeError('LowPassOptions must not be empty!');
    if (typeof options !== 'object' || Array.isArray(options)) throw new TypeError('LowPassOptions must be an object.');

    this.options.lowPass = options;
    if (apply) this.apply();
    return this;
  }

  /** Sets rotation filter */
  public setRotation(options: RotationOptions, apply = true): this {
    if (!options) throw new TypeError('RotationOptions must not be empty!');
    if (typeof options !== 'object' || Array.isArray(options)) throw new TypeError('RotationOptions must be an object.');

    this.options.rotation = options;
    if (apply) this.apply();
    return this;
  }

  /** Sets timescale filter */
  public setTimescale(options: TimescaleOptions, apply = true): this {
    if (!options) throw new TypeError('TimescaleOptions must not be empty!');
    if (typeof options !== 'object' || Array.isArray(options)) throw new TypeError('TimescaleOptions must be an object.');

    this.options.timescale = options;
    if (apply) this.apply();
    return this;
  }

  /** Sets Tremolo filter */
  public setTremolo(options: TremoloOptions, apply = true): this {
    if (!options) throw new TypeError('TremoloOptions must not be empty!');
    if (typeof options !== 'object' || Array.isArray(options)) throw new TypeError('TremoloOptions must be an object.');

    this.options.tremolo = options;
    if (apply) this.apply();
    return this;
  }

  /** Sets Vibrato filter */
  public setVibrato(options: VibratoOptions, apply = true): this {
    if (!options) throw new TypeError('VibratoOptions must not be empty!');
    if (typeof options !== 'object' || Array.isArray(options)) throw new TypeError('VibratoOptions must be an object.');

    this.options.vibrato = options;
    if (apply) this.apply();
    return this;
  }

  /** Sets all filters */
  public set(filters: FilterOptions): void {
    this.options = {};

    for (const [filter, config] of Object.entries(filters)) {
      if (!['channelMix', 'distortion', 'equalizer', 'karaoke', 'lowPass', 'rotation', 'timescale', 'tremolo', 'vibrato'].includes(filter)) continue;
      this.options[filter] = config;
    }

    this.apply();
  }

  /** Clears all active filters */
  public clear(): void {
    this.options = {};

    this.player.node.send({
      op: 'filters',
      guildId: this.player.guildId
    });
  }

  /** Sends filters payload to Lavalink Node */
  public apply(): void {
    const payload = {
      op: 'filters',
      guildId: this.player.guildId
    };

    Object.assign(payload, this.options);

    if (this.options.equalizer) { Object.assign(payload, { equalizer: this.options.equalizer.map((gain, band) => ({ band, gain })) }); }

    this.player.node.send(payload);
  }
}