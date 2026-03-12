import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Play, Pause, RotateCcw } from "lucide-react";
import { useState, useRef } from "react";
import AnimatedExercise from "./AnimatedExercise";

interface ExerciseVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseName: string;
  videoUrl?: string;
  videoThumbnail?: string;
}

const ExerciseVideoModal = ({ 
  isOpen, 
  onClose, 
  exerciseName, 
  videoUrl, 
  videoThumbnail 
}: ExerciseVideoModalProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleRestart = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleVideoClick = () => {
    setShowControls(!showControls);
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-4xl w-full p-0 bg-black">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-white text-xl font-bold">
              {exerciseName} - Exercise Guide
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="relative bg-black">
          {/* Video Container */}
          <div className="relative aspect-video bg-gray-900">
            {videoUrl ? (
              <div className="relative w-full h-full">
                {videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be') ? (
                  /* YouTube Embed */
                  <iframe
                    src={videoUrl}
                    title={`${exerciseName} Exercise Video`}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : videoUrl.includes('giphy.com') || videoUrl.includes('.mp4') || videoUrl.includes('.gif') ? (
                  /* Direct Video/GIF */
                  <video
                    src={videoUrl}
                    className="w-full h-full object-cover"
                    autoPlay
                    loop
                    muted
                    playsInline
                    controls
                  />
                ) : (
                  /* Fallback for other video types */
                  <iframe
                    src={videoUrl}
                    title={`${exerciseName} Exercise Video`}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                )}
              </div>
            ) : (
              /* Fallback for when no video URL is provided */
              <div className="flex items-center justify-center h-full text-white">
                <div className="text-center">
                  <AnimatedExercise exerciseName={exerciseName} className="mb-6" />
                  <h3 className="text-lg font-semibold mb-2">Exercise Animation</h3>
                  <p className="text-gray-400 text-sm">
                    Watch the animated demonstration for {exerciseName}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Video Controls Overlay */}
          {videoUrl && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <div className="flex items-center justify-center gap-4">
                <Button
                  onClick={handlePlayPause}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20"
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6" />
                  ) : (
                    <Play className="w-6 h-6" />
                  )}
                </Button>
                
                <Button
                  onClick={handleRestart}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20"
                >
                  <RotateCcw className="w-5 h-5" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Exercise Instructions */}
        <div className="p-6 bg-gray-900 text-white">
          <h4 className="font-semibold mb-2">Exercise Instructions:</h4>
          <div className="space-y-2 text-sm text-gray-300">
            <p>• Follow the animated demonstration for proper form</p>
            <p>• Maintain steady breathing throughout the exercise</p>
            <p>• Focus on controlled movements rather than speed</p>
            <p>• Stop if you feel any pain or discomfort</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExerciseVideoModal;
