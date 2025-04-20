// Security configuration and utilities
const SECURITY_CONFIG = {
    MAX_REQUESTS_PER_MINUTE: 30,
    MIN_SEED_LENGTH: 3,
    MAX_SEED_LENGTH: 100,
    ALLOWED_CHARACTERS: /^[a-zA-Z0-9\s\-_.,!@#$%^&*()]+$/,
    RATE_LIMIT_WINDOW: 60000 // 1 minute in milliseconds
};

// Rate limiting implementation
class RateLimiter {
    constructor() {
        this.requests = new Map();
    }

    isAllowed(ip) {
        const now = Date.now();
        const userRequests = this.requests.get(ip) || [];
        
        // Remove old requests
        const recentRequests = userRequests.filter(time => now - time < SECURITY_CONFIG.RATE_LIMIT_WINDOW);
        
        if (recentRequests.length >= SECURITY_CONFIG.MAX_REQUESTS_PER_MINUTE) {
            return false;
        }
        
        recentRequests.push(now);
        this.requests.set(ip, recentRequests);
        return true;
    }
}

// Input validation
class InputValidator {
    static validateSeed(seed) {
        if (!seed) {
            throw new Error('Seed value is required');
        }

        if (seed.length < SECURITY_CONFIG.MIN_SEED_LENGTH) {
            throw new Error(`Seed must be at least ${SECURITY_CONFIG.MIN_SEED_LENGTH} characters long`);
        }

        if (seed.length > SECURITY_CONFIG.MAX_SEED_LENGTH) {
            throw new Error(`Seed must not exceed ${SECURITY_CONFIG.MAX_SEED_LENGTH} characters`);
        }

        if (!SECURITY_CONFIG.ALLOWED_CHARACTERS.test(seed)) {
            throw new Error('Seed contains invalid characters');
        }

        return seed.trim();
    }

    static sanitizeInput(input) {
        return input.replace(/[<>]/g, ''); // Basic XSS prevention
    }
}

// Export security utilities
window.SecurityUtils = {
    RateLimiter,
    InputValidator,
    SECURITY_CONFIG
}; 