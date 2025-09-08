import { useMemo, useState, useRef, useEffect } from 'react'
import { Card, CardBody, CardHeader, Skeleton } from '@heroui/react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ComposedChart } from 'recharts'
import React from 'react'

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

interface PriceChartProps {
  priceData: PriceData[]
  selectedTokens: Token[]
  visibleTokens: Record<string, boolean>
  tokenColors: Record<string, string>
  isDarkMode: boolean
  isLoading?: boolean
  chartStartTime?: number | null
}

export function PriceChart({ priceData, selectedTokens, visibleTokens, tokenColors, isDarkMode, isLoading = false, chartStartTime }: PriceChartProps) {
  const [zoom, setZoom] = useState(1)
  const [panX, setPanX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, panX: 0 }) // хотел сделать перетаскивание, не успел
  const chartRef = useRef<HTMLDivElement>(null)

  // Группируем данные по токенам для отображения на графике
  const chartData = useMemo(() => {
    const timeMap = new Map()
    
    priceData.forEach(item => {
      const timeKey = new Date(item.E).toLocaleTimeString() // E - время события
      if (!timeMap.has(timeKey)) {
        timeMap.set(timeKey, { time: timeKey })
      }
      // Для свечей используем OHLC данные, если надо потом переделаю в свечи
      timeMap.get(timeKey)[`${item.s}_open`] = item.o
      timeMap.get(timeKey)[`${item.s}_high`] = item.h
      timeMap.get(timeKey)[`${item.s}_low`] = item.l
      timeMap.get(timeKey)[`${item.s}_close`] = item.c
    })
    
    const allData = Array.from(timeMap.values())
    const startIndex = Math.max(0, allData.length - Math.floor(50 / zoom) + Math.floor(panX / zoom))
    const endIndex = Math.min(allData.length, startIndex + Math.floor(50 / zoom))
    return allData.slice(startIndex, endIndex)
  }, [priceData])

  return (
    <Card>
      <CardHeader className="flex justify-between items-center gap-4">
        <h3 className="text-xl font-semibold">График цен в реальном времени</h3>
        <div className="flex items-center gap-4">
          {chartStartTime && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Начало: {new Date(chartStartTime).toLocaleTimeString()}
            </div>
          )}
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {priceData.length} Обновлений
          </div>
        </div>
      </CardHeader>
      <CardBody className="overflow-x-hidden">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-96 w-full rounded-lg" />
          </div>
        ) : chartData.length > 0 ? (
          <div 
            ref={chartRef}
            className="overflow-hidden cursor-grab active:cursor-grabbing"
            onMouseDown={(e) => {
              e.preventDefault()
              setIsDragging(true)
              setDragStart({ x: e.clientX, panX })
            }}
            onMouseLeave={() => {
              setIsDragging(false)
            }}
          >
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis 
                  domain={['dataMin * 0.95', 'dataMax * 1.05']}
                  tickFormatter={(value) => {
                    // форматирую цену чтобы влезла в график
                    const str = value.toString()
                    const parts = str.split('.')
                    if (parts[0].length > 4) {
                      return parts[0].slice(-4) + (parts[1] ? '.' + parts[1].slice(0, 2) : '')
                    }
                    return str
                  }}
                  tick={{ fontSize: 12 }}
                />
                <RechartsTooltip 
                  formatter={(value, name) => {
                    if (typeof name === 'string' && name.includes('_close')) {
                      return [`$${Number(value)?.toFixed(2)}`, name.replace('_close', '')]
                    }
                    return [`$${Number(value)?.toFixed(2)}`, name]
                  }}
                  labelFormatter={(label) => `Время: ${label}`}
                  contentStyle={{
                    backgroundColor: isDarkMode ? '#374151' : '#ffffff',
                    border: isDarkMode ? '1px solid #4B5563' : '1px solid #E5E7EB',
                    color: isDarkMode ? '#F9FAFB' : '#111827'
                  }}
                  labelStyle={{
                    color: isDarkMode ? '#F9FAFB' : '#111827'
                  }}
                />
                {selectedTokens
                  .filter(token => visibleTokens[token.symbol])
                  .map((token) => (
                    <Line
                      key={token.symbol}
                      type="monotone"
                      dataKey={`${token.symbol}_close`}
                      stroke={tokenColors[token.symbol] || '#8884d8'}
                      strokeWidth={2}
                      dot={false}
                      connectNulls={false}
                      isAnimationActive={false}
                    />
                  ))}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <p>Нет данных для отображения</p>
            <p className="text-sm">Выберите токены для начала отслеживания</p>
          </div>
        )}
      </CardBody>
    </Card>
  )
}