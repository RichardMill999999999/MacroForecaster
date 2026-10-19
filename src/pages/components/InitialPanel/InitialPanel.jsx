import React from 'react'
import TSLookUpTool from './TSLookUpTool';
import TimeSeriesDataAnalysis from '../workSatation/TimeSeriesDataAnalysis';
import MasterController from '../../../variable/controllers/MasterController';
const InitialPanel = () => {
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
      const setInputValueToday = () => {
        // set date like 2024-05-02 as value for input element id = 'endDate'
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
        const yyyy = today.getFullYear();
        document.getElementById('endDate').value = yyyy + '-' + mm + '-' + dd;
        const calendarEndDate = document.getElementById('startDate');
        const pastYear = yyyy - 2;
        calendarEndDate.value = pastYear + '-' + mm + '-' + dd;
      }
    
  return (
    <div className="container-fluid" id = "InitialPanel">
          <div className="d-flex flex-row" id="TimeSeries">           
 
    {/* <div className=" modelDeployment-search">
 <div className=" seccionBusqueda-derecha">
              <h4 className="toggleHeader">
               Time series builder
              </h4>
              <div className=" seccionBusqueda-derecha-searchEntry togglerSibling ">
                <label htmlFor=""><strong>What stock are we analysing today? 📈</strong></label>
                      <TSLookUpTool />
          
              </div>
           
              <div className="responseStatus">
              <div className="row" id="printTickerInfo"></div>
              <div className="row" id="entryHistory"></div>
            </div>
            </div>
           
      
            </div> 
             */}
          </div>
          <div><TimeSeriesDataAnalysis /></div>
              {/* <div className='col-5'>
                <div className="row">  <div className="col-5">
                  <div className="row">
                    <div className="col-3">
                      <h6>Ticker</h6>
                    </div>
                    <div className="col-9">
                      {" "}
                      <input
                        id="searchEntry"
                        type="text"
                        placeholder="Ticker"
                        defaultValue={""}
                      />
                    </div>
                  </div>
                </div>
                <div className="col-8 seccionBusqueda-derecha-fechas">
                  <div className="row">
                    <div className="col-4">Start D.</div>
                    <div className="col-8">
                      {" "}
                   <div className="row">
                    <div className="col-8">   <input
                        id="startDate"
                        type="text"
                        placeholder="Start Date"
                        defaultValue=""
                      /></div>
                   </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-3">End D.</div>
                    <div className="col-9">
                      {" "}
                 
                      <div className="row">
                        <div className="col-8">     <input
                        id="endDate"
                        type="text"
                        placeholder="End Date"
                        defaultValue=""
                      /></div>
                        <div className="col-1"><button onClick={setInputValueToday}>Today</button></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-6">
                  {" "}
                  <button
                    className="actionButton"
                    id="Function_HomeController_individualSearch"
                    onClick={handleClick}
                  >
                    Search & Graph
                  </button>{" "}
                </div></div>
              </div> */}
          </div>
  )
}

export default InitialPanel