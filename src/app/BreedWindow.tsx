// The breed window: photo, names, temperament and whether you've spotted it.
import { useRef, useState } from 'react'
import { GROUP_COLOUR, groupById, TOTAL } from '../data/catalogue.ts'
import type { Breed } from '../data/types.ts'
import { formatDay } from '../lib/dates.ts'
import { spot, unsee, type Spot } from '../lib/sightings.ts'
import { Icon } from '../ui/icons.tsx'
import { TRAIT_ICON } from '../ui/traitIcons.ts'
import { useModal } from '../ui/useModal.ts'
import { useShrinkToFit } from '../ui/useShrinkToFit.ts'
import { useTheme } from '../theme/store.ts'
import { isAquaFamily } from '../theme/themes.ts'
import { useDialog } from './dialogs.ts'
import { NoteField } from './NoteField.tsx'
import { Section } from './Section.tsx'

/** Which fold-away sections are open (Aqua). They stay as you left them as you move between breeds. */
export type Folds = { temperament: boolean; varieties: boolean; status: boolean }

type Props = { breed: Breed; spotted: Spot | undefined; spottedCount: number; onClose: () => void; folds: Folds; onFolds: (f: Folds) => void }

export function BreedWindow({ breed: b, spotted, spottedCount, onClose, folds, onFolds }: Props) {
  const ask = useDialog()
  const aqua = isAquaFamily(useTheme())
  const fold = (key: keyof Folds) => ({ open: folds[key], onToggle: (open: boolean) => onFolds({ ...folds, [key]: open }) })
  const title = useRef<HTMLSpanElement>(null)
  // Title text is 11px in Windows 98 and 13px in the Aqua themes; shrink long names to fit either.
  useShrinkToFit(title, aqua ? 13 : 11, 8, b.name)
  const windowRef = useRef<HTMLDivElement>(null)
  useModal(windowRef, onClose)
  const [saving, setSaving] = useState(false)
  const group = groupById.get(b.groupId)!
  // Nicknames, short forms included (Cavalier, Bichon); only one that's simply the breed's name is left out.
  const aka = b.aliases.filter((a) => a.toLowerCase() !== b.name.toLowerCase()).slice(0, 4)
  const [fx, fy] = b.image?.focus ?? [0.5, 0.5]

  const onSpot = async () => {
    // Ignore a double tap while the first one is saving.
    if (saving) return
    setSaving(true)
    await spot(b.id)
    setSaving(false)
    // Aqua's sheet shows the dog itself; Windows 98's message box keeps it plain.
    if (aqua) ask({ title: `${b.name} spotted`, text: `That's ${spottedCount + 1} of ${TOTAL} breeds.`, photo: b.image?.grid })
    else ask({ title: 'Spotted', text: `That's ${spottedCount + 1} of ${TOTAL} breeds.` })
  }
  const onUnsee = () =>
    ask({
      title: 'Unsee',
      text: `Remove ${b.name} from your spotted breeds? Its note will be deleted too.`,
      icon: 'warn',
      buttons: [{ label: 'Yes', onClick: () => void unsee(b.id) }, { label: 'No' }],
    })

  return (
    <div className="window props" role="dialog" aria-modal="true" aria-label={b.name} ref={windowRef} tabIndex={-1}>
      <div className="title-bar">
        <div className="title-bar-text one-line">
          {!aqua && <Icon name="bigPaw" />}
          <span ref={title}>{b.name}</span>
        </div>
        <div className="title-bar-controls">
          <button className="close" aria-label="Close" onClick={onClose} />
        </div>
      </div>
      <div className="window-body">
        <div className="photo-frame">
          {b.image && <img src={b.image.detail} alt={b.name} style={{ objectPosition: `${fx * 100}% ${fy * 100}%` }} />}
          <span className="photo-strip">
            <span>
              <span className="swatch" style={{ background: GROUP_COLOUR[b.groupId] }} />
              {group.name}
            </span>
            <span>#{b.dexNo}</span>
          </span>
        </div>
        {(aka.length > 0 || b.officialName || b.ankcUrl) && (
          <div className="title-block">
            {aka.length > 0 && <p>Also called {aka.join(', ')}</p>}
            {b.officialName && <p>Official name: {b.officialName}</p>}
            {b.ankcUrl && (
              <p>
                <a className="standard-link" href={b.ankcUrl} target="_blank" rel="noopener">
                  Official breed standard
                </a>
              </p>
            )}
          </div>
        )}
        {b.parents ? (
          <p className="small">Cross of {b.parents[0]} x {b.parents[1]}. Not recognised by Dogs Australia.</p>
        ) : b.about ? (
          <p className="small">{b.about} Not recognised by Dogs Australia.</p>
        ) : null}
        <Section title="Temperament" className="box" {...fold('temperament')}>
          <div className="chips" lang="en">
            {b.traits.map((t) => (
              <span className="chip" key={t}>
                <span className="chip-icon">
                  <Icon name={TRAIT_ICON[t]} />
                </span>
                {t}
              </span>
            ))}
          </div>
          {aqua && <div className="textbox">{b.text}</div>}
        </Section>
        {!aqua && <div className="textbox">{b.text}</div>}
        {b.forms.length > 0 && (
          <Section title="Varieties" {...fold('varieties')}>
            <div className="forms">
              {b.forms.map((f) => (
                <span key={f}>{f}</span>
              ))}
            </div>
          </Section>
        )}
        <Section title="Status" hint={spotted ? 'Spotted' : undefined} {...fold('status')}>
          {spotted ? (
            <>
              <div className="caught-line">
                <Icon name="eyes" />
                <span>
                  <b>Spotted!</b>First spotted {formatDay(spotted.firstSeen)}
                </span>
              </div>
              <NoteField key={spotted.sightingId} sightingId={spotted.sightingId} note={spotted.note} />
              <button type="button" onClick={onUnsee}>
                Unsee
              </button>
            </>
          ) : (
            <button type="button" className="catch-btn default" onClick={onSpot} disabled={saving}>
              <Icon name="eyes" />
              Spotted
            </button>
          )}
        </Section>
      </div>
    </div>
  )
}
