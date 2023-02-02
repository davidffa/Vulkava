"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Filters {
    player;
    options;
    /**
     * Creates an instance of filters
     * @param player
     */
    constructor(player) {
        this.player = player;
        this.options = {};
    }
    /** Checks if some filter is enabled */
    get enabled() {
        return !!Object.keys(this.options).length;
    }
    /** Gets a copy of active filters object */
    get active() {
        return Object.assign({}, this.options);
    }
    /**
     * Sets ChannelMix filter
     * @param options - The channel mix options
     * @param options.leftToLeft - The left to left mix
     * @param options.leftToRight - The left to right mix
     * @param options.rightToLeft - The right to left mix
     * @param options.rightToRight - The right to right mix
     * @param apply - Whether to send filter payload to Lavalink or not
     * @returns The filters instance, for chaining calls
     */
    setChannelMix(options, apply = true) {
        if (options === undefined)
            throw new TypeError('ChannelMixOptions must not be empty!');
        if (typeof options !== 'object' || Array.isArray(options))
            throw new TypeError('ChannelMixOptions must be an object.');
        options === null ? delete this.options.channelMix : this.options.channelMix = options;
        if (apply)
            this.apply();
        return this;
    }
    /**
     * Sets Distortion filter
     * @param options - The distortion options
     * @param options.sinOffset - The sin offset
     * @param options.sinScale - The sin scale
     * @param options.cosOffset - The cos offset
     * @param options.cosScale - The cos scale
     * @param options.tanOffset - The tan offset
     * @param options.tanScale - The tan scale
     * @param options.offset - The offset
     * @param options.scale - The scale
     * @param apply - Whether to send filter payload to Lavalink or not
     * @returns The filters instance, for chaining calls
     */
    setDistortion(options, apply = true) {
        if (options === undefined)
            throw new TypeError('DistortionOptions must not be empty!');
        if (typeof options !== 'object' || Array.isArray(options))
            throw new TypeError('DistortionOptions must be an object.');
        options === null ? delete this.options.distortion : this.options.distortion = options;
        if (apply)
            this.apply();
        return this;
    }
    /**
     * Sets Equalizer filter
     * @param options - The equalizer band array
     * @param apply - Whether to send filter payload to Lavalink or not
     * @returns The filters instance, for chaining calls
     */
    setEqualizer(options, apply = true) {
        if (options === undefined)
            throw new TypeError('Equalizer must not be empty!');
        if (options === null) {
            delete this.options.equalizer;
            if (apply)
                this.apply();
            return this;
        }
        if (typeof options !== 'object' || !Array.isArray(options))
            throw new TypeError('Equalizer must be an Array.');
        if (options.length > 15)
            throw new RangeError('Equalizer Array size must be less or equal than 15');
        this.options.equalizer = options;
        if (apply)
            this.apply();
        return this;
    }
    /**
     * Sets Karaoke filter
     * @param options - The karaoke options
     * @param options.level - The level
     * @param options.monoLevel - The mono level
     * @param options.filterBand - The band to filter
     * @param options.filterWidth - The filter width
     * @param apply - Whether to send filter payload to Lavalink or not
     * @returns The filters instance, for chaining calls
     */
    setKaraoke(options, apply = true) {
        if (options === undefined)
            throw new TypeError('KaraokeOptions must not be empty!');
        if (typeof options !== 'object' || Array.isArray(options))
            throw new TypeError('KaraokeOptions must be an object.');
        options === null ? delete this.options.karaoke : this.options.karaoke = options;
        if (apply)
            this.apply();
        return this;
    }
    /**
     * Sets LowPass filter
     * @param options - The lowpass options
     * @param options.smoothing - The lowpass smoothing
     * @param apply - Whether to send filter payload to Lavalink or not
     * @returns The filters instance, for chaining calls
     */
    setLowPass(options, apply = true) {
        if (options === undefined)
            throw new TypeError('LowPassOptions must not be empty!');
        if (typeof options !== 'object' || Array.isArray(options))
            throw new TypeError('LowPassOptions must be an object.');
        options === null ? delete this.options.lowPass : this.options.lowPass = options;
        if (apply)
            this.apply();
        return this;
    }
    /**
     * Sets Rotation filter
     * @param options - The rotation options
     * @param options.rotationHz - The rotation speed, in Hertz
     * @param apply - Whether to send filter payload to Lavalink or not
     * @returns The filters instance, for chaining calls
     */
    setRotation(options, apply = true) {
        if (options === undefined)
            throw new TypeError('RotationOptions must not be empty!');
        if (typeof options !== 'object' || Array.isArray(options))
            throw new TypeError('RotationOptions must be an object.');
        options === null ? delete this.options.rotation : this.options.rotation = options;
        if (apply)
            this.apply();
        return this;
    }
    /**
     * Sets Timescale filter
     * @param options - The timescale options
     * @param options.speed - The speed
     * @param options.rate - The rate
     * @param options.pitch - The pitch
     * @param apply - Whether to send filter payload to Lavalink or not
     * @returns The filters instance, for chaining calls
     */
    setTimescale(options, apply = true) {
        if (options === undefined)
            throw new TypeError('TimescaleOptions must not be empty!');
        if (typeof options !== 'object' || Array.isArray(options))
            throw new TypeError('TimescaleOptions must be an object.');
        options === null ? delete this.options.timescale : this.options.timescale = options;
        if (apply)
            this.apply();
        return this;
    }
    /**
     * Sets Tremolo filter
     * @param options - The tremolo options
     * @param options.frequency - The frequency 0 < f ≤ 14
     * @param options.depth - The depth 0 < d ≤ 1
     * @param apply - Whether to send filter payload to Lavalink or not
     * @returns The filters instance, for chaining calls
     */
    setTremolo(options, apply = true) {
        if (options === undefined)
            throw new TypeError('TremoloOptions must not be empty!');
        if (typeof options !== 'object' || Array.isArray(options))
            throw new TypeError('TremoloOptions must be an object.');
        options === null ? delete this.options.tremolo : this.options.tremolo = options;
        if (apply)
            this.apply();
        return this;
    }
    /**
     * Sets Vibrato filter
     * @param options - The vibrato options
     * @param options.frequency - The frequency 0 < f ≤ 14
     * @param options.depth - The depth 0 < d ≤ 1
     * @param apply - Whether to send filter payload to Lavalink or not
     * @returns The filters instance, for chaining calls
     */
    setVibrato(options, apply = true) {
        if (options === undefined)
            throw new TypeError('VibratoOptions must not be empty!');
        if (typeof options !== 'object' || Array.isArray(options))
            throw new TypeError('VibratoOptions must be an object.');
        options === null ? delete this.options.vibrato : this.options.vibrato = options;
        if (apply)
            this.apply();
        return this;
    }
    /**
     * Sets the volume
     * @param vol - The volume to set [0,500]
     * @param apply - Whether to send filter payload to Lavalink or not
     * @returns The filters instance, for chaining calls
     */
    setVolume(vol, apply = true) {
        if (typeof vol !== 'number')
            throw new TypeError('Volume must be an number.');
        if (vol < 0 || vol > 500)
            throw new TypeError('Volume must be an number between 0 and 500.');
        if (vol === 100)
            delete this.options.volume;
        else
            this.options.volume = vol / 100;
        if (apply)
            this.apply();
        return this;
    }
    /** Sets all filters */
    set(filters) {
        this.options = {};
        for (const [filter, config] of Object.entries(filters)) {
            if (!['channelMix', 'distortion', 'equalizer', 'karaoke', 'lowPass', 'rotation', 'timescale', 'tremolo', 'volume', 'vibrato'].includes(filter))
                continue;
            if (filter === 'volume')
                this.options[filter] = config / 100;
            else
                this.options[filter] = config;
        }
        this.apply();
    }
    /** Clears all active filters */
    clear() {
        this.options = {};
        if (this.player.node?.options.transport === 'rest') {
            this.player.node?.rest.updatePlayer(this.player.guildId, { filters: {} });
            return;
        }
        this.player.node?.send({
            op: 'filters',
            guildId: this.player.guildId
        });
    }
    /** Sends filters payload to Lavalink Node */
    apply() {
        if (this.player.node?.options.transport === 'rest') {
            const payload = this.options;
            if (this.options.equalizer) {
                Object.assign(payload, { equalizer: this.options.equalizer.map((gain, band) => ({ band, gain })) });
            }
            this.player.node?.rest.updatePlayer(this.player.guildId, this.options);
            return;
        }
        const payload = {
            op: 'filters',
            guildId: this.player.guildId
        };
        Object.assign(payload, this.options);
        if (this.options.equalizer) {
            Object.assign(payload, { equalizer: this.options.equalizer.map((gain, band) => ({ band, gain })) });
        }
        this.player.node?.send(payload);
    }
}
exports.default = Filters;
