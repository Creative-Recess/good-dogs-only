/** One icon: inner SVG markup on a square grid of `size` units. Hand-written, static strings only. */
export type IconDef = { size: number; d: string }

export type IconName =
  | 'eyes' | 'bigPaw' | 'infoBig' | 'warn' | 'tick' | 'disk'
  | 'tHeart' | 'tShield' | 'tBall' | 'tBulb' | 'tBolt' | 'tMoon'
  | 'tHand' | 'tEye' | 'tCrook' | 'tLock' | 'tCrown' | 'tDoor'
  | 'tCap' | 'tHouse' | 'tCompass' | 'tCloud' | 'tbDogdex' | 'tbPark'
  | 'tbProgress' | 'fLife' | 'bone'
  | 'wFeather' | 'wLight' | 'wMiddle' | 'wCruiser' | 'wHeavy' | 'wSuper'
/** Every theme's icon set must draw every icon. */
export type IconSet = Record<IconName, IconDef>
