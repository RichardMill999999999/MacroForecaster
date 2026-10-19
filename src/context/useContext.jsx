import { useContext } from 'react';
import ContextProvider from './ContextProvider';
const useMyContext = () => {
  return useContext(ContextProvider);
};

export default useMyContext;