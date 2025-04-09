'use server';

import { revalidatePath } from 'next/cache';

// Define the server action with proper error handling
export async function transcribeAudio(formData: FormData) {
  try {
    // Get the file from the FormData
    const file = formData.get('file');
    
    if (!file) {
      return { error: "No audio file provided" };
    }

    // Log basic file details
    console.log('Processing audio file for transcription');

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

      // Send request to Groq API
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
      console.error('Transcription API error:', groqError);
      return { error: `Transcription API error: ${groqError.message || 'Unknown error'}` };
    }
  } catch (error) {
    console.error('Transcription error:', error);
    return { error: "Failed to transcribe audio" };
  }
}