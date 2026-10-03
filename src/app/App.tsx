// Good Dogs Only: one full-screen window with three screens (tabs in Windows 98, a toolbar in the Aqua themes),
// plus the breed window on top. Help is behind the ? in the title bar, in a window of its own.
import { useLiveQuery } from 'dexie-react-hooks'
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { breedById } from '../data/catalogue.ts'
import { LAST_BACKUP } from '../lib/backup.ts'
import { db, toSpots } from '../lib/sightings.ts'
import { useTheme } from '../theme/store.ts'
import { isAquaFamily } from '../theme/themes.ts'
import { Icon } from '../ui/icons.tsx'
import { AquaIconDefs } from '../ui/icons/AquaIconDefs.tsx'
import type { IconName } from '../ui/icons/types.ts'
import { BreedsTab, type BreedsFilter } from './BreedsTab.tsx'
import { BreedWindow, type Folds } from './BreedWindow.tsx'
import { Dialog } from './dialog.tsx'
import { DialogContext, type DialogSpec } from './dialogs.ts'
import { HelpWindow } from './HelpWindow.tsx'
import { Launch } from './Launch.tsx'
import { ParkView } from './ParkView.tsx'
import { ProgressTab } from './ProgressTab.tsx'

type Tab = 'breeds' | 'park' | 'progress'
const TABS: { id: Tab; label: string; icon: IconName }[] = [
  { id: 'breeds', label: 'Dogdex', icon: 'tbDogdex' },
  { id: 'park', label: 'Park', icon: 'tbPark' },
  { id: 'progress', label: 'Progress', icon: 'tbProgress' },
]

export default function App() {
  const sightings = useLiveQuery(() => db.sightings.toArray(), [])
  const lastBackup = useLiveQuery(async () => (await db.meta.get(LAST_BACKUP))?.value ?? null, [], null)
  // Only breeds the app knows: a backup from a newer list could mention others.
  const spots = useMemo(() => toSpots((sightings ?? []).filter((s) => breedById.has(s.breedId))), [sightings])

  const [launched, setLaunched] = useState(false)
  const [tab, setTab] = useState<Tab>('breeds')
  const [filter, setFilter] = useState<BreedsFilter>({ q: '', group: 'all', show: 'all' })
  const [detail, setDetail] = useState<string | null>(null)
  const [dialog, setDialog] = useState<DialogSpec | null>(null)
  const [saver, setSaver] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [folds, setFolds] = useState<Folds>({ temperament: true, varieties: true, status: true })
  const theme = useTheme()
  const aqua = isAquaFamily(theme)

  const panelRef = useRef<HTMLDivElement>(null)

  const showTab = (t: Tab) => {
    setDetail(null)
    setHelpOpen(false)
    setTab(t)
  }
  // Arrow keys move between tabs, as in any tab bar.
  const onTabKey = (e: KeyboardEvent, i: number) => {
    const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: TABS.length - 1 }[e.key]
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      showTab(TABS[i].id)
    } else if (next !== undefined) {
      e.preventDefault()
      const t = TABS[(next + TABS.length) % TABS.length]
      showTab(t.id)
      document.getElementById(`tab-${t.id}`)?.focus()
    }
  }
  const onFilter = (f: BreedsFilter) => {
    if (f.group !== filter.group && panelRef.current) panelRef.current.scrollTop = 0
    setFilter(f)
  }
  const onLaunched = useCallback(() => setLaunched(true), [])
  // Opening on the launch screen again resets the window, like closing and reopening a program.
  const close = () => {
    setLaunched(false)
    setDetail(null)
    setHelpOpen(false)
    setTab('breeds')
  }
  const breed = detail ? breedById.get(detail) : undefined

  // The panel's scroll position restarts at the top for each tab.
  useEffect(() => {
    if (panelRef.current) panelRef.current.scrollTop = 0
  }, [tab])

  return (
    <DialogContext.Provider value={setDialog}>
      {aqua && <AquaIconDefs />}
      <div className="stage">
        <div className="app">
          <div className="window main">
            <div className="title-bar">
              <div className="title-bar-text">
                {!aqua && <Icon name="bigPaw" />}
                Good Dogs Only
              </div>
              <div className="title-bar-controls">
                {/* The yellow (or _) button opens the Park as a screensaver. */}
                <button className="minimize" aria-label="Screensaver" onClick={() => setSaver(true)} />
                <button className="close" aria-label="Close" onClick={close} />
                <button
                  className="help"
                  aria-label="Help"
                  onClick={() => {
                    setDetail(null)
                    setHelpOpen(true)
                  }}
                />
              </div>
            </div>
            <div className="window-body">
              <section className="tabs">
                <menu role="tablist" aria-label="Screens">
                  {TABS.map((t, i) => (
                    <li
                      role="tab"
                      key={t.id}
                      id={`tab-${t.id}`}
                      aria-selected={tab === t.id}
                      aria-controls="panel"
                      tabIndex={tab === t.id ? 0 : -1}
                      onClick={() => showTab(t.id)}
                      onKeyDown={(e) => onTabKey(e, i)}
                    >
                      <span className="tab-label">
                        {aqua && <Icon name={t.icon} />}
                        <span>{t.label}</span>
                      </span>
                    </li>
                  ))}
                </menu>
                <div ref={panelRef} id="panel" className={`window panel${tab === 'park' ? ' park-panel' : ''}`} role="tabpanel" aria-label={TABS.find((t) => t.id === tab)!.label}>
                  <div className={`window-body${tab === 'park' ? ' park-body' : ''}`}>
                    {tab === 'breeds' && <BreedsTab filter={filter} onFilter={onFilter} spots={spots} onOpen={setDetail} />}
                    {tab === 'park' && !saver && <ParkView spots={spots} onOpen={setDetail} />}
                    {tab === 'progress' && (
                      <ProgressTab
                        spots={spots}
                        onOpen={setDetail}
                        onGroup={(group) => {
                          setFilter({ q: '', group, show: 'all' })
                          showTab('breeds')
                        }}
                      />
                    )}
                  </div>
                </div>
              </section>
            </div>
          </div>
          {helpOpen && <HelpWindow lastBackup={lastBackup} sightings={sightings} onClose={() => setHelpOpen(false)} />}
          {breed && <BreedWindow key={breed.id} breed={breed} spotted={spots.get(breed.id)} spottedCount={spots.size} onClose={() => setDetail(null)} folds={folds} onFolds={setFolds} />}
          {dialog && <Dialog spec={dialog} onClose={() => setDialog(null)} />}
          {/* Minimise: the Park as a screensaver, full screen, until you tap. */}
          {saver && (
            <div className="saver" role="button" aria-label="Screensaver. Tap to return." tabIndex={0} onClick={() => setSaver(false)} onKeyDown={() => setSaver(false)}>
              <ParkView spots={spots} caption={false} />
            </div>
          )}
          {!launched && <Launch onDone={onLaunched} />}
        </div>
      </div>
    </DialogContext.Provider>
  )
}
