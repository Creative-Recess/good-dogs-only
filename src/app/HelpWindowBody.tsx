// The Help window's contents: about the app, its theme, how to add it to the Home Screen, and saving or restoring a backup.
import { useRef } from 'react'
import { groupById, TOTAL } from '../data/catalogue.ts'
import { backupFile, importBackup, markBackedUp } from '../lib/backup.ts'
import { formatDay } from '../lib/dates.ts'
import { currentPlatform } from '../lib/platform.ts'
import type { Sighting } from '../lib/sightings.ts'
import { setTheme, useTheme } from '../theme/store.ts'
import { THEMES } from '../theme/themes.ts'
import { Icon } from '../ui/icons.tsx'
import { useDialog } from './dialogs.ts'

/** Running from the Home Screen icon rather than a Safari tab. */
const standalone = () => matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true

export function HelpWindowBody({ lastBackup, sightings }: { lastBackup: string | null; sightings: Sighting[] }) {
  const ask = useDialog()
  const theme = useTheme()
  const fileRef = useRef<HTMLInputElement>(null)
  const bonus = groupById.get('bonus')?.total ?? 0

  const save = async () => {
    // Built synchronously so the share sheet opens straight from the tap (iOS requires it).
    const { file, count } = backupFile(sightings)
    try {
      if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: 'Good Dogs Only backup' })
      else {
        // No share sheet (e.g. a desktop browser): download the file instead.
        const url = URL.createObjectURL(file)
        const a = document.createElement('a')
        a.href = url
        a.download = file.name
        a.click()
        setTimeout(() => URL.revokeObjectURL(url), 1000)
      }
    } catch (e) {
      if ((e as Error).name === 'AbortError') return // closed the share sheet
      ask({ title: 'Save Backup', text: "The backup couldn't be saved. Please try again.", icon: 'warn' })
      return
    }
    await markBackedUp()
    ask({ title: 'Save Backup', text: `Backup saved with ${count} ${count === 1 ? 'breed' : 'breeds'}.`, icon: 'info' })
  }

  const restore = async (file: File) => {
    try {
      const changed = await importBackup(await file.text())
      ask({ title: 'Restore Backup', text: changed ? 'Backup restored. Your spots are merged, so nothing is lost.' : 'Everything in that backup is already here.', icon: 'info' })
    } catch (e) {
      ask({ title: 'Restore Backup', text: (e as Error).message, icon: 'warn' })
    }
  }

  return (
    <>
      <fieldset className="panel-box">
        <legend>About</legend>
        <div className="about-head">
          <b>Good Dogs Only</b>
          <span>Version 1.0</span>
        </div>
        <p>
          {TOTAL} breeds: all {TOTAL - bonus} recognised by Dogs Australia (checked 1 Oct 2026), plus {bonus} popular dogs it doesn't, in their own Bonus group.
        </p>
      </fieldset>
      <fieldset className="panel-box">
        <legend>Theme</legend>
        <div className="stack theme-list">
          {THEMES.map((t) => (
            <div className="field-row" key={t.id}>
              <input id={`theme-${t.id}`} type="radio" name="theme" value={t.id} checked={theme === t.id} onChange={() => setTheme(t.id)} />
              <label htmlFor={`theme-${t.id}`}>{t.label}</label>
            </div>
          ))}
        </div>
      </fieldset>
      <fieldset className="panel-box">
        <legend>Add to Home Screen</legend>
        {standalone() ? (
          <p>Done: you're using Good Dogs Only from your Home Screen.</p>
        ) : (
          <HomeScreenSteps />
        )}
      </fieldset>
      <fieldset className="panel-box">
        <legend>Backup</legend>
        <p>Save a backup now and then so a lost or new phone doesn't mean a lost dex.</p>
        <div className="warn">
          <Icon name={lastBackup ? 'disk' : 'warn'} />
          <span>Last backup: {lastBackup ? formatDay(lastBackup) : 'never'}</span>
        </div>
        <div className="stack">
          <button type="button" className="default" onClick={() => void save()}>
            Save Backup...
          </button>
          <button type="button" onClick={() => fileRef.current?.click()}>
            Restore Backup...
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            data-testid="restore-file"
            onChange={(e) => {
              const f = e.target.files?.[0]
              e.target.value = ''
              if (f) void restore(f)
            }}
          />
        </div>
      </fieldset>
    </>
  )
}

/** How to add the app to the Home Screen on this kind of phone. */
function HomeScreenSteps() {
  const platform = currentPlatform()
  return (
    <ol>
      {platform === 'ios' && (
        <li>
          Tap <b>Share</b>, then <b>Add to Home Screen</b>
        </li>
      )}
      {platform === 'android' && (
        <li>
          Open the browser menu <b>⋮</b>, then <b>Add to Home screen</b> or <b>Install app</b>
        </li>
      )}
      {platform === 'other' && (
        <li>
          On a phone, use the browser's <b>Add to Home Screen</b>. On a computer, look for <b>Install</b> in the address bar or browser menu
        </li>
      )}
      <li>Open it from the new icon. It runs full screen, like an app.</li>
    </ol>
  )
}
