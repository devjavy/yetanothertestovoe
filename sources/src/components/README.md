# Компоненты приложения

## Структура

```
src/components/
├── Icons.tsx          # SVG иконки
├── TokenSearch.tsx    # Поиск и выбор токенов
├── PriceChart.tsx     # График цен
├── PriceTable.tsx     # Таблица цен
├── index.ts          # Экспорт всех компонентов
└── README.md         # Документация
```

## Компоненты

### TokenSearch
Компонент для поиска и выбора криптовалютных токенов.

**Props:**
- `onTokenSelect: (token: Token | { symbol: string; action: 'remove' }) => void` - обработчик выбора токена
- `selectedTokens: Token[]` - массив выбранных токенов
- `maxTokens?: number` - максимальное количество токенов (по умолчанию 15)

**Функциональность:**
- Поиск токенов через Binance API
- Debounced поиск (500ms задержка)
- Автокомплит с результатами
- Управление выбранными токенами
- Ограничение на количество токенов

### PriceChart
Компонент для отображения графика цен в реальном времени.

**Props:**
- `priceData: PriceData[]` - данные о ценах
- `selectedTokens: Token[]` - выбранные токены
- `visibleTokens: Record<string, boolean>` - видимость токенов на графике
- `isDarkMode: boolean` - режим темы

**Функциональность:**
- Отображение свечей (OHLC данные)
- Фильтрация по видимым токенам
- Адаптивный дизайн
- Tooltip с информацией о ценах
- Поддержка темной темы

### PriceTable
Компонент для отображения таблицы текущих цен.

**Props:**
- `priceData: PriceData[]` - данные о ценах
- `selectedTokens: Token[]` - выбранные токены
- `visibleTokens: Record<string, boolean>` - видимость токенов
- `onToggleTokenVisibility: (symbol: string) => void` - переключение видимости
- `onShowAllTokens: () => void` - показать все токены
- `onShowOnlyToken: (symbol: string) => void` - показать только один токен

**Функциональность:**
- Отображение последних цен
- Управление видимостью токенов на графике
- Кнопки с иконками для управления
- Адаптивная таблица
- Overflow handling

### Icons
Коллекция SVG иконок для приложения.

**Иконки:**
- `EyeIcon` - показать
- `EyeSlashIcon` - скрыть
- `ShowAllIcon` - показать все
- `ShowOnlyIcon` - показать только один

## Типы

Все типы определены в `src/types/index.ts`:

```typescript
interface Token {
  symbol: string
  baseAsset: string
  quoteAsset: string
  status: string
}

interface PriceData {
  s: string      // символ
  E: number      // время события
  o: number      // открытие
  h: number      // максимум
  l: number      // минимум
  c: number      // закрытие
  v: number      // объем
  x: boolean     // свеча закрыта
}
```

## Использование

```typescript
import { TokenSearch, PriceChart, PriceTable } from './components'
import { Token, PriceData } from './types'

// В компоненте
const [selectedTokens, setSelectedTokens] = useState<Token[]>([])
const [priceData, setPriceData] = useState<PriceData[]>([])
const [visibleTokens, setVisibleTokens] = useState<Record<string, boolean>>({})

// Обработчики
const handleTokenSelect = (token: Token) => {
  setSelectedTokens(prev => [...prev, token])
}

const onToggleTokenVisibility = (symbol: string) => {
  setVisibleTokens(prev => ({
    ...prev,
    [symbol]: !prev[symbol]
  }))
}
```
