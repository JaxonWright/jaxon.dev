/**
 * Terminal themes taken from Omarchy's built-in themes (github.com/basecamp/omarchy,
 * themes/<name>/colors.toml @ 8a787b6) plus Jaxon's own `midnight`
 * (github.com/JaxonWright/omarchy-midnight-theme, colors.toml).
 * Fields are copied verbatim: background, foreground, bright_foreground, accent, red, and the
 * ANSI palette (lighter_background/red..cyan/foreground, dark_foreground/bright_*).
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
  /** ANSI colors 0-7 and 8-15 (Omarchy colors.toml), for fastfetch-style swatches. */
  palette: [string[], string[]];
}

export const DEFAULT_THEME = 'midnight';

export const TERMINAL_THEMES: TerminalTheme[] = [
  { name: 'midnight', mode: 'dark', background: '#000000', foreground: '#EFEFEF', bright: '#ffffff', accent: '#407e70', dim: '#8a8a8d', red: '#D35F5F', palette: [['#121212', '#D35F5F', '#8A9A7B', '#FFC107', '#8A9FBE', '#C1A1C1', '#88AABB', '#EFEFEF'], ['#555555', '#B91C1C', '#A5B799', '#F59E0B', '#A4BBDD', '#D9B9D9', '#A2C4D3', '#ffffff']] },
  { name: 'catppuccin', mode: 'dark', background: '#1e1e2e', foreground: '#cdd6f4', bright: '#cdd6f4', accent: '#89b4fa', dim: '#bac2de', red: '#f38ba8', palette: [['#313244', '#f38ba8', '#a6e3a1', '#f9e2af', '#89b4fa', '#f5c2e7', '#94e2d5', '#cdd6f4'], ['#6c7086', '#f38ba8', '#a6e3a1', '#f9e2af', '#89b4fa', '#f5c2e7', '#94e2d5', '#cdd6f4']] },
  { name: 'catppuccin-latte', mode: 'light', background: '#eff1f5', foreground: '#4c4f69', bright: '#4c4f69', accent: '#1e66f5', dim: '#5c5f77', red: '#d20f39', palette: [['#dce0e8', '#d20f39', '#40a02b', '#df8e1d', '#1e66f5', '#ea76cb', '#179299', '#4c4f69'], ['#9ca0b0', '#d20f39', '#40a02b', '#df8e1d', '#1e66f5', '#ea76cb', '#179299', '#4c4f69']] },
  { name: 'ethereal', mode: 'dark', background: '#060B1E', foreground: '#ffcead', bright: '#ffcead', accent: '#7d82d9', dim: '#c9b8a6', red: '#ED5B5A', palette: [['#131a3a', '#ED5B5A', '#92a593', '#E9BB4F', '#7d82d9', '#c89dc1', '#a3bfd1', '#ffcead'], ['#6d7db6', '#faaaa9', '#c4cfc4', '#f7dc9c', '#c2c4f0', '#ead7e7', '#dfeaf0', '#ffcead']] },
  { name: 'everforest', mode: 'dark', background: '#2d353b', foreground: '#d3c6aa', bright: '#d3c6aa', accent: '#7fbbb3', dim: '#9da9a0', red: '#e67e80', palette: [['#343f44', '#e67e80', '#a7c080', '#dbbc7f', '#7fbbb3', '#d699b6', '#83c092', '#d3c6aa'], ['#4f585e', '#e67e80', '#a7c080', '#dbbc7f', '#7fbbb3', '#d699b6', '#83c092', '#d3c6aa']] },
  { name: 'flexoki-light', mode: 'light', background: '#FFFCF0', foreground: '#100F0F', bright: '#100F0F', accent: '#205EA6', dim: '#403E3C', red: '#D14D41', palette: [['#E6E4D9', '#D14D41', '#879A39', '#D0A215', '#205EA6', '#CE5D97', '#3AA99F', '#100F0F'], ['#878580', '#D14D41', '#879A39', '#D0A215', '#4385BE', '#CE5D97', '#3AA99F', '#100F0F']] },
  { name: 'gruvbox', mode: 'dark', background: '#282828', foreground: '#d4be98', bright: '#d4be98', accent: '#7daea3', dim: '#bdae93', red: '#ea6962', palette: [['#3c3836', '#ea6962', '#a9b665', '#d8a657', '#7daea3', '#d3869b', '#89b482', '#d4be98'], ['#7c6f64', '#ea6962', '#a9b665', '#d8a657', '#7daea3', '#d3869b', '#89b482', '#d4be98']] },
  { name: 'hackerman', mode: 'dark', background: '#0B0C16', foreground: '#ddf7ff', bright: '#ddf7ff', accent: '#82FB9C', dim: '#b5c5db', red: '#50f872', palette: [['#151828', '#50f872', '#4fe88f', '#50f7d4', '#829dd4', '#86a7df', '#7cf8f7', '#ddf7ff'], ['#6a6e95', '#85ff9d', '#9cf7c2', '#a4ffec', '#c4d2ed', '#cddbf4', '#d1fffe', '#ddf7ff']] },
  { name: 'kanagawa', mode: 'dark', background: '#1f1f28', foreground: '#dcd7ba', bright: '#dcd7ba', accent: '#dcd7ba', dim: '#c8c093', red: '#c34043', palette: [['#223249', '#c34043', '#76946a', '#c0a36e', '#7e9cd8', '#957fb8', '#6a9589', '#dcd7ba'], ['#727169', '#e82424', '#98bb6c', '#e6c384', '#7fb4ca', '#938aa9', '#7aa89f', '#dcd7ba']] },
  { name: 'last-horizon', mode: 'dark', background: '#0c0b0c', foreground: '#FAFCFB', bright: '#e2dddc', accent: '#b59790', dim: '#cfd3cd', red: '#c38b7b', palette: [['#0c0b0c', '#c38b7b', '#87a9b0', '#6B5E73', '#b59790', '#c4d8e2', '#a5a0b6', '#FAFCFB'], ['#584e51', '#c38b7b', '#87a9b0', '#6B5E73', '#b59790', '#c4d8e2', '#a5a0b6', '#e2dddc']] },
  { name: 'lumon', mode: 'dark', background: '#16242d', foreground: '#d6e2ee', bright: '#f2fcff', accent: '#8bc9eb', dim: '#d6e2ee', red: '#4d86b0', palette: [['#1b2d40', '#4d86b0', '#5e95bc', '#6fa4c9', '#6fb8e3', '#8bc9eb', '#b4e4f6', '#d6e2ee'], ['#4d86b0', '#73a6cb', '#86b7d8', '#9dcae5', '#f2fcff', '#b1d8ee', '#d1eef8', '#f2fcff']] },
  { name: 'lupine', mode: 'light', background: '#fafafa', foreground: '#212121', bright: '#000000', accent: '#3264eb', dim: '#424242', red: '#c900c4', palette: [['#f5f5f5', '#c900c4', '#4a2fd0', '#026fde', '#3264eb', '#8a4ad7', '#0c67de', '#212121'], ['#757575', '#f930fb', '#9f85e0', '#358fff', '#5482ff', '#b363ff', '#3986ff', '#000000']] },
  { name: 'matte-black', mode: 'dark', background: '#121212', foreground: '#bebebe', bright: '#bebebe', accent: '#e68e0d', dim: '#8a8a8d', red: '#D35F5F', palette: [['#1e1e1e', '#D35F5F', '#FFC107', '#b91c1c', '#e68e0d', '#D35F5F', '#bebebe', '#bebebe'], ['#555555', '#B91C1C', '#FFC107', '#b90a0a', '#f59e0b', '#B91C1C', '#eaeaea', '#bebebe']] },
  { name: 'miasma', mode: 'dark', background: '#222222', foreground: '#c2c2b0', bright: '#c2c2b0', accent: '#78824b', dim: '#8a8a7e', red: '#685742', palette: [['#2c2c2c', '#685742', '#5f875f', '#b36d43', '#78824b', '#bb7744', '#c9a554', '#c2c2b0'], ['#555555', '#685742', '#5f875f', '#b36d43', '#78824b', '#bb7744', '#c9a554', '#c2c2b0']] },
  { name: 'nord', mode: 'dark', background: '#2e3440', foreground: '#d8dee9', bright: '#d8dee9', accent: '#81a1c1', dim: '#adb5c4', red: '#bf616a', palette: [['#3b4252', '#bf616a', '#a3be8c', '#ebcb8b', '#81a1c1', '#b48ead', '#88c0d0', '#d8dee9'], ['#667080', '#bf616a', '#a3be8c', '#ebcb8b', '#81a1c1', '#b48ead', '#8fbcbb', '#d8dee9']] },
  { name: 'osaka-jade', mode: 'dark', background: '#111c18', foreground: '#C1C497', bright: '#F7E8B2', accent: '#509475', dim: '#D6D5BC', red: '#FF5345', palette: [['#23372B', '#FF5345', '#549e6a', '#459451', '#509475', '#D2689C', '#2DD5B7', '#C1C497'], ['#81B8A8', '#db9f9c', '#63b07a', '#E5C736', '#ACD4CF', '#75bbb3', '#8CD3CB', '#F7E8B2']] },
  { name: 'retro-82', mode: 'dark', background: '#05182e', foreground: '#f6dcac', bright: '#f6dcac', accent: '#faa968', dim: '#a7c9c6', red: '#f85525', palette: [['#0a2540', '#f85525', '#028391', '#e97b3c', '#3f8f8a', '#3f8f8a', '#8cbfb8', '#f6dcac'], ['#3f8f8a', '#f85525', '#028391', '#e97b3c', '#faa968', '#3f8f8a', '#8cbfb8', '#f6dcac']] },
  { name: 'ristretto', mode: 'dark', background: '#2c2525', foreground: '#e6d9db', bright: '#e6d9db', accent: '#f38d70', dim: '#c3b7b8', red: '#fd6883', palette: [['#3d2f2a', '#fd6883', '#adda78', '#f9cc6c', '#f38d70', '#a8a9eb', '#85dacc', '#e6d9db'], ['#72696a', '#ff8297', '#c8e292', '#fcd675', '#f8a788', '#bebffd', '#9bf1e1', '#e6d9db']] },
  { name: 'rose-pine', mode: 'light', background: '#faf4ed', foreground: '#575279', bright: '#575279', accent: '#56949f', dim: '#6e6a86', red: '#b4637a', palette: [['#f2e9e1', '#b4637a', '#286983', '#ea9d34', '#56949f', '#907aa9', '#d7827e', '#575279'], ['#9893a5', '#b4637a', '#286983', '#ea9d34', '#56949f', '#907aa9', '#d7827e', '#575279']] },
  { name: 'solitude', mode: 'dark', background: '#101315', foreground: '#cacccc', bright: '#a5aeb4', accent: '#798186', dim: '#cbc2be', red: '#565d60', palette: [['#101315', '#565d60', '#9fa5a9', '#d9dbdc', '#798186', '#aeaeae', '#707070', '#cacccc'], ['#4b4e55', '#de6145', '#343d41', '#c9c2b4', '#5d6367', '#9a9a9a', '#707070', '#a5aeb4']] },
  { name: 'starship', mode: 'dark', background: '#1c1c1e', foreground: '#f5f5f7', bright: '#ffffff', accent: '#ff9f0a', dim: '#fbfbfd', red: '#ff5f4a', palette: [['#2c2c2e', '#ff5f4a', '#ff9f0a', '#ffc27a', '#8fb8de', '#ff8fa3', '#a6dcef', '#f5f5f7'], ['#98989d', '#ff8373', '#ffb340', '#ffd8a8', '#b5d0ea', '#ffb3c1', '#cdeefa', '#ffffff']] },
  { name: 'tokyo-night', mode: 'dark', background: '#1a1b26', foreground: '#a9b1d6', bright: '#c0caf5', accent: '#7aa2f7', dim: '#b4bee6', red: '#f7768e', palette: [['#24283b', '#f7768e', '#9ece6a', '#e0af68', '#7aa2f7', '#ad8ee6', '#449dab', '#a9b1d6'], ['#565f89', '#ff7a93', '#b9f27c', '#ff9e64', '#7da6ff', '#bb9af7', '#0db9d7', '#c0caf5']] },
  { name: 'vantablack', mode: 'dark', background: '#000000', foreground: '#ffffff', bright: '#ffffff', accent: '#8d8d8d', dim: '#ececec', red: '#a4a4a4', palette: [['#1a1a1a', '#a4a4a4', '#b6b6b6', '#cecece', '#8d8d8d', '#9b9b9b', '#b0b0b0', '#ffffff'], ['#505050', '#a4a4a4', '#b6b6b6', '#cecece', '#8d8d8d', '#9b9b9b', '#b0b0b0', '#ffffff']] },
  { name: 'white', mode: 'light', background: '#ffffff', foreground: '#000000', bright: '#000000', accent: '#6e6e6e', dim: '#000000', red: '#2a2a2a', palette: [['#c0c0c0', '#2a2a2a', '#3a3a3a', '#4a4a4a', '#1a1a1a', '#2e2e2e', '#3e3e3e', '#000000'], ['#c0c0c0', '#2a2a2a', '#3a3a3a', '#4a4a4a', '#1a1a1a', '#2e2e2e', '#3e3e3e', '#000000']] },
];
