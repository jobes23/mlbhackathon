export interface Categories {
    [language: string]: Record<string, string>;
}

export const Categories: Record<string, Record<string, string>> = {
    en: {
      "Game Rules & Strategy": "Game Rules & Strategy",
      "Player Achievements": "Player Achievements",
      "Records & Milestones": "Records & Milestones",
      "Teams & History": "Teams & History",
    },
    es: {
      "Game Rules & Strategy": "Reglas y estrategia del juego",
      "Player Achievements": "Logros de jugadores",
      "Records & Milestones": "Récords y hitos",
      "Teams & History": "Equipos e historia",
    },
    de: {
      "Game Rules & Strategy": "Spielregeln & Strategie",
      "Player Achievements": "Spielerleistungen",
      "Records & Milestones": "Rekorde & Meilensteine",
      "Teams & History": "Teams & Geschichte",
    },
    ja: {
      "Game Rules & Strategy": "ゲームのルールと戦略",
      "Player Achievements": "プレイヤーの功績",
      "Records & Milestones": "記録とマイルストーン",
      "Teams & History": "チームと歴史",
    },
  };
  