'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function SignOutPage() {
  const [status, setStatus] = useState('Signing you out...');
  const supabase = createClientComponentClient();

  useEffect(() => {
    const signOut = async () => {
      try {
        await supabase.auth.signOut();
        setStatus('You have been signed out successfully!');
        
        // Clear any extension data by posting message
        try {
          if (typeof window !== 'undefined' && window.chrome?.runtime) {
            // If we're in a Chrome extension context, clear storage
            chrome.storage.local.clear();
          }
        } catch (error) {
          // Not in extension context, ignore
        }
        
        // Redirect to signup page after a delay
        setTimeout(() => {
          window.location.href = '/auth/signup';
        }, 2000);
        
      } catch (error) {
        console.error('Sign out error:', error);
        setStatus('Error signing out. Please try again.');
      }
    };

    signOut();
  }, [supabase.auth]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md border border-gray-100 text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-gray-400 to-gray-600 rounded-xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Signing Out
        </h1>
        
        <p className="text-gray-600 mb-6">
          {status}
        </p>
        
        <div className="flex justify-center">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            You'll be redirected to the sign-in page shortly
          </p>
        </div>
      </div>
    </div>
  );
}