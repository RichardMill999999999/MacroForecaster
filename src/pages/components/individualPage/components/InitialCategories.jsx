import React, { useState, useEffect } from 'react';
import '../../../../styles/InitialCategories.scss'
import propsInfoData from '../../../../variable/fetches/propsInfo.json';
const initialCategories = ({ selectedProd, ...propsInfo }) => {
const [itemsSelected,selectItem] = useState(null)
let {merchCategories} = propsInfo

function rowColsByLength(array,rowId){
  const row = document.getElementById(`${rowId}`)
  const children = row.childNodes
switch (array.length){
    case 1:
      array.map((child)=>{
        const tempButton = document.createElement('button')

        tempButton.innerText = child
        tempButton.classList.add('ms-3','col-4', 'categoriesButton')
        row.appendChild(tempButton)
      })
      break;
      case 2:
       
        array.map((child)=>{
          const tempButton = document.createElement('button')

          tempButton.innerText = child
          tempButton.classList.add('ms-3','col-lg-5', 'col-6', 'categoriesButton')
          row.appendChild(tempButton)
        })
        break;
      case 3:
      array.map((child)=>{
        const tempButton = document.createElement('button')

          tempButton.innerText = child
     
          tempButton.classList.add('ms-3','col-3', 'categoriesButton')
          row.appendChild(tempButton)
        })
        
        break;
      case 4:
        
        array.map((child)=>{
          const tempButton = document.createElement('button')

          tempButton.innerText = child
          tempButton.classList.add('ms-3','col-lg-2','col-6', 'categoriesButton')
          row.appendChild(tempButton)
        })
        
        break;
        default:
          array.map((child)=>{
            const tempButton = document.createElement('button')

            tempButton.innerText = child
            tempButton.value = child
         
            tempButton.classList.add('ms-3','col-2', 'categoriesButton')
            row.appendChild(tempButton)
          })
          break;



}
}

useEffect(() => {
  const fetchPropsInfo = async () => {
    const InitialCategories = document.getElementById('InitialCategories')
    const initCChild = InitialCategories.childNodes
    const children = [...initCChild]; // Convierte los nodos en un array para evitar problemas con la eliminación
    children.forEach((item) => {
        InitialCategories.removeChild(item);
    });
    
       if(merchCategories){
        try{
          rowColsByLength(merchCategories,'InitialCategories')

        }catch (error){
          console.log(error);
        }
       }else{
        while(merchCategories === null){
          const ss = propsInfoData.find(obj => obj['link'] === selectedProd);
          const merchC = ss.merchCategories
          merchCategories = merchC
          try {
            rowColsByLength(merchCategories,'InitialCategories')

          }catch(error){
            console.log(error);
          }
        }
       }
  };
  fetchPropsInfo();
});


  return (



    <>
<center>
<div className='container-fluid'  >
  <h1>{selectedProd}</h1>
    <div className="row" id='InitialCategories'>
    </div>
  </div>
</center>
    </>
    )
}

export default initialCategories