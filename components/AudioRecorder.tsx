"use client";

import { useState, useRef, useEffect } from "react";

// Helper function to format seconds into MM:SS (e.g., 65 -> "01:05")
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export default function AudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // Timer states
  const [selectedDuration, setSelectedDuration] = useState<number>(60); // Default 60s
  const [timeLeft, setTimeLeft] = useState<number>(60);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Timer Engine: Handles the countdown ticks
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRecording && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRecording) {
      // Auto-stop recording when timer hits zero
      stopRecording();
    }

    // Cleanup function to stop interval when component unmounts or recording stops
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording, timeLeft]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        stream.getTracks().forEach((track) => track.stop());
      };

      // Reset timer and start
      setTimeLeft(selectedDuration);
      mediaRecorder.start();
      setIsRecording(true);
      setAudioUrl(null);
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
    <div className="flex flex-col items-center gap-6 p-8 border rounded-lg bg-slate-50 max-w-md mx-auto mt-10 shadow-sm">
      <h2 className="text-2xl font-bold text-gray-800">Speech Practice</h2>

      {/* Duration Selector (Only visible when not recording) */}
      {!isRecording && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 font-medium">Time Limit:</span>
          {[30, 60, 120].map((duration) => (
            <button
              key={duration}
              onClick={() => {
                setSelectedDuration(duration);
                setTimeLeft(duration);
              }}
              className={`px-3 py-1 text-sm rounded-md transition ${
                selectedDuration === duration
                  ? "bg-blue-600 text-white font-semibold"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {duration < 60 ? `${duration}s` : `${duration / 60}m`}
            </button>
          ))}
        </div>
      )}

      {/* Timer Display */}
      <div className="text-5xl font-mono font-bold tracking-wider text-slate-800 my-2">
        {formatTime(timeLeft)}
      </div>

      {/* Recording Control Button */}
      <div className="flex gap-4">
        {!isRecording ? (
          <button
            onClick={startRecording}
            className="px-6 py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition shadow"
          >
            Start Recording
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="px-6 py-3 bg-red-500 text-white rounded-full font-medium animate-pulse hover:bg-red-600 transition shadow"
          >
            Stop Early
          </button>
        )}
      </div>

      {/* Audio Playback Preview */}
      {audioUrl && (
        <div className="w-full mt-4 flex flex-col items-center gap-2 border-t pt-4">
          <p className="text-sm font-medium text-gray-600">Preview your speech:</p>
          <audio src={audioUrl} controls className="w-full" />
        </div>
      )}
    </div>
  );
}