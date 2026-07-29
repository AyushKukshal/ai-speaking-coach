"use client"; // Tells Next.js this runs in the browser, not the server

import { useState, useRef } from "react";

export default function AudioRecorder() {
  // State: Triggers the UI to update when these change
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // Refs: Hold data behind the scenes without triggering UI updates
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      // 1. Ask the user for microphone permissions
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // 2. Create a new MediaRecorder instance
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = []; // Clear old recordings

      // 3. Every time the mic grabs a chunk of audio, save it
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // 4. When recording stops, glue the chunks into a single audio file
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url); // Save the playable URL to state

        // Turn off the microphone completely (removes the red dot in the browser tab)
        stream.getTracks().forEach((track) => track.stop());
      };

      // 5. Actually start the recording process
      mediaRecorder.start();
      setIsRecording(true);
      setAudioUrl(null); // Clear previous playback
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Please allow microphone access to use this feature.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 p-8 border rounded-lg bg-slate-50 max-w-md mx-auto mt-10">
      <h2 className="text-xl font-semibold">Speech Practice</h2>
      
      {/* Recording Buttons */}
      <div className="flex gap-4">
        {!isRecording ? (
          <button
            onClick={startRecording}
            className="px-6 py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition"
          >
            Start Recording
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="px-6 py-3 bg-red-500 text-white rounded-full font-medium animate-pulse hover:bg-red-600 transition"
          >
            Stop Recording
          </button>
        )}
      </div>

      {/* Playback Audio Player */}
      {audioUrl && (
        <div className="w-full mt-4 flex flex-col items-center gap-2">
          <p className="text-sm text-gray-600">Preview your speech:</p>
          <audio src={audioUrl} controls className="w-full" />
        </div>
      )}
    </div>
  );
}