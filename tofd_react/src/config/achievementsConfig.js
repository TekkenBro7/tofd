export const ACHIEVEMENTS_CONFIG = {
  FG: {
    id: 1,
    code: 'FG',
    name: 'Первая копилка',
    description: 'Создал свою первую цель накопления',
    points: 20,
    icon: '🎯',
    category: 'цели'
  },
  '7D': {
    id: 2,
    code: '7D',
    name: 'Недельный стрик',
    description: 'Пополнял копилку 7 дней подряд',
    points: 30,
    icon: '📅',
    category: 'пополнения'
  },
  '30D': {
    id: 3,
    code: '30D',
    name: 'Месячный воин',
    description: 'Пополнял копилку 30 дней подряд',
    points: 100,
    icon: '🛡️',
    category: 'пополнения'
  },
  PG: {
    id: 4,
    code: 'PG',
    name: 'Идеальное завершение',
    description: 'Достиг цели точно в срок без досрочного вывода',
    points: 80,
    icon: '⭐',
    category: 'цели'
  },
  SV: {
    id: 5,
    code: 'SV',
    name: 'Спаситель будущего',
    description: 'Успешно завершил 5 и более целей',
    points: 150,
    icon: '🦸',
    category: 'цели'
  },
  R100: {
    id: 6,
    code: 'R100',
    name: 'Легенда дисциплины',
    description: 'Достиг рейтинга 100 и выше',
    points: 300,
    icon: '👑',
    category: 'рейтинг'
  },
  R500: {
    id: 7,
    code: 'R500',
    name: 'Абсолютный мастер',
    description: 'Достиг рейтинга 500',
    points: 1000,
    icon: '💎',
    category: 'рейтинг'
  },
  EW: {
    id: 8,
    code: 'EW',
    name: 'Сорвался',
    description: 'Снял деньги до достижения цели (штрафная)',
    points: -25,
    icon: '💔',
    category: 'снятия'
  },
  FAST: {
    id: 9,
    code: 'FAST',
    name: 'Молниеносный старт',
    description: 'Первый депозит в течение 5 минут после создания цели',
    points: 15,
    icon: '⚡',
    category: 'пополнения'
  },
  BIG: {
    id: 10,
    code: 'BIG',
    name: 'Крупный вклад',
    description: 'Один депозит ≥ 5 SOL',
    points: 70,
    icon: '💰',
    category: 'пополнения'
  },
  NIGHT: {
    id: 11,
    code: 'NIGHT',
    name: 'Ночной вкладчик',
    description: 'Депозит сделан с 00:00 до 06:00 по МСК',
    points: 10,
    icon: '🌙',
    category: 'пополнения'
  },
  SECRET: {
    id: 12,
    code: 'SECRET',
    name: 'Тайная ачивка',
    description: 'Секретное условие',
    points: 100,
    icon: '🔒',
    category: 'другие'
  }
};

export const CATEGORIES = {
  'цели': { name: 'Цели', icon: '🎯' },
  'пополнения': { name: 'Пополнения', icon: '💰' },
  'снятия': { name: 'Снятия', icon: '🏆' },
  'рейтинг': { name: 'Рейтинг', icon: '⭐' },
  'другие': { name: 'Другие', icon: '🔒' }
};
