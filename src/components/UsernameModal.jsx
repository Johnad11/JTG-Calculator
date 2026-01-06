import React, { useState, useEffect, useCallback } from 'react';
import { Icons } from './Icons';
import { db } from '../firebase';


const UsernameModal = ({ user, onUsernameSet }) => {
    const [username, setUsername] = useState('');
    const [status, setStatus] = useState('idle'); // idle, checking, available, taken, error, saving
    const [error, setError] = useState('');

    const validateUsername = (val) => {
        const regex = /^[a-zA-Z0-9_]{3,15}$/;
        if (!val) return 'Username is required';
        if (val.length < 3) return 'Minimum 3 characters';
        if (val.length > 15) return 'Maximum 15 characters';
        if (!regex.test(val)) return 'Only letters, numbers and underscores';
        return '';
    };

    const handleCheck = (e) => {
        const val = e.target.value.toLowerCase().trim();
        setUsername(val);

        const validationError = validateUsername(val);
        if (validationError) {
            setError(validationError);
            setStatus('idle');
            return;
        }
        setError('');
    };

    // Debounced uniqueness check
    useEffect(() => {
        if (username.length < 3) return;

        const validationError = validateUsername(username);
        if (validationError) return;

        setStatus('checking');
        const timer = setTimeout(async () => {
            try {
                const doc = await db.collection('usernames').doc(username).get();
                if (doc.exists) {
                    setStatus('taken');
                    setError('Username already taken');
                } else {
                    setStatus('available');
                }
            } catch (err) {
                console.error("Firestore Check Error:", err);
                setStatus('error');
                setError(`Error checking availability: ${err.message || 'Permission denied'}`);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [username]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (status !== 'available') return;

        setStatus('saving');
        try {
            const batch = db.batch();

            // 1. Create entry in usernames collection for uniqueness
            const usernameRef = db.collection('usernames').doc(username);
            batch.set(usernameRef, { uid: user.uid });

            // 2. Update user_settings with the username
            const settingsRef = db.collection('user_settings').doc(user.uid);
            batch.set(settingsRef, { username: username }, { merge: true });

            await batch.commit();
            onUsernameSet(username);
        } catch (err) {
            console.error(err);
            setStatus('available');
            setError('Failed to save username. Try again.');
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl p-6">
            <div className="bg-jtg-dark border-2 border-jtg-blue/30 p-8 rounded-3xl shadow-[0_0_50px_rgba(22,44,153,0.3)] max-w-md w-full animate-pop">
                <div className="flex flex-col items-center text-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-tr from-jtg-blue to-jtg-green rounded-2xl flex items-center justify-center mb-6 shadow-lg rotate-3 group-hover:rotate-6 transition-transform">
                        <Icons.User className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-3xl font-black text-white mb-2 tracking-tight">SET YOUR IDENTITY</h2>
                    <p className="text-slate-400 text-sm">Choose a unique username for your trade share cards.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="relative">
                        <label className="text-[10px] font-bold text-jtg-green uppercase tracking-widest mb-2 block">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={handleCheck}
                            placeholder="e.g. pips_master"
                            className={`w-full bg-jtg-input border-2 ${error ? 'border-red-500/50' : status === 'available' ? 'border-jtg-green/50' : 'border-jtg-blue/20'} rounded-xl p-4 text-white font-bold outline-none transition-all focus:border-jtg-green shadow-inner`}
                            autoFocus
                        />
                        <div className="absolute right-4 bottom-4">
                            {status === 'checking' && <div className="w-5 h-5 border-2 border-jtg-green border-t-transparent rounded-full animate-spin"></div>}
                            {status === 'available' && <Icons.Check className="w-5 h-5 text-jtg-green" />}
                            {(status === 'taken' || error) && <Icons.X className="w-5 h-5 text-red-500" />}
                        </div>
                    </div>

                    {error && <p className="text-red-500 text-xs font-bold text-center animate-shake">{error}</p>}
                    {status === 'available' && <p className="text-jtg-green text-xs font-bold text-center">Username is available!</p>}

                    <button
                        type="submit"
                        disabled={status !== 'available'}
                        className={`w-full py-4 rounded-xl font-black text-sm tracking-widest transition-all shadow-xl flex items-center justify-center gap-3 ${status === 'available'
                            ? 'bg-gradient-to-r from-jtg-green to-emerald-500 text-black hover:scale-[1.02] hover:shadow-jtg-green/20'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                            }`}
                    >
                        {status === 'saving' ? (
                            <>
                                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                                SECURING IDENTITY...
                            </>
                        ) : (
                            <>
                                <Icons.Check className="w-5 h-5" />
                                CONFIRM USERNAME
                            </>
                        )}
                    </button>

                    <p className="text-[10px] text-slate-500 text-center uppercase font-bold tracking-tighter">
                        Note: This is permanent and used for verified trade sharing.
                    </p>
                </form>
            </div>
        </div>
    );
};

export default UsernameModal;
