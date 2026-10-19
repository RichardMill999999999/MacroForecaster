# DataAnalysis

## Run locally

1. Add your API credentials and MongoDB connection string to `.env` (use `.env.example` as a template).
2. Start the Flask API with `start.bat` on Windows or `./start.sh` on macOS/Linux. The API listens on port 5000.
3. In another terminal, run `npm run dev` and open the Vite URL.

The portfolio workspace uses the `EconomicStudies` MongoDB database and saves profiles, portfolios, and
simulation sessions to the `PortfolioWorkspaces` collection. Existing browser-saved workspace data is
copied into MongoDB the first time the API returns an empty workspace. Historical time-series data remains
in the existing `TimeSeriesHistory` database.

Check `http://localhost:5000/health` to see which integrations are configured. Never commit `.env`.
