import InitialCategories from './components/InitialCategories';
import VariableDisplay from './components/VariableDisplay';
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Banner from './components/Banner'
import headerNavigation from '../../../variable/fetches/headerNavigation.json';

function CID () {
        const location = useLocation();
    const [propsInfo, setPropsInfo] = useState(null);

    useEffect(() => {
        const fetchPropsInfo = async () => {
            const ss = headerNavigation.find(obj => obj['link'] === location.search);
            setPropsInfo(ss);
        };
        fetchPropsInfo();
    }, [location.search]);
    const selectedProd = location.search;
    return (
            <div  className='MainTeamContainer'>
                <Banner />
 <InitialCategories  selectedProd={selectedProd}  {...propsInfo} />
 <VariableDisplay  selectedProd={selectedProd} propsInfo={propsInfo} />                 
 

     </div>
        ); 
   
      
    }
    
    export default CID;