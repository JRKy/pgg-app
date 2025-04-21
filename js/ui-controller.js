class UIController {
    constructor(gridGenerator) {
        this.gridGenerator = gridGenerator;
        this.presets = null;
        this.presetVersion = null;
        this.rateLimiter = new SecurityUtils.RateLimiter();
        this.lastRequestTime = 0;
        this.minRequestInterval = 1000; // Minimum 1 second between requests

        const initialSeed = this.generateRandomPassphrase();
        document.getElementById('seed-value').value = SecurityUtils.InputValidator.sanitizeInput(initialSeed);

        this.setupEventListeners();
        this.setupTooltips();
        this.setupKeyboardNavigation();
        this.loadPresets().then(() => {
            this.setupPresets();
            if (this.presets && this.presets.balanced) {
                this.applyPreset(this.presets.balanced.config);
            }
            this.generateGrid();
            this.loadFromURL();
        });
    }
    
    generateRandomPassphrase() {
        const words = [
            'apple', 'bear', 'bird', 'blue', 'boat', 'book', 'cake', 'cat', 'cloud', 'cold', 'dance', 'dark', 'deer', 'desk', 'dog', 'door', 
            'duck', 'eagle', 'earth', 'egg', 'face', 'farm', 'fish', 'flag', 'flower', 'food', 'fox', 'free', 'frog', 'game', 'gate', 'gift', 
            'girl', 'goat', 'gold', 'green', 'hand', 'hat', 'hill', 'home', 'horse', 'house', 'ice', 'ink', 'island', 'jacket', 'jar', 'jet', 
            'jump', 'key', 'king', 'kite', 'lake', 'lamp', 'leaf', 'light', 'lion', 'lock', 'map', 'milk', 'moon', 'mouse', 'mud', 'nest', 
            'night', 'note', 'ocean', 'owl', 'park', 'pen', 'pig', 'pink', 'pipe', 'plane', 'pond', 'pool', 'queen', 'rain', 'rat', 'red', 
            'ring', 'river', 'road', 'rock', 'roof', 'rose', 'sand', 'sea', 'ship', 'shoe', 'sky', 'snake', 'snow', 'sock', 'soup', 'star', 
            'stone', 'sun', 'table', 'tail', 'tent', 'time', 'tree', 'truck', 'vine', 'wall', 'wave', 'wind', 'wing', 'wolf', 'wood', 'yard', 
            'zebra', 'ball', 'bell', 'cake', 'card', 'drum', 'fish', 'glow', 'hope', 'love', 'play', 'song', 'talk', 'walk', 'wish', 'year'
        ];
        return `${words[Math.floor(Math.random() * words.length)]}-${words[Math.floor(Math.random() * words.length)]}-${words[Math.floor(Math.random() * words.length)]}`;
    }
    
    setupEventListeners() {
        document.getElementById('seed-value').addEventListener('input', () => {
            this.validateAndGenerateGrid();
        });

        document.getElementById('random-seed-btn').addEventListener('click', () => {
            const seedType = document.getElementById('seed-type').value;
            let newSeed;
            if (seedType === 'passphrase') {
                newSeed = this.generateRandomPassphrase();
            } else {
                newSeed = this.gridGenerator.generateSecureSeed();
            }
            document.getElementById('seed-value').value = SecurityUtils.InputValidator.sanitizeInput(newSeed);
            this.validateAndGenerateGrid();
        });

        ['uppercase', 'lowercase', 'numbers', 'special', 'avoid-ambiguous'].forEach(id => {
            document.getElementById(id).addEventListener('change', () => {
                this.generateGrid();
            });
        });

        ['grid-rows', 'grid-cols'].forEach(id => {
            document.getElementById(id).addEventListener('input', () => {
                this.generateGrid();
            });
        });

        document.getElementById('shading').addEventListener('change', () => {
            this.generateGrid();
        });

        document.getElementById('inner-lines').addEventListener('change', () => {
            this.generateGrid();
        });

        document.getElementById('colorblind-mode').addEventListener('change', (e) => {
            document.body.classList.toggle('colorblind-mode', e.target.checked);
            this.generateGrid();
        });

        document.getElementById('grid-theme').addEventListener('change', (e) => {
            const theme = e.target.value;
            localStorage.setItem('gridTheme', theme);
            this.generateGrid();
        });

        document.getElementById('color-numbers').addEventListener('change', () => {
            this.generateGrid();
        });

        document.getElementById('color-specials').addEventListener('change', () => {
            this.generateGrid();
        });

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
            const options = this.getOptionsFromUI();
            const url = new URL(window.location);
            Object.entries(options).forEach(([key, value]) => {
                url.searchParams.set(key, value);
            });
            url.searchParams.set('theme', document.getElementById('grid-theme').value);
            navigator.clipboard.writeText(url.toString())
                .then(() => alert('Grid URL copied to clipboard!'))
                .catch(err => alert('Failed to copy URL: ' + err));
        });

        document.getElementById('export-png-btn').addEventListener('click', () => {
            html2canvas(document.getElementById('password-grid')).then(canvas => {
                const link = document.createElement('a');
                link.download = `Password_Grid_${this.gridGenerator.options.seedValue}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
            }).catch(err => alert('Failed to export PNG: ' + err));
        });

        document.getElementById('export-csv-btn').addEventListener('click', () => {
            const gridData = this.gridGenerator.generateGrid().grid;
            let csv = 'Row,Column,Value\n';
            gridData.forEach((row, rowIndex) => {
                row.forEach((cell, colIndex) => {
                    csv += `${rowIndex + 1},${String.fromCharCode(65 + colIndex)},${cell.value}\n`;
                });
            });
            const blob = new Blob([csv], { type: 'text/csv' });
            const link = document.createElement('a');
            link.download = `Password_Grid_${this.gridGenerator.options.seedValue}.csv`;
            link.href = URL.createObjectURL(blob);
            link.click();
        });

        // Add descriptive labels to form controls
        document.querySelectorAll('input, select, button').forEach(control => {
            if (!control.id) return;
            
            const label = document.querySelector(`label[for="${control.id}"]`);
            if (label) {
                control.setAttribute('aria-labelledby', label.id);
            }
            
            // Add help text if available
            const helpText = control.getAttribute('data-help');
            if (helpText) {
                const helpId = `${control.id}-help`;
                control.setAttribute('aria-describedby', helpId);
                
                if (!document.getElementById(helpId)) {
                    const helpElement = document.createElement('div');
                    helpElement.id = helpId;
                    helpElement.className = 'sr-only';
                    helpElement.textContent = helpText;
                    control.parentNode.insertBefore(helpElement, control.nextSibling);
                }
            }
        });
    }

    loadFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const options = {};
        urlParams.forEach((value, key) => {
            if (key === 'gridRows' || key === 'gridCols' || key === 'shadingOption') {
                options[key] = parseInt(value, 10);
            } else if (key === 'includeUpper' || key === 'includeLower' || key === 'includeNumbers' || 
                       key === 'includeSpecial' || key === 'avoidAmbiguous' || key === 'innerLines' ||
                       key === 'colorNumbers' || key === 'colorSpecials') {
                options[key] = value === 'true';
            } else if (key === 'theme') {
                document.getElementById('grid-theme').value = value;
                localStorage.setItem('gridTheme', value);
            } else {
                options[key] = value;
            }
        });
        if (Object.keys(options).length > 0) {
            this.applyPreset(options);
            this.generateGrid();
        }
    }

    validatePresetConfig(config) {
        const requiredFields = ['includeUpper', 'includeLower', 'includeNumbers', 
                              'includeSpecial', 'avoidAmbiguous', 'gridRows', 
                              'gridCols', 'shadingOption', 'innerLines'];
        
        return requiredFields.every(field => 
            Object.prototype.hasOwnProperty.call(config, field)
        );
    }

    async loadPresets() {
        try {
            const response = await fetch('./presets.json');
            if (!response.ok) {
                throw new Error('Failed to load presets');
            }
            const presetData = await response.json();
            this.presetVersion = presetData.version;
            
            Object.values(presetData.presets).forEach(preset => {
                if (!this.validatePresetConfig(preset.config)) {
                    throw new Error(`Invalid preset configuration for ${preset.label}`);
                }
            });
            
            this.presets = presetData.presets;
        } catch (error) {
            console.error('Error loading presets:', error);
            this.presets = {
                strong: {
                    label: "Strong Security",
                    description: "Maximum security with all character sets",
                    config: {
                        includeUpper: true,
                        includeLower: true,
                        includeNumbers: true,
                        includeSpecial: true,
                        avoidAmbiguous: true,
                        gridRows: 20,
                        gridCols: 20,
                        shadingOption: 1,
                        innerLines: true
                    }
                },
                balanced: {
                    label: "Balanced",
                    description: "Good security with readable characters",
                    config: {
                        includeUpper: true,
                        includeLower: true,
                        includeNumbers: true,
                        includeSpecial: false,
                        avoidAmbiguous: true,
                        gridRows: 16,
                        gridCols: 16,
                        shadingOption: 2,
                        innerLines: true
                    }
                },
                memorable: {
                    label: "Memorable",
                    description: "Easier to remember, moderate security",
                    config: {
                        includeUpper: true,
                        includeLower: true,
                        includeNumbers: false,
                        includeSpecial: false,
                        avoidAmbiguous: true,
                        gridRows: 12,
                        gridCols: 12,
                        shadingOption: 0,
                        innerLines: false
                    }
                }
            };
            this.presetVersion = "1.0.0-fallback";
        }
    }

    async updatePresets(newPresets) {
        try {
            Object.values(newPresets.presets).forEach(preset => {
                if (!this.validatePresetConfig(preset.config)) {
                    throw new Error(`Invalid preset configuration for ${preset.label}`);
                }
            });
            
            this.presets = newPresets.presets;
            this.presetVersion = newPresets.version;
            
            const presetContainer = document.querySelector('.preset-buttons');
            presetContainer.innerHTML = '<p id="preset-description" class="visually-hidden">Select from predefined configurations for different security levels</p>';
            this.setupPresets();
            this.generateGrid();
        } catch (error) {
            console.error('Error updating presets:', error);
            throw error;
        }
    }

    setupPresets() {
        if (!this.presets) {
            console.warn('Presets not loaded yet');
            return;
        }
        
        const presetContainer = document.querySelector('.preset-buttons');
        Object.entries(this.presets).forEach(([name, preset]) => {
            const button = document.createElement('button');
            button.textContent = preset.label;
            button.setAttribute('aria-label', `Apply ${preset.label} preset: ${preset.description}`);
            button.setAttribute('title', preset.description);
            button.classList.add('preset-button');
            button.addEventListener('click', () => {
                presetContainer.querySelectorAll('.preset-button').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                this.applyPreset(preset.config);
                this.generateGrid();
            });
            presetContainer.appendChild(button);
        });
        
        const versionInfo = document.createElement('span');
        versionInfo.className = 'preset-version';
        versionInfo.textContent = `Preset version: ${this.presetVersion}`;
        versionInfo.setAttribute('aria-label', `Current preset version: ${this.presetVersion}`);
        presetContainer.appendChild(versionInfo);

        presetContainer.querySelector('.preset-button:nth-child(2)').classList.add('active');
    }
    
    setupTooltips() {
        const tooltipElements = {
            'seed-value': 'Seed value determines grid generation pattern. Use different seeds for different grids.',
            'avoid-ambiguous': 'Excludes characters that can be easily confused (like 0 and O, 1 and l)',
            'shading': 'Choose shading pattern for better visual distinction of cells'
        };

        Object.entries(tooltipElements).forEach(([id, text]) => {
            const element = document.getElementById(id);
            element.setAttribute('aria-describedby', `${id}-tooltip`);
        });
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
                case 'ArrowUp':
                case 'ArrowDown':
                case 'ArrowLeft':
                case 'ArrowRight':
                    this.handleGridNavigation(e);
                    break;
                case 'Home':
                    this.focusFirstGridCell();
                    break;
                case 'End':
                    this.focusLastGridCell();
                    break;
            }
        });
    }

    handleGridNavigation(e) {
        const currentCell = document.activeElement;
        if (!currentCell || !currentCell.closest('.grid')) return;

        e.preventDefault();
        const grid = currentCell.closest('table');
        const cells = Array.from(grid.querySelectorAll('td'));
        const currentIndex = cells.indexOf(currentCell);
        
        let nextIndex;
        switch(e.key) {
            case 'ArrowUp':
                nextIndex = currentIndex - grid.rows[1].cells.length;
                break;
            case 'ArrowDown':
                nextIndex = currentIndex + grid.rows[1].cells.length;
                break;
            case 'ArrowLeft':
                nextIndex = currentIndex - 1;
                break;
            case 'ArrowRight':
                nextIndex = currentIndex + 1;
                break;
        }

        if (nextIndex >= 0 && nextIndex < cells.length) {
            cells[nextIndex].focus();
        }
    }

    focusFirstGridCell() {
        const grid = document.querySelector('.grid');
        if (grid) {
            const firstCell = grid.querySelector('td');
            if (firstCell) {
                firstCell.focus();
            }
        }
    }

    focusLastGridCell() {
        const grid = document.querySelector('.grid');
        if (grid) {
            const cells = grid.querySelectorAll('td');
            const lastCell = cells[cells.length - 1];
            if (lastCell) {
                lastCell.focus();
            }
        }
    }
    
    getOptionsFromUI() {
        const options = {
            seedValue: document.getElementById('seed-value').value || "TANGO",
            includeUpper: document.getElementById('uppercase').checked,
            includeLower: document.getElementById('lowercase').checked,
            includeNumbers: document.getElementById('numbers').checked,
            includeSpecial: document.getElementById('special').checked,
            avoidAmbiguous: document.getElementById('avoid-ambiguous').checked,
            gridRows: parseInt(document.getElementById('grid-rows').value, 10) || 16,
            gridCols: parseInt(document.getElementById('grid-cols').value, 10) || 16,
            shadingOption: parseInt(document.getElementById('shading').value, 10) || 0,
            innerLines: document.getElementById('inner-lines').checked,
            colorNumbers: document.getElementById('color-numbers').checked,
            colorSpecials: document.getElementById('color-specials').checked
        };
        return options;
    }
    
    updateStatusPanel(result) {
        const { metrics, charSets } = result;
        
        document.getElementById('char-sets-status').textContent = charSets;
        document.getElementById('entropy-per-char').textContent = `${metrics.entropyPerChar} bits`;
        document.getElementById('password-strength').textContent = 
            `${metrics.pathLength}-char: ${metrics.totalEntropy} bits`;
        
        const complexityElement = document.getElementById('complexity-rating');
        complexityElement.textContent = metrics.complexityRating.text;
        complexityElement.className = metrics.complexityRating.class;
    }
    
    renderGrid(gridData) {
        const gridContainer = document.getElementById('password-grid');
        let table = document.createElement('table');
        table.className = 'grid';
        table.setAttribute('role', 'grid');
        table.setAttribute('aria-label', `Password Grid with ${gridData.length} rows and ${gridData[0].length} columns`);
        
        const theme = document.getElementById('grid-theme').value;
        table.classList.add(`theme-${theme}`);
        
        if (this.gridGenerator.options.innerLines) {
            table.classList.add('with-inner-lines');
        }
        
        if (!document.body.classList.contains('colorblind-mode')) {
            switch (parseInt(this.gridGenerator.options.shadingOption)) {
                case 1:
                    table.classList.add('checkerboard-2x2');
                    break;
                case 2:
                    table.classList.add('alt-rows');
                    break;
                case 3:
                    table.classList.add('diag-stripes');
                    break;
                case 4:
                    table.classList.add('quadrants');
                    break;
                case 5:
                    table.classList.add('sparse-dots');
                    break;
            }
        }

        if (this.gridGenerator.options.colorNumbers) {
            table.classList.add('color-numbers');
        }
        if (this.gridGenerator.options.colorSpecials) {
            table.classList.add('color-specials');
        }
        
        let thead = document.createElement('thead');
        let titleRow = document.createElement('tr');
        let titleCell = document.createElement('th');
        titleCell.colSpan = gridData[0].length + 2;
        titleCell.textContent = `GRID (${this.gridGenerator.options.seedValue})`;
        titleCell.className = 'grid-title';
        titleRow.appendChild(titleCell);
        thead.appendChild(titleRow);
        
        let headerRow = document.createElement('tr');
        let cornerCell = document.createElement('th');
        headerRow.appendChild(cornerCell);
        
        for (let col = 0; col < gridData[0].length; col++) {
            let th = document.createElement('th');
            th.textContent = String.fromCharCode(65 + col);
            headerRow.appendChild(th);
        }
        
        let rightCornerCell = document.createElement('th');
        headerRow.appendChild(rightCornerCell);
        
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        let tbody = document.createElement('tbody');
        
        gridData.forEach((row, rowIndex) => {
            let tr = document.createElement('tr');
            
            let rowHeader = document.createElement('th');
            rowHeader.textContent = rowIndex + 1;
            tr.appendChild(rowHeader);
            
            row.forEach((cell, colIndex) => {
                let td = document.createElement('td');
                td.textContent = cell.value;
                td.setAttribute('role', 'gridcell');
                td.setAttribute('aria-label', `Cell ${rowIndex + 1}${String.fromCharCode(65 + colIndex)}: ${cell.value}`);
                td.setAttribute('tabindex', '0');
                
                if (cell.type === 'number') td.classList.add('number-cell');
                if (cell.type === 'special') td.classList.add('special-cell');
                if (cell.shaded) td.classList.add('shaded-cell');
                
                tr.appendChild(td);
            });
            
            let rightRowHeader = document.createElement('th');
            rightRowHeader.textContent = rowIndex + 1;
            tr.appendChild(rightRowHeader);
            
            tbody.appendChild(tr);
        });
        
        table.appendChild(tbody);
        
        let tfoot = document.createElement('tfoot');
        let footerRow = document.createElement('tr');
        let bottomCornerCell = document.createElement('th');
        footerRow.appendChild(bottomCornerCell);
        
        for (let col = 0; col < gridData[0].length; col++) {
            let th = document.createElement('th');
            th.textContent = String.fromCharCode(65 + col);
            footerRow.appendChild(th);
        }
        
        let bottomRightCornerCell = document.createElement('th');
        footerRow.appendChild(bottomRightCornerCell);
        tfoot.appendChild(footerRow);
        
        let footerTitleRow = document.createElement('tr');
        let footerTitleCell = document.createElement('th');
        footerTitleCell.colSpan = gridData[0].length + 2;
        footerTitleCell.textContent = `${this.gridGenerator.getCharacterSetDescription()}`;
        footerTitleCell.className = 'grid-title';
        footerTitleRow.appendChild(footerTitleCell);
        tfoot.appendChild(footerTitleRow);
        
        table.appendChild(tfoot);
        
        gridContainer.innerHTML = '';
        gridContainer.appendChild(table);
        
        // Set focus to the first cell after grid update
        setTimeout(() => this.focusFirstGridCell(), 0);
    }
    
    applyPreset(config) {
        const idMap = {
            includeUpper: 'uppercase',
            includeLower: 'lowercase',
            includeNumbers: 'numbers',
            includeSpecial: 'special',
            avoidAmbiguous: 'avoid-ambiguous',
            gridRows: 'grid-rows',
            gridCols: 'grid-cols',
            shadingOption: 'shading',
            innerLines: 'inner-lines',
            colorNumbers: 'color-numbers',
            colorSpecials: 'color-specials'
        };
        Object.entries(config).forEach(([key, value]) => {
            const elementId = idMap[key] || key;
            const element = document.getElementById(elementId);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = value;
                    element.setAttribute('aria-checked', value.toString());
                    element.dispatchEvent(new Event('change'));
                } else {
                    element.value = value;
                    element.dispatchEvent(new Event('input'));
                }
            }
        });
    }
    
    saveSettings() {
        try {
            const options = this.getOptionsFromUI();
            options.theme = document.getElementById('grid-theme').value;
            localStorage.setItem('passGridOptions', JSON.stringify(options));
        } catch (e) {
            console.warn('Could not save settings to localStorage', e);
        }
    }
    
    loadSettings() {
        try {
            const savedOptions = localStorage.getItem('passGridOptions');
            if (savedOptions) {
                const options = JSON.parse(savedOptions);
                this.gridGenerator.setOptions(options);
                
                document.getElementById('seed-value').value = options.seedValue || "TANGO";
                document.getElementById('uppercase').checked = options.includeUpper !== false;
                document.getElementById('lowercase').checked = options.includeLower !== false;
                document.getElementById('numbers').checked = options.includeNumbers !== false;
                document.getElementById('special').checked = options.includeSpecial !== false;
                document.getElementById('avoid-ambiguous').checked = options.avoidAmbiguous === true;
                document.getElementById('grid-rows').value = options.gridRows || 16;
                document.getElementById('grid-cols').value = options.gridCols || 16;
                document.getElementById('shading').value = options.shadingOption || 0;
                document.getElementById('inner-lines').checked = options.innerLines !== false;
                document.getElementById('grid-theme').value = options.theme || 'classic';
                document.getElementById('color-numbers').checked = options.colorNumbers !== false;
                document.getElementById('color-specials').checked = options.colorSpecials !== false;
            }
        } catch (e) {
            console.warn('Could not load settings from localStorage', e);
        }
        this.generateGrid();
    }
    
    validateAndGenerateGrid() {
        try {
            const seedInput = document.getElementById('seed-value');
            const seed = SecurityUtils.InputValidator.validateSeed(seedInput.value);
            
            // Rate limiting check
            const now = Date.now();
            if (now - this.lastRequestTime < this.minRequestInterval) {
                console.warn('Too many requests. Please wait a moment.');
                return;
            }

            // Update last request time
            this.lastRequestTime = now;

            // Proceed with grid generation
            this.generateGrid();
        } catch (error) {
            this.showError(error.message);
        }
    }

    showError(message, duration = 5000) {
        const errorDiv = document.getElementById('error-message');
        errorDiv.textContent = message;
        errorDiv.setAttribute('role', 'alert');
        errorDiv.setAttribute('aria-live', 'assertive');
        errorDiv.classList.add('show');
        
        // Announce error to screen readers
        const announcement = document.createElement('div');
        announcement.setAttribute('role', 'status');
        announcement.setAttribute('aria-live', 'polite');
        announcement.className = 'sr-only';
        announcement.textContent = `Error: ${message}`;
        document.body.appendChild(announcement);
        
        setTimeout(() => {
            errorDiv.classList.remove('show');
            document.body.removeChild(announcement);
        }, duration);
    }

    showSuccess(message, duration = 3000) {
        const successDiv = document.getElementById('success-message');
        successDiv.textContent = message;
        successDiv.setAttribute('role', 'status');
        successDiv.setAttribute('aria-live', 'polite');
        successDiv.classList.add('show');
        
        // Announce success to screen readers
        const announcement = document.createElement('div');
        announcement.setAttribute('role', 'status');
        announcement.setAttribute('aria-live', 'polite');
        announcement.className = 'sr-only';
        announcement.textContent = message;
        document.body.appendChild(announcement);
        
        setTimeout(() => {
            successDiv.classList.remove('show');
            document.body.removeChild(announcement);
        }, duration);
    }

    generateGrid() {
        try {
            const options = this.getOptionsFromUI();
            this.gridGenerator.setOptions(options);
            const result = this.gridGenerator.generateGrid();
            this.updateStatusPanel(result);
            this.renderGrid(result.grid);
            this.saveSettings();
        } catch (error) {
            alert(`Error generating grid: ${error.message}`);
            console.error(error);
        }
    }
}