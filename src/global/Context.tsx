import * as React from 'react'
import getThemeStyle from './Style'

export type ThemeContextType = {
  setTheme: (arg1: Theme) => void
  theme: Theme
  themeStyle: ThemeStyle
}

export const ThemeContext: React.Context<ThemeContextType> = React.createContext<ThemeContextType>({
  setTheme: () => {},
  theme: 'normal',
  themeStyle: getThemeStyle({
    edgeInsets: { bottom: 0, left: 0, right: 0, top: 0 },
    height: 0,
    theme: 'normal',
    width: 0,
  }),
})
