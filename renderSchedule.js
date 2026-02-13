function renderSchedule(matches) {
const container = document.getElementById("scheduleOutput");

let html = "<h3>Generated Matches</h3>";

for (let md = 1; md <= 8; md++) {
html += `<strong>Matchday ${md}</strong><br>`;
matches
.filter(m => m.matchday === md)
.forEach(m => {
html += `${m.home} vs ${m.away}<br>`;
});
html += "<br>";
}

container.innerHTML = html;
}
