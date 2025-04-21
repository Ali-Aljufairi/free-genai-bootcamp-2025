#!/bin/bash

# Colors for output
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
NC="\033[0m" # No Color

BASE_URL="http://localhost:8080/api/langportal"

echo -e "${YELLOW}Importing JLPT N5 data...${NC}"

# First, try to get compounds for a common N5 kanji (日) to check if data exists
echo -e "\n${BLUE}Checking if Neo4j already has data...${NC}"
CHECK_RESPONSE=$(curl -s -G --data-urlencode "kanji=日" "${BASE_URL}/kanji/日/compounds")

if [[ $(echo $CHECK_RESPONSE | jq '.compounds | length') -gt 0 ]]; then
    echo -e "${GREEN}Neo4j data already exists. Skipping import.${NC}"
    exit 0
fi

# If no data exists, proceed with import
echo -e "${YELLOW}No existing data found. Starting fresh import...${NC}"

# First clean up any existing data
echo -e "\n${YELLOW}Cleaning up existing Neo4j data...${NC}"
CLEANUP_RESPONSE=$(curl -s -X POST "${BASE_URL}/neo4j/cleanup")
echo $CLEANUP_RESPONSE | jq .

# Import JLPT N5 data
echo -e "\n${YELLOW}Importing JLPT N5 kanji and compounds...${NC}"
IMPORT_RESPONSE=$(curl -s -X POST "${BASE_URL}/jlpt/import?level=N5")
echo $IMPORT_RESPONSE | jq .

# Verify the import
echo -e "\n${YELLOW}Verifying import with test kanji '人'...${NC}"
VERIFY_RESPONSE=$(curl -s -G --data-urlencode "kanji=日" "${BASE_URL}/kanji/人/compounds")
echo $VERIFY_RESPONSE | jq .

if [[ $(echo $VERIFY_RESPONSE | jq '.compounds | length') -eq 0 ]]; then
    echo -e "${RED}Import verification failed - no compounds found for test kanji${NC}"
    exit 1
else
    echo -e "${GREEN}Import verification successful${NC}"
    echo -e "\nYou can now run the word builder game flow script."
fi