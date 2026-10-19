import React from 'react'

const BaseWorkStation = () => {
    const { state, setState } = useMyContext();

  const [rangeDates, setRangeDates] = useState([]);
  const [ticker, setTicker] = useState(null);
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
    <div>
               <div className="row modelDeployment">

<div className="col-3 modelDeployment-search">
<h4 className="pt-4 toggleHeader">
    Multivariable analysis 
  </h4>
  <div className=" togglerSibling hidden seccionBusqueda-variableSetUp">
    <div className="row">
      <div className="col-6">
        <h6>Dependent Variable(s)</h6>
      </div>
      <div className="col-6">
        <h6>Independent Variable(s)</h6>
      </div>
    </div>
    <div className="row">
      <div className="col-6" id="dependentVariableSetUp">
        <input
          className="dependentVariable"
          defaultValue={"X:BTCUSD"}
          type="text"
          placeholder="Y"
        />
      </div>
      <div className="col-6" id="independentVariableSetUp">
        <input
          className="independentVariable"
          type="text"
          placeholder="x1"
          defaultValue={"TSLA"}
        />
        <input
          className="independentVariable"
          defaultValue={"NIO"}
          type="text"
          placeholder="x1"
        />
      </div>
    </div>
    <div className="row">
      <div className="col-6">
        <button
          id="_HomeController_addDVariable"
          onClick={handleClick}
        >
          Add Dep. Var
        </button>
      </div>
      <div className="col-6">
        <button
          id="_HomeController_addIVariable"
          onClick={handleClick}
        >
          Add Ind. Var
        </button>
      </div>
    </div>
    <div className="row">
      <div className="col-4"></div>
      <div className="col-4">
        {" "}
        <button
          id="Function_HomeController_saveVariables"
          onClick={handleClick}
        >
          Save Variables
        </button>
      </div>
      <div className="col-4"></div>
    </div>
    <div className="row">
      <div className="col-6">
        {" "}
        <div className="row">
          <div className="col-6">Start Date</div>
          <div className="col-6">
            {" "}
            <input
              id="startDateMVM"
              type="text"
              placeholder="Start Date"
              defaultValue="2022-05-02"
            />
          </div>
        </div>
      
      </div>
      <div className="col-6">
      <div className="row">
          <div className="col-6">End Date</div>
          <div className="col-6">
            {" "}
            <input
              id="endDateMVM"
              type="text"
              placeholder="end Date"
              defaultValue="2024-05-02"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
<div className="row">
<div className="col-4">
         <h5 className="toggleHeader">Funciones </h5>
         
        <div className="togglerSibling hidden">
        <div className="row"><div className="col-8"></div>
        <div className="col-4"><select name="" onChange={()=>{
          const e = document.getElementById('functionsTickerSelector')
          var text = e.options[e.selectedIndex].text;

          localStorage.setItem('functionsTicker',text)
        }} className="hidden" id="functionsTickerSelector"></select></div></div>
       
          <div className="row" id="modelInputs"></div>
          <div className="row" id="initialTestsButtons">
            <div className="row">
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
                id="Function_TestsController_allTestsTogether"
                onClick={handleClick}
              >
                All of above
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
            <div className="row">
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
            </div>
          </div>
          <div className="row" id="graphButtons">
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
          </div>
        </div>
      </div>
</div>
</div>

    </div>
  )
}

export default BaseWorkStation