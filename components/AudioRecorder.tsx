"use client";

import { useState, useRef, useEffect } from "react";
import { processAudio } from "@/actions/processAudio"; // Import our new backend function

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export default function AudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  // New States for AI processing
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);

  const [selectedDuration, setSelectedDuration] = useState<number>(60);
  const [timeLeft, setTimeLeft] = useState<number>(60);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRecording && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0 && isRecording) {
      stopRecording();
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isRecording, timeLeft]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioUrl(URL.createObjectURL(audioBlob));
        stream.getTracks().forEach((track) => track.stop());
      };

      setTimeLeft(selectedDuration);
      setTranscript(null); // Clear old transcripts
      mediaRecorder.start();
      setIsRecording(true);
      setAudioUrl(null);
    } catch (error) {
      console.error("Error:", error);
      alert("Please allow microphone access.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // NEW: Function to send audio to the server
  const handleAnalyze = async () => {
    if (audioChunksRef.current.length === 0) return;
    
    setIsAnalyzing(true);
    setTranscript(null);

    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      
      // FormData is the standard way to send files to a server
      const formData = new FormData();
      formData.append("audio", audioBlob);

      // Call the server action directly!
      const result = await processAudio(formData);

      if (result.error) {
        alert(result.error);
      } else if (result.transcript) {
        setTranscript(result.transcript);
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong communicating with the server.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 p-8 border rounded-lg bg-slate-50 max-w-xl mx-auto mt-10 shadow-sm">
      <h2 className="text-2xl font-bold text-gray-800">Speech Practice</h2>

      {!isRecording && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 font-medium">Time Limit:</span>
          {[30, 60, 120].map((duration) => (
            <button
              key={duration}
              onClick={() => { setSelectedDuration(duration); setTimeLeft(duration); }}
              className={`px-3 py-1 text-sm rounded-md transition ${
                selectedDuration === duration ? "bg-blue-600 text-white font-semibold" : "bg-gray-200 text-gray-700"
              }`}
            >
              {duration < 60 ? `${duration}s` : `${duration / 60}m`}
            </button>
          ))}
        </div>
      )}

      <div className="text-5xl font-mono font-bold tracking-wider text-slate-800 my-2">
        {formatTime(timeLeft)}
      </div>

      <div className="flex gap-4">
        {!isRecording ? (
          <button onClick={startRecording} className="px-6 py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition shadow">
            Start Recording
          </button>
        ) : (
          <button onClick={stopRecording} className="px-6 py-3 bg-red-500 text-white rounded-full font-medium animate-pulse hover:bg-red-600 transition shadow">
            Stop Early
          </button>
        )}
      </div>

      {audioUrl && (
        <div className="w-full mt-4 flex flex-col items-center gap-4 border-t pt-4">
          <audio src={audioUrl} controls className="w-full max-w-sm" />
          
          <button 
            onClick={handleAnalyze} 
            disabled={isAnalyzing}
            className="px-6 py-2 bg-emerald-600 text-white rounded-md font-medium hover:bg-emerald-700 disabled:bg-gray-400 transition"
          >
            {isAnalyzing ? "Processing Audio..." : "Transcribe Speech"}
          </button>
        </div>
      )}

      {/* NEW: Transcript Display */}
      {transcript && (
        <div className="w-full mt-4 p-4 bg-white border rounded-md text-left shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-2">Transcript:</h3>
          <p className="text-gray-700 leading-relaxed">{transcript}</p>
        </div>
      )}
    </div>
  );
}