import React from "react";
import { useState, useEffect } from "react";
import "../styles/Home.scss";
import axios from "axios";
import MasterController from "../variable/controllers/MasterController";
import getTickers from "../variable/controllers/zutilz/utils";
import useMyContext from "../context/useContext";
import InitialPanel from "./components/InitialPanel/InitialPanel";
import TimeSeriesHistory from "./components/InitialPanel/TimeSeriesHistory";
import Ma from "./components/Macroeconomia/Macroeconomia";
import Forecast from "./components/DataAnalysis/Forecast";
import PortfolioLookout from "./components/DataAnalysis/PortfolioLookout";
import { NavLink, useSearchParams } from "react-router-dom";
import MacroEconomia from "./components/Macroeconomia/Macroeconomia";
import FredCategoryExplorer from "./components/Macroeconomia/Explorers/USMAP";
import TimeSeriesDataAnalysis from "./components/workSatation/TimeSeriesDataAnalysis";
export const Home = () => {
  const { state, setState } = useMyContext();
  const [searchParams] = useSearchParams();

  const [rangeDates, setRangeDates] = useState([]);
  const [ticker, setTicker] = useState(null);
  const [workspaceView, setWorkspaceView] = useState("forecast");
  let previousElement = null;

  function handleClick(event) {
    const clickedElement = event.target.id;
    const splitted = clickedElement.split("_");
    const type = splitted[0]
    const Controller = splitted[1]
    const Test = splitted[2]
    const ControllerRunning = MasterController[Controller];
    const runnerFunction = ControllerRunning[Test];
    if(type !== ''){
      MasterController.WorkController.worklog.addItem(Test)

    }
   if(localStorage.getItem('lastCall')==='multiple'){

    const tickers = getTickers()
    const selector = document.getElementById('functionsTickerSelector')
    selector.classList.remove('hidden')
    selector.innerHTML = ''
    tickers.map(tic =>{
      const option = document.createElement('option')
      option.innerText = tic
      selector.append(option)
    })
   }


    runnerFunction();
  }
  localStorage.setItem("GraphsOpen", 0);

  useEffect(() => {
    document.querySelectorAll(".toggleHeader").forEach((element) => {
      element.addEventListener("click", toggleSibling);
    });
  });
  function toggleSibling(e) {
    const element = e.target;
    const sibling = element.nextElementSibling;
    let classes = sibling.classList;
    if (classes.contains("hidden")) {
      sibling.classList.remove("hidden");
    } else {
      sibling.classList.add("hidden");
    }
  }

  return (
    <div className="Home ">
      <nav className="home-route-nav" aria-label="Main navigation">
        <div className="home-workspace-switch" aria-label="Forecaster workspace">
          <button
            type="button"
            className={workspaceView === "forecast" ? "active" : ""}
            onClick={() => setWorkspaceView("forecast")}
          >
            Forecaster
          </button>
          <button
            type="button"
            className={workspaceView === "portfolio" ? "active" : ""}
            onClick={() => setWorkspaceView("portfolio")}
          >
            Portfolio lookout
          </button>
        </div>
        <NavLink
          to="/Macroeconomia"
          className={({ isActive }) => `home-route-link${isActive ? " active" : ""}`}
        >
          <span className="home-route-icon" aria-hidden="true">◎</span>
          <span>Macroeconomia</span>
          <span className="home-route-arrow" aria-hidden="true">↗</span>
        </NavLink>
    
      </nav>
      <main className="home-main">
        <div className="Home-bienvenida" id="Bienvenida">
          <h1>{workspaceView === "portfolio" ? "Portfolio lookout" : "Markets Forecast"}</h1>
          <h3>{workspaceView === "portfolio" ? "Build, compare, and monitor hypothetical portfolios" : "by Ricardo Bárcena Márquez"}</h3>
        </div>
        {workspaceView === "portfolio"
          ? <PortfolioLookout />
          : <Forecast initialTicker={searchParams.get("ticker")} />}
        <div id="worklog"></div>
      </main>

    </div>
  );
};

export default Home;
