import { createContext, FC, useContext } from 'react';
import useAppLocale from '/src/context/GlobalContext/useAppLocale';

const useGlobalData = () => ({
	...useAppLocale(),
});

const GlobalContext = createContext<ReturnType<typeof useGlobalData>>({} as any);

export const GlobalContextProvider: FC = ({ children }) => {
	const globalData = useGlobalData();
	return <GlobalContext.Provider value={globalData}>{children}</GlobalContext.Provider>;
};

export const useGlobalContext = () => useContext(GlobalContext);
