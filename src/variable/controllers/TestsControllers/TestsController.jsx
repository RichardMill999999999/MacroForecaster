import React from "react";
import axios from "axios";
import HomeGraphs from "../HomeControllers/HomeGraphs";
import WorkController from "../workController/WorkController";
const TestsController = {
  autoCorrelationTest:  async function autoCorrTest() {
    const ticker = document.getElementById("ticker").innerText;
      const startDate = document.getElementById("startDate").value;
      const endDate = document.getElementById("endDate").value;
      if (typeof(ticker) !== 'string'){
       for(let i = 0; i<ticker.length;i++){
        const autoCorrelationTest = await axios.get(
          `http://localhost:5000/autoCorrelationTest/${ticker[i]}/${startDate}/${endDate}`
        );
        // for (var i in autoCorrelationTest.data){
        //   const colDivisionKey = document.createElement('div')
        //   const colDivisionValue = document.createElement('div')
        //   colDivisionKey.classList.add('col-6')
        //   colDivisionValue.classList.add('col-6')
        //   const key = document.createElement('h6')
        //   key.innerText = i
        //   const value = document.createElement('p')
        //   value.innerText = autoCorrelationTest.data[i][i]
        //   colDivisionKey.appendChild(key)
        //   colDivisionValue.appendChild(value)
        //   autoCorrTestDiv.append(colDivisionKey,colDivisionValue)
  
        //  }
       HomeGraphs.autocorrelationGraph(autoCorrelationTest['data']['aucorr']['aucorr'])
      HomeGraphs.partialAutocorrelationGraph(autoCorrelationTest['data']['aucorrParcial']['aucorrParcial'])
       }
      }else{
        const autoCorrelationTest = await axios.get(
          `http://localhost:5000/autoCorrelationTest/${ticker}/${startDate}/${endDate}`
        );
        console.log(autoCorrelationTest)
        // for (var i in autoCorrelationTest.data){
        //   const colDivisionKey = document.createElement('div')
        //   const colDivisionValue = document.createElement('div')
        //   colDivisionKey.classList.add('col-6')
        //   colDivisionValue.classList.add('col-6')
        //   const key = document.createElement('h6')
        //   key.innerText = i
        //   const value = document.createElement('p')
        //   value.innerText = autoCorrelationTest.data[i][i]
        //   colDivisionKey.appendChild(key)
        //   colDivisionValue.appendChild(value)
        //   autoCorrTestDiv.append(colDivisionKey,colDivisionValue)
  
        //  }
       HomeGraphs.autocorrelationGraph(autoCorrelationTest['data']['aucorr']['aucorr'])
      HomeGraphs.partialAutocorrelationGraph(autoCorrelationTest['data']['aucorrParcial']['aucorrParcial'])
      }
      
      

      },
      basicStatisticsTest: async function basicStatisticsTest(){
        const ticker    = document.getElementById("ticker").innerText;
        const startDate = document.getElementById("startDate").value;
        const endDate   = document.getElementById("endDate").value;
      
        const resp = await axios.get(
          `http://localhost:5000/calculateBasicStats/${ticker}/${startDate}/${endDate}`
        );

      
        // grab the basicStats object
        const stats = resp.data.basicStats;
      
        const container = document.createElement('div');
        container.classList.add('row');
      
        Object.entries(stats).forEach(([key, val]) => {
          // key column
          const colK = document.createElement('div');
          colK.classList.add('col-6');
          const h6 = document.createElement('h6');
          h6.innerText = key;
          colK.appendChild(h6);
      
          // value column
          const colV = document.createElement('div');
          colV.classList.add('col-6');
      
          if (val !== null && typeof val === 'object') {
            // object/array → JSON pretty-print
            const pre = document.createElement('pre');
            pre.style.margin = 0;
            pre.innerText = JSON.stringify(val, null, 2);
            colV.appendChild(pre);
          } else {
            // primitive
            const p = document.createElement('p');
            p.innerText = val;
            colV.appendChild(p);
          }
      
          container.append(colK, colV);
        });
      
        WorkController.resultsDisplay.addItem(container, 'Basic Statistics');
        return container;
      },
      
      
      heteroskedasticityTests: async function heteroskedasticityTests(){
        const ticker = document.getElementById('ticker').innerText
        const startDate = document.getElementById("startDate").value;
        const endDate = document.getElementById("endDate").value;
        const heteroskedasticityTests = await axios.get(
          `http://localhost:5000/heteroskedasticityTests/${ticker}/${startDate}/${endDate}`
        );
        const heteroskedasticityTestsDiv = document.createElement('div');
        heteroskedasticityTestsDiv.classList.add('row')
        for (var i in heteroskedasticityTests.data){
          const colDivisionKey = document.createElement('div')
          const colDivisionValue = document.createElement('div')
          colDivisionKey.classList.add('col-6')
          colDivisionValue.classList.add('col-6')
          const key = document.createElement('h6')
          key.innerText = i
          const value = document.createElement('p')
          value.innerText = heteroskedasticityTests.data[i]
          colDivisionKey.appendChild(key)
          colDivisionValue.appendChild(value)
          heteroskedasticityTestsDiv.append(colDivisionKey,colDivisionValue)
  
         }
         WorkController.resultsDisplay.addItem(heteroskedasticityTestsDiv,'Heteroskedasticity Tests')

         return heteroskedasticityTestsDiv
      },
      stationalityTest: async function stationalityTest(){
        const ticker     = document.getElementById('ticker').innerText;
        const startDate  = document.getElementById("startDate").value;
        const endDate    = document.getElementById("endDate").value;
        const response   = await axios.get(
          `http://localhost:5000/ST/${ticker}/${startDate}/${endDate}`
        );
        const data       = response.data;  // { ADF:…, DFGLS: […], Phillips-Perron: {…} }
      
        const stationalityTestDiv = document.createElement('div');
        stationalityTestDiv.classList.add('row');
      
        Object.entries(data).forEach(([keyStr, val]) => {
          // key column
          const colKey = document.createElement('div');
          colKey.classList.add('col-12');
          const keyEl = document.createElement('h6');
          keyEl.innerText = keyStr;
          colKey.appendChild(keyEl);
      
          // value column
          const colVal = document.createElement('div');
          colVal.classList.add('col-12');
      
          if (val !== null && typeof val === 'object') {
            // object or array → pretty-print
            const pre = document.createElement('pre');
            pre.style.margin = 0;
            pre.innerText = JSON.stringify(val, null, 2);
            colVal.appendChild(pre);
          } else {
            // primitive
            const p = document.createElement('p');
            p.innerText = val;
            colVal.appendChild(p);
          }
      
          stationalityTestDiv.append(colKey, colVal);
        });
      
        WorkController.resultsDisplay.addItem(
          stationalityTestDiv,
          'Stationality Tests'
        );
        return stationalityTestDiv;
      },
      allTestsTogether: async function allTestsTogether(){
            const ticker = document.getElementById("ticker").innerText;
      const startDate = document.getElementById("startDate").value;
      const endDate = document.getElementById("endDate").value;
        try {
          let results = {
            basicStatistics: null,
            heteroskedasticity: null,
            stationality: null,
            autoCorrelation: null
          }
          const basic = await axios.get(
          `http://localhost:5000/calculateBasicStats/${ticker}/${startDate}/${endDate}`
        );
          results.basicStatistics = basic.data.basicStats
          const heteroskedasticity =await axios.get(
          `http://localhost:5000/heteroskedasticityTests/${ticker}/${startDate}/${endDate}`
        );
          results.heteroskedasticity= heteroskedasticity.data
   
       

        const autoCorrelation = await axios.get(
          `http://localhost:5000/autoCorrelationTest/${ticker}/${startDate}/${endDate}`
        );
      results.autoCorrelation = autoCorrelation.data
         //transform all data to plain text
      const plainTextResults = `
==== Basic Statistics ====
${JSON.stringify(results.basicStatistics, null, 2)}

==== Heteroskedasticity ====
${JSON.stringify(results.heteroskedasticity[0], null, 2)}

==== Stationality ====
${JSON.stringify(results.heteroskedasticity[1], null, 2)}

==== AutoCorrelation ====
${JSON.stringify(results.autoCorrelation, null, 2)}
`;
    
          //save results for ticker results to send to AI


        //  const response = await axios.post(`http://localhost:5000/ai-interpret/${plainTextResults}`)
        //   console.log(response.data)
        // Send results to AI and display reply
    const aiResponseDiv = document.createElement('div');
    aiResponseDiv.classList.add('row');
    const paragraph = document.createElement('p');

    
        const response = await axios.post(`http://localhost:5000/ai-interpret/${plainTextResults}`)
        paragraph.innerText = response.data.reply;
    aiResponseDiv.appendChild(paragraph);

    // Correct: append the actual div, not a text node
    WorkController.resultsDisplay.addItem(aiResponseDiv, 'AI Interpretation');
        }
        catch(err) {
          console.error("Error running all tests:", err);
        }
      },
      
      getDifference: async function getDifference(){
        
      },
      correctSpecification: async function correctSpecification(){

      },
    
      ARIMA: async function ARIMA(){

        const ticker = document.getElementById('ticker').innerText
        const startDate = document.getElementById('startDate').value  
        const endDate = document.getElementById('endDate').value
        const ARIMA = await axios.post(
          `http://localhost:5000/ARIMA/${ticker}/${startDate}/${endDate}`
        );
        const ARIMADiv = document.createElement('div')
        ARIMADiv.classList.add('row')
          // const colDivisionKey = document.createElement('div')
          // const colDivisionValue = document.createElement('div')
          // colDivisionKey.classList.add('col-2')
          // colDivisionValue.classList.add('col-4')
          // add table for results
          // let table = document.createElement('table')
          // table.classList.add('table','table-striped','table-bordered')
          // const thead = document.createElement('thead')
          // const tbody = document.createElement('tbody')
          // const headerRow = document.createElement('tr')
          // const paramHeader = document.createElement('th')
          // paramHeader.innerText = 'Period'
          // const valueHeader = document.createElement('th')
          // valueHeader.innerText = 'Value'
          // headerRow.appendChild(paramHeader)
          // headerRow.appendChild(valueHeader)
          // thead.appendChild(headerRow)
          // table.appendChild(thead)
          // //fill table with forecast data
          // //change color to white for better visibility

          // table.style.backgroundColor = 'white'
          // for (var i in ARIMA.data['forecast']){
          //   const row = document.createElement('tr')
          //   const periodCell = document.createElement('td')
          //   periodCell.innerText = i
          //   const valueCell = document.createElement('td')
          //   valueCell.innerText = ARIMA.data['forecast'][i]
          //   row.appendChild(periodCell)
          //   row.appendChild(valueCell)
          //   tbody.appendChild(row)
          // }
          // table.appendChild(tbody)
          // colDivisionValue.appendChild(table)


          // const key = document.createElement('h6')
          // key.innerText = 'forecast'
          // const value = document.createElement('p')
          // value.innerText = ARIMA.data['forecast']
          // colDivisionKey.appendChild(key)
          // colDivisionValue.appendChild(value)
          // ARIMADiv.append(colDivisionKey,colDivisionValue)
  // do a graph with forecasted values
          // HomeGraphs.graphScript(ARIMA.data['forecast'], 'ARIMA Forecasted Values')
            
const aiResponseDiv = document.createElement('div');
    aiResponseDiv.classList.add('row');
    const paragraph = document.createElement('p');
const plainTextResults = `
==== ARIMA RESULTS ====
FORECAST: ${ARIMA.data.forecast},
SUMMARY: ${ARIMA.data.model_summary}
if the forecast shows an increasing trend or decreasing trend over time
respond with a brief analysis of the trend and what it could imply for the stock performance in the near future
what other stocks or sectors could benefit from this trend, or be negatively impacted by it
along with any external factors that could be influencing this trend

`;
    
        const response = await axios.post(`http://localhost:5000/ai-interpret/${plainTextResults}`)
        paragraph.innerText = response.data.reply;
    aiResponseDiv.appendChild(paragraph);

    // Correct: append the actual div, not a text node
    WorkController.resultsDisplay.addItem(aiResponseDiv, 'Stock Analysis');
        //  return ARIMADiv

      },
      ARCH: async function ARCH(){
        const ARCHDiv = document.getElementById('ARCH');

      }, 
      GARCH: async function GARCH(){
        const GARCHDiv = document.getElementById('GARCH');

      },

      MovingAvrg: async function MovingAvrg(){
            const ticker     = document.getElementById('ticker').innerText;
        const startDate  = document.getElementById("startDate").value;
        const endDate    = document.getElementById("endDate").value;
        const response   = await axios.get(
          `http://localhost:5000/ARIMA/${ticker}/${startDate}/${endDate}`
        );
        const data       = response.data;
        
        const MovingAvrgDiv = document.createElement('div')
        MovingAvrgDiv.classList.add('row')
 /* answer is */ 
        for (var i in data){
          const colDivisionKey = document.createElement('div')
          const colDivisionValue = document.createElement('div')
          colDivisionKey.classList.add('col-6')
          colDivisionValue.classList.add('col-6')
          const key = document.createElement('h6')
          key.innerText = i
          const value = document.createElement('p')
          value.innerText = data[i]
          colDivisionKey.appendChild(key)
          colDivisionValue.appendChild(value)
          MovingAvrgDiv.append(colDivisionKey,colDivisionValue)
          
        }
          WorkController.resultsDisplay.addItem(MovingAvrgDiv,'Moving Average')
          return MovingAvrgDiv
      }
     

}
export default TestsController