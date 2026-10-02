import type { Trait } from '../data/types.ts'
import type { IconName } from './icons/types.ts'

/** One icon per trait in the fixed list of 16. */
export const TRAIT_ICON: Record<Trait, IconName> = {
  Affectionate: 'tHeart', Brave: 'tShield', Playful: 'tBall', Clever: 'tBulb', Energetic: 'tBolt', Calm: 'tMoon',
  Friendly: 'tHand', Alert: 'tEye', 'Hard-working': 'tCrook', Loyal: 'tLock', Dignified: 'tCrown', Reserved: 'tDoor',
  Trainable: 'tCap', Protective: 'tHouse', Independent: 'tCompass', Gentle: 'tCloud',
}
