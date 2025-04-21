// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const gridGenerator = new PasswordGrid();
        const ui = new UIController(gridGenerator);
        window.uiController = ui; // Optional: for console debugging

        if ('serviceWorker' in navigator) {
            console.log('Service Worker is supported in this browser');
        } else {
            console.log('Service Worker is not supported in this browser');
        }

        // Theme handling
        const themeToggle = document.getElementById('theme-toggle');
        const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
        
        // Function to set theme
        function setTheme(theme) {
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
        }

        // Initialize theme
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            setTheme(savedTheme);
        } else if (prefersDarkScheme.matches) {
            setTheme('dark');
        } else {
            setTheme('light');
        }

        // Theme toggle click handler
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                const currentTheme = document.documentElement.getAttribute('data-theme');
                const newTheme = currentTheme === 'light' ? 'dark' : 'light';
                setTheme(newTheme);
                ui.generateGrid(); // Regenerate grid to apply theme-specific styles
            });
        }

        // Update theme if system preference changes and no theme is saved
        prefersDarkScheme.addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                setTheme(e.matches ? 'dark' : 'light');
                ui.generateGrid(); // Regenerate grid to apply theme-specific styles
            }
        });
    } catch (error) {
        console.error('Application initialization failed:', error);
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.textContent = 'An error occurred while loading the application. Please refresh the page.';
        document.body.appendChild(errorMessage);
    }
});