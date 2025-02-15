## Running Ollama Third-Party Service

### Choosing a Model

You can get the model_id that ollama will launch from the [Ollama Library](https://ollama.com/library).

https://ollama.com/library/llama3.2

eg. LLM_MODEL_ID="llama3.2:1b"

### Getting the Host IP

#### Linux

Get your IP address
```sh
sudo apt install net-tools
ifconfig
```

Or you can try this way `$(hostname -I | awk '{print $1}')`

HOST_IP=$(hostname -I | awk '{print $1}') NO_PROXY=localhost LLM_ENDPOINT_PORT=9000 LLM_MODEL_ID="llama3.2:1b" docker compose up

