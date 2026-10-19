import React from "react";
import { Routes, Route } from 'react-router-dom';
import { Home} from '../pages';
import axios from "axios";
import SavedInvestigationsRouter from "../pages/components/workSatation/SavedInvestigationsRouter";
import SavedTimeSeriesRouter from "./SavedTimeSeriesRouter";
import Macroeconomia from "../pages/components/Macroeconomia/MacroeconomiaV2";
import MacroeconomiaNacional from "../pages/components/Macroeconomia/MacroeconomiaNacional";
import Forecast from "../pages/components/DataAnalysis/Forecast";
const RoutesIndex = () => {
  


  return (
    <>
    <Routes>
      
      
    <Route
      path = '/'

          element={<Home  />}
        />
        <Route
        path="/savedInvestigation/:invId/:startDate/:endDate"
        element={<SavedInvestigationsRouter />}
      />
          
        <Route
          path = {"/savedTimeSeries/*"}
          element={<SavedTimeSeriesRouter  />}
        />
          <Route
          path = {"/Macroeconomia/"}
          element={<Macroeconomia  />}
        />
       <Route
          path = {"/Macroeconomia/nacional/*"}
          element={<MacroeconomiaNacional  />}
        />
           <Route
          path = {"/Macroeconomia/nacional/estatal/*"}
          element={<MacroeconomiaNacional  />}
        />
     
     
    </Routes>
  </>

  );
};

export default RoutesIndex;

