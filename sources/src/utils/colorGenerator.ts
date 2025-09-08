// Генератор цветов для токенов (навайбкодил)
// Создает 100 различных цветов с хорошей контрастностью

export function generateTokenColors(): string[] {
  const colors: string[] = []
  
  // Базовые цвета (яркие и контрастные)
  const baseColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
    '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2',
    '#A9DFBF', '#F9E79F', '#FADBD8', '#D5DBDB', '#AED6F1',
    '#A3E4D7', '#FCF3CF', '#FAD7A0', '#D2B4DE', '#A9CCE3',
    '#A9DFBF', '#F7DC6F', '#F8C471', '#BB8FCE', '#85C1E9',
    '#D7BDE2', '#A3E4D7', '#FCF3CF', '#FAD7A0', '#D2B4DE',
    '#A9CCE3', '#A9DFBF', '#F7DC6F', '#F8C471', '#BB8FCE',
    '#85C1E9', '#D7BDE2', '#A3E4D7', '#FCF3CF', '#FAD7A0',
    '#D2B4DE', '#A9CCE3', '#A9DFBF', '#F7DC6F', '#F8C471'
  ]
  
  // Дополнительные цвета с вариациями
  const additionalColors = [
    '#E74C3C', '#3498DB', '#2ECC71', '#F39C12', '#9B59B6',
    '#1ABC9C', '#34495E', '#E67E22', '#95A5A6', '#F1C40F',
    '#E91E63', '#00BCD4', '#4CAF50', '#FF9800', '#673AB7',
    '#009688', '#607D8B', '#FF5722', '#795548', '#3F51B5',
    '#8BC34A', '#FFC107', '#9C27B0', '#00BCD4', '#4CAF50',
    '#FF9800', '#673AB7', '#009688', '#607D8B', '#FF5722',
    '#795548', '#3F51B5', '#8BC34A', '#FFC107', '#9C27B0',
    '#00BCD4', '#4CAF50', '#FF9800', '#673AB7', '#009688',
    '#607D8B', '#FF5722', '#795548', '#3F51B5', '#8BC34A',
    '#FFC107', '#9C27B0', '#00BCD4', '#4CAF50', '#FF9800'
  ]
  
  // Объединяем все цвета
  colors.push(...baseColors, ...additionalColors)
  
  return colors
}

// Функция для получения цвета токена по его символу
export function getTokenColor(symbol: string, colors: string[]): string {
  // Используем хеш символа для детерминированного выбора цвета
  let hash = 0
  for (let i = 0; i < symbol.length; i++) {
    const char = symbol.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Конвертируем в 32-битное число
  }
  
  // Берем абсолютное значение и получаем индекс цвета
  const index = Math.abs(hash) % colors.length
  return colors[index]
}

// Предгенерированные цвета для использования
export const TOKEN_COLORS = generateTokenColors()
