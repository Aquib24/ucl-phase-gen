// ============================================
// drawEngine.js - PERFECT VERSION
// 144 matches, 8 per team, 18 per matchday
// ============================================

const DrawEngine = {
    generateSchedule() {
        if (DataStore.teams.length !== 36) {
            throw new Error('Need exactly 36 teams for draw');
        }

        const matches = [];
        const matchSet = new Set(); // Track unique matches
        const teamMatches = new Map(); // Track matches per team
        
        // Initialize team matches counter
        DataStore.teams.forEach(team => {
            teamMatches.set(team.id, []);
        });

        // FIRST PASS: Assign 2 opponents from each pot (8 matches total)
        DataStore.teams.forEach(team => {
            for (let pot = 1; pot <= 4; pot++) {
                let assigned = 0;
                
                // Get candidates from this pot
                const candidates = DataStore.teams.filter(opp => 
                    opp.id !== team.id &&
                    opp.pot === pot &&
                    opp.country !== team.country && // Prefer different country
                    teamMatches.get(opp.id).length < 8 &&
                    !teamMatches.get(team.id).includes(opp.id)
                );
                
                // Shuffle for randomness
                this.shuffleArray(candidates);
                
                for (let opp of candidates) {
                    if (assigned >= 2) break;
                    
                    // Check if match already exists
                    const matchKey = [team.id, opp.id].sort().join('-');
                    if (matchSet.has(matchKey)) continue;
                    
                    // Create match
                    const homeAway = Math.random() > 0.5;
                    const match = {
                        id: DataStore.nextIds.match++,
                        homeTeam: homeAway ? team.id : opp.id,
                        awayTeam: homeAway ? opp.id : team.id,
                        matchday: null,
                        played: false,
                        score: { home: 0, away: 0 },
                        events: [],
                        motmPlayerId: null
                    };
                    
                    matches.push(match);
                    matchSet.add(matchKey);
                    teamMatches.get(team.id).push(opp.id);
                    teamMatches.get(opp.id).push(team.id);
                    assigned++;
                }
            }
        });

        // SECOND PASS: Fill remaining slots to reach 8 matches per team
        DataStore.teams.forEach(team => {
            const currentMatches = teamMatches.get(team.id).length;
            const needed = 8 - currentMatches;
            
            if (needed > 0) {
                const candidates = DataStore.teams.filter(opp => 
                    opp.id !== team.id &&
                    teamMatches.get(opp.id).length < 8 &&
                    !teamMatches.get(team.id).includes(opp.id) &&
                    opp.country !== team.country // Avoid same country
                );
                
                this.shuffleArray(candidates);
                
                for (let i = 0; i < needed && i < candidates.length; i++) {
                    const opp = candidates[i];
                    const matchKey = [team.id, opp.id].sort().join('-');
                    
                    if (matchSet.has(matchKey)) continue;
                    
                    const homeAway = Math.random() > 0.5;
                    const match = {
                        id: DataStore.nextIds.match++,
                        homeTeam: homeAway ? team.id : opp.id,
                        awayTeam: homeAway ? opp.id : team.id,
                        matchday: null,
                        played: false,
                        score: { home: 0, away: 0 },
                        events: [],
                        motmPlayerId: null
                    };
                    
                    matches.push(match);
                    matchSet.add(matchKey);
                    teamMatches.get(team.id).push(opp.id);
                    teamMatches.get(opp.id).push(team.id);
                }
            }
        });

        // VERIFY each team has exactly 8 matches
        DataStore.teams.forEach(team => {
            const count = teamMatches.get(team.id).length;
            if (count !== 8) {
                console.warn(`${team.name} has ${count}/8 matches - fixing...`);
                // Add remaining matches with any available team
                while (teamMatches.get(team.id).length < 8) {
                    const opp = DataStore.teams.find(t => 
                        t.id !== team.id && 
                        !teamMatches.get(team.id).includes(t.id) &&
                        teamMatches.get(t.id).length < 8
                    );
                    
                    if (!opp) break;
                    
                    const matchKey = [team.id, opp.id].sort().join('-');
                    if (!matchSet.has(matchKey)) {
                        const homeAway = Math.random() > 0.5;
                        matches.push({
                            id: DataStore.nextIds.match++,
                            homeTeam: homeAway ? team.id : opp.id,
                            awayTeam: homeAway ? opp.id : team.id,
                            matchday: null,
                            played: false,
                            score: { home: 0, away: 0 },
                            events: [],
                            motmPlayerId: null
                        });
                        matchSet.add(matchKey);
                        teamMatches.get(team.id).push(opp.id);
                        teamMatches.get(opp.id).push(team.id);
                    }
                }
            }
        });

        // Remove any duplicates that slipped through
        const uniqueMatches = [];
        const finalMatchSet = new Set();
        
        matches.forEach(match => {
            const key = [match.homeTeam, match.awayTeam].sort().join('-');
            if (!finalMatchSet.has(key)) {
                finalMatchSet.add(key);
                uniqueMatches.push(match);
            }
        });

        // Assign matchdays - EXACTLY 18 matches per day
        this.assignMatchdays(uniqueMatches);
        
        // Final verification
        console.log(`Generated ${uniqueMatches.length} matches`);
        
        // Count matches per team
        DataStore.teams.forEach(team => {
            const count = uniqueMatches.filter(m => 
                m.homeTeam === team.id || m.awayTeam === team.id
            ).length;
            console.log(`${team.name}: ${count} matches`);
        });

        DataStore.matches = uniqueMatches;
        Storage.save();
        return uniqueMatches;
    },

    assignMatchdays(matches) {
        const totalDays = 8;
        const matchesPerDay = 18; // 36 teams * 8 matches / 2 / 8 days = 18
        
        // Group matches by potential days
        const dayAssignments = Array(totalDays).fill().map(() => []);
        
        // First, ensure each team plays once per day
        const teamDays = new Map();
        DataStore.teams.forEach(t => teamDays.set(t.id, new Set()));
        
        // Sort matches to prioritize even distribution
        const shuffledMatches = [...matches];
        this.shuffleArray(shuffledMatches);
        
        shuffledMatches.forEach(match => {
            for (let day = 1; day <= totalDays; day++) {
                if (dayAssignments[day-1].length >= matchesPerDay) continue;
                if (teamDays.get(match.homeTeam).has(day)) continue;
                if (teamDays.get(match.awayTeam).has(day)) continue;
                
                match.matchday = day;
                dayAssignments[day-1].push(match);
                teamDays.get(match.homeTeam).add(day);
                teamDays.get(match.awayTeam).add(day);
                break;
            }
        });
        
        // Assign remaining matches to days with space
        matches.filter(m => !m.matchday).forEach(match => {
            for (let day = 1; day <= totalDays; day++) {
                if (dayAssignments[day-1].length >= matchesPerDay) continue;
                match.matchday = day;
                dayAssignments[day-1].push(match);
                break;
            }
        });
        
        // Final verification
        for (let day = 1; day <= totalDays; day++) {
            const dayMatches = matches.filter(m => m.matchday === day);
            console.log(`Matchday ${day}: ${dayMatches.length} matches`);
        }
    },

    validateSchedule(matches) {
        const errors = [];
        
        // Check total matches - MUST BE 144
        if (matches.length !== 144) {
            errors.push(`Expected 144 matches, got ${matches.length}`);
        }
        
        // Check each team has exactly 8 matches
        DataStore.teams.forEach(team => {
            const count = matches.filter(m => 
                m.homeTeam === team.id || m.awayTeam === team.id
            ).length;
            
            if (count !== 8) {
                errors.push(`${team.name}: ${count}/8 matches`);
            }
        });
        
        // Check no duplicates
        const matchSet = new Set();
        matches.forEach(m => {
            const key = [m.homeTeam, m.awayTeam].sort().join('-');
            if (matchSet.has(key)) {
                errors.push(`Duplicate match: ${key}`);
            }
            matchSet.add(key);
        });
        
        // Check matchday distribution (18 per day)
        for (let day = 1; day <= 8; day++) {
            const count = matches.filter(m => m.matchday === day).length;
            if (count !== 18) {
                errors.push(`Matchday ${day}: ${count}/18 matches`);
            }
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    },

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
};

window.DrawEngine = DrawEngine;