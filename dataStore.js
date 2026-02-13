// ============================================
// dataStore.js - FIXED reset method
// ============================================

const DataStore = {
    teams: [],
    players: [],
    matches: [],
    
    nextIds: {
        team: 100,
        player: 1000,
        match: 5000
    },

    // 🔥 FIXED reset method
    reset() {
        this.teams = [];
        this.players = [];
        this.matches = [];
        this.nextIds = { team: 100, player: 1000, match: 5000 };
        console.log('DataStore reset complete');
    },

    addTeam(team) {
        team.id = this.nextIds.team++;
        team.stats = {
            played: 0, wins: 0, draws: 0, losses: 0,
            gf: 0, ga: 0, gd: 0, points: 0
        };
        team.players = [];
        team.matches = [];
        this.teams.push(team);
        return team;
    },

    addPlayer(player) {
        player.id = this.nextIds.player++;
        player.goals = 0;
        player.assists = 0;
        player.motm = 0;
        
        const team = this.getTeamByName(player.teamName);
        if (team) {
            player.teamId = team.id;
            team.players.push(player.id);
        }
        
        this.players.push(player);
        return player;
    },

    addMatch(match) {
        match.id = this.nextIds.match++;
        match.played = false;
        match.score = { home: 0, away: 0 };
        match.events = [];
        match.motmPlayerId = null;
        this.matches.push(match);
        return match;
    },

    getTeamById(id) {
        return this.teams.find(t => t.id === id);
    },

    getTeamByName(name) {
        return this.teams.find(t => t.name === name);
    },

    getTeamByPlayerId(playerId) {
        const player = this.getPlayerById(playerId);
        if (!player) return null;
        return this.getTeamById(player.teamId);
    },

    getPlayerById(id) {
        return this.players.find(p => p.id === id);
    },

    getPlayersByTeam(teamId) {
        return this.players.filter(p => p.teamId === teamId);
    },

    getMatchById(id) {
        return this.matches.find(m => m.id === id);
    },

    validateComplete() {
        if (this.teams.length !== 36) return false;
        if (this.players.length < 36 * 4) return false;
        return true;
    }
};

window.DataStore = DataStore;