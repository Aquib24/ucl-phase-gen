// ============================================
// storage.js - FIXED clear method
// ============================================

const Storage = {
    KEY: 'UCL_COMPETITION_V3',

    save() {
        try {
            const state = {
                teams: DataStore.teams,
                players: DataStore.players,
                matches: DataStore.matches,
                nextIds: DataStore.nextIds
            };
            localStorage.setItem(this.KEY, JSON.stringify(state));
            console.log('Saved to localStorage');
            return true;
        } catch (e) {
            console.error('Save failed:', e);
            return false;
        }
    },

    load() {
        try {
            const raw = localStorage.getItem(this.KEY);
            if (!raw) {
                console.log('No saved data found');
                return false;
            }
            
            const state = JSON.parse(raw);
            DataStore.teams = state.teams || [];
            DataStore.players = state.players || [];
            DataStore.matches = state.matches || [];
            DataStore.nextIds = state.nextIds || { team: 100, player: 1000, match: 5000 };
            
            // Rebuild team-player links
            DataStore.teams.forEach(team => {
                team.players = DataStore.players
                    .filter(p => p.teamId === team.id)
                    .map(p => p.id);
            });
            
            console.log('Loaded from localStorage');
            return true;
        } catch (e) {
            console.error('Load failed:', e);
            return false;
        }
    },

    exportToFile() {
        const state = {
            teams: DataStore.teams,
            players: DataStore.players,
            matches: DataStore.matches,
            nextIds: DataStore.nextIds,
            exportedAt: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ucl-competition-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    },

    async importFromFile(file) {
        try {
            const text = await file.text();
            const state = JSON.parse(text);
            
            DataStore.teams = state.teams || [];
            DataStore.players = state.players || [];
            DataStore.matches = state.matches || [];
            DataStore.nextIds = state.nextIds || { team: 100, player: 1000, match: 5000 };
            
            this.save();
            return true;
        } catch (e) {
            console.error('Import failed:', e);
            return false;
        }
    },

    // 🔥 FIXED clear method
    clear() {
        localStorage.removeItem(this.KEY);
        console.log('localStorage cleared');
    }
};

window.Storage = Storage;