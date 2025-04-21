# Password Grid Generator

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A secure and user-friendly web application for generating password grids. Create strong, memorable passwords using visual patterns on a customizable grid.

## 🌟 Features

### Grid Generation
- **Customizable Grid Size**: 5-38 rows × 5-26 columns
- **Character Sets**:
  - Uppercase letters (A-Z)
  - Lowercase letters (a-z)
  - Numbers (0-9)
  - Special characters (!@#$%^&*)
  - Option to avoid ambiguous characters (0O1l)
- **Seed-Based Generation**: Use words or phrases as seeds for reproducible grids
- **Random Seed Generator**: Quick random grid generation

### Grid Appearance
- **Font Options**:
  - JetBrains Mono (default)
  - Courier New
  - Consolas
  - System Monospace
- **Adjustable Font Size**: 8-24px
- **Visual Enhancements**:
  - Alternating column shading
  - Row numbers and column letters
  - Distinct colors for numbers and special characters
  - Thick horizontal lines every two rows

### Export Options
- **Print**: Optimized print layout
- **Share**: URL-based grid sharing
- **PNG Export**: Save grid as image

### User Interface
- **Modern Design**: Clean, responsive interface
- **Keyboard Shortcuts**:
  - `p` - Print grid
  - `s` - Share grid URL
- **Persistent Settings**: Saves appearance preferences
- **Progressive Web App (PWA)**: Install as standalone app

## 🚀 Getting Started

### Online Usage
Visit [Password Grid Generator](https://jrky.github.io/pgg-app/) to use the application directly.

### Local Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/JRKy/pgg-app.git
   ```

2. Navigate to project directory:
   ```bash
   cd pgg-app
   ```

3. Start a local server:
   ```bash
   python -m http.server 8000
   ```

4. Open in browser:
   ```
   http://localhost:8000
   ```

## 📝 How to Use

1. **Generate a Grid**:
   - Enter a seed phrase or use the random generator
   - Adjust grid size (rows and columns)
   - Select desired character sets
   - Enable/disable ambiguous characters

2. **Create Passwords**:
   - Choose a starting point (e.g., A1)
   - Follow a pattern through the grid
   - Use the same pattern with different starting points for different services
   - Remember the pattern instead of the password

3. **Export and Share**:
   - Print for offline use
   - Share grid configuration via URL
   - Export as PNG for digital storage

## 🔧 Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## 🛡️ Security Considerations

- Grid generation is deterministic based on seed value
- No passwords are stored or transmitted
- All processing happens client-side
- Print layout removes UI elements for clean output
- Share URLs contain only grid configuration, not content

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Font Awesome for icons
- JetBrains Mono font
- Contributors and users of the project
