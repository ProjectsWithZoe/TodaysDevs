import { useEffect } from 'react'

const APP_NAME = 'TodaysDevs'

/**
 * Sets document.title = "<title> — TodaysDevs" for the lifetime of the component.
 * Restores the bare app name on unmount.
 */
export function useTitleEffect(title) {
  useEffect(() => {
    document.title = title ? `${title} — ${APP_NAME}` : APP_NAME
    return () => { document.title = APP_NAME }
  }, [title])
}
