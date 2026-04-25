import React, { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()
export const useTheme = () => useContext(ThemeContext)

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('wa-theme')
    return saved || 'system'
  })

  useEffect(() => {
    localStorage.setItem('wa-theme', theme)
    const root = document.documentElement
    if (theme === 'system') {
      const dark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.setAttribute('data-theme', dark ? 'dark' : 'light')
      const handler = (e) => root.setAttribute('data-theme', e.matches ? 'dark' : 'light')
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    } else {
      root.setAttribute('data-theme', theme)
    }
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
