export interface CompoundWord {
    word: string;
    reading: string;
    meaning: string;
    length: number;
    position: number;
    otherKanji: Array<{
        kanji: string;
        position: number;
    }>;
}

export interface KanjiChoice {
    kanji: string;
    isTarget: boolean;
    positions: number[];
    isValid: boolean;
}

export interface GameData {
    kanji: string;
    compounds: CompoundWord[];
    choices: KanjiChoice[];
    level: string;
}

export interface ValidateGameCompoundRequest {
    kanji: string;
    compound: string;
    level: string;
    position: number;
}

export interface ValidateGameCompoundResponse {
    isValid: boolean;
    word?: string;
    reading?: string;
    meaning?: string;
    length?: number;
    otherKanji?: Array<{
        kanji: string;
        position: number;
    }>;
    error?: string;
}