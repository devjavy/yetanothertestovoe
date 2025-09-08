import React, { useMemo } from 'react'
import { 
  Card, 
  CardBody, 
  CardHeader, 
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Tooltip,
  Skeleton
} from '@heroui/react'
import { EyeIcon, EyeSlashIcon, ShowAllIcon, ShowOnlyIcon, ArrowUpIcon, ArrowDownIcon } from './Icons'

interface Token {
  symbol: string
  baseAsset: string
  quoteAsset: string
  status: string
}

interface PriceData {
  s: string
  E: number
  o: number
  h: number
  l: number
  c: number
  v: number
  x: boolean
}

interface PriceTableProps {
  priceData: PriceData[]
  selectedTokens: Token[]
  visibleTokens: Record<string, boolean>
  tokenColors: Record<string, string>
  onToggleTokenVisibility: (symbol: string) => void
  onShowAllTokens: () => void
  onShowOnlyToken: (symbol: string) => void
  onRemoveToken: (symbol: string) => void
  onClearAllTokens: () => void
  isLoading?: boolean
}

export function PriceTable({ 
  priceData, 
  selectedTokens, 
  visibleTokens, 
  tokenColors,
  onToggleTokenVisibility, 
  onShowAllTokens, 
  onShowOnlyToken,
  onRemoveToken,
  onClearAllTokens,
  isLoading = false
}: PriceTableProps) {
  // Создаем таблицу данных для отображения
  const tableData = useMemo(() => {
    // Создаем Map для быстрого поиска цен по символу
    const priceMap = new Map()
    priceData.forEach(item => {
      priceMap.set(item.s, item)
    })
    
    // Создаем записи для всех выбранных токенов
    return selectedTokens.map(token => {
      const priceInfo = priceMap.get(token.symbol)
      return {
        token,
        priceInfo: priceInfo || null
      }
    })
  }, [selectedTokens, priceData])

  return (
    <Card>
      <CardHeader className="flex justify-between items-center gap-4">
        <h3 className="text-xl font-semibold">Текущие цены</h3>
        <div className="flex items-center gap-2">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {selectedTokens.length}/15 токенов отслеживается
          </div>
          <div className="flex gap-1">
            <Tooltip content="Показать все токены">
              <Button
                size="sm"
                variant="light"
                isIconOnly
                onClick={onShowAllTokens}
                className="text-gray-600 dark:text-gray-400"
              >
                <ShowAllIcon />
              </Button>
            </Tooltip>
            <Tooltip content="Скрыть все токены">
              <Button
                size="sm"
                variant="light"
                isIconOnly
                onClick={() => {
                  selectedTokens.forEach(token => {
                    if (visibleTokens[token.symbol]) {
                      onToggleTokenVisibility(token.symbol)
                    }
                  })
                }}
                className="text-gray-600 dark:text-gray-400"
              >
                <EyeSlashIcon />
              </Button>
            </Tooltip>
            {selectedTokens.length > 1 && <Tooltip content="Очистить все токены">
              <Button
                size="sm"
                variant="light"
                isIconOnly
                onClick={onClearAllTokens}
                className="text-red-600 dark:text-red-400"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </Button>
            </Tooltip>} 
          </div>
        </div>
      </CardHeader>
      <CardBody className="p-0">
        {isLoading ? (
          <div className="p-6 table-container">
            <Table aria-label="Таблица цен" removeWrapper>
              <TableHeader>
                <TableColumn className="w-1/3">Токен</TableColumn>
                <TableColumn className="w-1/3">Цена (USD)</TableColumn>
                <TableColumn className="w-1/3">Действия</TableColumn>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-4 rounded-full" />
                      <Skeleton className="h-4 w-16 rounded-lg" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20 rounded-lg" />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Skeleton className="h-8 w-8 rounded-lg" />
                      <Skeleton className="h-8 w-8 rounded-lg" />
                      <Skeleton className="h-8 w-8 rounded-lg" />
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        ) : selectedTokens.length > 0 ? (
          <div className="p-6 table-container">
            <Table aria-label="Таблица цен" removeWrapper>
              <TableHeader>
                <TableColumn className="w-1/3">Токен</TableColumn>
                <TableColumn className="w-1/3">Цена (USD)</TableColumn>
                <TableColumn className="w-1/3">Действия</TableColumn>
              </TableHeader>
            <TableBody>
              {tableData.map(({ token, priceInfo }) => (
                <TableRow key={token.symbol}>
                  <TableCell className="max-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: tokenColors[token.symbol] || '#8884d8' }}
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold truncate">{token.symbol}</span>
                        <span className="text-sm text-gray-500 truncate">Binance</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-0">
                    {priceInfo ? (
                      <Tooltip 
                        content={
                          priceInfo.priceChange !== undefined && priceInfo.priceChangePercent !== undefined ? (
                            <div className="text-sm">
                              <div>Изменение: {priceInfo.priceChange > 0 ? '+' : ''}${priceInfo.priceChange.toFixed(2)}</div>
                              <div>Процент: {priceInfo.priceChangePercent > 0 ? '+' : ''}{priceInfo.priceChangePercent.toFixed(2)}%</div>
                            </div>
                          ) : 'Нет данных об изменении'
                        }
                        placement="top"
                      >
                        <div className={`flex items-center gap-1 font-mono text-sm transition-colors duration-300 min-w-0 ${
                          priceInfo.priceChange !== undefined 
                            ? priceInfo.priceChange > 0 
                              ? 'text-green-600 bg-green-50 dark:bg-green-900/20' 
                              : priceInfo.priceChange < 0 
                                ? 'text-red-600 bg-red-50 dark:bg-red-900/20'
                                : 'text-gray-600'
                            : 'text-gray-600'
                        } px-2 py-1 rounded`}>
                          <span className="truncate">${parseFloat(priceInfo.c.toString()).toFixed(2)}</span>
                          {priceInfo.priceChange !== undefined && priceInfo.priceChange !== 0 && (
                            priceInfo.priceChange > 0 ? <ArrowUpIcon className="w-3 h-3 flex-shrink-0" /> : <ArrowDownIcon className="w-3 h-3 flex-shrink-0" />
                          )}
                        </div>
                      </Tooltip>
                    ) : (
                      <div className="text-gray-400 text-sm truncate">
                        Ожидание данных...
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="max-w-0">
                    <div className="flex gap-1 justify-end">
                      <Tooltip content={visibleTokens[token.symbol] ? "Скрыть с графика" : "Показать на графике"}>
                        <Button
                          size="sm"
                          variant="light"
                          isIconOnly
                          onClick={() => onToggleTokenVisibility(token.symbol)}
                          className={visibleTokens[token.symbol] ? "text-green-600" : "text-gray-400"}
                        >
                          {visibleTokens[token.symbol] ? <EyeIcon /> : <EyeSlashIcon />}
                        </Button>
                      </Tooltip>
                      <Tooltip content="Показать только этот токен">
                        <Button
                          size="sm"
                          variant="light"
                          isIconOnly
                          onClick={() => onShowOnlyToken(token.symbol)}
                          className="text-blue-600"
                        >
                          <ShowOnlyIcon />
                        </Button>
                      </Tooltip>
                      <Tooltip content="Удалить токен">
                        <Button
                          size="sm"
                          variant="light"
                          isIconOnly
                          onClick={() => onRemoveToken(token.symbol)}
                          className="text-red-600"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </Button>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>Нет данных о ценах</p>
            <p className="text-sm">Подключитесь к WebSocket для получения данных</p>
          </div>
        )}
      </CardBody>
    </Card>
  )
}
