import React,{useEffect} from 'react'
import MasterController from '../../../variable/controllers/MasterController'
const Functions = () => {

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
      useEffect(() => {
        document.querySelectorAll(".toggleHeader").forEach((element) => {
          element.addEventListener("click", toggleSibling);
        });
      });
    function handleClick(event) {
        const clickedElement = event.target.id;
        const splitted = clickedElement.split("_");
        const type = splitted[0]
        const Controller = splitted[1]
        const Test = splitted[2]
        console.log(splitted)
        const ControllerRunning = MasterController[Controller];
        const runnerFunction = ControllerRunning[Test];
      //   if(type !== ''){
      //     MasterController.WorkController.worklog.addItem(Test)
    
      //   }
      //  if(localStorage.getItem('lastCall')==='multiple'){
    
      //   const tickers = getTickers()
      //   const selector = document.getElementById('functionsTickerSelector')
      //   selector.classList.remove('hidden')
      //   selector.innerHTML = ''
      //   tickers.map(tic =>{
      //     const option = document.createElement('option')
      //     option.innerText = tic
      //     selector.append(option)
      //   })
      //  } 
    
    
        runnerFunction();
      }
  return (
    
  <>
   <div className="col-12">
      <div className="row">
      <div className="col-2">
    <h5 className="toggleHeader">Funciones </h5>
    
   <div className="togglerSibling ">
   <div className="row"><div className="col-8"></div>
   <div className="col-4"><select name="" onChange={()=>{
     const e = document.getElementById('functionsTickerSelector')
     var text = e.options[e.selectedIndex].text;

     localStorage.setItem('functionsTicker',text)
   }} className="hidden" id="functionsTickerSelector"></select></div></div>
  
     <div className="row" id="modelInputs"></div>
     <div className="row" id="initialTestsButtons">
       {/* <div className="row">
         <button
           className="testButton"
           id="Function_TestsController_basicStatisticsTest"
           onClick={handleClick}
         >
           Basic Stats
         </button>
       </div>

       <div className="row">
         <button
           className="testButton"
           id="Function_TestsController_heteroskedasticityTests"
           onClick={handleClick}
         >
           Heteroskedasticity
         </button>
       </div>
       <div className="row">
         <button
           className="testButton"
           id="Function_TestsController_stationalityTest"
           onClick={handleClick}
         >
           Stationality
         </button>
       </div>
       <div className="row">
         <button
           className="testButton"
           id="Function_WorkController_getDifference"
           onClick={handleClick}
         >
           Get difference
         </button>
       </div> */}
       <div className="row">
         <button
           className="testButton"
           id="Function_TestsController_allTestsTogether"
           onClick={handleClick}
         >
           Send Results for AI Interpretation
         </button>
       </div>
       <div className="row">
         <button
           className="testButton"
           id="Function_TestsController_ARIMA"
           onClick={handleClick}
         >
           ARIMA
         </button>
       </div>
       {/* <div className="row">
         <button
           className="testButton"
           id="Function_TestsController_ARCH"
           onClick={handleClick}
         >
           ARCH
         </button>
       </div>
       <div className="row">
         <button
           className="testButton"
           id="Function_TestsController_GARCH"
           onClick={handleClick}
         >
           GARCH
         </button>
       </div> */}
     </div>
     {/* <div className="row" id="graphButtons">
       <div className="row">
         <h5>Graphs</h5>{" "}
         <button
           className="testButton"
           id="Function_TestsController_autoCorrelationTest"
           onClick={handleClick}
         >
           AC & PAC{" "}
         </button>
       </div>
       <div className="row">
         {" "}
         <button
           className="testButton"
           id="Function_TestsController_MovingAvrg"
           onClick={handleClick}
         >
           Moving Avrage{" "}
         </button>
       </div>
     </div> */}
   </div>
 </div>
 <div className="col-10"><h5>ResultsLog</h5>
 <div className="row" id='resultsLog'>
  
  </div></div>
      </div>
    </div></>
  )
}

export default Functions