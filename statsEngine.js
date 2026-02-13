// ============================================
// statsEngine.js - Pure recomputation from matches
// ============================================

const StatsEngine = {
    // Recalculate ALL stats from matches (single source of truth)
    recalculate() {
        // Reset team stats
        DataStore.teams.forEach(team => {
            team.stats = {
                played: 0, wins: 0, draws: 0, losses: 0,
                gf: 0, ga: 0, gd: 0, points: 0
            };
        });

        // Reset player stats
        DataStore.players.forEach(player => {
            player.goals = 0;
            player.assists = 0;
            player.motm = 0;
        });

        // Apply all played matches
        DataStore.matches
            .filter(match => match.played)
            .forEach(match => {
                this.applyMatch(match);
            });

        // Calculate goal differences
        DataStore.teams.forEach(team => {
            team.stats.gd = team.stats.gf - team.stats.ga;
        });
    },

    // Apply a single match to stats
    applyMatch(match) {
        const home = DataStore.getTeamById(match.homeTeam);
        const away = DataStore.getTeamById(match.awayTeam);
        
        // Skip if teams not found
        if (!home || !away) return;

        // Update team stats
        home.stats.played++;
        away.stats.played++;
        
        home.stats.gf += match.score.home;
        home.stats.ga += match.score.away;
        away.stats.gf += match.score.away;
        away.stats.ga += match.score.home;

        // Win/draw/loss
        if (match.score.home > match.score.away) {
            home.stats.wins++;
            home.stats.points += 3;
            away.stats.losses++;
        } else if (match.score.away > match.score.home) {
            away.stats.wins++;
            away.stats.points += 3;
            home.stats.losses++;
        } else {
            home.stats.draws++;
            away.stats.draws++;
            home.stats.points++;
            away.stats.points++;
        }

        // Player goals and assists
        match.events.forEach(event => {
            const scorer = DataStore.getPlayerById(event.scorerId);
            if (scorer) scorer.goals++;
            
            if (event.assisterId) {
                const assister = DataStore.getPlayerById(event.assisterId);
                if (assister) assister.assists++;
            }
        });

        // MOTM
        if (match.motmPlayerId) {
            const motm = DataStore.getPlayerById(match.motmPlayerId);
            if (motm) motm.motm++;
        }
    },

    // Get sorted league table
    getLeagueTable() {
        return [...DataStore.teams].sort((a, b) => {
            if (a.stats.points !== b.stats.points) 
                return b.stats.points - a.stats.points;
            if (a.stats.gd !== b.stats.gd) 
                return b.stats.gd - a.stats.gd;
            return b.stats.gf - a.stats.gf;
        });
    },

    // Get top scorers
    getTopScorers(limit = 10) {
        return [...DataStore.players]
            .sort((a, b) => b.goals - a.goals)
            .slice(0, limit);
    },

    // Get top assisters
    getTopAssisters(limit = 10) {
        return [...DataStore.players]
            .sort((a, b) => b.assists - a.assists)
            .slice(0, limit);
    },

    // Get most MOTM
    getTopMOTM(limit = 10) {
        return [...DataStore.players]
            .sort((a, b) => b.motm - a.motm)
            .slice(0, limit);
    }
};

window.StatsEngine = StatsEngine;