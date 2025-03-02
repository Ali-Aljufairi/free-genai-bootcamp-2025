import pytest
from fastapi.testclient import TestClient
from app import ExampleService
import aiohttp
from unittest.mock import Mock, patch

@pytest.fixture
def example_service():
    service = ExampleService(host="0.0.0.0", port=8000)
    return service

@pytest.fixture
def test_client(example_service):
    return TestClient(example_service.service.app)

# Test service initialization
def test_service_initialization(example_service):
    assert example_service.host == "0.0.0.0"
    assert example_service.port == 8000
    assert example_service.endpoint == "/v1/example-service"

# Test Ollama connection check
@pytest.mark.asyncio
async def test_ollama_connection():
    service = ExampleService()
    with patch('aiohttp.ClientSession.get') as mock_get:
        mock_get.return_value.__aenter__.return_value.status = 200
        mock_get.return_value.__aenter__.return_value.json.return_value = ["model1", "model2"]
        result = await service.check_ollama_connection()
        assert result == True

# Test chat completion request
def test_chat_completion(test_client):
    test_request = {
        "model": "llama2",
        "messages": [
            {"role": "user", "content": "Hello, how are you?"}
        ],
        "stream": False
    }
    response = test_client.post("/v1/example-service", json=test_request)
    assert response.status_code == 200
    assert "choices" in response.json()