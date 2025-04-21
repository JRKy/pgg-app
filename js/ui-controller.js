class UIController {
    constructor(gridGenerator) {
        this.gridGenerator = gridGenerator;
        this.STORAGE_KEY = 'gridAppearanceSettings';

        // Initialize UI with default values
        this.initializeUI();
        
        // Set up event handlers
        this.setupEventListeners();
        this.setupKeyboardNavigation();
        
        // Load URL parameters (will override defaults if present)
        this.loadFromURL();
        
        // Initialize appearance from storage or defaults
        this.loadAppearanceSettings();
        this.updateGridAppearance();
        
        // Generate grid after all initialization
        this.generateGrid();
    }

    initializeUI() {
        // Initialize seed
        document.getElementById('seed-value').value = this.generateRandomPassphrase();

        // Initialize character sets (at least 2 must be selected)
        document.getElementById('uppercase').checked = true;
        document.getElementById('lowercase').checked = true;
        document.getElementById('numbers').checked = true;
        document.getElementById('special').checked = true;
        document.getElementById('avoid-ambiguous').checked = true;

        // Initialize grid size
        document.getElementById('grid-rows').value = "16";
        document.getElementById('grid-cols').value = "16";
    }
    
    generateRandomPassphrase() {
        const words = [
            'apple', 'bear', 'bird', 'blue', 'boat', 'book', 'cake', 'cat', 'cloud', 'cold',
            'dance', 'dark', 'deer', 'desk', 'dog', 'door', 'duck', 'eagle', 'earth', 'egg',
            'face', 'farm', 'fish', 'flag', 'flower', 'food', 'fox', 'free', 'frog', 'game',
            'gate', 'gift', 'girl', 'goat', 'gold', 'green', 'hand', 'hat', 'hill', 'home',
            'horse', 'house', 'ice', 'ink', 'island', 'jet', 'jump', 'key', 'king', 'kite',
            'lake', 'lamp', 'leaf', 'light', 'lion', 'lock', 'map', 'milk', 'moon', 'mouse',
            'nest', 'night', 'note', 'ocean', 'owl', 'park', 'pen', 'pink', 'pipe', 'plane',
            'rain', 'red', 'ring', 'river', 'road', 'rock', 'rose', 'sand', 'sea', 'ship',
            'sky', 'snow', 'star', 'stone', 'sun', 'table', 'tent', 'time', 'tree', 'wall',
            'wave', 'wind', 'wing', 'wolf', 'wood', 'year', 'zone'
        ];
        return `${words[Math.floor(Math.random() * words.length)]}-${words[Math.floor(Math.random() * words.length)]}-${words[Math.floor(Math.random() * words.length)]}`;
    }
    
    loadAppearanceSettings() {
        try {
            const savedSettings = localStorage.getItem(this.STORAGE_KEY);
            if (savedSettings) {
                const settings = JSON.parse(savedSettings);
                document.getElementById('grid-font').value = settings.fontFamily || "'JetBrains Mono'";
                document.getElementById('font-size').value = settings.fontSize || "14";
            } else {
                // Set defaults if no saved settings
                document.getElementById('grid-font').value = "'JetBrains Mono'";
                document.getElementById('font-size').value = "14";
            }
        } catch (error) {
            console.error('Error loading appearance settings:', error);
            // Set defaults on error
            document.getElementById('grid-font').value = "'JetBrains Mono'";
            document.getElementById('font-size').value = "14";
        }
    }

    saveAppearanceSettings() {
        try {
            const settings = {
                fontFamily: document.getElementById('grid-font').value,
                fontSize: document.getElementById('font-size').value
            };
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings));
        } catch (error) {
            console.error('Error saving appearance settings:', error);
        }
    }

    setupEventListeners() {
        // Seed controls
        document.getElementById('seed-value').addEventListener('input', () => {
            this.generateGrid();
        });

        document.getElementById('random-seed-btn').addEventListener('click', () => {
            document.getElementById('seed-value').value = this.generateRandomPassphrase();
            this.generateGrid();
        });

        // Grid size controls
        ['grid-rows', 'grid-cols'].forEach(id => {
            document.getElementById(id).addEventListener('input', () => {
                this.generateGrid();
            });
        });

        // Character set controls (including case control)
        ['uppercase', 'lowercase', 'numbers', 'special', 'avoid-ambiguous'].forEach(id => {
            document.getElementById(id).addEventListener('change', () => {
                this.generateGrid();
            });
        });

        // Font controls with persistence
        document.getElementById('grid-font').addEventListener('change', () => {
            this.updateGridAppearance();
            this.saveAppearanceSettings();
        });

        document.getElementById('font-size').addEventListener('input', () => {
            this.updateGridAppearance();
            this.saveAppearanceSettings();
        });

        // Export buttons
        document.getElementById('print-btn').addEventListener('click', () => {
            const rows = parseInt(document.getElementById('grid-rows').value) || 16;
            const cols = parseInt(document.getElementById('grid-cols').value) || 16;
            
            if (rows > 24 || cols > 20) {
                const proceed = confirm("This grid may be too large to fit on a single page. Continue with printing?");
                if (!proceed) return;
            }
            
            window.print();
        });

        document.getElementById('share-btn').addEventListener('click', () => {
            this.shareGrid();
        });

        document.getElementById('export-png-btn').addEventListener('click', () => {
            this.exportAsPNG();
        });

        // Panel toggles
        document.getElementById('toggle-help').addEventListener('click', () => {
            const helpPanel = document.getElementById('help-panel');
            helpPanel.classList.toggle('hidden');
        });

        document.getElementById('toggle-options').addEventListener('click', () => {
            const optionsPanel = document.getElementById('options-panel');
            optionsPanel.classList.toggle('hidden');
        });
    }

    loadFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const options = {};
        urlParams.forEach((value, key) => {
            if (key === 'gridRows' || key === 'gridCols') {
                options[key] = parseInt(value, 10);
            } else if (key === 'includeNumbers' || key === 'includeSpecial' || 
                       key === 'avoidAmbiguous' || key === 'includeUpper' || 
                       key === 'includeLower') {
                options[key] = value === 'true';
            } else if (key === 'seedValue') {
                document.getElementById('seed-value').value = value;
            }
        });
        if (Object.keys(options).length > 0) {
            this.gridGenerator.setOptions(options);
            this.generateGrid();
        }
    }

    getOptionsFromUI() {
        const options = {
            seedValue: document.getElementById('seed-value').value || "TANGO",
            gridRows: parseInt(document.getElementById('grid-rows').value, 10) || 16,
            gridCols: parseInt(document.getElementById('grid-cols').value, 10) || 16,
            includeNumbers: document.getElementById('numbers').checked,
            includeSpecial: document.getElementById('special').checked,
            avoidAmbiguous: document.getElementById('avoid-ambiguous').checked,
            includeUpper: document.getElementById('uppercase').checked,
            includeLower: document.getElementById('lowercase').checked
        };

        // Ensure at least two character sets are selected
        const selectedSets = [
            options.includeUpper,
            options.includeLower,
            options.includeNumbers,
            options.includeSpecial
        ].filter(Boolean).length;

        if (selectedSets < 2) {
            // If less than 2 sets are selected, force enable numbers and special chars
            options.includeNumbers = true;
            options.includeSpecial = true;
            
            // Update UI to match
            document.getElementById('numbers').checked = true;
            document.getElementById('special').checked = true;
        }

        return options;
    }
    
    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

            switch(e.key) {
                case 'p':
                    document.getElementById('print-btn').click();
                    break;
                case 's':
                    document.getElementById('share-btn').click();
                    break;
            }
        });
    }
    
    renderGrid(gridData) {
        const gridContainer = document.getElementById('password-grid');
        let table = document.createElement('table');
        table.className = 'grid';
        
        // Get current font settings
        const fontFamily = document.getElementById('grid-font').value;
        const fontSize = document.getElementById('font-size').value;
        
        // Create table structure
        let thead = document.createElement('thead');
        let headerRow = document.createElement('tr');
        let cornerCell = document.createElement('th');
        headerRow.appendChild(cornerCell);
        
        // Add column headers (A, B, C, etc.)
        for (let col = 0; col < gridData[0].length; col++) {
            let th = document.createElement('th');
            th.textContent = String.fromCharCode(65 + col);
            th.style.fontFamily = fontFamily;
            th.style.fontSize = `${fontSize}px`;
            headerRow.appendChild(th);
        }
        
        let rightCornerCell = document.createElement('th');
        headerRow.appendChild(rightCornerCell);
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Create table body
        let tbody = document.createElement('tbody');
        
        // Add rows with row numbers
        gridData.forEach((row, rowIndex) => {
            let tr = document.createElement('tr');
            
            // Add row number
            let rowHeader = document.createElement('th');
            rowHeader.textContent = rowIndex + 1;
            rowHeader.style.fontFamily = fontFamily;
            rowHeader.style.fontSize = `${fontSize}px`;
            tr.appendChild(rowHeader);
            
            // Add cells
            row.forEach(cell => {
                let td = document.createElement('td');
                if (cell.type === 'number') td.classList.add('number-cell');
                if (cell.type === 'special') td.classList.add('special-cell');
                
                let span = document.createElement('span');
                span.textContent = cell.value;
                span.style.fontFamily = fontFamily;
                span.style.fontSize = `${fontSize}px`;
                td.appendChild(span);
                
                tr.appendChild(td);
            });
            
            // Add right row number
            let rightRowHeader = document.createElement('th');
            rightRowHeader.textContent = rowIndex + 1;
            rightRowHeader.style.fontFamily = fontFamily;
            rightRowHeader.style.fontSize = `${fontSize}px`;
            tr.appendChild(rightRowHeader);
            
            tbody.appendChild(tr);
        });
        
        table.appendChild(tbody);
        
        // Create table footer (same as header)
        let tfoot = document.createElement('tfoot');
        let footerRow = document.createElement('tr');
        let bottomCornerCell = document.createElement('th');
        footerRow.appendChild(bottomCornerCell);
        
        for (let col = 0; col < gridData[0].length; col++) {
            let th = document.createElement('th');
            th.textContent = String.fromCharCode(65 + col);
            th.style.fontFamily = fontFamily;
            th.style.fontSize = `${fontSize}px`;
            footerRow.appendChild(th);
        }
        
        let bottomRightCornerCell = document.createElement('th');
        footerRow.appendChild(bottomRightCornerCell);
        tfoot.appendChild(footerRow);
        table.appendChild(tfoot);
        
        // Clear and update grid container
        gridContainer.innerHTML = '';
        gridContainer.appendChild(table);
        
        // Apply appearance settings
        this.updateGridAppearance();
    }
    
    generateGrid() {
        try {
            const options = this.getOptionsFromUI();
            this.gridGenerator.setOptions(options);
            const result = this.gridGenerator.generateGrid();
            this.renderGrid(result.grid);
        } catch (error) {
            alert(`Error generating grid: ${error.message}`);
            console.error(error);
        }
    }

    updateGridAppearance() {
        const grid = document.querySelector('#password-grid table.grid');
        if (!grid) return;

        // Update font settings
        const fontFamily = document.getElementById('grid-font').value;
        const fontSize = document.getElementById('font-size').value;
        
        // Apply font family and size to the grid and all its cells
        grid.style.fontFamily = fontFamily;
        grid.style.fontSize = `${fontSize}px`;
        
        // Ensure all cells and headers have the same font settings
        const allCells = grid.querySelectorAll('td, th');
        allCells.forEach(cell => {
            cell.style.fontFamily = fontFamily;
            cell.style.fontSize = `${fontSize}px`;
        });

        // Also update the spans inside cells
        const cellSpans = grid.querySelectorAll('td span');
        cellSpans.forEach(span => {
            span.style.fontFamily = fontFamily;
            span.style.fontSize = `${fontSize}px`;
        });
    }

    shareGrid() {
        const options = this.getOptionsFromUI();
        const url = new URL(window.location);
        Object.entries(options).forEach(([key, value]) => {
            url.searchParams.set(key, value);
        });
        navigator.clipboard.writeText(url.toString())
            .then(() => alert('Grid URL copied to clipboard!'))
            .catch(err => alert('Failed to copy URL: ' + err));
    }

    exportAsPNG() {
        html2canvas(document.getElementById('password-grid')).then(canvas => {
            const link = document.createElement('a');
            const seed = document.getElementById('seed-value').value;
            link.download = `Password_Grid_${seed}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        }).catch(err => alert('Failed to export PNG: ' + err));
    }
}