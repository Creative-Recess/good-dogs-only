// Progress: the overall count, a row per group, and the most recent spots.
import { breedById, GROUP_COLOUR, groups, spottedInGroup, TOTAL } from '../data/catalogue.ts'
import { formatDay } from '../lib/dates.ts'
import { newestFirst, type Spot } from '../lib/sightings.ts'
import { ProgressBar } from './ProgressBar.tsx'

/** Whole percent, but never 0% once one is spotted or 100% until they all are. */
const percent = (k: number, total: number) => `${k === 0 ? 0 : k === total ? 100 : Math.min(99, Math.max(1, Math.round((k / total) * 100)))}%`

type Props = { spots: Map<string, Spot>; onGroup: (groupId: string) => void; onOpen: (id: string) => void }

export function ProgressTab({ spots, onGroup, onOpen }: Props) {
  const n = spots.size
  const recent = [...spots.values()].sort(newestFirst).slice(0, 6)
  return (
    <>
      <div className="big-progress">
        <span className="figure">
          {n} of {TOTAL} breeds
        </span>
        <ProgressBar fraction={n / TOTAL} label="Breeds spotted" />
      </div>
      <div className="sunken-panel group-list">
        {groups.map((g) => {
          const k = spottedInGroup(g.id, spots)
          return (
            <button type="button" className="g-row" key={g.id} onClick={() => onGroup(g.id)} aria-label={`${g.name}: ${k} of ${g.total} spotted, ${percent(k, g.total)}`}>
              <span className="g-top">
                <span>
                  <span className="swatch" style={{ background: GROUP_COLOUR[g.id] }} />
                  {g.name}
                </span>
                <span>{percent(k, g.total)}</span>
              </span>
            </button>
          )
        })}
      </div>
      <p className="section-title">Recently spotted</p>
      <div className="sunken-panel">
        {recent.length ? (
          <table className="interactive">
            <colgroup>
              <col />
              <col style={{ width: 64 }} />
            </colgroup>
            <thead>
              <tr>
                <th>Breed</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((s) => {
                const b = breedById.get(s.breedId)
                if (!b) return null
                return (
                  <tr
                    className="recent-row"
                    key={s.breedId}
                    tabIndex={0}
                    aria-label={`${b.name}, spotted ${formatDay(s.firstSeen)}`}
                    onClick={() => onOpen(b.id)}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onOpen(b.id))}
                  >
                    <td>
                      {b.image && <img src={b.image.grid} alt="" />}
                      {b.name}
                    </td>
                    <td>{formatDay(s.firstSeen, false)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <p className="recent-empty">Nothing spotted yet. Get to the park!</p>
        )}
      </div>
    </>
  )
}
