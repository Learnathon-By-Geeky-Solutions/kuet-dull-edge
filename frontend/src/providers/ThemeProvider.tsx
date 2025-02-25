'use client';
import { useEffect } from 'react'
import { themeChange } from 'theme-change'



const ThemeProvider = ({children}: Readonly<{children: React.ReactNode}>) => {
    useEffect(() => {
        themeChange(false)
      }, [])
  return (
    children
  )
}

export default ThemeProvider