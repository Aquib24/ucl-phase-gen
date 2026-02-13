const MatchScheduler = {
buildMatches(fixtures) {
const matches = [];
const used = new Set();

fixtures.forEach((opps, team) => {
opps.forEach(o => {
const key = [team, o].sort().join("-");
if (!used.has(key)) {
used.add(key);
matches.push({
home: team,
away: o,
matchday: null
});
}
});
});

this.assignMatchdays(matches);
return matches;
},

assignMatchdays(matches) {
const totalDays = 8;
const teamDayMap = {};

for (let m of matches) {
for (let day = 1; day <= totalDays; day++) {
if (!teamDayMap[m.home]?.includes(day) &&
!teamDayMap[m.away]?.includes(day)) {

m.matchday = day;

teamDayMap[m.home] = teamDayMap[m.home] || [];
teamDayMap[m.away] = teamDayMap[m.away] || [];

teamDayMap[m.home].push(day);
teamDayMap[m.away].push(day);

break;
}
}
}
}
};
