import type { ThemeName } from '../../types'

export interface ThemeVars {
  '--bg-0': string
  '--bg-1': string
  '--bg-2': string
  '--bg-3': string
  '--bg-4': string
  '--border-0': string
  '--border-1': string
  '--border-2': string
  '--text-0': string
  '--text-1': string
  '--text-2': string
  '--accent': string
  '--accent-dim': string
  '--accent-glow': string
  '--danger': string
  '--success': string
}

export const THEMES: Record<ThemeName, { label: string; vars: ThemeVars }> = {
  google: {
    label: 'Google',
    vars: {
      '--bg-0': '#ffffff', '--bg-1': '#ffffff', '--bg-2': '#f1f3f4', '--bg-3': '#e8eaed', '--bg-4': '#dadce0',
      '--border-0': '#e8eaed', '--border-1': '#dadce0', '--border-2': '#bdc1c6',
      '--text-0': '#202124', '--text-1': '#5f6368', '--text-2': '#80868b',
      '--accent': '#1a73e8', '--accent-dim': 'rgba(26,115,232,0.12)', '--accent-glow': 'rgba(26,115,232,0.24)',
      '--danger': '#ea4335', '--success': '#34a853'
    }
  },
  dark: {
    label: 'Dark',
    vars: {
      '--bg-0': '#0f0f0f', '--bg-1': '#141414', '--bg-2': '#1a1a1a', '--bg-3': '#222', '--bg-4': '#282828',
      '--border-0': '#1e1e1e', '--border-1': '#2a2a2a', '--border-2': '#363636',
      '--text-0': '#e8e8e8', '--text-1': '#a0a0a0', '--text-2': '#606060',
      '--accent': '#4a9eff', '--accent-dim': 'rgba(74,158,255,0.12)', '--accent-glow': 'rgba(74,158,255,0.22)',
      '--danger': '#f05050', '--success': '#3ecf6e'
    }
  },
  light: {
    label: 'Light',
    vars: {
      '--bg-0': '#ffffff', '--bg-1': '#f7f7f8', '--bg-2': '#f0f0f2', '--bg-3': '#e5e5e8', '--bg-4': '#dcdce0',
      '--border-0': '#e5e5e8', '--border-1': '#d0d0d5', '--border-2': '#b8b8bf',
      '--text-0': '#1a1a1a', '--text-1': '#5a5a60', '--text-2': '#8a8a90',
      '--accent': '#1a73e8', '--accent-dim': 'rgba(26,115,232,0.12)', '--accent-glow': 'rgba(26,115,232,0.22)',
      '--danger': '#d93025', '--success': '#1e8e3e'
    }
  },
  midnight: {
    label: 'Midnight Blue',
    vars: {
      '--bg-0': '#0a0f1e', '--bg-1': '#0f1628', '--bg-2': '#141e34', '--bg-3': '#1b2846', '--bg-4': '#233358',
      '--border-0': '#182340', '--border-1': '#243356', '--border-2': '#334775',
      '--text-0': '#e6ecff', '--text-1': '#9fb0d4', '--text-2': '#5f7195',
      '--accent': '#5b8cff', '--accent-dim': 'rgba(91,140,255,0.14)', '--accent-glow': 'rgba(91,140,255,0.28)',
      '--danger': '#ff6470', '--success': '#4ade80'
    }
  },
  dracula: {
    label: 'Dracula',
    vars: {
      '--bg-0': '#282a36', '--bg-1': '#2d2f3f', '--bg-2': '#343746', '--bg-3': '#3d4054', '--bg-4': '#464a60',
      '--border-0': '#343746', '--border-1': '#44475a', '--border-2': '#565a72',
      '--text-0': '#f8f8f2', '--text-1': '#bcc1d4', '--text-2': '#6272a4',
      '--accent': '#bd93f9', '--accent-dim': 'rgba(189,147,249,0.15)', '--accent-glow': 'rgba(189,147,249,0.28)',
      '--danger': '#ff5555', '--success': '#50fa7b'
    }
  },
  nord: {
    label: 'Nord',
    vars: {
      '--bg-0': '#2e3440', '--bg-1': '#343b4a', '--bg-2': '#3b4252', '--bg-3': '#434c5e', '--bg-4': '#4c566a',
      '--border-0': '#3b4252', '--border-1': '#4c566a', '--border-2': '#5d6b83',
      '--text-0': '#eceff4', '--text-1': '#d8dee9', '--text-2': '#8892a6',
      '--accent': '#88c0d0', '--accent-dim': 'rgba(136,192,208,0.15)', '--accent-glow': 'rgba(136,192,208,0.3)',
      '--danger': '#bf616a', '--success': '#a3be8c'
    }
  },
  sepia: {
    label: 'Sepia',
    vars: {
      '--bg-0': '#f4ecd8', '--bg-1': '#ede3c7', '--bg-2': '#e5d9b6', '--bg-3': '#ddcfa4', '--bg-4': '#d3c393',
      '--border-0': '#ddcfa4', '--border-1': '#c9b98a', '--border-2': '#a89875',
      '--text-0': '#3b2f1a', '--text-1': '#6a5a3a', '--text-2': '#9a8760',
      '--accent': '#a0522d', '--accent-dim': 'rgba(160,82,45,0.13)', '--accent-glow': 'rgba(160,82,45,0.25)',
      '--danger': '#9b3626', '--success': '#4a7a3a'
    }
  },
  ocean: {
    label: 'Ocean',
    vars: {
      '--bg-0': '#061c21', '--bg-1': '#0a262d', '--bg-2': '#0f323b', '--bg-3': '#143f4a', '--bg-4': '#1b4d5a',
      '--border-0': '#0f323b', '--border-1': '#1b4d5a', '--border-2': '#286675',
      '--text-0': '#e0f2f4', '--text-1': '#8fb5bd', '--text-2': '#4f7680',
      '--accent': '#3ec1d3', '--accent-dim': 'rgba(62,193,211,0.14)', '--accent-glow': 'rgba(62,193,211,0.28)',
      '--danger': '#ff7272', '--success': '#5fe39f'
    }
  },
  forest: {
    label: 'Forest',
    vars: {
      '--bg-0': '#0f1a11', '--bg-1': '#142218', '--bg-2': '#1b2c20', '--bg-3': '#23382a', '--bg-4': '#2c4535',
      '--border-0': '#1b2c20', '--border-1': '#2c4535', '--border-2': '#3f5d4a',
      '--text-0': '#e3ecde', '--text-1': '#a6bba1', '--text-2': '#647c63',
      '--accent': '#7fc77f', '--accent-dim': 'rgba(127,199,127,0.14)', '--accent-glow': 'rgba(127,199,127,0.26)',
      '--danger': '#e87878', '--success': '#b3e6a0'
    }
  },
  rose: {
    label: 'Rose',
    vars: {
      '--bg-0': '#1f1216', '--bg-1': '#28171c', '--bg-2': '#321c24', '--bg-3': '#3e232c', '--bg-4': '#4b2c36',
      '--border-0': '#321c24', '--border-1': '#4b2c36', '--border-2': '#643c48',
      '--text-0': '#f5e1e8', '--text-1': '#c2a0ad', '--text-2': '#7a5e68',
      '--accent': '#ff6fa5', '--accent-dim': 'rgba(255,111,165,0.14)', '--accent-glow': 'rgba(255,111,165,0.28)',
      '--danger': '#ff5a7a', '--success': '#6fcf97'
    }
  },
  ember: {
    label: 'Ember',
    vars: {
      '--bg-0': '#0a0a0a', '--bg-1': '#121008', '--bg-2': '#1a160f', '--bg-3': '#241d12', '--bg-4': '#2e2516',
      '--border-0': '#1a160f', '--border-1': '#2c2417', '--border-2': '#453621',
      '--text-0': '#f5e9d8', '--text-1': '#bfa385', '--text-2': '#7a6650',
      '--accent': '#ff8c28', '--accent-dim': 'rgba(255,140,40,0.13)', '--accent-glow': 'rgba(255,140,40,0.32)',
      '--danger': '#ff5e1a', '--success': '#ffa84a'
    }
  },
  amber: {
    label: 'Amber',
    vars: {
      '--bg-0': '#1a1410', '--bg-1': '#221a14', '--bg-2': '#2c221a', '--bg-3': '#382c22', '--bg-4': '#46382c',
      '--border-0': '#2c221a', '--border-1': '#46382c', '--border-2': '#5e4a38',
      '--text-0': '#fbe7c2', '--text-1': '#d4a76a', '--text-2': '#8a6a40',
      '--accent': '#ffbe55', '--accent-dim': 'rgba(255,190,85,0.14)', '--accent-glow': 'rgba(255,190,85,0.3)',
      '--danger': '#ff7a55', '--success': '#c4d97a'
    }
  },
  sunset: {
    label: 'Sunset',
    vars: {
      '--bg-0': '#1a0e1f', '--bg-1': '#22132a', '--bg-2': '#2c1a36', '--bg-3': '#382244', '--bg-4': '#462c54',
      '--border-0': '#2c1a36', '--border-1': '#462c54', '--border-2': '#5e3d70',
      '--text-0': '#fce4d6', '--text-1': '#d8a8b8', '--text-2': '#8a6a78',
      '--accent': '#ff7e6a', '--accent-dim': 'rgba(255,126,106,0.14)', '--accent-glow': 'rgba(255,126,106,0.3)',
      '--danger': '#ff556e', '--success': '#ffba7a'
    }
  },
  crimson: {
    label: 'Crimson',
    vars: {
      '--bg-0': '#150708', '--bg-1': '#1d0a0c', '--bg-2': '#260e11', '--bg-3': '#341318', '--bg-4': '#421820',
      '--border-0': '#260e11', '--border-1': '#421820', '--border-2': '#5e2230',
      '--text-0': '#f4dada', '--text-1': '#c08a8a', '--text-2': '#7a5050',
      '--accent': '#e8434f', '--accent-dim': 'rgba(232,67,79,0.14)', '--accent-glow': 'rgba(232,67,79,0.3)',
      '--danger': '#ff7060', '--success': '#7fcf6f'
    }
  },
  arctic: {
    label: 'Arctic',
    vars: {
      '--bg-0': '#f4f8fb', '--bg-1': '#eaf1f7', '--bg-2': '#dde8f0', '--bg-3': '#cfdde8', '--bg-4': '#bccfdd',
      '--border-0': '#dde8f0', '--border-1': '#bccfdd', '--border-2': '#9bb6c8',
      '--text-0': '#0d2230', '--text-1': '#3d5e72', '--text-2': '#7a93a3',
      '--accent': '#0a96d4', '--accent-dim': 'rgba(10,150,212,0.13)', '--accent-glow': 'rgba(10,150,212,0.26)',
      '--danger': '#d93025', '--success': '#1e8e3e'
    }
  },
  monokai: {
    label: 'Monokai',
    vars: {
      '--bg-0': '#272822', '--bg-1': '#2d2e26', '--bg-2': '#34352d', '--bg-3': '#3d3e36', '--bg-4': '#4a4b41',
      '--border-0': '#34352d', '--border-1': '#49483e', '--border-2': '#75715e',
      '--text-0': '#f8f8f2', '--text-1': '#cfcfc2', '--text-2': '#75715e',
      '--accent': '#a6e22e', '--accent-dim': 'rgba(166,226,46,0.14)', '--accent-glow': 'rgba(166,226,46,0.28)',
      '--danger': '#f92672', '--success': '#a6e22e'
    }
  },
  'high-contrast': {
    label: 'High Contrast',
    vars: {
      '--bg-0': '#000000', '--bg-1': '#000000', '--bg-2': '#0a0a0a', '--bg-3': '#141414', '--bg-4': '#1e1e1e',
      '--border-0': '#ffffff', '--border-1': '#ffffff', '--border-2': '#ffffff',
      '--text-0': '#ffffff', '--text-1': '#f0f0f0', '--text-2': '#c0c0c0',
      '--accent': '#ffff00', '--accent-dim': 'rgba(255,255,0,0.2)', '--accent-glow': 'rgba(255,255,0,0.4)',
      '--danger': '#ff4040', '--success': '#40ff40'
    }
  }
}

export function applyTheme(name: string, accentOverride?: string) {
  const theme = THEMES[name as ThemeName] ?? THEMES.dark
  const root = document.documentElement
  for (const [k, v] of Object.entries(theme.vars)) {
    root.style.setProperty(k, v)
  }
  if (accentOverride) {
    root.style.setProperty('--accent', accentOverride)
    root.style.setProperty('--accent-dim', hexToRgba(accentOverride, 0.14))
    root.style.setProperty('--accent-glow', hexToRgba(accentOverride, 0.28))
  }
}

function hexToRgba(hex: string, a: number): string {
  const m = hex.replace('#', '')
  const full = m.length === 3 ? m.split('').map(c => c + c).join('') : m
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${a})`
}
