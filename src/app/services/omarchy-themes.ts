/**
 * Terminal themes taken from Omarchy's built-in themes (github.com/basecamp/omarchy,
 * themes/<name>/colors.toml @ 8a787b6) plus Jaxon's own `midnight`
 * (github.com/JaxonWright/omarchy-midnight-theme, colors.toml).
 * Fields are copied verbatim: background, foreground, bright_foreground, accent, red.
 */
export interface TerminalTheme {
  name: string;
  mode: 'dark' | 'light';
  background: string;
  foreground: string;
  bright: string;
  accent: string;
  dim: string;
  red: string;
}

export const DEFAULT_THEME = 'midnight';

export const TERMINAL_THEMES: TerminalTheme[] = [
  { name: 'midnight', mode: 'dark', background: '#000000', foreground: '#EFEFEF', bright: '#ffffff', accent: '#407e70', dim: '#8a8a8d', red: '#D35F5F' },
  { name: 'catppuccin', mode: 'dark', background: '#1e1e2e', foreground: '#cdd6f4', bright: '#cdd6f4', accent: '#89b4fa', dim: '#bac2de', red: '#f38ba8' },
  { name: 'catppuccin-latte', mode: 'light', background: '#eff1f5', foreground: '#4c4f69', bright: '#4c4f69', accent: '#1e66f5', dim: '#5c5f77', red: '#d20f39' },
  { name: 'ethereal', mode: 'dark', background: '#060B1E', foreground: '#ffcead', bright: '#ffcead', accent: '#7d82d9', dim: '#c9b8a6', red: '#ED5B5A' },
  { name: 'everforest', mode: 'dark', background: '#2d353b', foreground: '#d3c6aa', bright: '#d3c6aa', accent: '#7fbbb3', dim: '#9da9a0', red: '#e67e80' },
  { name: 'flexoki-light', mode: 'light', background: '#FFFCF0', foreground: '#100F0F', bright: '#100F0F', accent: '#205EA6', dim: '#403E3C', red: '#D14D41' },
  { name: 'gruvbox', mode: 'dark', background: '#282828', foreground: '#d4be98', bright: '#d4be98', accent: '#7daea3', dim: '#bdae93', red: '#ea6962' },
  { name: 'hackerman', mode: 'dark', background: '#0B0C16', foreground: '#ddf7ff', bright: '#ddf7ff', accent: '#82FB9C', dim: '#b5c5db', red: '#50f872' },
  { name: 'kanagawa', mode: 'dark', background: '#1f1f28', foreground: '#dcd7ba', bright: '#dcd7ba', accent: '#dcd7ba', dim: '#c8c093', red: '#c34043' },
  { name: 'last-horizon', mode: 'dark', background: '#0c0b0c', foreground: '#FAFCFB', bright: '#e2dddc', accent: '#b59790', dim: '#cfd3cd', red: '#c38b7b' },
  { name: 'lumon', mode: 'dark', background: '#16242d', foreground: '#d6e2ee', bright: '#f2fcff', accent: '#8bc9eb', dim: '#d6e2ee', red: '#4d86b0' },
  { name: 'lupine', mode: 'light', background: '#fafafa', foreground: '#212121', bright: '#000000', accent: '#3264eb', dim: '#424242', red: '#c900c4' },
  { name: 'matte-black', mode: 'dark', background: '#121212', foreground: '#bebebe', bright: '#bebebe', accent: '#e68e0d', dim: '#8a8a8d', red: '#D35F5F' },
  { name: 'miasma', mode: 'dark', background: '#222222', foreground: '#c2c2b0', bright: '#c2c2b0', accent: '#78824b', dim: '#8a8a7e', red: '#685742' },
  { name: 'nord', mode: 'dark', background: '#2e3440', foreground: '#d8dee9', bright: '#d8dee9', accent: '#81a1c1', dim: '#adb5c4', red: '#bf616a' },
  { name: 'osaka-jade', mode: 'dark', background: '#111c18', foreground: '#C1C497', bright: '#F7E8B2', accent: '#509475', dim: '#D6D5BC', red: '#FF5345' },
  { name: 'retro-82', mode: 'dark', background: '#05182e', foreground: '#f6dcac', bright: '#f6dcac', accent: '#faa968', dim: '#a7c9c6', red: '#f85525' },
  { name: 'ristretto', mode: 'dark', background: '#2c2525', foreground: '#e6d9db', bright: '#e6d9db', accent: '#f38d70', dim: '#c3b7b8', red: '#fd6883' },
  { name: 'rose-pine', mode: 'light', background: '#faf4ed', foreground: '#575279', bright: '#575279', accent: '#56949f', dim: '#6e6a86', red: '#b4637a' },
  { name: 'solitude', mode: 'dark', background: '#101315', foreground: '#cacccc', bright: '#a5aeb4', accent: '#798186', dim: '#cbc2be', red: '#565d60' },
  { name: 'starship', mode: 'dark', background: '#1c1c1e', foreground: '#f5f5f7', bright: '#ffffff', accent: '#ff9f0a', dim: '#fbfbfd', red: '#ff5f4a' },
  { name: 'tokyo-night', mode: 'dark', background: '#1a1b26', foreground: '#a9b1d6', bright: '#c0caf5', accent: '#7aa2f7', dim: '#b4bee6', red: '#f7768e' },
  { name: 'vantablack', mode: 'dark', background: '#000000', foreground: '#ffffff', bright: '#ffffff', accent: '#8d8d8d', dim: '#ececec', red: '#a4a4a4' },
  { name: 'white', mode: 'light', background: '#ffffff', foreground: '#000000', bright: '#000000', accent: '#6e6e6e', dim: '#000000', red: '#2a2a2a' },
];
