import { useState, useEffect, useCallback, useRef } from 'react'
import { 
  Input,
  Chip,
  Card,
  CardBody
} from '@heroui/react'
import { config } from '../config'
import React from 'react'

interface Token {
  symbol: string
  baseAsset: string
  quoteAsset: string
  status: string
}

interface TokenSearchProps {
  onTokenSelect: (token: Token | { symbol: string; action: 'remove' }) => void
  selectedTokens: Token[]
  maxTokens?: number
}

export function TokenSearch({ onTokenSelect, selectedTokens, maxTokens = 15 }: TokenSearchProps) {
  const [allTokens, setAllTokens] = useState<Token[]>([])
  const [searchResults, setSearchResults] = useState<Token[]>([])
  const [isLoadingTokens, setIsLoadingTokens] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const loadAllTokens = useCallback(async () => {
    try {
      const response = await fetch(`${config.binanceApiUrl}/exchangeInfo`)
      if (!response.ok) throw new Error('Ошибка получения данных с Binance')
      const data = await response.json()

      const usdtSymbols = data.symbols
        .filter((symbol: any) => 
          symbol.symbol.endsWith('USDT') && 
          symbol.status === 'TRADING'
        )
        .map((symbol: any) => ({
          symbol: symbol.symbol,
          baseAsset: symbol.baseAsset,
          quoteAsset: symbol.quoteAsset,
          status: symbol.status
        }))
      
      setAllTokens(usdtSymbols)
    } catch (error) {
      console.error('Ошибка загрузки токенов:', error)
    } finally {
      setIsLoadingTokens(false)
    }
  }, [])

  const searchTokens = useCallback((query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      setShowSuggestions(false)
      return
    }

    const filtered = allTokens
      .filter(token => 
        token.baseAsset.toLowerCase().includes(query.toLowerCase()) ||
        token.symbol.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 10) // Ограничиваем до 10 результатов
    
    setSearchResults(filtered)
    setShowSuggestions(filtered.length > 0)
  }, [allTokens])

  const handleSearchInput = (value: string) => {
    setSearchQuery(value)
    searchTokens(value)
  }

  useEffect(() => {
    loadAllTokens()
  }, [loadAllTokens])

  const handleTokenSelect = (token: Token) => {
    if (selectedTokens.length >= maxTokens) {
      alert(`Максимум ${maxTokens} токенов можно отслеживать одновременно`) // если надо потом переделаю в тост, лимит в 15 токенов - бинанс
      return
    }
    
    if (!selectedTokens.find(t => t.symbol === token.symbol)) {
      onTokenSelect(token)
    }
    setSearchQuery('')
    setSearchResults([])
    setShowSuggestions(false)
    inputRef.current?.blur()
  }

  const removeToken = (symbol: string) => {
    onTokenSelect({ symbol: symbol, action: 'remove' })
  }

  return (
    <div className="space-y-4 overflow-visible">
      <div className="relative overflow-visible">
        <Input
          ref={inputRef}
          placeholder={isLoadingTokens ? "Загрузка токенов..." : "Введите название пары"}
          value={searchQuery}
          onValueChange={handleSearchInput}
          onFocus={() => {
            if (searchResults.length > 0) {
              setShowSuggestions(true)
            }
          }}
          onBlur={() => {
            // Задержка для обработки клика по подсказке
            setTimeout(() => setShowSuggestions(false), 150)
          }}
          isDisabled={isLoadingTokens}
          className="flex-1"
          isClearable
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          onClear={() => {
            setSearchQuery('')
            setSearchResults([])
            setShowSuggestions(false)
          }}
          style={{
            fontSize: '16px', // iOS prevent zoom
          }}
        />
        
        {showSuggestions && searchResults.length > 0 && (
          <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto shadow-lg border">
            <CardBody className="p-2">
              {searchResults.map((token) => (
                <div
                  key={token.symbol}
                  className="flex flex-col p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer transition-colors"
                  onClick={() => handleTokenSelect(token)}
                >
                  <span className="font-semibold">{token.symbol}</span>
                  <span className="text-sm text-gray-500">{token.baseAsset} / {token.quoteAsset}</span>
                </div>
              ))}
            </CardBody>
          </Card>
        )}
      </div>

      <div className="h-5 flex items-center">
        {searchQuery.length > 0 && !isLoadingTokens && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {searchResults.length > 0
              ? `Найдено ${searchResults.length} токенов`
              : 'Токены не найдены'
            }
          </div>
        )}
      </div>

      {selectedTokens.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Отслеживаемые токены ({selectedTokens.length}/{maxTokens}):</p>
          <div className="flex flex-wrap gap-2">
            {selectedTokens.map((token) => (
              <Chip
                key={token.symbol}
                onClose={() => removeToken(token.symbol)}
                variant="flat"
                color="primary"
              >
                {token.symbol}
              </Chip>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
