import { useState } from 'react';

const PASSWORD = '45dayschallenge'; // Replace with your actual password

const Login = () => {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input === PASSWORD) {
      localStorage.setItem('authenticated', 'true');
      window.location.href = '/';
    } else {
      setError('Incorrect password. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <form onSubmit={handleSubmit} className="bg-card p-8 rounded shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-6 text-center">Enter Password</h2>
        <input
          type="password"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Password"
          className="w-full p-3 rounded border border-gray-300 mb-4"
          autoFocus
        />
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <button
          type="submit"
          className="w-full bg-primary text-white py-3 rounded hover:bg-primary-dark transition"
        >
          Submit
        </button>
      </form>
    </div>
  );
};

export default Login;
