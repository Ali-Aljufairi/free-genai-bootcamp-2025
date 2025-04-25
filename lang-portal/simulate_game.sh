#!/bin/bash

# Configuration
API_BASE_URL="http://localhost:8080"
JLPT_LEVEL="N5"  # Can be N5, N4, N3, N2, N1

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting Kanji Compound Learning Game Simulation${NC}"
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
echo -e "\n${BLUE}Step 2: Getting compounds for $KANJI${NC}"
COMPOUNDS_RESPONSE=$(curl -s "$API_BASE_URL/api/langportal/game/kanji-compound/compounds/$KANJI/$JLPT_LEVEL")
echo "Available compounds:"
echo "$COMPOUNDS_RESPONSE" | jq -r '.compounds[] | "\(.word) - \(.meaning) (Reading: \(.reading))"'

# Step 3: Get kanji choices for the game
echo -e "\n${BLUE}Step 3: Getting kanji choices${NC}"
CHOICES_RESPONSE=$(curl -s "$API_BASE_URL/api/langportal/game/kanji-compound/choices/$KANJI/$JLPT_LEVEL")
echo "Available kanji choices:"
echo "$CHOICES_RESPONSE" | jq -r '.choices[] | 
  if .isValid then 
    "\(.kanji) (Valid positions: \(.positions | join(", "))) - \(if .isTarget then "Target" else "Valid" end)" 
  else 
    "\(.kanji) (No valid positions) - Invalid" 
  end'

# Step 4: Simulate user input and validate
echo -e "\n${BLUE}Step 4: Simulating user input${NC}"
# Get the first compound from the list
FIRST_COMPOUND=$(echo "$COMPOUNDS_RESPONSE" | jq -r '.compounds[0].word')
if [ "$FIRST_COMPOUND" = "null" ] || [ -z "$FIRST_COMPOUND" ]; then
    echo -e "${RED}No compounds available for validation${NC}"
    exit 1
fi

echo "Selected compound: $FIRST_COMPOUND"

# Get all possible positions for the target kanji in the compound
POSITIONS=$(echo "$COMPOUNDS_RESPONSE" | jq -r '.compounds[0].position')
if [ "$POSITIONS" = "null" ]; then
    echo -e "${RED}No valid positions found for this compound${NC}"
    exit 1
fi

# Try with the target kanji (should be valid)
echo -e "\n${YELLOW}Testing with target kanji ($KANJI):${NC}"
for POSITION in $POSITIONS; do
    echo -e "\nTrying position: $POSITION"
    
    # Validate the compound
    VALIDATION_RESPONSE=$(curl -s -X POST "$API_BASE_URL/api/langportal/game/kanji-compound/validate" \
      -H "Content-Type: application/json" \
      -d "{\"kanji\":\"$KANJI\",\"compound\":\"$FIRST_COMPOUND\",\"level\":\"$JLPT_LEVEL\",\"position\":$POSITION}")

    IS_VALID=$(echo "$VALIDATION_RESPONSE" | jq -r '.isValid')
    MEANING=$(echo "$VALIDATION_RESPONSE" | jq -r '.meaning')
    READING=$(echo "$VALIDATION_RESPONSE" | jq -r '.reading')

    if [ "$IS_VALID" = "true" ]; then
        echo -e "${GREEN}Valid compound at position $POSITION!${NC}"
        echo "Meaning: $MEANING"
        echo "Reading: $READING"
    else
        echo -e "${RED}Invalid compound at position $POSITION${NC}"
    fi
done

# Try with a random invalid kanji
echo -e "\n${YELLOW}Testing with invalid kanji:${NC}"
# Get a random invalid kanji from choices
INVALID_KANJI=$(echo "$CHOICES_RESPONSE" | jq -r '.choices[] | select(.isValid == false) | .kanji' | head -n 1)
if [ -n "$INVALID_KANJI" ]; then
    echo "Using invalid kanji: $INVALID_KANJI"
    
    # Try all positions with invalid kanji
    for POSITION in 0 1 2; do
        echo -e "\nTrying position: $POSITION"
        
        VALIDATION_RESPONSE=$(curl -s -X POST "$API_BASE_URL/api/langportal/game/kanji-compound/validate" \
          -H "Content-Type: application/json" \
          -d "{\"kanji\":\"$INVALID_KANJI\",\"compound\":\"$FIRST_COMPOUND\",\"level\":\"$JLPT_LEVEL\",\"position\":$POSITION}")

        IS_VALID=$(echo "$VALIDATION_RESPONSE" | jq -r '.isValid')
        MEANING=$(echo "$VALIDATION_RESPONSE" | jq -r '.meaning')
        READING=$(echo "$VALIDATION_RESPONSE" | jq -r '.reading')

        if [ "$IS_VALID" = "true" ]; then
            echo -e "${GREEN}Valid compound at position $POSITION!${NC}"
            echo "Meaning: $MEANING"
            echo "Reading: $READING"
        else
            echo -e "${RED}Invalid compound at position $POSITION${NC}"
        fi
    done
else
    echo -e "${RED}No invalid kanji found in choices${NC}"
fi

# Try with a valid non-target kanji
echo -e "\n${YELLOW}Testing with valid non-target kanji:${NC}"
# Get a random valid non-target kanji from choices
VALID_NONTARGET_KANJI=$(echo "$CHOICES_RESPONSE" | jq -r '.choices[] | select(.isValid == true and .isTarget == false) | .kanji' | head -n 1)
if [ -n "$VALID_NONTARGET_KANJI" ]; then
    echo "Using valid non-target kanji: $VALID_NONTARGET_KANJI"
    
    # Try all positions with valid non-target kanji
    for POSITION in 0 1 2; do
        echo -e "\nTrying position: $POSITION"
        
        VALIDATION_RESPONSE=$(curl -s -X POST "$API_BASE_URL/api/langportal/game/kanji-compound/validate" \
          -H "Content-Type: application/json" \
          -d "{\"kanji\":\"$VALID_NONTARGET_KANJI\",\"compound\":\"$FIRST_COMPOUND\",\"level\":\"$JLPT_LEVEL\",\"position\":$POSITION}")

        IS_VALID=$(echo "$VALIDATION_RESPONSE" | jq -r '.isValid')
        MEANING=$(echo "$VALIDATION_RESPONSE" | jq -r '.meaning')
        READING=$(echo "$VALIDATION_RESPONSE" | jq -r '.reading')

        if [ "$IS_VALID" = "true" ]; then
            echo -e "${GREEN}Valid compound at position $POSITION!${NC}"
            echo "Meaning: $MEANING"
            echo "Reading: $READING"
        else
            echo -e "${RED}Invalid compound at position $POSITION${NC}"
        fi
    done
else
    echo -e "${RED}No valid non-target kanji found in choices${NC}"
fi

echo -e "\n${BLUE}Game simulation complete!${NC}" 