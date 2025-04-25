package services

import (
	"encoding/xml"
	"fmt"
	"io"
	"os"
)

// JMdict represents the root element of the JMdict XML
type JMdict struct {
	Entries []Entry `xml:"entry"`
}

// Entry represents a dictionary entry
type Entry struct {
	Kanji    []KEle  `xml:"k_ele"`
	Readings []REle  `xml:"r_ele"`
	Senses   []Sense `xml:"sense"`
}

// KEle represents the kanji element
type KEle struct {
	Keb string `xml:"keb"`
}

// REle represents the reading element
type REle struct {
	Reb string `xml:"reb"`
}

// Sense represents the sense element containing meanings
type Sense struct {
	Glosses []string `xml:"gloss"`
}

// DictionaryParser handles parsing of the JMdict XML file
type DictionaryParser struct {
	filePath   string
	validKanji map[string]bool
	jlptLevel  string
	allKanji   map[string]string // maps kanji to its JLPT level
}

// NewDictionaryParser creates a new dictionary parser
func NewDictionaryParser(filePath string, validKanji []string, jlptLevel string, allKanji map[string]string) *DictionaryParser {
	// Create a map for O(1) lookup of valid kanji
	kanjiMap := make(map[string]bool)
	for _, k := range validKanji {
		kanjiMap[k] = true
	}

	return &DictionaryParser{
		filePath:   filePath,
		validKanji: kanjiMap,
		jlptLevel:  jlptLevel,
		allKanji:   allKanji,
	}
}

// ParseDictionary parses the XML dictionary and returns valid compound words
func (p *DictionaryParser) ParseDictionary() ([]CompoundWord, error) {
	file, err := os.Open(p.filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to open dictionary file: %w", err)
	}
	defer file.Close()

	decoder := xml.NewDecoder(file)
	decoder.Strict = false
	decoder.Entity = xml.HTMLEntity

	var compounds []CompoundWord
	var inEntry bool
	var currentEntry Entry

	// Add counters for skipped entries
	var skippedDecoding int
	var skippedInvalidCompound int
	var skippedNoKanji int
	var totalEntries int

	// Add counters for rejection reasons
	var skippedLength int
	var skippedLevelMismatch int
	var skippedMissingKanji int
	var skippedNoCurrentLevelKanji int

	for {
		token, err := decoder.Token()
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, fmt.Errorf("error decoding XML: %w", err)
		}

		switch t := token.(type) {
		case xml.StartElement:
			if t.Name.Local == "entry" {
				inEntry = true
				currentEntry = Entry{}
				totalEntries++
			} else if inEntry {
				switch t.Name.Local {
				case "k_ele":
					var kele KEle
					if err := decoder.DecodeElement(&kele, &t); err != nil {
						skippedDecoding++
						continue // Skip this element if there's an error
					}
					currentEntry.Kanji = append(currentEntry.Kanji, kele)
				case "r_ele":
					var rele REle
					if err := decoder.DecodeElement(&rele, &t); err != nil {
						skippedDecoding++
						continue
					}
					currentEntry.Readings = append(currentEntry.Readings, rele)
				case "sense":
					var sense Sense
					if err := decoder.DecodeElement(&sense, &t); err != nil {
						skippedDecoding++
						continue
					}
					currentEntry.Senses = append(currentEntry.Senses, sense)
				}
			}
		case xml.EndElement:
			if t.Name.Local == "entry" && inEntry {
				// Process each kanji element in the entry
				for _, kele := range currentEntry.Kanji {
					word := kele.Keb
					if p.isValidCompound(word, &skippedLength, &skippedLevelMismatch, &skippedMissingKanji, &skippedNoCurrentLevelKanji) {
						kanjiList := p.extractKanji(word)
						if len(kanjiList) > 0 {
							compound := CompoundWord{
								Word:    word,
								Reading: getFirstReading(currentEntry.Readings),
								Meaning: getFirstMeaning(currentEntry.Senses),
								Kanji:   kanjiList,
							}
							compounds = append(compounds, compound)
						} else {
							skippedNoKanji++
						}
					} else {
						skippedInvalidCompound++
					}
				}
				inEntry = false
			}
		}
	}

	return compounds, nil
}

