export default function ChatPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 md:rounded-2xl md:border md:border-white/10 md:shadow-2xl overflow-hidden bg-gradient-to-b from-[#1a1d24] to-[#15181e]">
      <div className="w-32 h-32 bg-primary-500/10 rounded-full flex items-center justify-center mb-8 relative border border-primary-500/20 shadow-[0_0_50px_rgba(229,9,20,0.1)]">
        <svg className="w-12 h-12 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
      </div>
      <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">Your Messages</h2>
      <p className="text-gray-400 max-w-sm text-base mb-8 leading-relaxed">
        Select a conversation from the sidebar or find a friend's profile to start chatting instantly.
      </p>
    </div>
  );
}
