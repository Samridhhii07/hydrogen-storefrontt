import { useState, useEffect } from 'react';

interface Announcement {
  id: number;
  text: string;
}

const announcements: Announcement[] = [
  { id: 1, text: "Free shipping on orders over $100" },
  { id: 2, text: "New collection dropping soon! Stay tuned" },
  { id: 3, text: "20% off all products" }
];

export function AnnouncementBar() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === announcements.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const handlePrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? announcements.length - 1 : prevIndex - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === announcements.length - 1 ? 0 : prevIndex + 1
    );
  };

  return (
    <div className="w-full bg-black relative">
      <div className="flex items-center justify-between px-4">
        <button 
          onClick={handlePrevious}
          className="text-white hover:text-gray-300 focus:outline-none"
          aria-label="Previous announcement"
        >
          ←
        </button>
        
        <div className="overflow-hidden flex-1">
          <div 
            className="flex transition-transform duration-500 ease-in-out w-full"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {announcements.map((announcement) => (
              <div 
                key={announcement.id}
                className="w-full flex-shrink-0 py-2 text-center min-w-full"
              >
                <p className="text-white text-sm">{announcement.text}</p>
              </div>
            ))}
          </div>
        </div>

        <button 
          onClick={handleNext}
          className="text-white hover:text-gray-300 focus:outline-none"
          aria-label="Next announcement"
        >
          →
        </button>
      </div>
    </div>
  );
} 