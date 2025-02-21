
#!/bin/bash

# YouTube clip URL
URL="https://youtube.com/clip/Ugkxz23E126TMRuYDwwYOIGluTM8qsCbDp-J?si=HW9GIDWDE4U0Vzp3"

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if yt-dlp and ffmpeg are installed
if ! command_exists yt-dlp || ! command_exists ffmpeg; then
    echo "Error: yt-dlp and/or ffmpeg are not installed. Please install them first."
    exit 1
fi

# Try to download and convert to .mov
echo "Attempting to download and convert to .mov..."
yt-dlp -f bestvideo+bestaudio --merge-output-format mov "$URL"

# If the above fails, try downloading as mp4 and then convert
if [ $? -ne 0 ]; then
    echo "Direct .mov conversion failed. Trying mp4 download and conversion..."
    
    # Download as mp4
    yt-dlp -f bestvideo+bestaudio --merge-output-format mp4 "$URL"
    
    # Get the filename of the downloaded mp4
    mp4_file=$(yt-dlp --get-filename -f bestvideo+bestaudio --merge-output-format mp4 "$URL")
    
    # Convert mp4 to mov using ffmpeg
    ffmpeg -i "$mp4_file" -c:v libx264 -c:a aac "${mp4_file%.mp4}.mov"
    
    # Remove the original mp4 file
    rm "$mp4_file"
fi

echo "Process completed. Check the current directory for the output file."
