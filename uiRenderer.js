// ============================================
// uiRenderer.js - COMPLETE FIXED VERSION
// With working match editor and save button
// ============================================

const UIRenderer = {
    // ============ MASTER RENDER ============
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

    // ============ TEAM MANAGEMENT ============
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

    // ============ MATCHDAY VIEW ============
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
                    <div class="match-item played" data-match-id="${match.id}">
                        <span><strong>${home.name}</strong> ${match.score.home}-${match.score.away} <strong>${away.name}</strong></span>
                        <span style="display:flex; gap:0.5rem;">
                            <span class="badge">⚽ ${match.events.length}</span>
                            <button class="btn-sm edit-match-btn" data-match-id="${match.id}">✏️</button>
                        </span>
                    </div>
                `;
            } else {
                return `
                    <div class="match-item" data-match-id="${match.id}">
                        <span>${home.name} vs ${away.name}</span>
                        <span style="display:flex; gap:0.5rem;">
                            <span style="color:#6b8cae;">⏳</span>
                            <button class="btn-sm edit-match-btn" data-match-id="${match.id}">✏️</button>
                        </span>
                    </div>
                `;
            }
        }).join('');
        
        // Add click handlers
        container.querySelectorAll('.edit-match-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const matchId = parseInt(btn.dataset.matchId);
                this.renderMatchEditor(matchId);
            });
        });
        
        container.querySelectorAll('.match-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('edit-match-btn')) {
                    const matchId = parseInt(item.dataset.matchId);
                    this.renderMatchEditor(matchId);
                }
            });
        });
    },

    // ============ LEAGUE TABLE ============
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

    // ============ LEADERBOARDS ============
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

    // ============ STATUS ============
    renderStatusBadge() {
        const badge = document.getElementById('globalStateBadge');
        if (badge) badge.innerHTML = '🟢 Auto-saved';
    },

    showStatus(message, isError = false) {
        const status = document.getElementById('dataPipelineStatus');
        if (status) {
            status.innerHTML = isError ? `❌ ${message}` : `✅ ${message}`;
            status.style.color = isError ? '#dc2626' : '#059669';
        }
    },

    showDrawFeedback(message, isValid = true) {
        const feedback = document.getElementById('drawFeedback');
        if (feedback) {
            feedback.innerHTML = isValid ? `✓ ${message}` : `⚠️ ${message}`;
            feedback.style.color = isValid ? '#059669' : '#dc2626';
        }
    },

    // ============ SEARCH ============
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
            
            const statusIcon = match.played ? '✅' : '⏳';
            const score = match.played ? `${match.score.home}-${match.score.away}` : 'vs';
            
            return `
                <div class="match-item" data-match-id="${match.id}" style="cursor:pointer;">
                    <div style="display:flex; justify-content:space-between; width:100%;">
                        <span>
                            <span style="background:#eef5fa; padding:0.2rem 0.5rem; border-radius:20px; font-size:0.7rem;">MD${match.matchday}</span>
                            <strong>${home.name}</strong> ${score} <strong>${away.name}</strong>
                        </span>
                        <span>
                            ${statusIcon}
                            <button class="btn-sm edit-match-btn" data-match-id="${match.id}" style="margin-left:0.5rem;">✏️</button>
                        </span>
                    </div>
                </div>
            `;
        }).join('');
        
        // Add click handlers
        container.querySelectorAll('.edit-match-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const matchId = parseInt(btn.dataset.matchId);
                this.renderMatchEditor(matchId);
            });
        });
        
        container.querySelectorAll('.match-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('edit-match-btn')) {
                    const matchId = parseInt(item.dataset.matchId);
                    this.renderMatchEditor(matchId);
                }
            });
        });
    },

    // ============ MATCH EDITOR - FIXED VERSION ============
    renderMatchEditor(matchId) {
        const match = DataStore.getMatchById(matchId);
        if (!match) return;
        
        const home = DataStore.getTeamById(match.homeTeam);
        const away = DataStore.getTeamById(match.awayTeam);
        
        // Show editor panel
        const editorPanel = document.getElementById('matchEditPanel');
        if (editorPanel) {
            editorPanel.style.display = 'block';
            editorPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        
        // Update header
        const headerEl = document.querySelector('#matchEditPanel h3');
        if (headerEl) {
            headerEl.innerHTML = `⚽ ${home?.name} vs ${away?.name}`;
        }
        
        // Update team names and scores
        const homeNameEl = document.getElementById('matchHomeName');
        const awayNameEl = document.getElementById('matchAwayName');
        const homeScoreEl = document.getElementById('homeScore');
        const awayScoreEl = document.getElementById('awayScore');
        
        if (homeNameEl) homeNameEl.textContent = home?.name || '';
        if (awayNameEl) awayNameEl.textContent = away?.name || '';
        if (homeScoreEl) homeScoreEl.value = match.score.home;
        if (awayScoreEl) awayScoreEl.value = match.score.away;
        
        // Player dropdowns
        const players = DataStore.players.filter(p => 
            p.teamId === match.homeTeam || p.teamId === match.awayTeam
        );
        
        const playerOptions = players.map(p => {
            const team = DataStore.getTeamById(p.teamId);
            return `<option value="${p.id}">${p.name} (${team?.name})</option>`;
        }).join('');
        
        const scorerSelect = document.getElementById('scorerSelect');
        const assisterSelect = document.getElementById('assisterSelect');
        const motmSelect = document.getElementById('motmSelect');
        
        if (scorerSelect) scorerSelect.innerHTML = '<option value="">Select scorer...</option>' + playerOptions;
        if (assisterSelect) assisterSelect.innerHTML = '<option value="">— no assist —</option>' + playerOptions;
        if (motmSelect) motmSelect.innerHTML = '<option value="">— select MOTM —</option>' + playerOptions;
        
        // Render events
        this.renderMatchEvents(match);
        
        // Store match ID in save button
        const saveBtn = document.getElementById('saveMatchBtn');
        if (saveBtn) saveBtn.dataset.matchId = matchId;
        
        // Clear any errors
        const errorEl = document.getElementById('editorError');
        if (errorEl) errorEl.style.display = 'none';
    },

    // Render events for current match - FIXED VERSION
    renderMatchEvents(match) {
        const container = document.getElementById('eventsList');
        if (!container) return;
        
        if (match.events.length === 0) {
            container.innerHTML = '<div style="color: #64748b; font-style: italic; padding: 1rem; text-align: center;">No goals added yet. Add goals below!</div>';
            return;
        }
        
        container.innerHTML = match.events.map((event, index) => {
            const scorer = DataStore.getPlayerById(event.scorerId);
            const assister = event.assisterId ? DataStore.getPlayerById(event.assisterId) : null;
            
            return `
                <div class="event-item" data-event-index="${index}">
                    <div>
                        <span class="minute">${event.minute}'</span>
                        <span class="scorer">⚽ ${scorer?.name || 'Unknown'}</span>
                        ${assister ? `<span class="assist">🅰️ ${assister.name}</span>` : ''}
                    </div>
                    <button class="remove-event-btn" data-event-index="${index}" title="Remove goal">✕</button>
                </div>
            `;
        }).join('');
        
        // Add remove event handlers
        container.querySelectorAll('.remove-event-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(btn.dataset.eventIndex);
                const saveBtn = document.getElementById('saveMatchBtn');
                const matchId = saveBtn ? parseInt(saveBtn.dataset.matchId) : null;
                const match = DataStore.getMatchById(matchId);
                
                if (match && !match.played) {
                    match.events.splice(index, 1);
                    this.renderMatchEvents(match);
                    Storage.save();
                }
            });
        });
    }
};

window.UIRenderer = UIRenderer;