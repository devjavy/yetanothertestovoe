export interface Token {
  symbol: string
  baseAsset: string
  quoteAsset: string
  status: string
}
// Взял с бинанса, + нужные пропы, подписал что за что отвечает

export interface PriceData {
  s: string
  E: number
  o: number
  h: number
  l: number
  c: number
  v: number
  x: boolean
  previousPrice?: number // Предыдущая цена для сравнения
  priceChange?: number // Абсолютное изменение цены
  priceChangePercent?: number // Процентное изменение цены
}
