// ============================================
// app.js - COMPLETE with WORKING RESET
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('UCL Manager starting...');
    
    // Load saved state
    Storage.load();
    
    // Link players to teams
    DataStore.players.forEach(player => {
        if (!player.teamId) {
            const team = DataStore.getTeamByName(player.teamName);
            if (team) {
                player.teamId = team.id;
                if (!team.players.includes(player.id)) {
                    team.players.push(player.id);
                }
            }
        }
    });
    
    UIRenderer.renderAll();

    // ============ SAMPLE TEAMS ============
    document.getElementById('sampleTeamsBtn').addEventListener('click', () => {
        const teamsCSV = CSVParser.generateSampleTeams();
        const playersCSV = CSVParser.generateSamplePlayers();
        
        const blob1 = new Blob([teamsCSV], { type: 'text/csv' });
        const blob2 = new Blob([playersCSV], { type: 'text/csv' });
        
        const a1 = document.createElement('a');
        a1.href = URL.createObjectURL(blob1);
        a1.download = 'sample_teams.csv';
        a1.click();
        
        const a2 = document.createElement('a');
        a2.href = URL.createObjectURL(blob2);
        a2.download = 'sample_players.csv';
        a2.click();
        
        URL.revokeObjectURL(blob1);
        URL.revokeObjectURL(blob2);
        
        UIRenderer.showStatus('Sample CSV files downloaded', false);
    });

    // ============ LOAD DATA ============
    document.getElementById('loadDataBtn').addEventListener('click', async () => {
        try {
            const teamsFile = document.getElementById('teamsCSVUpload').files[0];
            const playersFile = document.getElementById('playersCSVUpload').files[0];
            
            if (!teamsFile || !playersFile) {
                throw new Error('Upload both CSV files');
            }
            
            const teamLines = await CSVParser.readFile(teamsFile);
            const playerLines = await CSVParser.readFile(playersFile);
            
            const teams = CSVParser.parseTeams(teamLines);
            const players = CSVParser.parsePlayers(playerLines);
            
            if (teams.length !== 36) {
                throw new Error(`Need 36 teams, got ${teams.length}`);
            }
            
            DataStore.reset();
            teams.forEach(t => DataStore.addTeam(t));
            players.forEach(p => DataStore.addPlayer(p));
            
            Storage.save();
            UIRenderer.renderAll();
            UIRenderer.showStatus(`Loaded ${teams.length} teams, ${players.length} players`, false);
            
        } catch (err) {
            UIRenderer.showStatus(err.message, true);
        }
    });

    // ============ DRAW ============
    document.getElementById('drawBtn').addEventListener('click', () => {
        try {
            if (DataStore.teams.length !== 36) {
                throw new Error('Load 36 teams first');
            }
            
            const matches = DrawEngine.generateSchedule();
            UIRenderer.renderAll();
            UIRenderer.showDrawFeedback(`Generated ${matches.length} matches`, true);
            
        } catch (err) {
            UIRenderer.showDrawFeedback(err.message, false);
        }
    });

    // ============ VALIDATE DRAW ============
    document.getElementById('validateDrawBtn').addEventListener('click', () => {
        const validation = DrawEngine.validateSchedule(DataStore.matches);
        UIRenderer.showDrawFeedback(
            validation.valid ? '✓ Valid schedule' : validation.errors[0], 
            validation.valid
        );
    });

    // ============ SEARCH EVENT LISTENERS ============
    
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            UIRenderer.renderSearchResults();
        });
    }
    
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                UIRenderer.renderSearchResults();
            }
        });
    }
    
    const matchdayFilter = document.getElementById('matchdaySearchFilter');
    if (matchdayFilter) {
        matchdayFilter.addEventListener('change', () => {
            UIRenderer.renderSearchResults();
        });
    }
    
    const teamFilter = document.getElementById('teamSearchFilter');
    if (teamFilter) {
        teamFilter.addEventListener('change', () => {
            UIRenderer.renderSearchResults();
        });
    }
    
    const statusFilter = document.getElementById('statusSearchFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', () => {
            UIRenderer.renderSearchResults();
        });
    }
    
    const resetSearchBtn = document.getElementById('resetSearchBtn');
    if (resetSearchBtn) {
        resetSearchBtn.addEventListener('click', () => {
            document.getElementById('searchInput').value = '';
            document.getElementById('matchdaySearchFilter').value = '0';
            document.getElementById('teamSearchFilter').value = '0';
            document.getElementById('statusSearchFilter').value = 'all';
            UIRenderer.renderSearchResults();
        });
    }
    
    const refreshBtn = document.getElementById('refreshResultsBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            UIRenderer.renderSearchResults();
        });
    }

    // ============ MATCH EDITOR ============
    
    // Load Match
    const loadMatchBtn = document.getElementById('loadMatchBtn');
    if (loadMatchBtn) {
        loadMatchBtn.addEventListener('click', () => {
            const select = document.getElementById('matchSelector');
            const matchId = parseInt(select.value);
            if (matchId) UIRenderer.renderMatchEditor(matchId);
        });
    }

    // Add Goal
    const addGoalBtn = document.getElementById('addGoalEventBtn');
    if (addGoalBtn) {
        addGoalBtn.addEventListener('click', () => {
            const matchId = parseInt(document.getElementById('saveMatchBtn').dataset.matchId);
            const scorerId = parseInt(document.getElementById('scorerSelect').value);
            const minute = parseInt(document.getElementById('minuteInput').value) || 45;
            
            if (!scorerId) {
                alert('Select a scorer');
                return;
            }
            
            const match = DataStore.getMatchById(matchId);
            if (match && !match.played) {
                match.events.push({
                    minute,
                    scorerId,
                    assisterId: document.getElementById('assisterSelect').value ? parseInt(document.getElementById('assisterSelect').value) : null
                });
                document.getElementById('minuteInput').value = '';
                UIRenderer.renderMatchEditor(matchId);
                Storage.save();
            }
        });
    }

    // Save Match
    const saveMatchBtn = document.getElementById('saveMatchBtn');
    if (saveMatchBtn) {
        saveMatchBtn.addEventListener('click', () => {
            const matchId = parseInt(document.getElementById('saveMatchBtn').dataset.matchId);
            const match = DataStore.getMatchById(matchId);
            
            if (!match || match.played) {
                alert('Match already played or invalid');
                return;
            }
            
            match.played = true;
            match.score.home = parseInt(document.getElementById('homeScore').value) || 0;
            match.score.away = parseInt(document.getElementById('awayScore').value) || 0;
            match.motmPlayerId = document.getElementById('motmSelect').value ? parseInt(document.getElementById('motmSelect').value) : null;
            
            StatsEngine.recalculate();
            Storage.save();
            UIRenderer.renderAll();
            UIRenderer.renderSearchResults();
            document.getElementById('matchEditPanel').style.display = 'none';
            UIRenderer.showStatus('Match saved', false);
        });
    }

    // ============ EXPORT/IMPORT ============
    
    // Export
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            Storage.exportToFile();
        });
    }

    // Import
    const importFile = document.getElementById('importFile');
    if (importFile) {
        importFile.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const success = await Storage.importFromFile(file);
            UIRenderer.renderAll();
            UIRenderer.showStatus(success ? 'Import successful' : 'Import failed', !success);
            e.target.value = '';
        });
    }

    // ============ 🔥 FIXED RESET BUTTON ============
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm('⚠️ Reset ALL competition data? This will delete everything and start fresh.')) {
                // Clear localStorage
                Storage.clear();
                
                // Reset DataStore to empty state
                DataStore.reset();
                
                // Add default empty structure
                DataStore.teams = [];
                DataStore.players = [];
                DataStore.matches = [];
                DataStore.nextIds = { team: 100, player: 1000, match: 5000 };
                
                // Force save empty state
                Storage.save();
                
                // Re-render everything
                UIRenderer.renderAll();
                
                // Clear any open editor panels
                const editorPanel = document.getElementById('matchEditPanel');
                if (editorPanel) editorPanel.style.display = 'none';
                
                // Clear search results
                const searchResults = document.getElementById('searchResultsList');
                if (searchResults) searchResults.innerHTML = '';
                
                // Update result count
                const resultCount = document.getElementById('resultCount');
                if (resultCount) resultCount.textContent = '(0)';
                
                // Show success message
                UIRenderer.showStatus('✅ All data reset. Ready to start fresh!', false);
                
                console.log('Reset complete - DataStore:', DataStore);
            }
        });
    }

    // ============ AUTO-SAVE ============
    window.addEventListener('beforeunload', () => {
        Storage.save();
    });
});