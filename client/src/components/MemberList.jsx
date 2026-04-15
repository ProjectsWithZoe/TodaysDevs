import { CAPACITY }  from '../lib/constants.js'
import { Avatar }    from './Avatar.jsx'
import { RoleBadge } from './RoleBadge.jsx'

export function MemberList({ members, mode }) {
  const capacity = CAPACITY[mode]
  const slots    = Array.from({ length: capacity }, (_, i) => members[i] ?? null)

  return (
    <ul className="space-y-2">
      {slots.map((member, i) => (
        <li
          key={i}
          className={[
            'flex items-center gap-3 px-3 py-2.5 rounded-lg border',
            member
              ? 'bg-white border-slate-200'
              : 'bg-slate-50 border-dashed border-slate-200'
          ].join(' ')}
        >
          {member ? (
            <>
              <Avatar name={member.display_name || member.email} size="sm" />
              <span className="flex-1 text-sm font-medium text-slate-700 truncate">
                {member.display_name || member.email}
              </span>
              {member.role && <RoleBadge role={member.role} />}
            </>
          ) : (
            <>
              <span className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 text-xs shrink-0">
                ?
              </span>
              <span className="text-xs text-slate-400 italic">Waiting for player…</span>
            </>
          )}
        </li>
      ))}
    </ul>
  )
}
