// Manchester City Season Tracker - ESPN API Integration

const ESPN_RESULTS_API = 'https://site.api.espn.com/apis/site/v2/sports/soccer/all/teams/382/schedule';
const ESPN_FIXTURES_API = 'https://site.api.espn.com/apis/site/v2/sports/soccer/all/teams/382/schedule?fixture=true';
const MAN_CITY_ID = '382';

let isLoading = false;

// Fetch results from ESPN API
async function fetchResults() {
    const response = await fetch(ESPN_RESULTS_API);
    if (!response.ok) throw new Error('Failed to fetch results');
    return response.json();
}

// Fetch fixtures from ESPN API
async function fetchFixtures() {
    const response = await fetch(ESPN_FIXTURES_API);
    if (!response.ok) throw new Error('Failed to fetch fixtures');
    return response.json();
}

// Parse events into matches
function parseEvents(data, isFixture = false) {
    const matches = [];

    if (!data.events) return matches;

    data.events.forEach(event => {
        const match = parseEvent(event, isFixture);
        if (match) matches.push(match);
    });

    return matches;
}

// Parse individual event
function parseEvent(event, isFixture = false) {
    try {
        const competitors = event.competitions?.[0]?.competitors || [];
        if (competitors.length !== 2) return null;

        const cityTeam = competitors.find(c => c.team.id === MAN_CITY_ID);
        const opponent = competitors.find(c => c.team.id !== MAN_CITY_ID);

        if (!cityTeam || !opponent) return null;

        const isHome = cityTeam.homeAway === 'home';
        const homeTeam = isHome ? cityTeam : opponent;
        const awayTeam = isHome ? opponent : cityTeam;

        // Score can be nested as score.displayValue or score.value or just score
        const getScore = (team) => {
            if (team.score?.displayValue) return parseInt(team.score.displayValue) || 0;
            if (team.score?.value !== undefined) return parseInt(team.score.value) || 0;
            if (typeof team.score === 'string' || typeof team.score === 'number') return parseInt(team.score) || 0;
            return 0;
        };

        const cityScore = getScore(cityTeam);
        const opponentScore = getScore(opponent);

        let result = null;
        if (!isFixture) {
            if (cityScore > opponentScore) result = 'win';
            else if (cityScore < opponentScore) result = 'loss';
            else result = 'draw';
        }

        // Get competition name from league slug (primary) or season slug (fallback)
        const leagueSlug = event.league?.slug || event.season?.slug || '';
        const competition = getCompetitionName(leagueSlug);

        return {
            id: event.id,
            date: event.date,
            homeTeam: {
                id: homeTeam.team.id,
                name: homeTeam.team.displayName || homeTeam.team.name,
                shortName: homeTeam.team.shortDisplayName || homeTeam.team.abbreviation,
                logo: homeTeam.team.logo || `https://a.espncdn.com/i/teamlogos/soccer/500/${homeTeam.team.id}.png`,
                score: getScore(homeTeam)
            },
            awayTeam: {
                id: awayTeam.team.id,
                name: awayTeam.team.displayName || awayTeam.team.name,
                shortName: awayTeam.team.shortDisplayName || awayTeam.team.abbreviation,
                logo: awayTeam.team.logo || `https://a.espncdn.com/i/teamlogos/soccer/500/${awayTeam.team.id}.png`,
                score: getScore(awayTeam)
            },
            isHome,
            cityScore,
            opponentScore,
            result,
            competition,
            isFixture,
            venue: event.competitions?.[0]?.venue?.fullName || ''
        };
    } catch (error) {
        console.error('Error parsing event:', error);
        return null;
    }
}

