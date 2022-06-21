import Filters from './lib/Filters';
import Node, { NodeState } from './lib/Node';
import Player, { ConnectionState } from './lib/Player';
import Track from './lib/Track';
import UnresolvedTrack from './lib/UnresolvedTrack';
import { Vulkava } from './lib/Vulkava';
import { AbstractExternalSource } from './lib/sources/AbstractExternalSource';
import { AbstractQueue } from './lib/queue/AbstractQueue';

import type {
  NodeOptions,
  SearchResult,
  SEARCH_SOURCE,
} from './lib/@types';

import { version } from './package.json';

const VERSION = version;

export {
  Filters,
  Node,
  Player,
  Track,
  UnresolvedTrack,
  Vulkava,

  AbstractQueue,
  AbstractExternalSource,

  NodeState,
  ConnectionState,

  SearchResult,
  SEARCH_SOURCE,
  NodeOptions,

  VERSION
};