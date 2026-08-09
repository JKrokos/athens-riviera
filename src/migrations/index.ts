import * as migration_20260809_110854_initial from './20260809_110854_initial';

export const migrations = [
  {
    up: migration_20260809_110854_initial.up,
    down: migration_20260809_110854_initial.down,
    name: '20260809_110854_initial'
  },
];
