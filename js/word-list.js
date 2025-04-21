// Common, memorable English words for generating passphrases
const WordList = {
    nouns: [
        'apple', 'bird', 'book', 'cake', 'cat', 'cloud', 'dog', 'door', 'fish',
        'flag', 'flower', 'game', 'gift', 'home', 'key', 'king', 'lamp', 'leaf',
        'moon', 'nest', 'park', 'rain', 'ring', 'road', 'ship', 'star', 'sun',
        'tree', 'wall', 'wind'
    ],
    verbs: [
        'bake', 'climb', 'dance', 'dream', 'float', 'fly', 'grow', 'jump',
        'laugh', 'paint', 'play', 'read', 'run', 'sing', 'sleep', 'swim',
        'think', 'walk', 'write', 'zoom'
    ],
    adjectives: [
        'blue', 'bold', 'brave', 'calm', 'cool', 'dark', 'fast', 'good',
        'green', 'happy', 'kind', 'light', 'new', 'pink', 'quick', 'red',
        'soft', 'warm', 'wise', 'young'
    ],

    getRandomWord(category) {
        const words = this[category];
        return words[Math.floor(Math.random() * words.length)];
    },

    generatePassphrase(wordCount) {
        const words = [];
        const categories = ['adjectives', 'nouns', 'verbs'];
        
        for (let i = 0; i < wordCount; i++) {
            // Cycle through categories, but start randomly
            const category = categories[i % categories.length];
            words.push(this.getRandomWord(category));
        }
        
        return words.join('-');
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WordList;
} 