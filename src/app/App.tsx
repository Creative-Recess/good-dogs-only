// Good Dogs Only: one full-screen Windows 98 window with four tabs, plus the breed window on top.
import { useLiveQuery } from 'dexie-react-hooks'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { breedById } from '../data/catalogue.ts'
import { LAST_BACKUP } from '../lib/backup.ts'
import { db, toSpots } from '../lib/sightings.ts'
import { Icon } from '../ui/icons.tsx'
import { BreedsTab, type BreedsFilter } from './BreedsTab.tsx'
import { BreedWindow } from './BreedWindow.tsx'
import { Dialog } from './dialog.tsx'
import { DialogContext, type DialogSpec } from './dialogs.ts'
import { HelpTab } from './HelpTab.tsx'
import { Launch } from './Launch.tsx'
import { ParkView } from './ParkView.tsx'
import { ProgressTab } from './ProgressTab.tsx'

type Tab = 'breeds' | 'park' | 'progress' | 'help'
const TABS: { id: Tab; label: string }[] = [
  { id: 'breeds', label: 'Breeds' },
  { id: 'park', label: 'Park' },
  { id: 'progress', label: 'Progress' },
  { id: 'help', label: 'Help' },
]

export default function App() {
  const sightings = useLiveQuery(() => db.sightings.toArray(), [])
  const lastBackup = useLiveQuery(async () => (await db.meta.get(LAST_BACKUP))?.value ?? null, [], null)
  const spots = useMemo(() => toSpots(sightings ?? []), [sightings])

  const [launched, setLaunched] = useState(false)
  const [tab, setTab] = useState<Tab>('breeds')
  const [filter, setFilter] = useState<BreedsFilter>({ q: '', group: 'all', show: 'all' })
  const [detail, setDetail] = useState<string | null>(null)
  const [dialog, setDialog] = useState<DialogSpec | null>(null)
  const [saver, setSaver] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const showTab = (t: Tab) => {
    setDetail(null)
    setTab(t)
    if (panelRef.current) panelRef.current.scrollTop = 0
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
    setTab('breeds')
  }
  const breed = detail ? breedById.get(detail) : undefined

  // The panel's scroll position restarts at the top for each tab.
  useEffect(() => {
    if (panelRef.current) panelRef.current.scrollTop = 0
  }, [tab])

  return (
    <DialogContext.Provider value={setDialog}>
      <div className="stage">
        <div className="app98">
          <div className="window main">
            <div className="title-bar">
              <div className="title-bar-text">
                <Icon name="bigPaw" />
                Good Dogs Only
              </div>
              <div className="title-bar-controls">
                <button aria-label="Minimize" title="Screensaver" onClick={() => setSaver(true)} />
                <button aria-label="Close" onClick={close} />
              </div>
            </div>
            <div className="window-body">
              <section className="tabs">
                <menu role="tablist" aria-label="Screens">
                  {TABS.map((t) => (
                    <li role="tab" key={t.id} aria-selected={tab === t.id} aria-controls="panel" onClick={() => showTab(t.id)}>
                      <button type="button">{t.label}</button>
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
                    {tab === 'help' && <HelpTab lastBackup={lastBackup} />}
                  </div>
                </div>
              </section>
            </div>
          </div>
          {breed && <BreedWindow key={breed.id} breed={breed} spotted={spots.get(breed.id)} spottedCount={spots.size} onClose={() => setDetail(null)} />}
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
