'use client';

import { submitForm } from '../actions';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function PortalForm({
    clientMac, 
    apMac, 
    redirectUrl, 
    //ssid
}: {
    clientMac: string, 
    apMac: string, 
    redirectUrl: string,
    //ssid: string | undefined,
}) {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      setError('You must agree to the Terms of Service');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await submitForm({ name, contact, clientMac, apMac, redirectUrl });
    } catch (err) {
      setError((err instanceof Error ? err.message : 'An error occurred. Please try again.'));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md"
      >
        <div className="flex justify-center">
          <Image
            src="/logo.png"
            alt="Store Logo"
            width={2800}
            height={720}
            className="w-60 h-auto py-12"
          />
        </div>

        <h1 className="text-lg font-semibold text-center mb-6 text-gray-400">
          Connect to Free Wi-Fi
        </h1>

        <input
          type="text"
          placeholder="Your Name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <input
          type="text"
          placeholder="Email or Phone"
          required
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <label className="flex items-start space-x-2 text-sm mb-4">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1"
          />
          <span>
            I agree to the{' '}
            <Link
              href="/terms"
              target="_blank"
              className="text-blue-600 underline"
            >
              Terms of Service
            </Link>
          </span>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition"
        >
          {loading ? 'Connecting...' : 'Connect'}
        </button>

        {error && (
          <p className="text-red-500 text-sm mt-4 text-center">{error}</p>
        )}
      </form>
    </div>
  );
}
