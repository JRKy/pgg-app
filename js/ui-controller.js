class UIController {
    constructor(gridGenerator) {
        this.gridGenerator = gridGenerator;
        this.rateLimiter = new SecurityUtils.RateLimiter();
        this.lastRequestTime = 0;
        this.minRequestInterval = 300;
        this.requestQueue = [];
        this.isProcessing = false;
        this.initializing = true;
        this.loadingIndicator = this.createLoadingIndicator();
        this.gridStyles = {
            fontSize: '16',
            padding: '8',
            textColor: '#000000',
            borderColor: '#4A5568',
            evenColumns: '#F7FAFC',
            oddColumns: '#FFFFFF'
        };

        // Initialize CSS variables
        this.updateCSSVariables();

        // Initialize grid with a random seed
        const initialSeed = this.generateRandomPassphrase();
        this.currentSeed = initialSeed;

        this.setupEventListeners();
        this.setupTooltips();
        this.setupKeyboardNavigation();
        this.initializing = false;
        this.generateGrid();
        this.loadFromURL();
        this.loadTheme();
        this.loadGridStylePreferences();
    }
    
    generateRandomPassphrase(wordCount = 3) {
        return WordList.generatePassphrase(wordCount);
    }

    generateRandomCharacterSeed(length = 12) {
        const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        return result;
    }

    setupEventListeners() {
        // Seed type and word count controls
        const seedTypeSelect = document.getElementById('seed-type');
        const wordCountContainer = document.getElementById('word-count-container');
        const wordCountSelect = document.getElementById('word-count');
        const seedInput = document.getElementById('seed');
        const randomSeedBtn = document.getElementById('random-seed-btn');

        if (seedTypeSelect) {
            seedTypeSelect.addEventListener('change', (e) => {
                if (wordCountContainer) {
                    wordCountContainer.style.display = e.target.value === 'passphrase' ? 'flex' : 'none';
                }
                this.generateNewSeed();
            });
        }

        if (wordCountSelect) {
            wordCountSelect.addEventListener('change', () => {
                this.generateNewSeed();
            });
        }

        if (seedInput) {
            seedInput.value = this.currentSeed;
            seedInput.addEventListener('input', (e) => {
                this.currentSeed = SecurityUtils.InputValidator.sanitizeInput(e.target.value);
                this.validateAndGenerateGrid();
            });
        }

        if (randomSeedBtn) {
            randomSeedBtn.addEventListener('click', () => {
                this.generateNewSeed();
            });
        }

        // Theme selection
        const themeSelect = document.getElementById('theme-select');
        if (themeSelect) {
            themeSelect.addEventListener('change', (e) => {
                this.setTheme(e.target.value);
                this.generateGrid(); // Regenerate grid to apply theme-specific styles
            });
        }

        // Grid appearance controls
        const gridControls = {
            'grid-font-size': (value) => this.updateGridStyle('fontSize', value),
            'grid-padding': (value) => this.updateGridStyle('padding', value),
            'grid-text-color': (value) => this.updateGridStyle('textColor', value),
            'border-text-color': (value) => this.updateGridStyle('borderColor', value),
            'even-columns-color': (value) => this.updateGridStyle('evenColumns', value),
            'odd-columns-color': (value) => this.updateGridStyle('oddColumns', value)
        };

        // Set up event listeners for all grid controls
        Object.entries(gridControls).forEach(([id, handler]) => {
            const element = document.getElementById(id);
            if (element) {
                element.value = this.gridStyles[id.replace(/-/g, '')] ?? element.value;
                element.addEventListener('change', (e) => handler(e.target.value));
            }
        });

        // Character set checkboxes
        const charSetCheckboxes = ['uppercase', 'lowercase', 'numbers', 'special', 'avoid-ambiguous'];
        charSetCheckboxes.forEach(id => {
            const checkbox = document.getElementById(id);
            if (checkbox) {
                checkbox.addEventListener('change', () => {
                    this.validateAndGenerateGrid();
                });
            }
        });

        // Print and Share buttons
        const printBtn = document.getElementById('print-btn');
        if (printBtn) {
            printBtn.addEventListener('click', () => {
                window.print();
            });
        }

        const shareBtn = document.getElementById('share-btn');
        if (shareBtn) {
            shareBtn.addEventListener('click', async () => {
                try {
                    const url = this.generateShareURL();
                    await navigator.clipboard.writeText(url);
                    this.showSuccess('Grid URL copied to clipboard!');
                } catch (err) {
                    this.showError('Failed to copy URL: ' + err.message);
                }
            });
        }

        // Panel toggles
        const settingsBtn = document.getElementById('settings-btn');
        const settingsPanel = document.getElementById('settings-panel');
        const settingsClose = document.getElementById('settings-close');
        const overlay = document.getElementById('overlay');

        if (settingsBtn && settingsPanel && settingsClose) {
            settingsBtn.addEventListener('click', () => {
                settingsPanel.classList.add('open');
                overlay.classList.add('active');
            });

            settingsClose.addEventListener('click', () => {
                settingsPanel.classList.remove('open');
                overlay.classList.remove('active');
            });
        }

        const helpBtn = document.getElementById('help-btn');
        const helpPanel = document.getElementById('help-panel');
        const helpClose = document.getElementById('help-close');

        if (helpBtn && helpPanel && helpClose) {
            helpBtn.addEventListener('click', () => {
                helpPanel.classList.add('open');
                overlay.classList.add('active');
            });

            helpClose.addEventListener('click', () => {
                helpPanel.classList.remove('open');
                overlay.classList.remove('active');
            });
        }

        // Close panels when clicking overlay
        if (overlay) {
            overlay.addEventListener('click', () => {
                document.querySelectorAll('.settings-panel, .help-panel').forEach(panel => {
                    panel.classList.remove('open');
                });
                overlay.classList.remove('active');
            });
        }

        // Status panel toggle
        const statusToggle = document.querySelector('.status-toggle');
        const statusPanel = document.querySelector('.status-panel');
        
        if (statusToggle && statusPanel) {
            // Set initial state to expanded
            statusToggle.setAttribute('aria-expanded', 'true');
            
            statusToggle.addEventListener('click', () => {
                const isExpanded = statusToggle.getAttribute('aria-expanded') === 'true';
                statusToggle.setAttribute('aria-expanded', !isExpanded);
                statusPanel.classList.toggle('collapsed');
            });
        }

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

    updateFontPreview() {
        const preview = document.querySelector('.font-preview-text');
        const fontSelect = document.getElementById('grid-font-family');
        if (preview && fontSelect) {
            preview.style.fontFamily = fontSelect.value;
        }
    }

    generateShareURL() {
        const options = this.getOptionsFromUI();
        const url = new URL(window.location);
        Object.entries(options).forEach(([key, value]) => {
            url.searchParams.set(key, value);
        });
        url.searchParams.set('theme', document.documentElement.getAttribute('data-theme') || 'light');
        return url.toString();
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
            'seed': 'Seed value determines grid generation pattern. Use different seeds for different grids.',
            'avoid-ambiguous': 'Excludes characters that can be easily confused (like 0 and O, 1 and l)',
            'inner-lines': 'Show or hide grid cell borders',
            'color-numbers': 'Highlight numbers in a different color',
            'color-specials': 'Highlight special characters in a different color'
        };

        Object.entries(tooltipElements).forEach(([id, text]) => {
            const element = document.getElementById(id);
            if (element) {
                element.setAttribute('aria-describedby', `${id}-tooltip`);
                element.setAttribute('title', text);
            }
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
        const getElementValue = (id, defaultValue) => {
            const element = document.getElementById(id);
            return element ? element.value : defaultValue;
        };

        const getElementChecked = (id, defaultValue) => {
            const element = document.getElementById(id);
            return element ? element.checked : defaultValue;
        };

        const options = {
            seedValue: this.currentSeed,  // Use the stored seed value
            includeUpper: getElementChecked('uppercase', true),
            includeLower: getElementChecked('lowercase', true),
            includeNumbers: getElementChecked('numbers', true),
            includeSpecial: getElementChecked('special', true),
            avoidAmbiguous: getElementChecked('avoid-ambiguous', false),
            gridRows: parseInt(getElementValue('grid-rows', '16'), 10) || 16,
            gridCols: parseInt(getElementValue('grid-cols', '16'), 10) || 16,
            shadingPattern: getElementValue('shading', 'none'),
            innerLines: getElementChecked('inner-lines', false),
            colorNumbers: getElementChecked('color-numbers', true),
            colorSpecials: getElementChecked('color-specials', true)
        };

        return options;
    }
    
    updateStatusPanel(gridData) {
        const strengthElement = document.getElementById('password-strength');
        const complexityElement = document.getElementById('complexity-rating');
        const charSetsElement = document.getElementById('char-sets-status');
        
        if (strengthElement && complexityElement && charSetsElement) {
            const metrics = gridData.metrics;
            strengthElement.textContent = `${metrics.totalEntropy} bits`;
            complexityElement.textContent = metrics.complexityRating.text;
            complexityElement.className = `metric-description ${metrics.complexityRating.class}`;
            charSetsElement.textContent = gridData.charSets;
        }
    }
    
    renderGrid(gridData) {
        const gridContainer = document.getElementById('password-grid');
        let table = document.createElement('table');
        table.className = 'grid-table';
        table.setAttribute('role', 'grid');
        table.setAttribute('aria-label', `Password Grid with ${gridData.length} rows and ${gridData[0].length} columns`);
        
        // Apply all current styles to the table
        const {fontSize, padding, textColor, borderColor, evenColumns, oddColumns} = this.gridStyles;
        
        table.classList.add(
            `font-size-${fontSize}`,
            `padding-${padding}`
        );

        table.setAttribute('data-text-color', textColor);
        table.setAttribute('data-border-color', borderColor);
        table.setAttribute('data-even-columns', evenColumns);
        table.setAttribute('data-odd-columns', oddColumns);
        
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
        
        // Remove automatic focus on first cell
        // setTimeout(() => this.focusFirstGridCell(), 0);
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
            shadingPattern: 'shading',
            innerLines: 'inner-lines',
            colorNumbers: 'color-numbers',
            colorSpecials: 'color-specials'
        };

        // Set all values first
        Object.entries(config).forEach(([key, value]) => {
            const elementId = idMap[key] || key;
            const element = document.getElementById(elementId);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = value;
                    element.setAttribute('aria-checked', value.toString());
                } else {
                    element.value = value;
                }
            }
        });

        // Then trigger a single change event
        if (!this.initializing) {
            this.validateAndGenerateGrid();
        }
    }
    
    saveSettings() {
        try {
            const options = this.getOptionsFromUI();
            // Get theme from document attribute instead of element
            options.theme = document.documentElement.getAttribute('data-theme') || 'light';
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
                
                // Safely set values with null checks
                const setElementValue = (id, value) => {
                    const element = document.getElementById(id);
                    if (element) {
                        element.value = value;
                    }
                };

                const setElementChecked = (id, value) => {
                    const element = document.getElementById(id);
                    if (element) {
                        element.checked = value;
                    }
                };

                setElementValue('seed', options.seedValue || "TANGO");
                setElementChecked('uppercase', options.includeUpper !== false);
                setElementChecked('lowercase', options.includeLower !== false);
                setElementChecked('numbers', options.includeNumbers !== false);
                setElementChecked('special', options.includeSpecial !== false);
                setElementChecked('avoid-ambiguous', options.avoidAmbiguous === true);
                setElementValue('grid-rows', options.gridRows || 16);
                setElementValue('grid-cols', options.gridCols || 16);
                setElementValue('shading', options.shadingPattern || 'none');
                setElementChecked('inner-lines', options.innerLines !== false);
                setElementValue('grid-theme', options.theme || 'classic');
                setElementChecked('color-numbers', options.colorNumbers !== false);
                setElementChecked('color-specials', options.colorSpecials !== false);
            }
        } catch (e) {
            console.warn('Could not load settings from localStorage', e);
        }
        this.generateGrid();
    }
    
    createLoadingIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'loading-indicator';
        indicator.innerHTML = '<span class="spinner"></span>Updating grid...';
        document.body.appendChild(indicator);
        return indicator;
    }

    showLoadingIndicator() {
        this.loadingIndicator.classList.add('show');
    }

    hideLoadingIndicator() {
        this.loadingIndicator.classList.remove('show');
    }

    async processRequestQueue() {
        if (this.isProcessing || this.requestQueue.length === 0) return;
        
        this.isProcessing = true;
        this.showLoadingIndicator();
        
        while (this.requestQueue.length > 0) {
            const now = Date.now();
            if (now - this.lastRequestTime < this.minRequestInterval) {
                await new Promise(resolve => setTimeout(resolve, this.minRequestInterval));
                continue;
            }
            
            this.lastRequestTime = now;
            await this.generateGrid();
            this.requestQueue.shift();
        }
        
        this.isProcessing = false;
        this.hideLoadingIndicator();
    }

    validateAndGenerateGrid() {
        try {
            const seedInput = document.getElementById('seed');
            const seed = SecurityUtils.InputValidator.validateSeed(seedInput.value);
            
            // Skip rate limiting during initialization
            if (!this.initializing) {
                const now = Date.now();
                if (now - this.lastRequestTime < this.minRequestInterval) {
                    // Add request to queue instead of showing error
                    if (!this.requestQueue.includes('pending')) {
                        this.requestQueue.push('pending');
                        this.processRequestQueue();
                    }
                    return;
                }
                this.lastRequestTime = now;
            }

            this.generateGrid();
        } catch (error) {
            this.showError(error.message);
        }
    }

    showNotification(message, type = 'error', duration = 5000) {
        const notification = document.getElementById('notification');
        if (!notification) return;

        // Clear any existing classes and timeouts
        notification.className = 'notification';
        if (this.notificationTimeout) {
            clearTimeout(this.notificationTimeout);
        }

        // Set the message and show the notification
        notification.textContent = message;
        notification.classList.add(type, 'show');

        // Set up screen reader announcement
        const announcement = document.createElement('div');
        announcement.className = 'sr-only';
        announcement.textContent = `${type === 'error' ? 'Error' : 'Success'}: ${message}`;
        document.body.appendChild(announcement);

        // Hide the notification after duration
        this.notificationTimeout = setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.textContent = '';
                announcement.remove();
            }, 300); // Wait for fade out animation
        }, duration);
    }

    showError(message, duration = 5000) {
        this.showNotification(message, 'error', duration);
    }

    showSuccess(message, duration = 3000) {
        this.showNotification(message, 'success', duration);
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

    loadTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.setTheme(savedTheme);
    }

    setTheme(theme) {
        // Set theme on document
        document.documentElement.setAttribute('data-theme', theme);
        
        // Update select element if it exists
        const themeSelect = document.getElementById('theme-select');
        if (themeSelect) {
            themeSelect.value = theme;
        }
        
        // Save to localStorage
        localStorage.setItem('theme', theme);
        
        // Update any theme-dependent styles
        this.generateGrid();
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

    ensureMinimumSecurity() {
        const checkboxes = {
            uppercase: document.getElementById('uppercase'),
            lowercase: document.getElementById('lowercase'),
            numbers: document.getElementById('numbers'),
            special: document.getElementById('special')
        };

        // Count selected character sets
        const selectedCount = Object.values(checkboxes).filter(cb => cb.checked).length;

        // If only one set is selected, automatically enable another set
        if (selectedCount === 1) {
            const unselected = Object.entries(checkboxes)
                .filter(([_, cb]) => !cb.checked)
                .map(([id, _]) => id);

            if (unselected.length > 0) {
                // Prefer numbers if available, then special, then lowercase
                const priorityOrder = ['numbers', 'special', 'lowercase', 'uppercase'];
                const setToEnable = priorityOrder.find(id => unselected.includes(id));
                
                if (setToEnable) {
                    checkboxes[setToEnable].checked = true;
                    // Show a subtle notification that we've enabled an additional set
                    this.showSecurityNotification(`Added ${setToEnable} characters for better security`);
                }
            }
        }
    }

    showSecurityNotification(message) {
        // Create notification element if it doesn't exist
        let notification = document.getElementById('security-notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'security-notification';
            notification.className = 'security-notification';
            document.body.appendChild(notification);
        }

        // Update and show notification
        notification.textContent = message;
        notification.classList.add('show');

        // Hide after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    updateCSSVariables() {
        const root = document.documentElement;
        root.style.setProperty('--grid-font-size', `${this.gridStyles.fontSize}px`);
        root.style.setProperty('--grid-cell-padding', `${this.gridStyles.padding}px`);
        root.style.setProperty('--grid-text-color', this.gridStyles.textColor);
        root.style.setProperty('--border-text-color', this.gridStyles.borderColor);
        root.style.setProperty('--even-columns-color', this.gridStyles.evenColumns);
        root.style.setProperty('--odd-columns-color', this.gridStyles.oddColumns);
    }

    updateGridStyle(property, value) {
        // Update the style in our state
        this.gridStyles[property] = value;

        // Update CSS variables
        this.updateCSSVariables();

        // Save the updated style to localStorage
        localStorage.setItem('gridStyles', JSON.stringify(this.gridStyles));

        // Regenerate grid to apply changes if needed
        if (['fontSize', 'padding'].includes(property)) {
            this.generateGrid();
        }
    }

    setupGridStyleControls() {
        // The grid style controls are now handled in setupEventListeners
        // This method is kept for backward compatibility
        return;
    }

    loadGridStylePreferences() {
        // Load saved grid styles from localStorage
        const savedStyles = localStorage.getItem('gridStyles');
        if (savedStyles) {
            this.gridStyles = { ...this.gridStyles, ...JSON.parse(savedStyles) };
            this.updateCSSVariables();
        }

        // Apply saved styles to controls
        const controls = {
            'grid-font-size': this.gridStyles.fontSize,
            'grid-padding': this.gridStyles.padding,
            'grid-text-color': this.gridStyles.textColor,
            'border-text-color': this.gridStyles.borderColor,
            'even-columns-color': this.gridStyles.evenColumns,
            'odd-columns-color': this.gridStyles.oddColumns
        };

        Object.entries(controls).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.value = value;
            }
        });
    }

    async generateNewSeed() {
        const seedType = document.getElementById('seed-type')?.value || 'passphrase';
        const wordCount = parseInt(document.getElementById('word-count')?.value || '3', 10);
        const seedInput = document.getElementById('seed');

        let newSeed;
        if (seedType === 'passphrase') {
            newSeed = this.generateRandomPassphrase(wordCount);
        } else {
            newSeed = this.generateRandomCharacterSeed();
        }

        this.currentSeed = newSeed;
        if (seedInput) {
            seedInput.value = newSeed;
        }
        this.validateAndGenerateGrid();
    }
}