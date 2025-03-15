#!/bin/bash

# API Testing Script for Language Portal
# This script tests all API endpoints defined in the backend

# Set the base URL for API requests (change if needed)
BASE_URL="http://localhost:8080"
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
NC="\033[0m" # No Color
LOG_FILE="api_test_results.log"

# Start with a clean log file
echo "API Test Results - $(date)" > $LOG_FILE
echo "=======================================" >> $LOG_FILE

# Function to make an API call and validate the response
test_endpoint() {
  local method=$1
  local endpoint=$2
  local description=$3
  local payload=$4

  echo -e "\n-----------------------------------------------"
  echo -e "Testing: ${method} ${endpoint}"
  echo -e "Description: ${description}"
  
  # Log to file
  echo -e "\n-----------------------------------------------" >> $LOG_FILE
  echo "Testing: ${method} ${endpoint}" >> $LOG_FILE
  echo "Description: ${description}" >> $LOG_FILE
  
  # Prepare curl command
  cmd="curl -s -X ${method} ${BASE_URL}${endpoint}"
  
  # Add payload if provided
  if [ ! -z "$payload" ]; then
    cmd="${cmd} -H 'Content-Type: application/json' -d '${payload}'"
  fi

  echo -e "${YELLOW}Executing: ${cmd}${NC}"
  echo "Executing: ${cmd}" >> $LOG_FILE

  # Execute the request
  response=$(eval ${cmd})
  
  # Check if the response is valid JSON or empty
  if echo "$response" | jq -e . >/dev/null 2>&1; then
    if [ ! -z "$response" ] && [ "$response" != "null" ]; then
      echo -e "${GREEN}✓ Success${NC}: Valid JSON response received"
      echo "✓ Success: Valid JSON response received" >> $LOG_FILE
      echo -e "Response preview:"
      echo "Response preview:" >> $LOG_FILE
      echo "$response" | jq '.' | head -n 20
      echo "$response" | jq '.' | head -n 20 >> $LOG_FILE
      if [ $(echo "$response" | jq '.' | wc -l) -gt 20 ]; then
        echo "..."
        echo "..." >> $LOG_FILE
      fi
      return 0
    else
      echo -e "${RED}✗ Failed${NC}: Empty or null response"
      echo "✗ Failed: Empty or null response" >> $LOG_FILE
      echo "Raw response: $response"
      echo "Raw response: $response" >> $LOG_FILE
      return 1
    fi
  else
    echo -e "${RED}✗ Failed${NC}: Invalid JSON response"
    echo "✗ Failed: Invalid JSON response" >> $LOG_FILE
    echo "Raw response: $response"
    echo "Raw response: $response" >> $LOG_FILE
    return 1
  fi
}

# Check if jq is installed
if ! command -v jq &> /dev/null; then
  echo -e "${RED}Error: jq is not installed. Please install it using 'brew install jq' or an equivalent command for your OS.${NC}"
  echo "Error: jq is not installed. Please install it using 'brew install jq' or an equivalent command for your OS." >> $LOG_FILE
  exit 1
fi

# Check if the server is running
echo -e "Checking if the server is running at ${BASE_URL}..."
echo "Checking if the server is running at ${BASE_URL}..." >> $LOG_FILE
if ! curl -s -o /dev/null -w "%{http_code}" ${BASE_URL} > /dev/null; then
  echo -e "${RED}Error: Server is not running at ${BASE_URL}. Please start the server before running tests.${NC}"
  echo -e "You can start the server using 'make run' or directly with 'go run cmd/api/main.go'"
  echo "Error: Server is not running at ${BASE_URL}. Please start the server before running tests." >> $LOG_FILE
  echo "You can start the server using 'make run' or directly with 'go run cmd/api/main.go'" >> $LOG_FILE
  exit 1
fi

echo -e "${GREEN}Server is running. Starting API endpoint tests...${NC}"
echo "Server is running. Starting API endpoint tests..." >> $LOG_FILE
echo "Base URL: $BASE_URL"
echo "Base URL: $BASE_URL" >> $LOG_FILE

# Track test results
passed=0
failed=0
total=0

# Function to track test results
record_result() {
  total=$((total+1))
  if [ $1 -eq 0 ]; then
    passed=$((passed+1))
  else
    failed=$((failed+1))
  fi
}


# 2. Dashboard endpoints
test_endpoint "GET" "/api/v1/dashboard/last_study_session" "Get last study session data"
record_result $?

test_endpoint "GET" "/api/v1/dashboard/study_progress" "Get study progress statistics"
record_result $?

test_endpoint "GET" "/api/v1/dashboard/quick-stats" "Get quick statistics overview"
record_result $?

# 3. Study session endpoints
test_endpoint "GET" "/api/v1/study_sessions" "Get all study sessions"
record_result $?

# Get the ID of the first study session for subsequent tests
study_session_id=$(curl -s ${BASE_URL}/api/v1/study_sessions | jq -r '.items[0].id')
if [ -z "$study_session_id" ] || [ "$study_session_id" = "null" ]; then
  echo -e "${YELLOW}No existing study session found. Creating a new one for testing...${NC}"
  echo "No existing study session found. Creating a new one for testing..." >> $LOG_FILE
  
  # Create a study session for testing
  study_session_payload='{"group_id": 1, "study_activity_id": 1}'
  test_endpoint "POST" "/api/v1/study_sessions" "Create a new study session" "$study_session_payload"
  record_result $?
  
  # Try to get the ID again
  study_session_id=$(curl -s ${BASE_URL}/api/v1/study_sessions | jq -r '.items[0].id')
  if [ -z "$study_session_id" ] || [ "$study_session_id" = "null" ]; then
    echo -e "${YELLOW}Still no study session available. Using 1 as default ID.${NC}"
    echo "Still no study session available. Using 1 as default ID." >> $LOG_FILE
    study_session_id=1
  fi
