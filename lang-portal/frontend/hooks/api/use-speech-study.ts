import { useState, useRef, useEffect } from 'react';
import { toast } from "@/components/ui/sonner";
import { generateImageFromText } from '@/services/google-ai';
import { transcribeAudio } from '@/app/actions/transcribe';

export function useSpeechStudy() {
    const [transcription, setTranscription] = useState<string>('');
    const [generatedImage, setGeneratedImage] = useState<string>('');
    const [analysisResult, setAnalysisResult] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioLevel, setAudioLevel] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const recorderRef = useRef<any>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, []);

    const startRecording = async () => {
        try {
            setError(null);

            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                const errorMsg = 'Your browser does not support audio recording. Please try a modern browser like Chrome, Firefox, or Edge.';
                console.error(errorMsg);
                setError(errorMsg);
                toast({
                    variant: "destructive",
                    title: "Browser Not Supported",
                    description: errorMsg,
                });
                return;
            }

            // Request microphone permissions with detailed error handling
            try {
                console.log('Requesting microphone permissions...');
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
                    }
                });
                console.log('Microphone access granted:', stream);
                streamRef.current = stream;
            } catch (mediaError: any) {
                console.error('Detailed microphone error:', mediaError);
                let errorMessage = 'Failed to access microphone. ';

                if (mediaError.name === 'NotAllowedError' || mediaError.name === 'PermissionDeniedError') {
                    errorMessage += 'Please grant microphone permissions in your browser settings.';
                } else if (mediaError.name === 'NotFoundError' || mediaError.name === 'DevicesNotFoundError') {
                    errorMessage += 'No microphone was found on your device.';
                } else if (mediaError.name === 'NotReadableError' || mediaError.name === 'TrackStartError') {
                    errorMessage += 'Your microphone is already in use by another application.';
                } else if (mediaError.name === 'OverconstrainedError') {
                    errorMessage += 'The requested microphone settings are not supported by your device.';
                } else if (mediaError.name === 'TypeError') {
                    errorMessage += 'Invalid microphone configuration.';
                } else {
                    errorMessage += `Error: ${mediaError.message || 'Unknown error'}`;
                }

                setError(errorMessage);
                toast({
                    title: "Microphone Error",
                    description: errorMessage,
                });
                return;
            }

            // Set up audio analysis
            try {
                audioContextRef.current = new AudioContext();
                const source = audioContextRef.current.createMediaStreamSource(streamRef.current);
                analyserRef.current = audioContextRef.current.createAnalyser();
                analyserRef.current.fftSize = 256;
                source.connect(analyserRef.current);
                console.log('Audio context and analyzer set up');
            } catch (audioError) {
                console.error('Error setting up audio context:', audioError);
                setError('Failed to set up audio processing. Please try again.');
                toast({
                    title: "Audio Setup Error",
                    description: "Failed to set up audio processing. Please try again.",
                });
                return;
            }

            // Initialize RecordRTC
            try {
                console.log('Importing RecordRTC...');
                const RecordRTC = (await import('recordrtc')).default;
                console.log('RecordRTC imported');

                console.log('Initializing RecordRTC...');
                recorderRef.current = new RecordRTC(streamRef.current, {
                    type: 'audio',
                    mimeType: 'audio/webm',
                    sampleRate: 44100,
                    desiredSampRate: 16000,
                    recorderType: RecordRTC.StereoAudioRecorder,
                    numberOfAudioChannels: 2,
                    bufferSize: 4096,
                    audioBitsPerSecond: 128000,
                    timeSlice: 1000,
                    checkForInactiveTracks: true,
                    disableLogs: false,
                });
                console.log('RecordRTC initialized with config:', recorderRef.current);

                recorderRef.current.startRecording();
                console.log('Recording started');
                setIsRecording(true);
                setRecordingTime(0);

                // Start timer
                timerRef.current = setInterval(() => {
                    setRecordingTime(prev => prev + 1);
                }, 1000);

                // Start audio level monitoring
                const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
                const updateAudioLevel = () => {
                    if (!analyserRef.current) return;
                    analyserRef.current.getByteFrequencyData(dataArray);
                    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
                    setAudioLevel(average / 128); // Normalize to 0-1
                    if (isRecording) {
                        requestAnimationFrame(updateAudioLevel);
                    }
                };
                updateAudioLevel();
            } catch (recorderError) {
                console.error('Error initializing recorder:', recorderError);
                setError('Failed to initialize audio recorder. Please try again.');
                toast({
                    variant: "destructive",
                    title: "Recorder Error",
                    description: "Failed to initialize audio recorder. Please try again.",
                });

                // Clean up resources
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop());
                }
                if (audioContextRef.current) {
                    audioContextRef.current.close();
                }
                return;
            }

        } catch (err) {
            console.error('Unexpected error in startRecording:', err);
            setError('An unexpected error occurred. Please try again.');
            toast({
                variant: "destructive",
                title: "Error",
                description: "An unexpected error occurred. Please try again.",
            });
        }
    };

    const stopRecording = async () => {
        if (!recorderRef.current || !isRecording) return;

        try {
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);

            recorderRef.current.stopRecording(async () => {
                const blob = recorderRef.current.getBlob();
                await handleStop(URL.createObjectURL(blob), blob);
            });

            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                console.log('Media tracks stopped');
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }

        } catch (err) {
            console.error('Error stopping recording:', err);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to stop recording. Please try again.",
            });
        }
    };

    const analyzeSpeech = async (transcript: string) => {
        if (!transcript) return;
        
        setIsAnalyzing(true);
        try {
            const response = await fetch('/api/analyze-speech', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ transcript }),
            });

            if (!response.ok) {
                throw new Error(`Failed to analyze speech: ${response.status}`);
            }

            // Parse the JSON response
            const data = await response.json();
            
            if (!data.success) {
                throw new Error('Analysis failed on the server');
            }
            
            // Update the state with the analysis text
            setAnalysisResult(data.analysis);
            
            toast({
                title: "Analysis Complete",
                description: "Speech analysis completed successfully!",
                duration: 3000
            });
        } catch (error) {
            console.error('Error analyzing speech:', error);
            toast({
                variant: "destructive",
                title: "Analysis Error",
                description: error instanceof Error ? error.message : "Failed to analyze speech",
            });
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleStop = async (blobUrl: string, blob: Blob) => {
        setIsProcessing(true);
        try {
            console.log('Processing audio file...');
            
            // Verify blob is a proper WebM audio file
            console.log('Raw audio blob details:', {
                type: blob.type,
                size: blob.size
            });

            toast({
                title: "Processing Audio",
                description: "Transcribing your speech...",
            });

            // Create FormData and append the raw blob directly
            const formData = new FormData();
            formData.append('file', blob);

            try {
                // Use the server action directly
                const result = await transcribeAudio(formData);
                
                if (result.error) {
                    throw new Error(result.error);
                }

                if (result.text) {
                    setTranscription(result.text);

                    toast({
                        title: "Transcription Complete",
                        description: "Analyzing your speech and generating image...",
                    });

                    // Run image generation and speech analysis independently
                    // so they can display as soon as they're ready
                    generateImageFromText(result.text)
                        .then(imageUrl => {
                            setGeneratedImage(imageUrl);
                            console.log('Image generated successfully');
                            toast({
                                title: "Success",
                                description: "Image generated successfully!",
                                duration: 3000
                            });
                        })
                        .catch(error => {
                            console.error('Image generation error:', error);
                            toast({
                                variant: "destructive",
                                title: "Image Error",
                                description: error instanceof Error ? error.message : "Failed to generate image",
                            });
                        });
                    
                    // Run analysis in parallel but independently
                    analyzeSpeech(result.text);
                } else {
                    throw new Error('No transcription text returned');
                }
            } catch (transcriptionError) {
                console.error('Transcription error:', transcriptionError);
                throw new Error('Failed to transcribe audio');
            }
        } catch (error) {
            console.error('Error processing audio:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to process your speech",
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return {
        transcription,
        generatedImage,
        analysisResult,
        isProcessing,
        isRecording,
        isAnalyzing,
        recordingTime,
        audioLevel,
        error,
        startRecording,
        stopRecording,
        formatTime
    };
}