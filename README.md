# Man City Season Tracker 2025/26

A live tracker for Manchester City's season across all competitions, pulling real-time data from ESPN's API.

## Features

- **All Competitions** — Track Premier League, Champions League, FA Cup, Carabao Cup, and Club World Cup
- **Live Results** — View all match results with scores and competition badges
- **Upcoming Fixtures** — See scheduled matches across all competitions
- **Season Stats** — Track P/W/D/L/GF/GA across all competitions
- **Visual Result Indicators** — Color-coded W/D/L badges
- **Competition Badges** — Distinct color-coded badges for each competition
- **Timezone Display** — Shows your local timezone in the header
- **Real-time Refresh** — Click to pull latest data from ESPN

## Tech Stack

- Vanilla HTML/CSS/JavaScript
- ESPN API (unofficial public endpoint)
- No build tools required

## Data Source

Uses ESPN's public API endpoints:
- Results: `site.api.espn.com/apis/site/v2/sports/soccer/all/teams/382/schedule`
- Fixtures: `site.api.espn.com/apis/site/v2/sports/soccer/all/teams/382/schedule?fixture=true`

## Usage

Just open `index.html` in a browser. No server required (ESPN API allows CORS).

Or serve locally:
```bash
python3 -m http.server 8080
```

Then visit `http://localhost:8080`

## License

MIT
