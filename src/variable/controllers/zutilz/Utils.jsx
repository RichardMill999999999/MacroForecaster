import React from "react";


export default function getTickers (){
    const allTickers = localStorage.getItem('allTickers');
    const MultiIndependentVarTickers = localStorage.getItem('MultiIndependentVarTickers');
    const MultiDependentVarTickers = localStorage.getItem('MultiDependentVarTickers');

    const singleTicker = localStorage.getItem('ticker');
    console.log(allTickers);
    if (allTickers) {
      return allTickers.split(',')
     
    } else {
      return singleTicker;
    } 
}

