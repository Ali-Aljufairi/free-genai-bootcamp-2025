#!/bin/bash
# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Testing N5 Kanji Compound Import${NC}"
echo -e "${BLUE}-----------------------------${NC}"

BASE_URL="http://localhost:8080/api/langportal"

# Cleanup Neo4j first
echo -e "\n${GREEN}Cleaning up Neo4j database...${NC}"
CLEANUP=$(curl -s -X POST "${BASE_URL}/neo4j/cleanup")
echo $CLEANUP | jq .

# Import N5 data
echo -e "\n${GREEN}Importing N5 level data...${NC}"
IMPORT=$(curl -s -X POST "${BASE_URL}/jlpt/import?level=N5")
echo $IMPORT | jq .

# Test with some known N5 kanji
for KANJI in "人" "日" "本" "人" "月" "火"; do
    echo -e "\n${GREEN}Testing compounds for kanji: $KANJI${NC}"
    COMPOUNDS=$(curl -s -G --data-urlencode "kanji=$KANJI" "${BASE_URL}/kanji/$KANJI/compounds")
    echo "Number of compounds:" $(echo $COMPOUNDS | jq '.compounds | length')
    echo "Compounds:" 
    echo $COMPOUNDS | jq '.compounds[] | {word, reading, meaning}'
done