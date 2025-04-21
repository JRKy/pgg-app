# Password Grid Generator

A secure and user-friendly web application for generating password grids that can be used to create strong, memorable passwords.

## Features

- **Grid Generation**
  - Customizable grid size (5-38 rows, 5-26 columns)
  - Configurable character sets (uppercase, lowercase, numbers, special characters)
  - Option to avoid ambiguous characters (0O1l)
  - Unique grid generation based on seed value

- **Grid Appearance**
  - Multiple font options (JetBrains Mono, Courier New, Consolas, System Monospace)
  - Adjustable font size
  - Alternating column shading for better readability
  - Optimized for both screen and print

- **Export Options**
  - Print grid directly
  - Share grid via URL
  - Export as PNG image

- **User Interface**
  - Modern, responsive design
  - Compact settings panel
  - Keyboard shortcuts for common actions
  - Progressive Web App (PWA) support

## Usage

1. **Generate a Grid**
   - Enter a seed phrase or use the random generator
   - Adjust grid size and character sets as needed
   - The grid will automatically update with your changes

2. **Create Passwords**
   - Follow a path through the grid to create passwords
   - Example: Start at A1, move right 3, down 2, etc.
   - Combine movements to create complex passwords

3. **Save and Share**
   - Print the grid for offline use
   - Share the grid configuration via URL
   - Export as PNG for digital storage

## Keyboard Shortcuts

- `p` - Print grid
- `s` - Share grid URL

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/JRKy/pgg-app.git
   ```

2. Navigate to the project directory:
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

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## License

MIT License - See LICENSE file for details

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
