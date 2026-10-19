import InitialCategories from './components/InitialCategories';
import VariableDisplay from './components/VariableDisplay';
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import Banner from './components/Banner'

function CID () {
        const location = useLocation();
    const [propsInfo, setPropsInfo] = useState(null);

    useEffect(() => {
        const fetchPropsInfo = async () => {
            const res = await axios.get('../../src/variable/fetches/headerNavigation.json').then((data) => data.data);
            const ss = await res.find(obj => obj['link'] === location.search);
            setPropsInfo(ss);
            const NFLAPI = await axios.get('../../src/variable/fetches/NFLAPI.json').then((data) => data.data);
            // const app =await axios.get(`${NFLAPI[0].enlace}${team}?key=1e603d3c5bbc4eb8b2285df9c6605c46`).then((data) => data.data);
            // console.log(app);
            
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