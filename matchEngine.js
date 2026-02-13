// ============================================
// matchEngine.js - Match execution and event handling
// ============================================

const MatchEngine = {
    // Play a match with full event data
    playMatch(matchId, homeScore, awayScore, events, motmPlayerId) {
        const match = DataStore.getMatchById(matchId);
        if (!match) throw new Error('Match not found');
        if (match.played) throw new Error('Match already played');
        
        // Validate scorers and assisters belong to participating teams
        const teamIds = [match.homeTeam, match.awayTeam];
        
        events.forEach(event => {
            const scorer = DataStore.getPlayerById(event.scorerId);
            if (!scorer || !teamIds.includes(scorer.teamId)) {
                throw new Error(`Scorer ${event.scorerId} not in match`);
            }
            
            if (event.assisterId) {
                const assister = DataStore.getPlayerById(event.assisterId);
                if (!assister || !teamIds.includes(assister.teamId)) {
                    throw new Error(`Assister ${event.assisterId} not in match`);
                }
            }
        });
        
        if (motmPlayerId) {
            const motm = DataStore.getPlayerById(motmPlayerId);
            if (!motm || !teamIds.includes(motm.teamId)) {
                throw new Error('MOTM not in match');
            }
        }
        
        // Update match
        match.played = true;
        match.score = { home: homeScore, away: awayScore };
        match.events = events;
        match.motmPlayerId = motmPlayerId;
        
        // Recalculate all stats
        StatsEngine.recalculate();
        Storage.save();
        
        return match;
    },

    // Add a goal event to an unplayed match
    addGoalEvent(matchId, minute, scorerId, assisterId = null) {
        const match = DataStore.getMatchById(matchId);
        if (!match) throw new Error('Match not found');
        if (match.played) throw new Error('Cannot edit played match');
        
        match.events.push({
            minute,
            scorerId,
            assisterId
        });
        
        Storage.save();
    },

    // Remove last event from match
    undoLastEvent(matchId) {
        const match = DataStore.getMatchById(matchId);
        if (!match) throw new Error('Match not found');
        if (match.played) throw new Error('Match already played');
        
        match.events.pop();
        Storage.save();
    },

    // Get all unplayed matches
    getUnplayedMatches() {
        return DataStore.matches.filter(m => !m.played);
    },

    // Get matches by matchday
    getMatchesByMatchday(matchday) {
        return DataStore.matches.filter(m => m.matchday === matchday);
    },

    // Format match display
    formatMatch(match) {
        const home = DataStore.getTeamById(match.homeTeam);
        const away = DataStore.getTeamById(match.awayTeam);
        
        if (match.played) {
            return `${home.name} ${match.score.home} - ${match.score.away} ${away.name}`;
        } else {
            return `${home.name} vs ${away.name}`;
        }
    }
};

window.MatchEngine = MatchEngine;