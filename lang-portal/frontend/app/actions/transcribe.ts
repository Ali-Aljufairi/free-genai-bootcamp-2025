'use server';

import { Groq } from 'groq-sdk';
import { promises as fs } from 'node:fs';
import { resolve } from 'node:path';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';

// Configure the Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Define the server action with proper error handling
export async function transcribeAudio(formData: FormData) {
  try {
    // Get the file from the FormData
    const file = formData.get('file');
    
    if (!file) {
      return { error: "No audio file provided" };
    }

    // Log the file details for debugging
    console.log('File details:', {
      name: file instanceof File ? file.name : 'Not a File',
      type: file instanceof File ? file.type : (file instanceof Blob ? file.type : 'Unknown type'),
      size: file instanceof Blob ? file.size : 'unknown'
    });

    // Create a temporary file path and save a copy for debugging
    const uploadsDir = resolve('./uploads');
    
    // Ensure the uploads directory exists
    try {
      await fs.access(uploadsDir);
    } catch (error) {
      await fs.mkdir(uploadsDir, { recursive: true });
    }
    
    // Generate a unique filename for the debug file
    const debugFilename = `${crypto.randomUUID()}-recording.webm`;
    const debugFilePath = resolve(uploadsDir, debugFilename);
    
    // Save a copy of the audio for debugging
    if (file instanceof Blob) {
      const buffer = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(debugFilePath, buffer);
      console.log('Debug copy saved to:', debugFilePath);
    }

    try {
      // Create a FormData object specifically for Groq API
      const formDataForGroq = new FormData();
      
      if (file instanceof File) {
        // If it's already a File, use it directly
        formDataForGroq.append('file', file, 'recording.webm');
      } else if (file instanceof Blob) {
        // If it's a Blob, create a File from it
        const fileFromBlob = new File([file], 'recording.webm', { type: 'audio/webm' });
        formDataForGroq.append('file', fileFromBlob);
      } else {
        throw new Error('File is neither File nor Blob');
      }
      
      // Add the required model parameter
      formDataForGroq.append('model', 'whisper-large-v3');
      
      // Add other required parameters
      formDataForGroq.append('response_format', 'verbose_json');
      formDataForGroq.append('language', 'ja');
      formDataForGroq.append('temperature', '0.0');

      // Instead of passing the file directly to create(), we use fetch to manually construct the request
      const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: formDataForGroq,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Groq API error: ${JSON.stringify(errorData)}`);
      }

      const transcription = await response.json();
  
      console.log('Transcription successful');
  
      // Revalidate the path to ensure fresh data
      revalidatePath('/');
  
      return { text: transcription.text };
    } catch (groqError) {
      console.error('Groq API error details:', groqError);
      return { error: `Transcription API error: ${groqError.message || 'Unknown error'}` };
    }
  } catch (error) {
    // Log the detailed error for debugging
    console.error('Transcription error details:', error);
    return { error: "Failed to transcribe audio" };
  }
}