else
  echo -e "Using existing study session with ID: ${study_session_id}"
  echo "Using existing study session with ID: ${study_session_id}" >> $LOG_FILE
fi

test_endpoint "GET" "/api/v1/study_sessions/${study_session_id}/words" "Get words for a specific study session"
record_result $?

# 4. Group endpoints
test_endpoint "GET" "/api/v1/groups" "Get all groups"
record_result $?

# Get the ID of the first group for subsequent tests
group_id=$(curl -s ${BASE_URL}/api/v1/groups | jq -r '.items[0].id')
if [ -z "$group_id" ] || [ "$group_id" = "null" ]; then
  echo -e "${YELLOW}No groups found. Using 1 as default group ID.${NC}"
  echo "No groups found. Using 1 as default group ID." >> $LOG_FILE
  group_id=1
else
  echo -e "Using existing group with ID: ${group_id}"
  echo "Using existing group with ID: ${group_id}" >> $LOG_FILE
fi

test_endpoint "GET" "/api/v1/groups/${group_id}" "Get specific group details"
record_result $?

test_endpoint "GET" "/api/v1/groups/${group_id}/words" "Get words for a specific group"
record_result $?

test_endpoint "GET" "/api/v1/groups/${group_id}/study_sessions" "Get study sessions for a specific group"
record_result $?

# 5. Study activity endpoints
# Try to get a valid activity ID first
study_activity_id=$(curl -s ${BASE_URL}/api/v1/study_activities/1 | jq -r '.id')
if [ -z "$study_activity_id" ] || [ "$study_activity_id" = "null" ]; then
  echo -e "${YELLOW}No existing study activity found. Using 1 as default ID.${NC}"
  echo "No existing study activity found. Using 1 as default ID." >> $LOG_FILE
  study_activity_id=1
else
  echo -e "Using existing study activity with ID: ${study_activity_id}"
  echo "Using existing study activity with ID: ${study_activity_id}" >> $LOG_FILE
fi

test_endpoint "GET" "/api/v1/study_activities/${study_activity_id}" "Get specific study activity details"
record_result $?

test_endpoint "GET" "/api/v1/study_activities/${study_activity_id}/sessions" "Get sessions for a specific study activity"
record_result $?

# Create a study activity
study_activity_payload='{"group_id": 1, "name": "Test Activity", "thumbnail_url": "https://example.com/thumbnail.jpg", "description": "Test description"}'
test_endpoint "POST" "/api/v1/study_activities" "Create a new study activity" "$study_activity_payload"
record_result $?

# 6. Word endpoints
test_endpoint "GET" "/api/v1/words" "Get all words"
record_result $?

# Get first word ID for review test
word_id=$(curl -s ${BASE_URL}/api/v1/words | jq -r '.items[0].id')
if [ -z "$word_id" ] || [ "$word_id" = "null" ]; then
  echo -e "${YELLOW}No words found. Using 1 as default word ID.${NC}"
  echo "No words found. Using 1 as default word ID." >> $LOG_FILE
  word_id=1
fi

# 7. Review endpoints
# Test the submission review endpoint with the correct path
review_payload='{"correct": true}'
test_endpoint "POST" "/api/v1/study_sessions/${study_session_id}/words/${word_id}/review" "Submit a word review" "$review_payload"
record_result $?

# Summary
echo -e "\n-----------------------------------------------"
echo -e "Test Summary:"
echo -e "${GREEN}Passed: $passed${NC}"
echo -e "${RED}Failed: $failed${NC}"
echo -e "Total: $total"

echo -e "\n-----------------------------------------------" >> $LOG_FILE
echo "Test Summary:" >> $LOG_FILE
echo "Passed: $passed" >> $LOG_FILE
echo "Failed: $failed" >> $LOG_FILE
echo "Total: $total" >> $LOG_FILE

if [ $failed -eq 0 ]; then
  echo -e "\n${GREEN}All tests passed successfully!${NC}"
  echo -e "\nAll tests passed successfully!" >> $LOG_FILE
  exit 0
else
  echo -e "\n${RED}Some tests failed. Please check the implementation.${NC}"
  echo -e "\nSome tests failed. Please check the implementation." >> $LOG_FILE
  
  # Provide specific troubleshooting advice
  echo -e "\n${YELLOW}Troubleshooting tips:${NC}"
  echo -e "1. Check that the database is properly initialized and seeded (run 'make db-setup')"
  echo -e "2. Verify that the server is running and listening on ${BASE_URL}"
  echo -e "3. Examine the server logs for any errors during API calls"
  echo -e "4. Review handler implementations for endpoints that are failing"
  
  echo -e "\nTroubleshooting tips:" >> $LOG_FILE
  echo "1. Check that the database is properly initialized and seeded (run 'make db-setup')" >> $LOG_FILE
  echo "2. Verify that the server is running and listening on ${BASE_URL}" >> $LOG_FILE
  echo "3. Examine the server logs for any errors during API calls" >> $LOG_FILE
  echo "4. Review handler implementations for endpoints that are failing" >> $LOG_FILE
  
  echo -e "\nTest results saved to: ${LOG_FILE}"
  exit 1
fi