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
      '--bg-0': '#fbfaf7', '--bg-1': '#f4f2ec', '--bg-2': '#ebe8df', '--bg-3': '#dfdbd0', '--bg-4': '#cec9bc',
      '--border-0': '#e5e1d5', '--border-1': '#cdc7b6', '--border-2': '#a89f88',
      '--text-0': '#1f1d18', '--text-1': '#5b574c', '--text-2': '#8c8674',
      '--accent': '#5b6cff', '--accent-dim': 'rgba(91,108,255,0.13)', '--accent-glow': 'rgba(91,108,255,0.26)',
      '--danger': '#c2362b', '--success': '#2d8f4a'
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
      '--bg-0': '#031f24', '--bg-1': '#062b30', '--bg-2': '#073a3e', '--bg-3': '#0a4b4d', '--bg-4': '#0e5e5d',
      '--border-0': '#0a3b3e', '--border-1': '#0e5b5d', '--border-2': '#157a78',
      '--text-0': '#d6f8f5', '--text-1': '#7fc7be', '--text-2': '#3f8079',
      '--accent': '#22d3ee', '--accent-dim': 'rgba(34,211,238,0.14)', '--accent-glow': 'rgba(34,211,238,0.32)',
      '--danger': '#ff8266', '--success': '#34e3a1'
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
      '--accent': '#ff4500', '--accent-dim': 'rgba(255,69,0,0.13)', '--accent-glow': 'rgba(255,69,0,0.32)',
      '--danger': '#ff5e1a', '--success': '#ffa84a'
    }
  },
  amber: {
    label: 'Amber',
    vars: {
      '--bg-0': '#fdf6e7', '--bg-1': '#f6ebcf', '--bg-2': '#eedfb3', '--bg-3': '#e3d098', '--bg-4': '#d3bc7e',
      '--border-0': '#e8d8a8', '--border-1': '#c8ad6b', '--border-2': '#9a8447',
      '--text-0': '#3a2a0d', '--text-1': '#6e5424', '--text-2': '#a08658',
      '--accent': '#d97706', '--accent-dim': 'rgba(217,119,6,0.13)', '--accent-glow': 'rgba(217,119,6,0.28)',
      '--danger': '#b53b1f', '--success': '#5b8b1b'
    }
  },
  sunset: {
    label: 'Sunset',
    vars: {
      '--bg-0': '#1a0d05', '--bg-1': '#241208', '--bg-2': '#30180b', '--bg-3': '#3f200f', '--bg-4': '#4f2a14',
      '--border-0': '#301a0c', '--border-1': '#4f2c14', '--border-2': '#73411f',
      '--text-0': '#ffe7cf', '--text-1': '#e0a878', '--text-2': '#996b48',
      '--accent': '#ff9248', '--accent-dim': 'rgba(255,146,72,0.15)', '--accent-glow': 'rgba(255,146,72,0.34)',
      '--danger': '#ff5a3c', '--success': '#ffc14a'
    }
  },
  crimson: {
    label: 'Crimson',
    vars: {
      '--bg-0': '#1a0509', '--bg-1': '#240a10', '--bg-2': '#2f0e16', '--bg-3': '#3d121d', '--bg-4': '#4f1626',
      '--border-0': '#33101a', '--border-1': '#561a2c', '--border-2': '#7a253f',
      '--text-0': '#fbd9de', '--text-1': '#cf7d8b', '--text-2': '#8a4654',
      '--accent': '#dc143c', '--accent-dim': 'rgba(220,20,60,0.15)', '--accent-glow': 'rgba(220,20,60,0.36)',
      '--danger': '#ff5070', '--success': '#94c97a'
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
      '--bg-0': '#1f2018', '--bg-1': '#26271d', '--bg-2': '#2e2f23', '--bg-3': '#373829', '--bg-4': '#454632',
      '--border-0': '#2e2f23', '--border-1': '#454632', '--border-2': '#6f6b51',
      '--text-0': '#f8f8f2', '--text-1': '#c8c8a8', '--text-2': '#75715e',
      '--accent': '#fd971f', '--accent-dim': 'rgba(253,151,31,0.14)', '--accent-glow': 'rgba(253,151,31,0.3)',
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
