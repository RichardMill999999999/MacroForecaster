import React from 'react'
import MasterController from '../../../variable/controllers/MasterController';
const TSLookUpTool = () => {
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
  return (
    <div>
              <div className="mx-5 ms-auto" id="TSLookUpTool">
          <div className="" id="tsLookUpTools">
            <div className=" seccionDesarrollo-Functions">
                <div className="row ">
                  <div className="col-12 ">
                    <h5 className="toggleHeader ">
                      Busqueda empresas/index/ticker {" "}
                    </h5>
                    <div className="togglerSibling">
                      <div className="row">
                        <div className="col-4">
                          <input
                            type="text"
                            className='ts-input'
                            id="searchTicker"
                            placeholder="Company, Option, Crypto, Forex search"
                          />
                        </div>
                        <div className="col-8">
                          <div className="row">
                            {" "}
                            <div className="col-6">
                              <select
                                name=""
                                className='ts-input'
                                id="marketType"
                                onChange={(e) => {
                                  const selVal = e.target.value;
                                  document.getElementById("marketType").value =
                                    selVal;
                                }}
                              >
                                <option value="">Market type</option>{" "}
                                <option value="stock">Stock</option>
                                <option value="fx">FX</option>
                                <option value="crypto">Crypto</option>
                                <option value="otc">OTC</option>
                              </select>
                            </div>
                            <div className="col-6">
                              <h5>
                                <button
                                  id="_HomeController_getTickers"
                                  onClick={handleClick}
                                  className='ts-btn secondary'
                                >
                                  Search
                                </button>
                              </h5>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="row" id="searchTable"></div>
                    </div>
                  </div>
                 
                </div>
           
              </div>
            </div>
          </div>
        <style> {`
.date-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

     .ts-panel {
  background: rgba(10,20,10,.95);
  border: 1px solid #2f4f2f;
  border-radius: 16px;
  padding: 24px;              /* ⬅ more breathing */
  margin-top: 20px;           /* ⬅ separates from map */
  color: #cde6b3;
  box-shadow: 0 0 20px rgba(107,142,35,.25);
}

/* Inputs */
.ts-input {
  width: 100%;
  background: rgba(20,40,20,.9);
  border: 1px solid #6b8e23;
  border-radius: 8px;
  padding: 6px 10px;
  color: #cde6b3;
  outline: none;
}

.ts-input::placeholder {
  color: #9fb58a;
}

/* Buttons */
.ts-btn {
  background: rgba(30,60,30,.95);
  border: 1px solid #6b8e23;
  border-radius: 10px;
  padding: 8px 14px;
  color: #cde6b3;
  cursor: pointer;
  transition: all .2s ease;
}

.ts-btn:hover {
  box-shadow: 0 0 14px #6b8e23;
  transform: translateY(-1px);
}

.ts-btn.secondary {
  background: rgba(60,60,60,.7);
  border-color: #888;
}`}</style>
    </div>
  )
}

export default TSLookUpTool