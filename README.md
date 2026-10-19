# DataAnalysis

## Run locally

1. Add your API credentials and MongoDB connection string to `.env` (use `.env.example` as a template).
2. Start the Flask API with `start.bat` on Windows or `./start.sh` on macOS/Linux. The API listens on port 5000.
3. In another terminal, run `npm run dev` and open the Vite URL.

For the AWS Amplify frontend and App Runner API deployment, see [DEPLOYMENT.md](./DEPLOYMENT.md).

The frontend uses `http://localhost:5000` by default. Set `VITE_BACKEND_URL` in your Vite environment
when the API is hosted at a different address.

`app.py` is the single API application used by the frontend and owns the mascot's `/AI/macro-insight`
route. The startup scripts launch it directly. Running `analyzeData.py` also starts this same application
for compatibility; it no longer starts a separate legacy API.

The portfolio workspace uses the `EconomicStudies` MongoDB database and saves profiles, portfolios, and
simulation sessions to the `PortfolioWorkspaces` collection. Existing browser-saved workspace data is
copied into MongoDB the first time the API returns an empty workspace. Historical time-series data remains
in the existing `TimeSeriesHistory` database.

Check `http://localhost:5000/health` to see which integrations are configured. Never commit `.env`.

The macro atlas uses delayed Yahoo Finance futures history as a fallback when no Finnhub stream key is
configured. Commodity charts support 1 week, 30, 90, 180, and 365 days, plus each provider's maximum
available history. Its floating Orbit astronaut uses `OPENAI_API_KEY2` (DeepSeek) to analyze visible
dashboard data and recent relevant country news. It checks for updates every five minutes, reuses
unchanged insights, and limits new DeepSeek analyses to one per screen focus every 15 minutes.
The astronaut roams without covering the Ask AI panel; its speech bubble travels beside it as it
orbits the globe, then parks at the selected country. The bubble is a persistent, screen-aware chat:
it remembers the current subject's conversation and recent insights, answers questions from the loaded
evidence, and falls back to a distinct insight when the evidence does not support an answer.

The forecast page uses Polygon daily aggregate bars and reference-company details, plus Alpaca option
snapshots and the latest stock quote/bar. Its market-context panel shows market capitalization when Polygon
provides it, session volume/trade counts, candle-direction volume estimates, and quote-level bid/ask sizes.
Buyer- versus seller-initiated share volume is not inferred from daily bars. The forward forecast defaults
to 30 trading sessions and the historical chart defaults to two years; the selected 67% confidence range
is used by both forecast charts. MongoDB connectivity is actively checked by `/health` (`mongoConnected`),
and Mongo-backed routes return an explicit service error if the database is not configured or reachable.
