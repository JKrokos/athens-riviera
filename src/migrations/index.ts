import * as migration_20260809_110854_initial from './20260809_110854_initial';
import * as migration_20260903_000705_add_area_gallery from './20260903_000705_add_area_gallery';

export const migrations = [
  {
    up: migration_20260809_110854_initial.up,
    down: migration_20260809_110854_initial.down,
    name: '20260809_110854_initial',
  },
  {
    up: migration_20260903_000705_add_area_gallery.up,
    down: migration_20260903_000705_add_area_gallery.down,
    name: '20260903_000705_add_area_gallery'
  },
];
