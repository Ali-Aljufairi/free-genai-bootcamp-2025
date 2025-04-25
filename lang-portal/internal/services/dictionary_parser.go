package services

import (
	"encoding/xml"
	"fmt"
	"io"
	"os"
	"strings"
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
}

// NewDictionaryParser creates a new dictionary parser
func NewDictionaryParser(filePath string, validKanji []string) *DictionaryParser {
	// Create a map for O(1) lookup of valid kanji
	kanjiMap := make(map[string]bool)
	for _, k := range validKanji {
		kanjiMap[k] = true
	}

	return &DictionaryParser{
		filePath:   filePath,
		validKanji: kanjiMap,
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
			} else if inEntry {
				switch t.Name.Local {
				case "k_ele":
					var kele KEle
					if err := decoder.DecodeElement(&kele, &t); err != nil {
						continue // Skip this element if there's an error
					}
					currentEntry.Kanji = append(currentEntry.Kanji, kele)
				case "r_ele":
					var rele REle
					if err := decoder.DecodeElement(&rele, &t); err != nil {
						continue
					}
					currentEntry.Readings = append(currentEntry.Readings, rele)
				case "sense":
					var sense Sense
					if err := decoder.DecodeElement(&sense, &t); err != nil {
						continue
					}
					currentEntry.Senses = append(currentEntry.Senses, sense)
				}
			}
		case xml.EndElement:
			if t.Name.Local == "entry" && inEntry {
				// Process the entry
				for _, kele := range currentEntry.Kanji {
					word := kele.Keb
					if p.isValidCompound(word) {
						compound := CompoundWord{
							Word:    word,
							Reading: getFirstReading(currentEntry.Readings),
							Meaning: getFirstMeaning(currentEntry.Senses),
							Kanji:   strings.Split(word, ""),
						}
						compounds = append(compounds, compound)
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
	Word    string
	Reading string
	Meaning string
	Kanji   []string
}

// isValidCompound checks if a word is a valid compound (1-4 kanji, all kanji in valid list)
func (p *DictionaryParser) isValidCompound(word string) bool {
	runes := []rune(word)
	if len(runes) < 1 || len(runes) > 4 {
		return false
	}

	for _, r := range runes {
		if !p.validKanji[string(r)] {
			return false
		}
	}

	return true
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