// CompoundWord represents a valid compound word found in the dictionary
type CompoundWord struct {
	Word    string   `json:"word"`
	Reading string   `json:"reading"`
	Meaning string   `json:"meaning"`
	Kanji   []string `json:"kanji"`
}

// isValidLevel checks if a JLPT level is valid for current context
func (p *DictionaryParser) isValidLevel(level string) bool {
	levelMap := map[string]int{
		"N5": 5,
		"N4": 4,
		"N3": 3,
		"N2": 2,
		"N1": 1,
	}
	currentLevel := levelMap[p.jlptLevel]
	targetLevel := levelMap[level]
	return targetLevel >= currentLevel
}

// isValidCompound checks if a word is appropriate for the JLPT level
func (p *DictionaryParser) isValidCompound(word string, skippedLength, skippedLevelMismatch, skippedMissingKanji, skippedNoCurrentLevelKanji *int) bool {
	runes := []rune(word)

	// Length restrictions based on JLPT level
	switch p.jlptLevel {
	case "N5":
		// N5 compounds should be mostly 2 kanji
		if len(runes) < 2 || len(runes) > 3 {
			*skippedLength++
			return false
		}
	case "N4":
		if len(runes) > 3 {
			*skippedLength++
			return false
		}
	case "N3", "N2", "N1":
		if len(runes) > 4 {
			*skippedLength++
			return false
		}
	}

	// Count kanji and validate each one
	var kanjiCount int
	for _, r := range runes {
		char := string(r)
		// Skip if it's not kanji (hiragana/katakana)
		if !isKanji(char) {
			continue
		}
		kanjiCount++

		// Check if this kanji exists in our level mapping
		if level, exists := p.allKanji[char]; exists {
			// If the kanji's level is higher than current level, reject
			if !p.isValidLevel(level) {
				*skippedLevelMismatch++
				return false
			}
		} else {
			// If we don't have level info, reject the kanji
			*skippedMissingKanji++
			return false
		}
	}

	// N5 compounds should have exactly 2 kanji (most common case)
	if p.jlptLevel == "N5" && kanjiCount != 2 {
		*skippedLength++
		return false
	}

	// Make sure we have at least one kanji from current level
	hasCurrentLevelKanji := false
	for _, r := range runes {
		char := string(r)
		if p.validKanji[char] {
			hasCurrentLevelKanji = true
			break
		}
	}

	if !hasCurrentLevelKanji {
		*skippedNoCurrentLevelKanji++
		return false
	}

	return true
}

// isKanji checks if a character is a kanji
func isKanji(char string) bool {
	for _, r := range char {
		if (r >= '\u4E00' && r <= '\u9FFF') || // CJK Unified Ideographs
			(r >= '\u3400' && r <= '\u4DBF') || // CJK Unified Ideographs Extension A
			(r >= '\uF900' && r <= '\uFAFF') { // CJK Compatibility Ideographs
			return true
		}
	}
	return false
}

// extractKanji extracts valid kanji from a word in order
func (p *DictionaryParser) extractKanji(word string) []string {
	var kanji []string
	for _, r := range word {
		char := string(r)
		if isKanji(char) && p.validKanji[char] {
			kanji = append(kanji, char)
		}
	}
	return kanji
}

// getFirstReading returns the first reading of the word
func getFirstReading(readings []REle) string {
	if len(readings) > 0 {
		return readings[0].Reb
	}
	return ""
}

// getFirstMeaning returns the first English meaning of the word
func getFirstMeaning(senses []Sense) string {
	if len(senses) > 0 && len(senses[0].Glosses) > 0 {
		return senses[0].Glosses[0]
	}
	return ""
}
