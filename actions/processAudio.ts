"use server"; // This strictly tells Next.js: NEVER send this code to the browser!

export async function processAudio(formData: FormData) {
  // 1. Extract the audio file from the data sent by the browser
  const file = formData.get("audio") as Blob;
  
  if (!file) {
    return { error: "No audio file found" };
  }

  try {
    // 2. Package the file specifically for Groq's API
    const groqData = new FormData();
    groqData.append("file", file, "speech.webm");
    groqData.append("model", "whisper-large-v3-turbo"); // Groq's fastest transcription model
    groqData.append("response_format", "json");

    // 3. Send the request to Groq securely using your secret API key
    const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: groqData,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("API Error:", data);
      return { error: "Failed to transcribe audio. Check your API key." };
    }

    // 4. Return the text back to the browser
    return { transcript: data.text };
    
  } catch (error) {
    console.error("Server Error:", error);
    return { error: "Something went wrong on the server." };
  }
}