export function ProjectFilters({ filters, onChange }) {
  const selectClass = 'field-input py-1.5 text-xs pr-7 w-full'

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <label className="flex items-center gap-1.5">
        <span className="text-xs text-slate-500 whitespace-nowrap">Difficulty</span>
        <select
          className={selectClass}
          value={filters.difficulty}
          onChange={e => onChange({ ...filters, difficulty: e.target.value, offset: 0 })}
        >
          <option value="">All</option>
          <option value="junior">Junior</option>
          <option value="mid">Mid</option>
          <option value="senior">Senior</option>
        </select>
      </label>

      <label className="flex items-center gap-1.5">
        <span className="text-xs text-slate-500 whitespace-nowrap">Type</span>
        <select
          className={selectClass}
          value={filters.type}
          onChange={e => onChange({ ...filters, type: e.target.value, offset: 0 })}
        >
          <option value="">All</option>
          <option value="solo">Solo</option>
          <option value="duo">Duo</option>
          <option value="team">Team</option>
        </select>
      </label>
    </div>
  )
}
