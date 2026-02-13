// ============================================
// csvParser.js - Pure CSV parsing
// ============================================

const CSVParser = {
    // Read file as text and split lines
    async readFile(file) {
        const text = await file.text();
        return text.split(/\r?\n/).filter(line => line.trim() !== '');
    },

    // Parse teams CSV: team_name,country,pot
    parseTeams(lines) {
        const teams = [];
        const isHeader = lines[0].toLowerCase().includes('team');
        const startIndex = isHeader ? 1 : 0;
        
        for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const [name, country, pot] = line.split(',').map(s => s.trim());
            if (name && country && pot) {
                teams.push({
                    name,
                    country,
                    pot: parseInt(pot)
                });
            }
        }
        return teams;
    },

    // Parse players CSV: team_name,player_name
    parsePlayers(lines) {
        const players = [];
        const isHeader = lines[0].toLowerCase().includes('team');
        const startIndex = isHeader ? 1 : 0;
        
        for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const [teamName, playerName] = line.split(',').map(s => s.trim());
            if (teamName && playerName) {
                players.push({
                    teamName,
                    name: playerName
                });
            }
        }
        return players;
    },

    // Generate sample teams CSV content
    generateSampleTeams() {
        const pots = [1, 2, 3, 4];
        const countries = ['ESP', 'ENG', 'ITA', 'GER', 'FRA', 'POR', 'NED', 'AUT', 'BEL', 'SCO'];
        let csv = 'team_name,country,pot\n';
        
        for (let i = 1; i <= 36; i++) {
            const pot = pots[Math.floor((i - 1) / 9) % 4];
            const country = countries[(i - 1) % countries.length];
            csv += `Team ${i},${country},${pot}\n`;
        }
        return csv;
    },

    // Generate sample players CSV content
    generateSamplePlayers() {
        let csv = 'team_name,player_name\n';
        for (let i = 1; i <= 36; i++) {
            for (let p = 1; p <= 6; p++) {
                csv += `Team ${i},Player ${p} of Team ${i}\n`;
            }
        }
        return csv;
    }
};

window.CSVParser = CSVParser;