import { useAuth } from '../hooks/useAuth.js'

export function RoleRequirements({ responsibilities }) {
  const { user } = useAuth()

  if (!responsibilities || responsibilities.length === 0) return null

  const roleLabel = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : 'Your role'

  return (
    <section>
      <h3 className="text-sm font-semibold text-slate-700 mb-3">
        Your responsibilities as {roleLabel}
      </h3>
      <ul className="space-y-2">
        {responsibilities.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <label className="flex items-start gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 shrink-0"
              />
              <span className="text-sm text-slate-600 group-hover:text-slate-800 transition-colors leading-relaxed">
                {item}
              </span>
            </label>
          </li>
        ))}
      </ul>
    </section>
  )
}
