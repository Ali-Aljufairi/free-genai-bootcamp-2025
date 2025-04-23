#!/bin/bash

# Configuration
API_BASE_URL="http://localhost:8080"
JLPT_LEVEL=${JLPT_LEVEL:-"N5"}  # Default to N5 if not set

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting Kanji Compound Learning Game Test${NC}"
echo "Selected JLPT Level: $JLPT_LEVEL"
echo "----------------------------------------"

# Step 1: Start the game and get a random kanji
echo -e "\n${BLUE}Step 1: Getting random kanji for level $JLPT_LEVEL${NC}"
RESPONSE=$(curl -s "$API_BASE_URL/api/langportal/game/kanji-compound/start/$JLPT_LEVEL")
KANJI=$(echo "$RESPONSE" | jq -r '.kanji')
LEVEL=$(echo "$RESPONSE" | jq -r '.level')

if [ "$KANJI" = "null" ]; then
    echo -e "${RED}Failed to get kanji. Response:${NC}"
    echo "$RESPONSE"
    exit 1
fi

echo "Selected Kanji: $KANJI"
echo "Level: $LEVEL"

# Step 2: Get compounds for the kanji
echo -e "\n${BLUE}Step 2: Getting compounds${NC}"
COMPOUNDS_RESPONSE=$(curl -s "$API_BASE_URL/api/langportal/game/kanji-compound/compounds/$KANJI/$JLPT_LEVEL")
echo "Compounds available:"
echo "$COMPOUNDS_RESPONSE" | jq -r '.compounds[] | "- \(.word) (\(.reading)) - \(.meaning) [Length: \(.length), Position: \(.position)]"'

# Test different compound lengths
for LENGTH in {2..4}; do
    echo -e "\n${CYAN}Testing $LENGTH-character compounds${NC}"
    
    # Find a compound of the current length
    COMPOUND=$(echo "$COMPOUNDS_RESPONSE" | jq -r --arg len "$LENGTH" '.compounds[] | select(.length == ($len|tonumber)) | .word')
    if [ -n "$COMPOUND" ]; then
        echo "Found compound: $COMPOUND"
        
        # Step 3: Get kanji choices
        echo -e "\n${BLUE}Step 3: Getting kanji choices${NC}"
        CHOICES_RESPONSE=$(curl -s "$API_BASE_URL/api/langportal/game/kanji-compound/choices/$KANJI/$JLPT_LEVEL")
        echo "Available choices:"
        echo "$CHOICES_RESPONSE" | jq -r '.choices[] | 
            if .isValid then 
                "\(.kanji) (Valid positions: \(.positions | join(", "))) - \(if .isTarget then "Target" else "Valid" end)" 
            else 
                "\(.kanji) (No valid positions) - Invalid" 
            end'

        # Step 4: Validate placement in each position
        echo -e "\n${BLUE}Step 4: Testing placement in each position${NC}"
        for POS in $(seq 0 $(($LENGTH - 1))); do
            echo -e "\nTesting position $POS"
            VALIDATION_RESPONSE=$(curl -s -X POST "$API_BASE_URL/api/langportal/game/kanji-compound/validate" \
                -H "Content-Type: application/json" \
                -d "{\"kanji\":\"$KANJI\",\"compound\":\"$COMPOUND\",\"level\":\"$JLPT_LEVEL\",\"position\":$POS}")
            
            IS_VALID=$(echo "$VALIDATION_RESPONSE" | jq -r '.isValid')
            if [ "$IS_VALID" = "true" ]; then
                READING=$(echo "$VALIDATION_RESPONSE" | jq -r '.reading')
                MEANING=$(echo "$VALIDATION_RESPONSE" | jq -r '.meaning')
                echo -e "${GREEN}Position $POS is valid!${NC}"
                echo "Reading: $READING"
                echo "Meaning: $MEANING"
            else
                echo -e "${RED}Position $POS is invalid${NC}"
            fi
        done
    else
        echo -e "${YELLOW}No $LENGTH-character compounds found${NC}"
    fi
done

echo -e "\n${GREEN}Test completed successfully!${NC}"