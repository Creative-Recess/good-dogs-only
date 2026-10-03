// Dogdex: find by name or nickname, filter by group and by spotted, in a grid of photo tiles.
import { useMemo, useRef } from 'react'
import { breeds, GROUP_COLOUR, groups, spottedInGroup } from '../data/catalogue.ts'
import type { Breed } from '../data/types.ts'
import { searchBreeds } from '../lib/search.ts'
import type { Spot } from '../lib/sightings.ts'
import { Icon } from '../ui/icons.tsx'
import { useShrinkToFit } from '../ui/useShrinkToFit.ts'

type Show = 'all' | 'spotted' | 'unseen'
export type BreedsFilter = { q: string; group: string; show: Show }

type Props = {
  filter: BreedsFilter
  onFilter: (f: BreedsFilter) => void
  spots: Map<string, Spot>
  onOpen: (id: string) => void
}

export function BreedsTab({ filter, onFilter, spots, onOpen }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const list = useMemo(() => {
    let l = breeds
    if (filter.group !== 'all') l = l.filter((b) => b.groupId === filter.group)
    if (filter.show === 'spotted') l = l.filter((b) => spots.has(b.id))
    if (filter.show === 'unseen') l = l.filter((b) => !spots.has(b.id))
    return filter.q.trim() ? searchBreeds(l, filter.q) : l
  }, [filter, spots])
  const set = (patch: Partial<BreedsFilter>) => onFilter({ ...filter, ...patch })

  return (
    <>
      <div className="find">
        <label htmlFor="find">Find:</label>
        <input
          ref={inputRef}
          id="find"
          className="nz"
          type="search"
          value={filter.q}
          onChange={(e) => set({ q: e.target.value })}
          placeholder="Breed or nickname"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="search"
        />
        <button
          type="button"
          className="x"
          aria-label="Clear"
          onClick={() => {
            set({ q: '' })
            inputRef.current?.focus()
          }}
        >
          X
        </button>
        <label htmlFor="group">Group:</label>
        <select id="group" className="nz" value={filter.group} onChange={(e) => set({ group: e.target.value })}>
          <option value="all">All</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name} ({spottedInGroup(g.id, spots)}/{g.total})
            </option>
          ))}
        </select>
      </div>
      <fieldset className="show">
        <legend>Show</legend>
        <div className="show-row">
          {(['all', 'spotted', 'unseen'] as const).map((value) => (
            <div className="field-row" key={value}>
              <input id={`show-${value}`} type="radio" name="show" value={value} checked={filter.show === value} onChange={() => set({ show: value })} />
              <label htmlFor={`show-${value}`}>{value === 'all' ? 'All' : value === 'spotted' ? 'Spotted' : 'Unseen'}</label>
            </div>
          ))}
        </div>
      </fieldset>
      {list.length ? (
        <div className="icons">
          {list.map((b) => (
            <BreedTile key={b.id} breed={b} spotted={spots.has(b.id)} onOpen={onOpen} />
          ))}
        </div>
      ) : filter.q.trim() && (filter.group !== 'all' || filter.show !== 'all') ? (
        // The group or Show filter may be hiding it.
        <div className="empty">
          No <b>{filter.q.trim()}</b> here.
          <br />
          <button type="button" onClick={() => set({ group: 'all', show: 'all' })}>
            Search all breeds
          </button>
        </div>
      ) : filter.q.trim() ? (
        <div className="empty">
          Good Dogs Only cannot find <b>{filter.q.trim()}</b>.
          <br />
          Try a nickname like "staffy", "heeler" or "sausage dog".
        </div>
      ) : (
        <div className="empty">{filter.show === 'spotted' ? 'Nothing spotted here yet. Get to the park!' : 'You have spotted every one of these. Good dog!'}</div>
      )}
    </>
  )
}

function BreedTile({ breed: b, spotted, onOpen }: { breed: Breed; spotted: boolean; onOpen: (id: string) => void }) {
  const label = useRef<HTMLSpanElement>(null)
  const name = b.shortName ?? b.name
  // The odd long word (e.g. "Staffordshire") is wider than a tile: shrink just that label until it fits in two lines.
  useShrinkToFit(label, 10, 7.5, name)
  return (
    <button type="button" className={`icon${spotted ? ' is-spotted' : ''}`} style={{ '--g': GROUP_COLOUR[b.groupId] } as React.CSSProperties} onClick={() => onOpen(b.id)} aria-label={`${b.name}${spotted ? ', spotted' : ''}`}>
      <span className="pic">
        {b.image &&
          (spotted ? (
            <img src={b.image.grid} alt="" loading="lazy" decoding="async" width={60} height={60} />
          ) : (
            // Not spotted yet: "Who's that dog?", the dog's shape against a spotlight, tinted by the theme.
            <span className="sil" aria-hidden="true">
              <span className="sil-glow">
                <span className="sil-dog" style={{ '--mask': `url(${b.image.mask})` } as React.CSSProperties} />
              </span>
            </span>
          ))}
        <span className="no">{b.dexNo}</span>
      </span>
      {spotted && (
        <span className="tick">
          <Icon name="tick" />
        </span>
      )}
      <span className="label" lang="en" ref={label}>
        {name}
      </span>
    </button>
  )
}
