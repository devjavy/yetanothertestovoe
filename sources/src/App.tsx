import React, { useState, useEffect, useCallback } from 'react'
import { 
  Button, 
  Card, 
  CardBody, 
  CardHeader, 
  Switch, 
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Tooltip
} from '@heroui/react'
import useWebSocket from 'react-use-websocket'
import { config } from './config'
import { TokenSearch, PriceChart, PriceTable } from './components'
import { Token, PriceData } from './types'
import { 
  useTokenStore, 
  useSelectedTokens, 
  usePriceData, 
  useLatestPrices, 
  useAllPriceData,
  useConnectionStatus, 
  useVisibleTokens,
  useTokenColors
} from './store/TokenStore'

function App() {
  const { dispatch } = useTokenStore()
  const selectedTokens = useSelectedTokens()
  const priceDataStore = usePriceData()
  const latestPrices = useLatestPrices()
  const allPriceData = useAllPriceData()
  const connectionStatus = useConnectionStatus()
  const visibleTokens = useVisibleTokens()
  const tokenColors = useTokenColors()
  
  const [isDarkMode, setIsDarkMode] = useState(false)

  const { sendMessage, lastMessage, readyState } = useWebSocket(
    connectionStatus.shouldConnect ? config.binanceWsUrl : null,
    {
      onOpen: () => {
        dispatch({ type: 'SET_CONNECTION_STATUS', payload: { isConnected: true, status: 'Подключен' } })
      },
      onClose: () => {
        dispatch({ type: 'SET_CONNECTION_STATUS', payload: { isConnected: false, status: 'Отключен' } })
      },
      onError: (error) => {
        dispatch({ type: 'SET_ERROR', payload: 'Ошибка подключения к WebSocket' })
        console.error('WebSocket:', error)
      },
      onMessage: (event) => {
        dispatch({ type: 'INCREMENT_MESSAGES_RECEIVED' })
        try {
          const data = JSON.parse(event.data)
          
          // Обрабатываем данные от Binance kline stream
          if (data.e === 'kline' && data.s && data.k) {
            const klineData = data.k
            const currentPrice = parseFloat(klineData.c)
            
            // Находим предыдущую цену для этого символа из хранилища
            const symbolData = priceDataStore[data.s] || []
            const previousData = symbolData
              .filter(item => item.E < data.E) // ДО текущего времени
              .sort((a, b) => b.E - a.E)[0] // Берем самую последнюю по времени
            const previousPrice = previousData?.c
            
            const processedData: PriceData = {
              s: data.s, // Я сначала хотел сделать график-свечи, но не хватило сил, поэтому оставил график линий
              E: data.E, // время события
              o: parseFloat(klineData.o),
              h: parseFloat(klineData.h),
              l: parseFloat(klineData.l),
              c: currentPrice,
              v: parseFloat(klineData.v),
              x: klineData.x,
              previousPrice: previousPrice,
              priceChange: previousPrice ? currentPrice - previousPrice : undefined,
              priceChangePercent: previousPrice ? ((currentPrice - previousPrice) / previousPrice) * 100 : undefined
            }
            dispatch({ type: 'ADD_PRICE_DATA', payload: processedData })
          }
        } catch (error) {
          console.error('Invalid data:', error)
        }
      },
      shouldReconnect: () => connectionStatus.shouldConnect, // Переподключаемся только если нужно
      reconnectAttempts: 10,
      reconnectInterval: 3000,
    }
  )

  // Обработка выбора токенов
  const handleTokenSelect = useCallback((token: Token | { symbol: string; action: 'remove' }) => {
    if ('action' in token && token.action === 'remove') {
      dispatch({ type: 'REMOVE_TOKEN', payload: token.symbol })
      // Очищаем данные для удаленного токена
      dispatch({ type: 'CLEAR_PRICE_DATA', payload: token.symbol })
    } else if (!('action' in token)) {
      dispatch({ type: 'ADD_TOKEN', payload: token })
      // Если это первый токен, подключаемся к WebSocket
      if (selectedTokens.length === 0) {
        dispatch({ type: 'SET_SHOULD_CONNECT', payload: true })
        dispatch({ type: 'SET_LOADING', payload: true })
        dispatch({ type: 'SET_CHART_START_TIME', payload: Date.now() })
      }
    }
  }, [selectedTokens, dispatch])

  // Функции управления видимостью токенов на графике
  const onToggleTokenVisibility = useCallback((symbol: string) => {
    dispatch({ type: 'TOGGLE_TOKEN_VISIBILITY', payload: symbol })
  }, [dispatch])

  const onShowAllTokens = useCallback(() => {
    const symbols = selectedTokens.map(token => token.symbol)
    dispatch({ type: 'SET_ALL_TOKENS_VISIBLE', payload: symbols })
  }, [selectedTokens, dispatch])

  const onShowOnlyToken = useCallback((symbol: string) => {
    dispatch({ type: 'SET_ONLY_TOKEN_VISIBLE', payload: symbol })
  }, [dispatch])

  const onRemoveToken = useCallback((symbol: string) => {
    dispatch({ type: 'REMOVE_TOKEN', payload: symbol })
    dispatch({ type: 'CLEAR_PRICE_DATA', payload: symbol })
  }, [dispatch])

  const onClearAllTokens = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL_TOKENS' })
  }, [dispatch])

  // Автоматически показывать новые токены при добавлении
  useEffect(() => {
    const newSymbols = selectedTokens
      .filter(token => visibleTokens[token.symbol] === undefined)
      .map(token => token.symbol)
    
    if (newSymbols.length > 0) {
      newSymbols.forEach(symbol => {
        dispatch({ type: 'TOGGLE_TOKEN_VISIBILITY', payload: symbol })
      })
    }
  }, [selectedTokens, visibleTokens, dispatch])

  // Отправка подписки на токены через сокет
  const subscribeToTokens = useCallback(() => {
    if (selectedTokens.length === 0) return
    const streams = selectedTokens.map(token => `${token.symbol.toLowerCase()}@kline_1m`)
    
    const subscription = {
      method: "SUBSCRIBE",
      params: streams,
      id: 1
    }
    
    sendMessage(JSON.stringify(subscription))
    dispatch({ type: 'INCREMENT_MESSAGES_SENT' })
  }, [selectedTokens, sendMessage, dispatch])


  useEffect(() => {
    if (connectionStatus.isConnected && selectedTokens.length > 0) {
      subscribeToTokens()
    }
  }, [connectionStatus.isConnected, selectedTokens, subscribeToTokens])


  const toggleTheme = useCallback(() => {
    setIsDarkMode(prev => !prev)
    document.documentElement.classList.toggle('dark')
  }, [])


  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDarkMode(true)
      document.documentElement.classList.add('dark')
    }
  }, [])


  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light')
  }, [isDarkMode])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">

      <Navbar className="bg-white dark:bg-gray-800 shadow-sm">
        <NavbarBrand>
          <h1 className="text-xl font-bold text-gray-800 dark:text-white hidden sm:block">
            Websocket Price Tracker
          </h1>
        </NavbarBrand>
        <NavbarContent justify="end">
          <NavbarItem>
            <Tooltip
              content={
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${connectionStatus.isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-sm">
                      {connectionStatus.isConnected ? 'Подключен' : 'Отключен'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    <span className="text-orange-400">↓</span> {connectionStatus.messagesReceived} получено сообщений
                  </div>
                  <div className="text-xs text-gray-400">
                    <span className="text-green-400">↑</span> {connectionStatus.messagesSent} отправлено сообщений
                  </div>
                </div>
              }
              placement="bottom"
              showArrow
            >
              <Button
                isIconOnly
                variant="light"
                className="text-gray-600 dark:text-gray-400"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </Button>
            </Tooltip>
          </NavbarItem>
          <NavbarItem>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {isDarkMode ? 'Темная' : 'Светлая'} тема
              </span>
              <Switch
                isSelected={isDarkMode}
                onValueChange={toggleTheme}
                color="primary"
                size="sm"
              />
            </div>
          </NavbarItem>
        </NavbarContent>
      </Navbar>

      <div className="container mx-auto px-4 py-6 overflow-visible">

        <Card className="mb-6 overflow-visible">
          <CardHeader>
            <h2 className="text-2xl font-semibold">Поиск и выбор токенов</h2>
          </CardHeader>
          <CardBody className="overflow-visible">
            <TokenSearch 
              onTokenSelect={handleTokenSelect}
              selectedTokens={selectedTokens}
              maxTokens={15}
            />
          </CardBody>
        </Card>


        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          <div className="xl:col-span-2">
            <PriceChart 
              priceData={allPriceData} 
              selectedTokens={selectedTokens} 
              visibleTokens={visibleTokens}
              tokenColors={tokenColors}
              isDarkMode={isDarkMode}
              isLoading={connectionStatus.isLoadingData}
              chartStartTime={connectionStatus.chartStartTime}
            />
          </div>
          

          <div>
            <PriceTable 
              priceData={latestPrices} 
              selectedTokens={selectedTokens} 
              visibleTokens={visibleTokens}
              tokenColors={tokenColors}
              onToggleTokenVisibility={onToggleTokenVisibility}
              onShowAllTokens={onShowAllTokens}
              onShowOnlyToken={onShowOnlyToken}
              onRemoveToken={onRemoveToken}
              onClearAllTokens={onClearAllTokens}
              isLoading={connectionStatus.isLoadingData}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
