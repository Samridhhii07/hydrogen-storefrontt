import { useState } from 'react';

export function EmailSignupForm() {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubscribed(true);
      setEmail(''); 
    }
  };

  return (
    <div className="w-full max-w-md">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <div className="flex">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="flex-1 px-4 py-2 border border-black text-black rounded-l focus:outline-none focus:border-black"
            required
          />
          <button
            type="submit"
            className="px-4 py-2 text-black rounded-r transition-colors"
            aria-label="Subscribe"
          >
            →
          </button>
        </div>
        {isSubscribed && (
          <p className="text-black-600 text-sm mt-2 animate-fade-in">
            Thanks for subscribing!
          </p>
        )}
      </form>
    </div>
  );
} 