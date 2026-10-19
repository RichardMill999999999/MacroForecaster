import React,{useEffect} from 'react';
import { Routes, Route } from 'react-router-dom';
import axios from "axios";
import AIChat from '../pages/components/individualPage/components/ChatAInterpreter';
import Functions from '../pages/components/DataAnalysis/Functions';
import WorkController from '../variable/controllers/workController/WorkController';
const SavedTimeSeriesRouter = () => {
    let Title = window.location.pathname.split('/');
    const Ticker = Title[2];
    const startDate = Title[3];
    const endDate = Title[4];
   //use useEffect
    
       useEffect(() => {
        WorkController.resultsDisplay.graphIndividualSeries()
        ;
      });
    return (
        <div>
            <div className="container d-flex flex-column align-items-center text-center">
               <div>
              <div className="d-flex flex-row">
              <input type="text" id='endDate' className='hidden'  defaultValue={endDate} /> 
              <input type="text" id='startDate' className='hidden' defaultValue={startDate} /> 

                <input type="text" id='searchEntry' className='hidden' defaultValue={Ticker} /> 
              <h1 id='ticker' >{Ticker}</h1>
                <div className='d-flex flex-column'>
                    <div >{startDate}</div>
                    <div >{endDate}</div>
                </div>
              </div>
               </div>
            </div>
              <div id="allGraphs" style={{position:'absolute', bottom:'0px',left:'0px'}}></div>

            <div className="d-flex flex-row container  mt-3">
                <Functions />
                
            </div>
            <div className="d-flex flex-row container  mt-3">
            </div>
            <Routes>
                <Route path="*" element={<div></div>} />
            </Routes>
            
        </div>
    );
};

export default SavedTimeSeriesRouter;
