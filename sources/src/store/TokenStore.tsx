import React, { createContext, useContext, useReducer, ReactNode } from 'react'
import { Token, PriceData } from '../types'
import { getTokenColor, TOKEN_COLORS } from '../utils/colorGenerator'


/**
 * Я решил использовать контекст вместо Redux, потому что это проще и быстрее, + мы храним мало состояний
 * Извините если говнокод
 */


// Типы для состояния
interface TokenSettings {
  selectedTokens: Token[]
  tokenColors: Record<string, string> // Цвета токенов по символу
}

interface PriceDataStore {
  [symbol: string]: PriceData[] // Данные по ключу символа токена
}

interface AppState {
  tokenSettings: TokenSettings
  priceDataStore: PriceDataStore
  isConnected: boolean
  connectionStatus: string
  error: string | null
  shouldConnect: boolean
  visibleTokens: Record<string, boolean>
  isLoadingData: boolean
  chartStartTime: number | null
  messagesReceived: number
  messagesSent: number
}

// Типы действий
type TokenAction = 
  | { type: 'ADD_TOKEN'; payload: Token }
  | { type: 'REMOVE_TOKEN'; payload: string }
  | { type: 'CLEAR_ALL_TOKENS' }
  | { type: 'SET_TOKENS'; payload: Token[] }

type PriceAction =
  | { type: 'ADD_PRICE_DATA'; payload: PriceData }
  | { type: 'CLEAR_PRICE_DATA'; payload: string }

type ConnectionAction =
  | { type: 'SET_CONNECTION_STATUS'; payload: { isConnected: boolean; status: string } }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SHOULD_CONNECT'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_CHART_START_TIME'; payload: number | null }
  | { type: 'INCREMENT_MESSAGES_RECEIVED' }
  | { type: 'INCREMENT_MESSAGES_SENT' }

type VisibilityAction =
  | { type: 'TOGGLE_TOKEN_VISIBILITY'; payload: string }
  | { type: 'SET_ALL_TOKENS_VISIBLE'; payload: string[] }
  | { type: 'SET_ONLY_TOKEN_VISIBLE'; payload: string }

type AppAction = TokenAction | PriceAction | ConnectionAction | VisibilityAction

// Начальное состояние
const initialState: AppState = {
  tokenSettings: {
    selectedTokens: [],
    tokenColors: {}
  },
  priceDataStore: {},
  isConnected: false,
  connectionStatus: 'Отключен',
  error: null,
  shouldConnect: false,
  visibleTokens: {},
  isLoadingData: false,
  chartStartTime: null,
  messagesReceived: 0,
  messagesSent: 0
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    // Управление токенами
    case 'ADD_TOKEN':
      const newToken = action.payload
      const existingColors = state.tokenSettings.tokenColors
      const tokenColor = existingColors[newToken.symbol] || getTokenColor(newToken.symbol, TOKEN_COLORS)
      
      return {
        ...state,
        tokenSettings: {
          ...state.tokenSettings,
          selectedTokens: [...state.tokenSettings.selectedTokens, newToken],
          tokenColors: {
            ...existingColors,
            [newToken.symbol]: tokenColor
          }
        }
      }
    
    case 'REMOVE_TOKEN':
      const newTokens = state.tokenSettings.selectedTokens.filter(t => t.symbol !== action.payload)
      return {
        ...state,
        tokenSettings: {
          ...state.tokenSettings,
          selectedTokens: newTokens
        },
        // Если токенов не осталось, отключаем сокет
        shouldConnect: newTokens.length > 0,
        isLoadingData: newTokens.length > 0 ? state.isLoadingData : false,
        chartStartTime: newTokens.length > 0 ? state.chartStartTime : null
      }
    
    case 'CLEAR_ALL_TOKENS':
      return {
        ...state,
        tokenSettings: {
          ...state.tokenSettings,
          selectedTokens: []
        },
        priceDataStore: {},
        shouldConnect: false,
        isLoadingData: false,
        chartStartTime: null,
        visibleTokens: {}
      }
    
    case 'SET_TOKENS':
      return {
        ...state,
        tokenSettings: {
          ...state.tokenSettings,
          selectedTokens: action.payload
        },
        shouldConnect: action.payload.length > 0,
        isLoadingData: action.payload.length > 0 ? state.isLoadingData : false,
        chartStartTime: action.payload.length > 0 ? state.chartStartTime : null
      }
    case 'ADD_PRICE_DATA':
      const symbol = action.payload.s
      const existingData = state.priceDataStore[symbol] || []
      const updatedData = [...existingData.slice(-999), action.payload] // Храним последние 1к записей
      
      return {
        ...state,
        priceDataStore: {
          ...state.priceDataStore,
          [symbol]: updatedData
        },
        isLoadingData: false
      }
    
    case 'CLEAR_PRICE_DATA':
      const { [action.payload]: removed, ...restPriceData } = state.priceDataStore
      return {
        ...state,
        priceDataStore: restPriceData
      }
    case 'SET_CONNECTION_STATUS':
      return {
        ...state,
        isConnected: action.payload.isConnected,
        connectionStatus: action.payload.status,
        error: action.payload.isConnected ? null : state.error
      }
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload
      }
    
    case 'SET_SHOULD_CONNECT':
      return {
        ...state,
        shouldConnect: action.payload,
        isLoadingData: action.payload ? state.isLoadingData : false,
        chartStartTime: action.payload ? state.chartStartTime : null
      }
    
    case 'SET_LOADING':
      return {
        ...state,
        isLoadingData: action.payload
      }
    
    case 'SET_CHART_START_TIME':
      return {
        ...state,
        chartStartTime: action.payload
      }
    
    case 'INCREMENT_MESSAGES_RECEIVED':
      return {
        ...state,
        messagesReceived: state.messagesReceived + 1
      }
    
    case 'INCREMENT_MESSAGES_SENT':
      return {
        ...state,
        messagesSent: state.messagesSent + 1
      }
    case 'TOGGLE_TOKEN_VISIBILITY':
      return {
        ...state,
        visibleTokens: {
          ...state.visibleTokens,
          [action.payload]: !state.visibleTokens[action.payload]
        }
      }
    
    case 'SET_ALL_TOKENS_VISIBLE':
      const allVisible: Record<string, boolean> = {}
      action.payload.forEach(symbol => {
        allVisible[symbol] = true
      })
      return {
        ...state,
        visibleTokens: allVisible
      }
    
    case 'SET_ONLY_TOKEN_VISIBLE':
      return {
        ...state,
        visibleTokens: {
          [action.payload]: true
        }
      }

    default:
      return state
  }
}

