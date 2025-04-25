#!/bin/bash

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Testing Word Builder Game Flow${NC}"
echo -e "${BLUE}----------------------------${NC}"

# Base URL
BASE_URL="http://localhost:8080/api/langportal"

# Force cleanup and import of fresh data
echo -e "\n${BLUE}Cleaning up existing Neo4j data...${NC}"
CLEANUP_RESPONSE=$(curl -s -X POST "${BASE_URL}/neo4j/cleanup")
echo $CLEANUP_RESPONSE | jq .

echo -e "\n${GREEN}Importing fresh JLPT N5 data...${NC}"
IMPORT_RESPONSE=$(curl -s -X POST "${BASE_URL}/jlpt/import?level=N5")
echo $IMPORT_RESPONSE | jq .

# Verify Neo4j data import with a known N5 kanji
echo -e "\n${BLUE}Verifying Neo4j data import with test kanji '日'...${NC}"
VERIFY_RESPONSE=$(curl -s -G --data-urlencode "kanji=日" "${BASE_URL}/kanji/日/compounds")
echo $VERIFY_RESPONSE | jq .

if [[ $(echo $VERIFY_RESPONSE | jq '.compounds | length') -eq 0 ]]; then
    echo -e "${RED}Import verification failed - no compounds found for test kanji${NC}"
    exit 1
else
    echo -e "${GREEN}Import verification successful${NC}"
fi

# Get a random kanji for word building
echo -e "\n${GREEN}Getting random kanji for N5 level...${NC}"
RANDOM_KANJI_RESPONSE=$(curl -s -X GET "${BASE_URL}/jlpt/N5/random-kanji")
echo $RANDOM_KANJI_RESPONSE | jq .

# Extract the kanji from the response for use in next request
KANJI=$(echo $RANDOM_KANJI_RESPONSE | jq -r '.kanji')
echo -e "\n${BLUE}Selected kanji: $KANJI${NC}"

# URL encode the kanji for the request
ENCODED_KANJI=$(printf %s "$KANJI" | jq -sRr @uri)

# Get compounds for the selected kanji
echo -e "\n${GREEN}Getting compounds for kanji $KANJI...${NC}"
COMPOUNDS_RESPONSE=$(curl -s -G --data-urlencode "kanji=$KANJI" "${BASE_URL}/kanji/$KANJI/compounds")
echo $COMPOUNDS_RESPONSE | jq .

# Test compound validation if compounds were found
if [[ $(echo $COMPOUNDS_RESPONSE | jq '.compounds | length') -gt 0 ]]; then
    COMPOUND=$(echo $COMPOUNDS_RESPONSE | jq -r '.compounds[0].word')
    POSITION=$(echo $COMPOUNDS_RESPONSE | jq -r '.compounds[0].position')
    
    echo -e "\n${GREEN}Testing compound validation for $COMPOUND at position $POSITION...${NC}"
    VALIDATION_RESPONSE=$(curl -s -G \
        --data-urlencode "kanji=$KANJI" \
        --data-urlencode "targetWord=$COMPOUND" \
        --data-urlencode "position=$POSITION" \
        "${BASE_URL}/kanji/validate-compound")
    echo $VALIDATION_RESPONSE | jq .
fi