import { useEffect, useState } from 'react';

interface Chapter {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
  thumbnail?: string;
}

interface ChapterControlsProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  chapters: Chapter[];
  onChapterChange?: (chapter: Chapter) => void;
}

export function ChapterControls({
  videoRef,
  chapters,
  onChapterChange
}: ChapterControlsProps) {
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const currentTime = video.currentTime;
      const chapter = chapters.find(
        (ch) => currentTime >= ch.startTime && currentTime < ch.endTime
      );

      if (chapter && chapter.id !== currentChapter?.id) {
        setCurrentChapter(chapter);
        onChapterChange?.(chapter);
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [chapters, currentChapter, onChapterChange]);

  const seekToChapter = (chapter: Chapter) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = chapter.startTime;
    setCurrentChapter(chapter);
    onChapterChange?.(chapter);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded"
      >
        <span>Chapters</span>
        <span>{currentChapter?.title}</span>
      </button>

      {isExpanded && (
        <div className="absolute bottom-full left-0 w-64 bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="max-h-96 overflow-y-auto">
            {chapters.map((chapter) => (
              <button
                key={chapter.id}
                onClick={() => seekToChapter(chapter)}
                className={`w-full flex items-center p-2 hover:bg-gray-100 ${
                  currentChapter?.id === chapter.id ? 'bg-gray-50' : ''
                }`}
              >
                {chapter.thumbnail && (
                  <img
                    src={chapter.thumbnail}
                    alt={chapter.title}
                    className="w-16 h-9 object-cover rounded mr-2"
                  />
                )}
                <div className="flex-1 text-left">
                  <div className="font-medium">{chapter.title}</div>
                  <div className="text-sm text-gray-500">
                    {formatTime(chapter.startTime)}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}
