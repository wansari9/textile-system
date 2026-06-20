import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Temporary bypass for frontend scaffolding
    localStorage.setItem('token', 'fake-jwt-token');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Textile System Login</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <input 
              type="text" 
              className="mt-1 w-full p-2 border rounded-md" 
              value={username} 
              onChange={e => setUsername(e.target.value)}
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input 
              type="password" 
              className="mt-1 w-full p-2 border rounded-md" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              required 
            />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded-md font-bold hover:bg-blue-700">
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}