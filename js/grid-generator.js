class PasswordGrid {
    constructor() {
        this.UPPER_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        this.LOWER_CHARS = "abcdefghijklmnopqrstuvwxyz";
        this.NUMBER_CHARS = "0123456789";
        this.SPECIAL_CHARS = "!@#$%^&*()-_=+[]{};:,.<>/?";
        this.AMBIGUOUS_CHARS = "0O1lI|5S8B6G";
        
        this.MINIMUM_CHAR_SETS = 2;
        this.MINIMUM_ENTROPY = 64;
        
        this.options = {
            seedValue: "TANGO",
            includeUpper: true,
            includeLower: true,
            includeNumbers: true,
            includeSpecial: true,
            avoidAmbiguous: false,
            gridRows: 16,
            gridCols: 16,
            shadingOption: 0,
            innerLines: true
        };
    }
    
    setOptions(options) {
        this.options = {...this.options, ...options};
    }
    
    validateCharacterSets() {
        const selectedSets = [
            this.options.includeUpper,
            this.options.includeLower,
            this.options.includeNumbers,
            this.options.includeSpecial
        ].filter(Boolean).length;

        if (selectedSets < this.MINIMUM_CHAR_SETS) {
            throw new Error(`Please select at least ${this.MINIMUM_CHAR_SETS} character sets for adequate security`);
        }
    }
    
    generateSeedValue(seedText) {
        let seed = 0;
        for (let i = 0; i < seedText.length; i++) {
            seed = (seed + seedText.charCodeAt(i)) % 1000000;
        }
        return seed;
    }
    
    generateSecureSeed() {
        const array = new Uint32Array(4);
        crypto.getRandomValues(array);
        return Array.from(array)
            .map(x => x.toString(36))
            .join('')
            .toUpperCase()
            .slice(0, 10);
    }
    
    seededRandom(seed) {
        let value = seed;
        return function() {
            value = (value * 9301 + 49297) % 233280;
            return value / 233280;
        };
    }
    
    buildCharacterSet() {
        let charSet = "";
        
        if (this.options.includeUpper) charSet += this.UPPER_CHARS;
        if (this.options.includeLower) charSet += this.LOWER_CHARS;
        if (this.options.includeNumbers) charSet += this.NUMBER_CHARS;
        if (this.options.includeSpecial) charSet += this.SPECIAL_CHARS;
        
        if (this.options.avoidAmbiguous) {
            let finalCharSet = "";
            for (let i = 0; i < charSet.length; i++) {
                if (!this.AMBIGUOUS_CHARS.includes(charSet[i])) {
                    finalCharSet += charSet[i];
                }
            }
            charSet = finalCharSet;
            
            if (charSet.length === 0) {
                charSet = "ACDEFHJKLMNPQRTUVWXYZ";
            }
        }
        
        return charSet;
    }
    
    calculateSecurityMetrics(charSet) {
        const entropyPerChar = Math.log2(charSet.length);
        const avgPathLength = Math.sqrt(this.options.gridRows * this.options.gridCols);
        const totalEntropy = avgPathLength * entropyPerChar;
        
        let complexityRating;
        if (totalEntropy < 64) {
            complexityRating = { text: "Weak", class: "weak" };
        } else if (totalEntropy < 80) {
            complexityRating = { text: "Moderate", class: "moderate" };
        } else if (totalEntropy < 100) {
            complexityRating = { text: "Strong", class: "strong" };
        } else {
            complexityRating = { text: "Very Strong", class: "very-strong" };
        }
        
        return {
            charSetSize: charSet.length,
            entropyPerChar: entropyPerChar.toFixed(2),
            pathLength: Math.round(avgPathLength),
            totalEntropy: totalEntropy.toFixed(2),
            complexityRating: complexityRating
        };
    }
    
    getCharacterSetDescription() {
        let parts = [];
        if (this.options.includeUpper) parts.push("Upper");
        if (this.options.includeLower) parts.push("Lower");
        if (this.options.includeNumbers) parts.push("Numbers");
        if (this.options.includeSpecial) parts.push("Special");
        if (this.options.avoidAmbiguous) parts.push("(No Ambig)");
        return parts.join(' ');
    }
    
    generateGrid() {
        try {
            this.validateCharacterSets();
            const seedNum = this.generateSeedValue(this.options.seedValue);
            const random = this.seededRandom(seedNum); 
            
            const charSet = this.buildCharacterSet();
            const metrics = this.calculateSecurityMetrics(charSet);
            
            const grid = [];
            for (let row = 0; row < this.options.gridRows; row++) {
                const gridRow = [];
                for (let col = 0; col < this.options.gridCols; col++) {
                    const charIndex = Math.floor(random() * charSet.length);
                    const char = charSet[charIndex];
                    
                    let type = 'normal';
                    if (this.NUMBER_CHARS.includes(char)) {
                        type = 'number';
                    } else if (this.SPECIAL_CHARS.includes(char)) {
                        type = 'special';
                    }
                    
                    let isShaded = false;
                    switch (parseInt(this.options.shadingOption)) {
                        case 1: // Checkerboard 2x2 handled in CSS
                            break;
                        case 2: // Alternating Rows handled in CSS
                            break;
                        case 3: // Diagonal Stripes handled in CSS
                            break;
                        case 4: // Quadrants
                            const halfRows = Math.floor(this.options.gridRows / 2);
                            const halfCols = Math.floor(this.options.gridCols / 2);
                            isShaded = (row < halfRows && col < halfCols) || (row >= halfRows && col >= halfCols);
                            break;
                        case 5: // Sparse Dots handled in CSS
                            break;
                    }
                    
                    gridRow.push({
                        value: char,
                        type: type,
                        shaded: isShaded,
                        position: {
                            row: row + 1, 
                            col: String.fromCharCode(65 + col)
                        }
                    });
                }
                grid.push(gridRow);
            }
            
            const result = { 
                grid, 
                metrics,
                options: {...this.options},
                charSets: this.getCharacterSetDescription()
            };

            if (metrics.totalEntropy < this.MINIMUM_ENTROPY) {
                console.warn('Warning: Grid entropy below recommended threshold');
            }

            return result;
        } catch (error) {
            throw new Error(`Grid generation failed: ${error.message}`);
        }
    }
}