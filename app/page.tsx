import AudioRecorder from "@/components/AudioRecorder";

export default function Home() {
  return (
    <main className="min-h-screen bg-white p-8">
      <div className="max-w-2xl mx-auto text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">AI Speaking Coach</h1>
        <p className="text-gray-600">Click below to record your first speech.</p>
      </div>
      
      {/* Here is the component we just built! */}
      <AudioRecorder />
    </main>
  );
}