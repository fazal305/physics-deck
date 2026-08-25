/**
 * Matter.js collision categories are bitmasks (max 32). We keep a small fixed
 * set so filtering stays cheap and predictable.
 */
export const CATEGORY = {
  DEFAULT: 0x0001,
  WALL: 0x0002,
  PLAYER: 0x0004,
  ENEMY: 0x0008,
  PROJECTILE: 0x0010,
  ENVIRONMENT: 0x0020,
  HAZARD: 0x0040,
}
