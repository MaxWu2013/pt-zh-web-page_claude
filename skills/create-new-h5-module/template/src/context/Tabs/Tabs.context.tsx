import React, {Dispatch, ReactElement, ReactNode, useMemo} from 'react'
import TAB_CLICK from '@src/context/Tabs/Tabs.action'

const initialState = {
  tabNum: 0
}

interface ITabNumState {
  tabNum: number
}

interface ActionType {
  type: string
  payload: ITabNumState
}

interface ITabNumContext {
  state: ITabNumState
  dispatch: Dispatch<ActionType>
}

function tabNumReducer(state: ITabNumState, action: ActionType) {
  switch (action.type) {
    case TAB_CLICK: {
      return {
        ...state,
        tabNum: (action.payload as ITabNumState).tabNum
      }
    }
    default:
      return { ...state }
  }
}

const TabNumContext = React.createContext({} as ITabNumContext)

function TabNumProvider({ children }: { children: ReactNode }): ReactElement {
  const [state, dispatch] = React.useReducer(tabNumReducer, initialState)
  const value = useMemo(() => ({ state, dispatch }), [state, dispatch])
  return (
    <TabNumContext.Provider value={value}>{children}</TabNumContext.Provider>
  )
}

function useTabNum() {
  const context = React.useContext(TabNumContext)
  const { state, dispatch } = context
  if (context === undefined) {
    throw new Error('useCount must be used within a CountProvider')
  }
  return { state, dispatch }
}

export { TabNumProvider, useTabNum }
