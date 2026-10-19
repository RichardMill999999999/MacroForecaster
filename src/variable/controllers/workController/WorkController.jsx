import React from "react";
import axios from "axios";
import TestsController from "../TestsControllers/TestsController";
import getTickers from "../zutilz/utils";
import HomeGraphs from "../HomeControllers/HomeGraphs";
const WorkController = {
    worklog: {
        addItem: (test,ticker)=>{
            
 
                const time =  new Date().toLocaleTimeString('en-US', {hour12: false})

                let workName = test.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/([A-Z])([A-Z][a-z])/g, '$1 $2'); //splitted[1] splitted again at each Mayusc and capitalized each word
                workName = workName.charAt(0).toUpperCase() + workName.slice(1);
                const worklog = document.getElementById('worklog')
                const resultHistory = document.createElement('div')
                resultHistory.innerHTML = `  <div class="worklogItem">
                <p>${time}  ${workName} ran for ${ticker} <span class="viewResultDetailsButton">view results</span></p>
               </div>`
            
            
                worklog.append(resultHistory)
            
           
        }
    },
    resultsDisplay : {
        addItem: async (testResults,title)=>{
           console.log(testResults);
            const resultsDisplayDiv = document.getElementById('resultsLog')
            const individualResult = document.createElement('div')
            resultsDisplayDiv.appendChild(individualResult)
            const closeBtn = document.createElement('button')

            const minButton = document.createElement('button')
            minButton.innerHTML = '-'
            minButton.addEventListener('click',(e)=>{
                const parentNode = e.target.parentElement
                let sibling =  parentNode.parentElement.nextElementSibling
                console.log(sibling);
                sibling.classList.toggle('hidden')
            })
            closeBtn.addEventListener('click',(e)=>{
              
                const parentDiv = e.target.closest('.indResultDisplay-container');
                if (parentDiv) {
                    parentDiv.parentElement.remove();
                }                
            })
            closeBtn.innerHTML = " &#120143;"
            individualResult.innerHTML = `
            <div class="row indResultDisplay-container">
            <div class="row indResultDisplay-titleClose">
              <div class="col-10 indResultDisplay-titleClose-title">
              
         <h6>     ${title}</h6>
              
              
              </div>
              <div class="col-1 indResultDisplay-titleClose-min">

              </div>
              <div class="col-1 indResultDisplay-titleClose-close">

              </div>
            </div>
                 
            <div class="row indResultDisplay-actualResult">

    </div>
          </div>
    
            `
            individualResult.querySelector('.indResultDisplay-titleClose-close').appendChild(closeBtn);
            individualResult.querySelector('.indResultDisplay-titleClose-min').appendChild(minButton);

            const resultsContainer = individualResult.querySelector('.indResultDisplay-actualResult');
            
            if (typeof testResults === 'string') {
                resultsContainer.innerHTML = testResults;
            } else if (testResults instanceof HTMLElement) {
                resultsContainer.appendChild(testResults);
            }
            console.log(testResults,resultsContainer);
        },
        graphIndividualSeries:async(prop='') =>{
                let searchValue = '';
                if (prop !== '') {
                    searchValue = prop;
                } else if (document.getElementById("searchEntry")) {
                    searchValue = document.getElementById("searchEntry").defaultValue;
                } else {
                    console.log(searchValue = document.getElementById("searchEntry"));
                }
        
                if (searchValue !== "") {
                    const startDate = document.getElementById("startDate").value;
                    const endDate = document.getElementById("endDate").value;
                    const data = await axios.get(`http://localhost:5000/getData/${searchValue}/${startDate}/${endDate}`);
        
                    let tempArray = [];
                    let dates = [];
                    let timestamps = [];
                    const timeSeries = { dates: dates, datos: tempArray, ticker: searchValue, startDate: startDate, endDate: endDate };
        
                    if (data) {
                   
                    
        
                        data.data.results.forEach((obj) => {
                            tempArray.push(obj.c);
                            let timestamp = obj.t;
                            timestamps.push(timestamp);
        
                            let date = new Date(timestamp);
                            let formattedDate = `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getDate().toString().padStart(2, "0")}`;
                            dates.push(formattedDate);
                        });
        
                        HomeGraphs.graphScript(timeSeries, `${searchValue} from ${startDate} to ${endDate}`);
        
                   
                    }
                }
            
        }
        
    }
    ,
    history:{
        addItem: (testName,testResults,ticker)=>{
        axios.post('/api/individualSearch/')
        }
        ,
        getHistoty: ()=>{
            axios.get('api/worklog')
           .then(response=>{return data.data})
        }

    }

}
export default WorkController 