const TokenStoreContext = createContext<{
  state: AppState
  dispatch: React.Dispatch<AppAction>
} | null>(null)

interface TokenStoreProviderProps {
  children: ReactNode
}

export function TokenStoreProvider({ children }: TokenStoreProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  return (
    <TokenStoreContext.Provider value={{ state, dispatch }}>
      {children}
    </TokenStoreContext.Provider>
  )
}

// Решил сделать хук для использования хранилища
export function useTokenStore() {
  const context = useContext(TokenStoreContext)
  if (!context) {
    throw new Error('useTokenStore must be used within a TokenStoreProvider')
  }
  return context
}

// Селекторы для удобного доступа к данным
export function useSelectedTokens() {
  const { state } = useTokenStore()
  return state.tokenSettings.selectedTokens
}

export function usePriceData() {
  const { state } = useTokenStore()
  return state.priceDataStore
}

export function useLatestPrices() {
  const { state } = useTokenStore()
  
  // Получаем последние цены для каждого токена
  const latestPrices: PriceData[] = []
  
  Object.entries(state.priceDataStore).forEach(([symbol, data]) => {
    if (data.length > 0) {
      // Находим последнюю запись по времени
      const latest = data.reduce((latest, current) => 
        new Date(current.E) > new Date(latest.E) ? current : latest
      )
      latestPrices.push(latest)
    }
  })
  
  return latestPrices
}

export function useAllPriceData() {
  const { state } = useTokenStore()
  
  // Получаем все данные для графика (все исторические данные)
  const allPriceData: PriceData[] = []
  
  Object.entries(state.priceDataStore).forEach(([symbol, data]) => {
    allPriceData.push(...data)
  })
  
  // Сортируем по времени
  return allPriceData.sort((a, b) => a.E - b.E)
}

export function useConnectionStatus() {
  const { state } = useTokenStore()
  return {
    isConnected: state.isConnected,
    connectionStatus: state.connectionStatus,
    error: state.error,
    shouldConnect: state.shouldConnect,
    isLoadingData: state.isLoadingData,
    chartStartTime: state.chartStartTime,
    messagesReceived: state.messagesReceived,
    messagesSent: state.messagesSent
  }
}

export function useVisibleTokens() {
  const { state } = useTokenStore()
  return state.visibleTokens
}

export function useTokenColors() {
  const { state } = useTokenStore()
  return state.tokenSettings.tokenColors
}
