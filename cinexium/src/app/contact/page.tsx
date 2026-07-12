'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function ContactUsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const name = session?.user?.name || 'User';
    const emailSubject = subject.trim() ? subject : `Contact from ${name}`;
    const mailtoLink = `mailto:cinexium@gmail.com?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(message)}`;
    
    window.location.href = mailtoLink;
    setMessage('');
    setSubject('');
  };

  return (
    <div className="min-h-screen bg-[#0f1115] text-gray-200 selection:bg-primary-500/30 font-sans">
      
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Top Bar with Back Arrow */}
        <div className="flex items-center gap-4 mb-10 border-b border-white/10 pb-6">
          <button onClick={() => router.back()} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-white">Contact Us</h1>
        </div>

        {/* Description */}
        <div className="mb-10 text-left">
          <p className="text-lg text-gray-400">
            Have questions, feedback, or need support? Send us a message and we'll respond as soon as possible.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-[#16181d] border border-white/5 rounded-2xl p-6 sm:p-10 shadow-xl max-w-2xl mx-auto">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-primary-500">
                <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
                <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
              </svg>
              Send a Message
            </h2>
          </div>

          {session ? (
            <form onSubmit={handleSendMessage} className="space-y-5">
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-400 mb-1.5">Subject (Optional)</label>
                <input
                  type="text"
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="What is this regarding?"
                  className="w-full bg-[#0f1115] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all"
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-400 mb-1.5">Message <span className="text-primary-500">*</span></label>
                <textarea
                  id="message"
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  placeholder="Type your message here..."
                  className="w-full bg-[#0f1115] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all resize-none"
                ></textarea>
              </div>
              <button
                type="submit"
                disabled={!message.trim()}
                className="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-3.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span>Send via Email</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </button>
            </form>
          ) : (
            <div className="py-10 text-center bg-[#0f1115] rounded-xl border border-white/5">
              <div className="w-12 h-12 mx-auto bg-white/5 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Login Required</h3>
              <p className="text-gray-400 text-sm mb-6 max-w-xs mx-auto">
                You must be logged in to send a message.
              </p>
              <Link href="/login" className="inline-flex items-center justify-center px-6 py-2.5 bg-white text-black text-sm font-bold rounded-lg hover:bg-gray-200 transition-colors">
                Log In Now
              </Link>
            </div>
          )}

          {/* Connect with Admin - Minimal Icons */}
          <div className="mt-10 pt-8 border-t border-white/5 text-center">
            <p className="text-sm font-medium text-gray-400 mb-6 uppercase tracking-widest">Connect with Admin</p>
            <div className="flex items-center justify-center gap-6">
              
              {/* X (Twitter) */}
              <a 
                href="https://x.com/_KrutarthRaval_" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full bg-[#0f1115] hover:bg-white hover:text-black border border-white/5 flex items-center justify-center text-gray-400 transition-all hover:scale-110"
                aria-label="X (Twitter)"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.008 5.936H5.039z"></path></svg>
              </a>

              {/* Instagram */}
              <a 
                href="https://instagram.com/raval_krutarth" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full bg-[#0f1115] hover:bg-pink-500 hover:text-white border border-white/5 flex items-center justify-center text-gray-400 transition-all hover:scale-110"
                aria-label="Instagram"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                  <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                </svg>
              </a>


            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
