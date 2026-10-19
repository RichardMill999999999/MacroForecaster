import React, { createContext, useState } from 'react';

const ContextProvider = createContext();

export const MyProvider = ({ children }) => {
  const [state, setState] = useState("default value");
const [tickersHistory, setTickersHistory] = useState(null)
  return (
    <ContextProvider.Provider value={{ state, setState }}>
      {children}
    </ContextProvider.Provider>
  );
};

export default ContextProvider;