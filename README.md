# Man City Premier League Season Tracker 2025/26

A live tracker for Manchester City's Premier League season, pulling real-time data from ESPN's API.

## Features

- **Live Results** — View all Premier League match results with scores
- **Upcoming Fixtures** — See scheduled Premier League matches
- **Season Stats** — Track P/W/D/L/GF/GA/Points
- **Visual Result Indicators** — Color-coded W/D/L badges
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
