# PGG - Password Grid Generator

A Progressive Web App (PWA) for crafting secure, memorable passwords with customizable grids. Generate unique password patterns using seeds, character sets, and stylish themes—ideal for anyone wanting strong passwords with a personal touch.

Live demo: [https://jrky.github.io/pgg/](https://jrky.github.io/pgg/)

## Features
- **Custom Grids**: Adjust rows (5-38), columns (5-26), and character sets (uppercase, lowercase, numbers, special).
- **Seed-Driven**: Input passphrases (e.g., "cake-home-star") or random strings for unique grids.
- **Themes**: Pick from Classic, Blueprint, Retro, Minimal, or Forest looks.
- **Patterns**: Add visual flair with Checkerboard, Alternating Rows, Diagonal Stripes, Quadrants, or Sparse Dots.
- **Accessibility**: Colorblind Mode swaps colors for patterns.
- **Export**: Print, share via URL, or save as PNG/CSV.
- **Offline Ready**: PWA with Service Worker caching.
- **Live Updates**: Grid refreshes instantly with option changes.

## Installation
1. **Clone the Repo**:
   ```bash
   git clone https://github.com/JRKy/pgg.git
   cd pgg
   ```
2. **Serve Locally** (optional):
   - Use `npx serve` or `python -m http.server 8000`.
   - Open `http://localhost:8000`.
3. **Deploy to GitHub Pages**:
   - Push to `main` branch.
   - Enable GitHub Pages: Settings > Pages > Source: `main`, Folder: `/ (root)`.

## Usage
1. **Set a Seed**: Enter a passphrase or hit "Random Seed."
2. **Customize**: Tweak character sets, grid size, shading, and theme.
3. **Generate**: Grid updates live—start at a cell (e.g., A1), trace a pattern (e.g., down, right) for your password.
4. **Export**: Print, share URL, or save as PNG/CSV.
5. **Tips**: Aim for 12-16 character patterns—check status panel for strength.

## Files
- `index.html`: Core app page
- `sw.js`: Service Worker for offline support
- `css/styles.css`: Styles with theme definitions
- `js/ui-controller.js`: UI and grid rendering logic
- `js/grid-generator.js`: Grid generation engine
- `js/app.js`: App initialization
- `manifest.json`: PWA manifest
- `presets.json`: Preset configs
- `img/icons/`: App icons

## Credits
Created by [jrky](https://github.com/JRKy) with assist from Grok (xAI). Contributions welcome—fork, tweak, PR!

## License
MIT License—free to use, modify, share. See [LICENSE](LICENSE) for details.
