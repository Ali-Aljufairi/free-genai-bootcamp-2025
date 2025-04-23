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

echo -e "${BLUE}Starting Kanji Compound Learning Game Simulation${NC}"
echo "Selected JLPT Level: $JLPT_LEVEL"
echo "----------------------------------------"

# Keep trying until we find a kanji with a 3-kanji compound
while true; do
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
    echo -e "\n${BLUE}Step 2: Getting compounds for $KANJI${NC}"
    COMPOUNDS_RESPONSE=$(curl -s "$API_BASE_URL/api/langportal/game/kanji-compound/compounds/$KANJI/$JLPT_LEVEL")
    
    # Check for a 3-kanji compound
    THREE_KANJI_COMPOUND=$(echo "$COMPOUNDS_RESPONSE" | jq -r '.compounds[] | select((.word | length) == 3) | .word')
    if [ -n "$THREE_KANJI_COMPOUND" ]; then
        echo "Found 3-kanji compound: $THREE_KANJI_COMPOUND"
        break
    else
        echo -e "${YELLOW}No 3-kanji compound found. Trying another kanji...${NC}"
    fi
done

# Get the full compound details
COMPOUND_DETAILS=$(echo "$COMPOUNDS_RESPONSE" | jq -r --arg compound "$THREE_KANJI_COMPOUND" '.compounds[] | select(.word == $compound)')
MEANING=$(echo "$COMPOUND_DETAILS" | jq -r '.meaning')
READING=$(echo "$COMPOUND_DETAILS" | jq -r '.reading')
POSITION=$(echo "$COMPOUND_DETAILS" | jq -r '.position')

echo -e "\n${CYAN}Compound Details:${NC}"
echo "Word: $THREE_KANJI_COMPOUND"
echo "Meaning: $MEANING"
echo "Reading: $READING"
echo "Target Position: $POSITION"

# Initialize game state
PLACED_KANJI=""
ROUND=1

# Game loop until all kanji are placed correctly
while [ ${#PLACED_KANJI} -lt 3 ]; do
    echo -e "\n${BLUE}Round $ROUND:${NC}"
    
    # Step 3: Get kanji choices for the game
    echo -e "\n${BLUE}Step 3: Getting kanji choices${NC}"
    CHOICES_RESPONSE=$(curl -s "$API_BASE_URL/api/langportal/game/kanji-compound/choices/$KANJI/$JLPT_LEVEL")
    echo "Available kanji choices:"
    echo "$CHOICES_RESPONSE" | jq -r '.choices[] | 
      if .isValid then 
        "\(.kanji) (Valid position: \(.positions | join(", "))) - \(if .isTarget then "Target" else "Valid" end)" 
      else 
        "\(.kanji) (No valid positions) - Invalid" 
      end'

    # Step 4: Simulate user choice
    echo -e "\n${BLUE}Step 4: Simulating user choice${NC}"
    echo -e "${YELLOW}User selects target kanji ($KANJI) and tries position $POSITION${NC}"

    VALIDATION_RESPONSE=$(curl -s -X POST "$API_BASE_URL/api/langportal/game/kanji-compound/validate" \
      -H "Content-Type: application/json" \
      -d "{\"kanji\":\"$KANJI\",\"compound\":\"$THREE_KANJI_COMPOUND\",\"level\":\"$JLPT_LEVEL\",\"position\":$POSITION}")

    IS_VALID=$(echo "$VALIDATION_RESPONSE" | jq -r '.isValid')
    MEANING=$(echo "$VALIDATION_RESPONSE" | jq -r '.meaning')
    READING=$(echo "$VALIDATION_RESPONSE" | jq -r '.reading')

    if [ "$IS_VALID" = "true" ]; then
        echo -e "${GREEN}Correct! Kanji placed successfully!${NC}"
        echo "Meaning: $MEANING"
        echo "Reading: $READING"
        PLACED_KANJI="${PLACED_KANJI}${KANJI}"
    else
        echo -e "${RED}Incorrect position! Try again.${NC}"
    fi

    ROUND=$((ROUND + 1))
done

echo -e "\n${GREEN}Congratulations! All kanji have been placed correctly!${NC}"
echo -e "${BLUE}Game simulation complete!${NC}" 