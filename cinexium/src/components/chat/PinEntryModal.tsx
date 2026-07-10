'use client';

import React, { useState, useEffect } from 'react';
import { useHiddenChat } from '@/components/providers/HiddenChatProvider';

interface PinEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PinEntryModal({ isOpen, onClose, onSuccess }: PinEntryModalProps) {
  const { hasPinSet, setHasPinSet, setIsHiddenModeActive } = useHiddenChat();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'ENTER' | 'SET' | 'CONFIRM' | 'FORGOT_OTP' | 'FORGOT_NEW' | 'FORGOT_CONFIRM'>('ENTER');
  const [otp, setOtp] = useState('');

  // Check if user has a PIN when modal opens
  useEffect(() => {
    if (isOpen && hasPinSet === null) {
      // Just check by passing no pin. It will return 400 'PIN not set' or 400 'PIN required'
      fetch('/api/user/pin')
        .then(res => res.json())
        .then(data => {
          if (data.error === 'PIN not set') {
            setHasPinSet(false);
            setMode('SET');
          } else {
            setHasPinSet(true);
            setMode('ENTER');
          }
        });
    } else if (isOpen) {
      setMode(hasPinSet ? 'ENTER' : 'SET');
    }
    
    if (!isOpen) {
      setPin('');
      setConfirmPin('');
      setOtp('');
      setError('');
    }
  }, [isOpen, hasPinSet]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (mode === 'SET') {
      if (pin.length !== 4) return setError('PIN must be 4 digits');
      setMode('CONFIRM');
      return;
    }
    
    if (mode === 'CONFIRM') {
      if (pin !== confirmPin) {
        setError('PINs do not match');
        setConfirmPin('');
        setMode('SET');
        return;
      }
      setLoading(true);
      const res = await fetch('/api/user/pin', {
        method: 'POST',
        body: JSON.stringify({ pin })
      });
      setLoading(false);
      if (res.ok) {
        setHasPinSet(true);
        setIsHiddenModeActive(true);
        onSuccess();
      } else {
        setError('Failed to set PIN');
      }
      return;
    }

    if (mode === 'ENTER') {
      if (pin.length !== 4) return setError('PIN must be 4 digits');
      setLoading(true);
      const res = await fetch(`/api/user/pin?pin=${pin}`);
      setLoading(false);
      if (res.ok) {
        setIsHiddenModeActive(true);
        onSuccess();
      } else {
        setError('Invalid PIN');
        setPin('');
      }
      return;
    }
    
    if (mode === 'FORGOT_OTP') {
      if (otp.length !== 6) return setError('OTP must be 6 digits');
      setMode('FORGOT_NEW');
      return;
    }
    
    if (mode === 'FORGOT_NEW') {
      if (pin.length !== 4) return setError('PIN must be 4 digits');
      setMode('FORGOT_CONFIRM');
      return;
    }
    
    if (mode === 'FORGOT_CONFIRM') {
      if (pin !== confirmPin) {
        setError('PINs do not match');
        setConfirmPin('');
        setMode('FORGOT_NEW');
        return;
      }
      setLoading(true);
      const res = await fetch('/api/user/pin/reset', {
        method: 'POST',
        body: JSON.stringify({ otp, newPin: pin })
      });
      setLoading(false);
      if (res.ok) {
        setHasPinSet(true);
        setIsHiddenModeActive(true);
        onSuccess();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to reset PIN');
        setMode('FORGOT_OTP');
      }
    }
  };

  const handleForgotPin = async () => {
    setLoading(true);
    const res = await fetch('/api/user/pin/forgot', { method: 'POST' });
    setLoading(false);
    if (res.ok) {
      setMode('FORGOT_OTP');
      setError('');
    } else {
      setError('Failed to send OTP');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#15181e] border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#1a1d24]">
          <h3 className="font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            {mode === 'ENTER' ? 'Enter PIN' : 
             mode === 'SET' || mode === 'CONFIRM' ? 'Set Hidden PIN' : 
             'Reset PIN'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          {error && <div className="mb-4 p-2 bg-red-500/10 text-red-500 text-sm rounded-lg text-center">{error}</div>}
          
          <div className="text-center mb-6">
            <p className="text-gray-400 text-sm">
              {mode === 'ENTER' && 'Enter your 4-digit PIN to unlock hidden chats.'}
              {mode === 'SET' && 'Create a 4-digit PIN for your hidden chats.'}
              {mode === 'CONFIRM' && 'Please confirm your 4-digit PIN.'}
              {mode === 'FORGOT_OTP' && 'An OTP was sent to your email. Enter it below.'}
              {mode === 'FORGOT_NEW' && 'Enter your new 4-digit PIN.'}
              {mode === 'FORGOT_CONFIRM' && 'Confirm your new 4-digit PIN.'}
            </p>
          </div>

          <div className="flex justify-center mb-6">
            {(mode === 'ENTER' || mode === 'SET' || mode === 'FORGOT_NEW') && (
              <input
                type="password"
                maxLength={4}
                value={pin}
                onChange={e => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                autoFocus
                className="w-32 text-center text-2xl tracking-widest bg-black/30 border border-white/10 rounded-xl py-3 text-white focus:outline-none focus:border-primary-500"
                placeholder="••••"
              />
            )}
            {(mode === 'CONFIRM' || mode === 'FORGOT_CONFIRM') && (
              <input
                type="password"
                maxLength={4}
                value={confirmPin}
                onChange={e => setConfirmPin(e.target.value.replace(/[^0-9]/g, ''))}
                autoFocus
                className="w-32 text-center text-2xl tracking-widest bg-black/30 border border-white/10 rounded-xl py-3 text-white focus:outline-none focus:border-primary-500"
                placeholder="••••"
              />
            )}
            {mode === 'FORGOT_OTP' && (
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                autoFocus
                className="w-48 text-center text-2xl tracking-widest bg-black/30 border border-white/10 rounded-xl py-3 text-white focus:outline-none focus:border-primary-500"
                placeholder="••••••"
              />
            )}
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary-600 hover:bg-primary-500 text-white font-bold py-2.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Continue'}
          </button>

          {mode === 'ENTER' && (
            <div className="mt-4 text-center">
              <button 
                type="button" 
                onClick={handleForgotPin}
                disabled={loading}
                className="text-sm text-gray-500 hover:text-white transition-colors"
              >
                Forgot PIN?
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
