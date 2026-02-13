// ============================================
// uiRenderer.js - COMPLETE with Search
// ============================================

const UIRenderer = {
    renderAll() {
        this.renderTeamCloud();
        this.renderTeamCount();
        this.renderMatchCount();
        this.renderMatchdayTabs();
        this.renderMatchdayView(1);
        this.renderLeagueTable();
        this.renderLeaderboards();
        this.renderStatusBadge();
        this.populateTeamFilter();
        this.renderSearchResults();
    },

    // Team Management
    renderTeamCloud() {
        const container = document.getElementById('teamCloudContainer');
        if (!container) return;
        
        container.innerHTML = DataStore.teams
            .map(team => `
                <span class="team-badge">
                    ${team.name}
                    <span class="pot-tag">Pot ${team.pot}</span>
                    <span style="font-size:0.65rem;">${team.country}</span>
                </span>
            `).join('');
    },

    renderTeamCount() {
        const badge = document.getElementById('teamCountBadge');
        if (badge) badge.textContent = `${DataStore.teams.length}/36`;
    },

    renderMatchCount() {
        const badge = document.getElementById('matchCountBadge');
        if (badge) {
            const total = DataStore.matches.length;
            const played = DataStore.matches.filter(m => m.played).length;
            badge.textContent = `${played}/${total}`;
        }
    },

    // Matchday View
    renderMatchdayTabs() {
        const container = document.getElementById('matchdayTabBar');
        if (!container) return;
        
        let html = '';
        for (let i = 1; i <= 8; i++) {
            const count = DataStore.matches.filter(m => m.matchday === i).length;
            html += `<button class="match-tab" data-md="${i}">MD${i} (${count})</button>`;
        }
        container.innerHTML = html;
        
        container.querySelectorAll('.match-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                container.querySelectorAll('.match-tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                const md = parseInt(e.target.dataset.md);
                this.renderMatchdayView(md);
                document.getElementById('currentMDLabel').textContent = `MD${md}`;
            });
        });
        
        const firstTab = container.querySelector('.match-tab');
        if (firstTab) firstTab.classList.add('active');
    },

    renderMatchdayView(matchday) {
        const container = document.getElementById('matchdayMatchList');
        if (!container) return;
        
        const matches = DataStore.matches
            .filter(m => m.matchday === matchday)
            .sort((a, b) => {
                const homeA = DataStore.getTeamById(a.homeTeam)?.name || '';
                const homeB = DataStore.getTeamById(b.homeTeam)?.name || '';
                return homeA.localeCompare(homeB);
            });
        
        container.innerHTML = matches.map(match => {
            const home = DataStore.getTeamById(match.homeTeam);
            const away = DataStore.getTeamById(match.awayTeam);
            if (!home || !away) return '';
            
            if (match.played) {
                return `
                    <div class="match-item played">
                        <span><strong>${home.name}</strong> ${match.score.home}-${match.score.away} <strong>${away.name}</strong></span>
                    </div>
                `;
            } else {
                return `
                    <div class="match-item">
                        <span>${home.name} vs ${away.name}</span>
                        <span style="color:#6b8cae;">⏳</span>
                    </div>
                `;
            }
        }).join('');
    },

    // League Table
    renderLeagueTable() {
        const container = document.getElementById('leagueTableContainer');
        if (!container) return;
        
        const table = [...DataStore.teams].sort((a, b) => {
            if (a.stats.points !== b.stats.points) return b.stats.points - a.stats.points;
            if (a.stats.gd !== b.stats.gd) return b.stats.gd - a.stats.gd;
            return b.stats.gf - a.stats.gf;
        });
        
        let html = '<table><tr><th>Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th><th>GD</th><th>Pts</th></tr>';
        table.forEach(team => {
            html += `<tr>
                <td><strong>${team.name}</strong></td>
                <td>${team.stats.played}</td>
                <td>${team.stats.wins}</td>
                <td>${team.stats.draws}</td>
                <td>${team.stats.losses}</td>
                <td>${team.stats.gf}</td>
                <td>${team.stats.ga}</td>
                <td>${team.stats.gd}</td>
                <td><strong>${team.stats.points}</strong></td>
            </tr>`;
        });
        html += '</table>';
        container.innerHTML = html;
    },

    // Leaderboards
    renderLeaderboards() {
        // Top Scorers
        const scorers = [...DataStore.players].sort((a,b) => b.goals - a.goals).slice(0,10);
        const scorersEl = document.getElementById('scorersList');
        if (scorersEl) {
            scorersEl.innerHTML = scorers.map(p => {
                const team = DataStore.getTeamByPlayerId(p.id);
                return `<div class="leaderboard-item"><span><strong>${p.name}</strong> · ${team?.name}</span><span>${p.goals} ⚽</span></div>`;
            }).join('');
        }

        // Top Assists
        const assisters = [...DataStore.players].sort((a,b) => b.assists - a.assists).slice(0,10);
        const assistsEl = document.getElementById('assistsList');
        if (assistsEl) {
            assistsEl.innerHTML = assisters.map(p => {
                const team = DataStore.getTeamByPlayerId(p.id);
                return `<div class="leaderboard-item"><span><strong>${p.name}</strong> · ${team?.name}</span><span>${p.assists} 🅰️</span></div>`;
            }).join('');
        }

        // Top MOTM
        const motm = [...DataStore.players].sort((a,b) => b.motm - a.motm).slice(0,10);
        const motmEl = document.getElementById('motmList');
        if (motmEl) {
            motmEl.innerHTML = motm.map(p => {
                const team = DataStore.getTeamByPlayerId(p.id);
                return `<div class="leaderboard-item"><span><strong>${p.name}</strong> · ${team?.name}</span><span>${p.motm} ⭐</span></div>`;
            }).join('');
        }
    },

    renderStatusBadge() {
        const badge = document.getElementById('globalStateBadge');
        if (badge) badge.innerHTML = '🟢 Auto-saved';
    },

    showStatus(message, isError = false) {
        const status = document.getElementById('dataPipelineStatus');
        if (status) {
            status.innerHTML = isError ? `❌ ${message}` : `✅ ${message}`;
            status.style.color = isError ? '#b33a3a' : '#2a6e9b';
        }
    },

    showDrawFeedback(message, isValid = true) {
        const feedback = document.getElementById('drawFeedback');
        if (feedback) {
            feedback.innerHTML = isValid ? `✓ ${message}` : `⚠️ ${message}`;
            feedback.style.color = isValid ? '#0057a3' : '#b33a3a';
        }
    },

    // ============ SEARCH FUNCTIONALITY ============
    
    populateTeamFilter() {
        const select = document.getElementById('teamSearchFilter');
        if (!select) return;
        
        let html = '<option value="0">All Teams</option>';
        [...DataStore.teams].sort((a,b) => a.name.localeCompare(b.name)).forEach(team => {
            html += `<option value="${team.id}">${team.name}</option>`;
        });
        select.innerHTML = html;
    },

    searchMatches(searchTerm = '', matchday = 0, teamId = 0, status = 'all') {
        let results = [...DataStore.matches];
        
        if (matchday > 0) {
            results = results.filter(m => m.matchday === matchday);
        }
        
        if (teamId > 0) {
            results = results.filter(m => m.homeTeam === teamId || m.awayTeam === teamId);
        }
        
        if (status === 'unplayed') {
            results = results.filter(m => !m.played);
        } else if (status === 'played') {
            results = results.filter(m => m.played);
        }
        
        if (searchTerm.trim() !== '') {
            const term = searchTerm.toLowerCase().trim();
            results = results.filter(m => {
                const home = DataStore.getTeamById(m.homeTeam);
                const away = DataStore.getTeamById(m.awayTeam);
                return home?.name.toLowerCase().includes(term) || 
                       away?.name.toLowerCase().includes(term);
            });
        }
        
        return results;
    },

    renderSearchResults() {
        const container = document.getElementById('searchResultsList');
        const countSpan = document.getElementById('resultCount');
        if (!container) return;
        
        const searchTerm = document.getElementById('searchInput')?.value || '';
        const matchday = parseInt(document.getElementById('matchdaySearchFilter')?.value || '0');
        const teamId = parseInt(document.getElementById('teamSearchFilter')?.value || '0');
        const status = document.getElementById('statusSearchFilter')?.value || 'all';
        
        const results = this.searchMatches(searchTerm, matchday, teamId, status);
        
        if (countSpan) countSpan.textContent = `(${results.length})`;
        
        if (results.length === 0) {
            container.innerHTML = '<div style="text-align:center; padding:1rem; color:#6b8cae;">No matches found</div>';
            return;
        }
        
        container.innerHTML = results.slice(0, 20).map(match => {
            const home = DataStore.getTeamById(match.homeTeam);
            const away = DataStore.getTeamById(match.awayTeam);
            if (!home || !away) return '';
            
            const status = match.played ? '✅' : '⏳';
            const score = match.played ? `${match.score.home}-${match.score.away}` : 'vs';
            
            return `
                <div class="match-item" data-match-id="${match.id}" style="cursor:pointer;">
                    <div style="display:flex; justify-content:space-between; width:100%;">
                        <span>
                            <span style="background:#eef5fa; padding:0.2rem 0.5rem; border-radius:20px; font-size:0.7rem;">MD${match.matchday}</span>
                            <strong>${home.name}</strong> ${score} <strong>${away.name}</strong>
                        </span>
                        <span>
                            ${status}
                            <button class="btn btn-sm edit-search-match" data-match-id="${match.id}" style="margin-left:0.5rem;">✏️</button>
                        </span>
                    </div>
                </div>
            `;
        }).join('');
        
        // Add click handlers
        container.querySelectorAll('.edit-search-match').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const matchId = parseInt(btn.dataset.matchId);
                this.renderMatchEditor(matchId);
            });
        });
        
        container.querySelectorAll('.match-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('edit-search-match')) {
                    const matchId = parseInt(item.dataset.matchId);
                    this.renderMatchEditor(matchId);
                }
            });
        });
    },

    // Match Editor
    renderMatchEditor(matchId) {
        const match = DataStore.getMatchById(matchId);
        if (!match) return;
        
        const home = DataStore.getTeamById(match.homeTeam);
        const away = DataStore.getTeamById(match.awayTeam);
        
        document.getElementById('matchHomeName').textContent = home?.name || '';
        document.getElementById('matchAwayName').textContent = away?.name || '';
        document.getElementById('homeScore').value = match.score.home;
        document.getElementById('awayScore').value = match.score.away;
        
        const players = DataStore.players.filter(p => 
            p.teamId === match.homeTeam || p.teamId === match.awayTeam
        );
        
        const playerOptions = players.map(p => {
            const team = DataStore.getTeamById(p.teamId);
            return `<option value="${p.id}">${p.name} (${team?.name})</option>`;
        }).join('');
        
        document.getElementById('scorerSelect').innerHTML = playerOptions;
        document.getElementById('assisterSelect').innerHTML = '<option value="">— no assist —</option>' + playerOptions;
        document.getElementById('motmSelect').innerHTML = '<option value="">— select MOTM —</option>' + playerOptions;
        
        // Show events
        const eventsList = document.getElementById('eventsList');
        eventsList.innerHTML = match.events.map(e => {
            const scorer = DataStore.getPlayerById(e.scorerId);
            return `<div>⚽ ${e.minute}' ${scorer?.name}</div>`;
        }).join('');
        
        document.getElementById('matchEditPanel').style.display = 'block';
        document.getElementById('saveMatchBtn').dataset.matchId = matchId;
    }
};

window.UIRenderer = UIRenderer;