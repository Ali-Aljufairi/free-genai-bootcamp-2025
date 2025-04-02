declare module 'recordrtc' {
    export default class RecordRTC {
        constructor(stream: MediaStream, options?: RecordRTCOptions);
        startRecording(): void;
        stopRecording(callback: (blob: Blob) => void): void;
        getBlob(): Blob;
        static StereoAudioRecorder: any;
    }

    interface RecordRTCOptions {
        type?: string;
        mimeType?: string;
        sampleRate?: number;
        desiredSampRate?: number;
        recorderType?: any;
        numberOfAudioChannels?: number;
        bufferSize?: number;
        audioBitsPerSecond?: number;
        timeSlice?: number;
        checkForInactiveTracks?: boolean;
        disableLogs?: boolean;
    }
} 