// Normalize competition name
function getCompetitionName(slug) {
    const lower = slug.toLowerCase();
    if (lower === 'eng.1' || lower.includes('premier')) return 'Premier League';
    if (lower.includes('uefa.champions')) return 'Champions League';
    if (lower.includes('eng.fa')) return 'FA Cup';
    if (lower.includes('eng.league_cup') || lower.includes('carabao')) return 'Carabao Cup';
    if (lower.includes('eng.community_shield')) return 'Community Shield';
    if (lower.includes('club.friendly')) return 'Friendly';
    if (lower.includes('fifa.cwc') || lower.includes('club.world')) return 'Club World Cup';
    // Return actual slug for unknown competitions (will be filtered out)
    return slug || 'Other';
}

// Get competition CSS class
function getCompetitionClass(competition) {
    const map = {
        'Premier League': 'premier-league',
        'Champions League': 'champions-league',
        'FA Cup': 'fa-cup',
        'Carabao Cup': 'carabao-cup',
        'Community Shield': 'community-shield',
        'Friendly': 'friendly'
    };
    return map[competition] || 'premier-league';
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Format time
function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

// Create result card HTML
function createResultCard(match) {
    const homeTeam = match.homeTeam;
    const awayTeam = match.awayTeam;
    const resultClass = match.result || '';
    const resultText = match.result === 'win' ? 'W' : match.result === 'draw' ? 'D' : 'L';

    return `
        <div class="match-card ${resultClass}">
            <div class="match-meta">
                <span class="match-date">${formatDate(match.date)}</span>
                <span class="match-competition ${getCompetitionClass(match.competition)}">${match.competition}</span>
            </div>
            <div class="match-teams">
                <div class="team home">
                    <img src="${homeTeam.logo}" alt="${homeTeam.shortName}" class="team-logo" onerror="this.style.display='none'">
                    <div class="team-info">
                        <div class="team-name">${homeTeam.shortName}</div>
                    </div>
                </div>
                <div class="match-score">
                    <span class="score ${homeTeam.id === MAN_CITY_ID ? 'city' : ''}">${homeTeam.score}</span>
                    <span class="score-divider">-</span>
                    <span class="score ${awayTeam.id === MAN_CITY_ID ? 'city' : ''}">${awayTeam.score}</span>
                </div>
                <div class="team away">
                    <img src="${awayTeam.logo}" alt="${awayTeam.shortName}" class="team-logo" onerror="this.style.display='none'">
                    <div class="team-info">
                        <div class="team-name">${awayTeam.shortName}</div>
                    </div>
                </div>
                <div class="result-badge ${resultClass}">${resultText}</div>
            </div>
        </div>
    `;
}

// Create fixture card HTML
function createFixtureCard(match) {
    const homeTeam = match.homeTeam;
    const awayTeam = match.awayTeam;

    return `
        <div class="match-card fixture">
            <div class="match-meta">
                <span class="match-date">${formatDate(match.date)}</span>
                <span class="match-competition ${getCompetitionClass(match.competition)}">${match.competition}</span>
            </div>
            <div class="match-teams">
                <div class="team home">
                    <img src="${homeTeam.logo}" alt="${homeTeam.shortName}" class="team-logo" onerror="this.style.display='none'">
                    <div class="team-info">
                        <div class="team-name">${homeTeam.shortName}</div>
                    </div>
                </div>
                <div class="match-score">
                    <span class="fixture-time">${formatTime(match.date)}</span>
                </div>
                <div class="team away">
                    <img src="${awayTeam.logo}" alt="${awayTeam.shortName}" class="team-logo" onerror="this.style.display='none'">
                    <div class="team-info">
                        <div class="team-name">${awayTeam.shortName}</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Calculate stats from results
function calculateStats(results) {
    const stats = {
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0
    };

    // Only count Premier League matches for the stats
    const leagueResults = results.filter(m => m.competition === 'Premier League');

    leagueResults.forEach(match => {
        stats.played++;
        stats.goalsFor += match.cityScore;
        stats.goalsAgainst += match.opponentScore;

        if (match.result === 'win') {
            stats.won++;
            stats.points += 3;
        } else if (match.result === 'draw') {
            stats.drawn++;
            stats.points += 1;
        } else {
            stats.lost++;
        }
    });

    return stats;
}

// Update stats display
function updateStatsDisplay(stats) {
    document.getElementById('played').textContent = stats.played;
    document.getElementById('won').textContent = stats.won;
    document.getElementById('drawn').textContent = stats.drawn;
    document.getElementById('lost').textContent = stats.lost;
    document.getElementById('goals-for').textContent = stats.goalsFor;
    document.getElementById('goals-against').textContent = stats.goalsAgainst;
    document.getElementById('points').textContent = stats.points;
}

// Render results
function renderResults(results) {
    const container = document.getElementById('results-list');

    // Filter to Premier League only
    const plResults = results.filter(m => m.competition === 'Premier League');

    if (plResults.length === 0) {
        container.innerHTML = '<div class="empty">No Premier League results yet</div>';
        return;
    }

    // Sort by date (most recent first)
    plResults.sort((a, b) => new Date(b.date) - new Date(a.date));
    container.innerHTML = plResults.map(createResultCard).join('');
}

// Render fixtures
function renderFixtures(fixtures) {
    const container = document.getElementById('fixtures-list');

    // Filter to Premier League only
    const plFixtures = fixtures.filter(m => m.competition === 'Premier League');

    if (plFixtures.length === 0) {
        container.innerHTML = '<div class="empty">No upcoming Premier League fixtures</div>';
        return;
    }

    // Sort by date (soonest first)
    plFixtures.sort((a, b) => new Date(a.date) - new Date(b.date));
    container.innerHTML = plFixtures.map(createFixtureCard).join('');
}

// Setup tabs
function setupTabs() {
    const tabs = document.querySelectorAll('.tab');
    const sections = {
        results: document.getElementById('results-section'),
        fixtures: document.getElementById('fixtures-section')
    };

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;

            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Show/hide sections
            Object.keys(sections).forEach(key => {
                sections[key].classList.toggle('hidden', key !== target);
            });
        });
    });
}

// Update last updated time
function updateLastUpdated() {
    const now = new Date();
    document.getElementById('last-updated').textContent = now.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
    });
}

// Show loading state
function showLoading() {
    isLoading = true;
    document.getElementById('results-list').innerHTML = '<div class="loading">Loading results...</div>';
    document.getElementById('fixtures-list').innerHTML = '<div class="loading">Loading fixtures...</div>';

    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.disabled = true;
        refreshBtn.textContent = 'Refreshing...';
    }
}

// Hide loading state
function hideLoading() {
    isLoading = false;
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.disabled = false;
        refreshBtn.textContent = 'Refresh';
    }
}

// Show error
function showError(message) {
    document.getElementById('results-list').innerHTML = `<div class="error">${message}</div>`;
    document.getElementById('fixtures-list').innerHTML = `<div class="error">${message}</div>`;
}

// Load all data
async function loadData() {
    if (isLoading) return;

    showLoading();

    try {
        // Fetch results and fixtures in parallel
        const [resultsData, fixturesData] = await Promise.all([
            fetchResults(),
            fetchFixtures()
        ]);

        const results = parseEvents(resultsData, false);
        const fixtures = parseEvents(fixturesData, true);

        console.log('Results:', results.length, 'Fixtures:', fixtures.length);

        // Update stats (Premier League only)
        const stats = calculateStats(results);
        updateStatsDisplay(stats);

        // Render matches
        renderResults(results);
        renderFixtures(fixtures);

        // Update timestamp
        updateLastUpdated();

    } catch (error) {
        console.error('Load error:', error);
        showError('Failed to load data. Click refresh to try again.');
    } finally {
        hideLoading();
    }
}

// Setup refresh button
function setupRefreshButton() {
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadData);
    }
}

// Main init function
async function init() {
    setupTabs();
    setupRefreshButton();
    await loadData();
}

// Run when DOM is ready
document.addEventListener('DOMContentLoaded', init);
