import { Groq } from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('file') as File;

    if (!audioFile) {
      return new Response(JSON.stringify({ error: "No audio file provided" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const transcription = await groq.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-large-v3",
      response_format: "verbose_json",
      timestamp_granularities: ["word", "segment"],
      language: "ja",
      temperature: 0.0,
    });

    return new Response(JSON.stringify({ text: transcription.text }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Transcription error:', error);
    return new Response(JSON.stringify({ error: "Failed to transcribe audio" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}