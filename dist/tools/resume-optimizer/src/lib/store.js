/**
 * Simple State Management Store
 * Inspired by Redux but lightweight for vanilla JS
 */

class Store {
    constructor(initialState = {}) {
        this.state = {
            profile: {
                name: '',
                title: '',
                email: '',
                phone: '',
                location: '',
                summary: ''
            },
            experience: [],
            education: [],
            skills: [],
            projects: [],
            ...initialState
        };
        this.listeners = [];
    }

    // Get current state
    getState() {
        return { ...this.state };
    }

    // Update state
    setState(updater) {
        const newState = typeof updater === 'function' 
            ? updater(this.state) 
            : { ...this.state, ...updater };
        
        this.state = newState;
        this.notify();
    }

    // Update specific path
    updatePath(path, value) {
        const keys = path.split('.');
        const newState = { ...this.state };
        let current = newState;
        
        for (let i = 0; i < keys.length - 1; i++) {
            current[keys[i]] = { ...current[keys[i]] };
            current = current[keys[i]];
        }
        
        current[keys[keys.length - 1]] = value;
        this.state = newState;
        this.notify();
    }

    // Subscribe to changes
    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    // Notify all listeners
    notify() {
        this.listeners.forEach(listener => listener(this.state));
    }

    // Reset to initial state
    reset() {
        this.state = {
            profile: {
                name: '',
                title: '',
                email: '',
                phone: '',
                location: '',
                summary: ''
            },
            experience: [],
            education: [],
            skills: [],
            projects: []
        };
        this.notify();
    }

    // Load from localStorage
    load() {
        try {
            const saved = localStorage.getItem('resumeOptimizerState');
            if (saved) {
                this.state = JSON.parse(saved);
                this.notify();
            }
        } catch (e) {
            console.error('Failed to load state:', e);
        }
    }

    // Save to localStorage
    save() {
        try {
            localStorage.setItem('resumeOptimizerState', JSON.stringify(this.state));
        } catch (e) {
            console.error('Failed to save state:', e);
        }
    }

    // Add array item
    addArrayItem(path, item) {
        const current = this.getState()[path] || [];
        this.updatePath(path, [...current, { id: Date.now(), ...item }]);
    }

    // Remove array item
    removeArrayItem(path, id) {
        const current = this.getState()[path] || [];
        this.updatePath(path, current.filter(item => item.id !== id));
    }

    // Update array item
    updateArrayItem(path, id, updates) {
        const current = this.getState()[path] || [];
        this.updatePath(path, current.map(item => 
            item.id === id ? { ...item, ...updates } : item
        ));
    }
}

// Create global store instance
const store = new Store();

// Auto-save on changes
store.subscribe(() => {
    store.save();
});

// Load saved state on init
store.load();
