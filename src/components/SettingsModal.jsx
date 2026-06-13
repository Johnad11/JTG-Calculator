import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';
import { db } from '../firebase';

const SettingsModal = ({
    user,
    username,
    setUsername,
    isPremium,
    close,
    logout,
    remindersEnabled,
    setRemindersEnabled,
    reminderTime,
    setReminderTime,
    startTour
}) => {
    const [activeTab, setActiveTab] = useState('profile');
    const [newUsername, setNewUsername] = useState(username || '');
    const [status, setStatus] = useState('idle'); // idle, checking, available, taken, error, saving
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [permissionStatus, setPermissionStatus] = useState(
        'Notification' in window ? Notification.permission : 'unsupported'
    );

    const validateUsername = (val) => {
        const regex = /^[a-zA-Z0-9_]{3,15}$/;
        if (!val) return 'Username is required';
        if (val.length < 3) return 'Minimum 3 characters';
        if (val.length > 15) return 'Maximum 15 characters';
        if (!regex.test(val)) return 'Only letters, numbers and underscores';
        return '';
    };

    const handleUsernameChange = (e) => {
        const val = e.target.value.toLowerCase().trim();
        setNewUsername(val);
        setSuccessMessage('');

        if (val === username) {
            setError('');
            setStatus('idle');
            return;
        }

        const validationError = validateUsername(val);
        if (validationError) {
            setError(validationError);
            setStatus('idle');
            return;
        }
        setError('');
    };

    // Debounced uniqueness check for username edit
    useEffect(() => {
        if (newUsername.length < 3 || newUsername === username) return;

        const validationError = validateUsername(newUsername);
        if (validationError) return;

        setStatus('checking');
        const timer = setTimeout(async () => {
            try {
                const doc = await db.collection('usernames').doc(newUsername).get();
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
    }, [newUsername, username]);

    const handleSaveUsername = async (e) => {
        e.preventDefault();
        if (newUsername === username) return;
        if (status !== 'available') return;

        setStatus('saving');
        try {
            // 1. Create entry in usernames collection first
            const newUsernameRef = db.collection('usernames').doc(newUsername);
            await newUsernameRef.set({ uid: user.uid });

            // 2. Update user_settings
            const settingsRef = db.collection('user_settings').doc(user.uid);
            await settingsRef.set({ username: newUsername }, { merge: true });

            // 3. Delete old username (non-blocking, handled separately to prevent rules failure from reverting settings)
            if (username) {
                try {
                    const oldUsernameRef = db.collection('usernames').doc(username);
                    const oldDoc = await oldUsernameRef.get();
                    if (oldDoc.exists) {
                        await oldUsernameRef.delete();
                    }
                } catch (deleteErr) {
                    console.warn("Could not delete old username document:", deleteErr);
                }
            }

            setUsername(newUsername);
            setSuccessMessage('Username updated successfully!');
            setStatus('idle');
        } catch (err) {
            console.error("Save Username Error:", err);
            setStatus('available');
            setError('Failed to save username. Try again.');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="relative w-full max-w-2xl bg-jtg-dark border border-jtg-blue/30 rounded-3xl shadow-[0_0_50px_rgba(22,44,153,0.3)] overflow-hidden animate-pop flex flex-col md:flex-row h-[550px] max-h-[90vh]">
                
                {/* Left tab sidebar */}
                <div className="w-full md:w-48 bg-jtg-blue/5 border-b md:border-b-0 md:border-r border-jtg-blue/20 p-4 flex flex-row md:flex-col gap-2 shrink-0 overflow-x-auto no-scrollbar">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`flex-1 md:flex-initial py-3 px-4 rounded-xl text-left text-xs font-bold uppercase tracking-wider flex items-center justify-center md:justify-start gap-3 transition-all ${activeTab === 'profile' ? 'bg-jtg-green text-black shadow-lg shadow-jtg-green/10' : 'text-slate-400 hover:text-white hover:bg-jtg-blue/10'}`}
                    >
                        <Icons.User className="w-4 h-4" />
                        <span>Profile</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('reminders')}
                        className={`flex-1 md:flex-initial py-3 px-4 rounded-xl text-left text-xs font-bold uppercase tracking-wider flex items-center justify-center md:justify-start gap-3 transition-all ${activeTab === 'reminders' ? 'bg-jtg-green text-black shadow-lg shadow-jtg-green/10' : 'text-slate-400 hover:text-white hover:bg-jtg-blue/10'}`}
                    >
                        <Icons.Clock className="w-4 h-4" />
                        <span>Reminders</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('system')}
                        className={`flex-1 md:flex-initial py-3 px-4 rounded-xl text-left text-xs font-bold uppercase tracking-wider flex items-center justify-center md:justify-start gap-3 transition-all ${activeTab === 'system' ? 'bg-jtg-green text-black shadow-lg shadow-jtg-green/10' : 'text-slate-400 hover:text-white hover:bg-jtg-blue/10'}`}
                    >
                        <Icons.Settings className="w-4 h-4" />
                        <span>System</span>
                    </button>
                </div>

                {/* Right content area */}
                <div className="flex-1 p-6 md:p-8 flex flex-col justify-between overflow-y-auto custom-scroll relative">
                    
                    {/* Close Button */}
                    <button onClick={close} className="absolute top-6 right-6 p-1 text-slate-400 hover:text-white transition-colors" aria-label="Close Settings">
                        <Icons.X className="w-5 h-5" />
                    </button>

                    <div className="flex-1">
                        {/* Profile Tab */}
                        {activeTab === 'profile' && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-1">Identity Settings</h3>
                                    <p className="text-xs text-slate-400">Manage your credentials and trader profile info.</p>
                                </div>

                                <div className="space-y-4">
                                    {/* Email display */}
                                    <div className="bg-jtg-input/40 border border-jtg-blue/20 rounded-xl p-4">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Google Account</label>
                                        <span className="text-sm text-slate-300 font-medium break-all">{user?.email}</span>
                                    </div>

                                    {/* Username form */}
                                    <form onSubmit={handleSaveUsername} className="bg-jtg-input/40 border border-jtg-blue/20 rounded-xl p-4 space-y-4">
                                        <div>
                                            <label className="text-[10px] font-bold text-jtg-green uppercase tracking-widest block mb-2">Trader Username</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={newUsername}
                                                    onChange={handleUsernameChange}
                                                    placeholder="Enter username"
                                                    className={`w-full bg-jtg-dark border ${error ? 'border-red-500/50' : status === 'available' ? 'border-jtg-green/50' : 'border-jtg-blue/30'} rounded-lg p-3 text-white text-sm font-bold outline-none focus:border-jtg-green transition-all`}
                                                />
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                    {status === 'checking' && <div className="w-4 h-4 border-2 border-jtg-green border-t-transparent rounded-full animate-spin"></div>}
                                                    {status === 'available' && <Icons.Check className="w-4 h-4 text-jtg-green" />}
                                                    {(status === 'taken' || error) && <Icons.X className="w-4 h-4 text-red-500" />}
                                                </div>
                                            </div>
                                        </div>

                                        {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
                                        {status === 'available' && <p className="text-jtg-green text-xs font-bold">Username is available!</p>}
                                        {successMessage && <p className="text-jtg-green text-xs font-bold">{successMessage}</p>}

                                        <button
                                            type="submit"
                                            disabled={newUsername === username || status !== 'available'}
                                            className={`w-full py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                                                newUsername !== username && status === 'available'
                                                    ? 'bg-jtg-green hover:bg-emerald-600 text-white'
                                                    : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                                            }`}
                                        >
                                            {status === 'saving' ? 'Saving Username...' : 'Update Username'}
                                        </button>
                                    </form>

                                    {/* Account Level */}
                                    <div className="flex justify-between items-center bg-jtg-input/40 border border-jtg-blue/20 rounded-xl p-4">
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Subscription status</span>
                                            <span className="text-sm text-white font-bold">{isPremium ? 'JTG Premium PRO' : 'Free Trial/Basic'}</span>
                                        </div>
                                        {isPremium ? (
                                            <span className="bg-[#1BA657]/20 border border-[#1BA657]/50 text-[#1BA657] text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">PRO MEMBER</span>
                                        ) : (
                                            <span className="bg-slate-800 text-slate-400 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">FREE TIER</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Reminders Tab */}
                        {activeTab === 'reminders' && (
                            <div className="space-y-6 animate-fade-in">
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-1">Daily Reminders</h3>
                                    <p className="text-xs text-slate-400">Configure daily logging reminders to build a journaling habit.</p>
                                </div>

                                <div className="space-y-5 bg-jtg-input/40 border border-jtg-blue/20 rounded-2xl p-6">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <span className="text-sm font-bold text-white block mb-0.5">Push Notifications</span>
                                            <span className="text-xs text-slate-400">Get prompted to log your trading logs daily.</span>
                                        </div>
                                        <button
                                            onClick={async () => {
                                                if (!remindersEnabled) {
                                                    if (!('Notification' in window)) {
                                                        alert("This browser does not support desktop notifications.");
                                                        return;
                                                    }
                                                    let currentPermission = Notification.permission;
                                                    if (currentPermission === 'default') {
                                                        currentPermission = await Notification.requestPermission();
                                                        setPermissionStatus(currentPermission);
                                                    }
                                                    
                                                    if (currentPermission === 'granted') {
                                                        setRemindersEnabled(true);
                                                    } else {
                                                        alert("Notification permission denied. Please allow notifications in your browser settings to receive reminders.");
                                                    }
                                                } else {
                                                    setRemindersEnabled(false);
                                                }
                                            }}
                                            className={`w-12 h-6 rounded-full transition-all duration-300 relative border ${remindersEnabled ? 'bg-jtg-green border-jtg-green' : 'bg-slate-800 border-slate-700'}`}
                                            aria-label="Toggle Reminders"
                                        >
                                            <div className={`w-4 h-4 rounded-full bg-white absolute top-1/2 -translate-y-1/2 transition-all duration-300 ${remindersEnabled ? 'left-7' : 'left-1'}`}></div>
                                        </button>
                                    </div>

                                    {permissionStatus === 'denied' && (
                                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-500 text-xs font-bold uppercase tracking-wider">
                                            ⚠️ Notifications are blocked in this browser. Please enable permissions in your site settings to receive reminders.
                                        </div>
                                    )}

                                    {remindersEnabled && (
                                        <div className="pt-4 border-t border-jtg-blue/10 animate-slide-in">
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Reminder Trigger Time</label>
                                                <input
                                                    type="time"
                                                    value={reminderTime}
                                                    onChange={e => setReminderTime(e.target.value)}
                                                    className="bg-jtg-dark border border-jtg-blue/30 rounded-lg p-3 text-white text-sm font-bold outline-none focus:border-jtg-green"
                                                />
                                                <p className="text-[10px] text-slate-500 font-bold uppercase mt-3">Trigger time is set to your device's local time.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* System Settings Tab */}
                        {activeTab === 'system' && (
                            <div className="space-y-6 animate-fade-in">
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-1">System Utilities</h3>
                                    <p className="text-xs text-slate-400">Onboarding, support, and session configuration options.</p>
                                </div>

                                <div className="space-y-4">
                                    {/* Tour Button */}
                                    <button
                                        onClick={() => {
                                            close();
                                            setTimeout(() => startTour(), 300);
                                        }}
                                        className="w-full bg-jtg-input/40 border border-jtg-blue/20 hover:border-jtg-blue/40 rounded-xl p-4 flex justify-between items-center transition group text-left"
                                    >
                                        <div>
                                            <span className="text-sm font-bold text-white block mb-0.5">Interactive Tour</span>
                                            <span className="text-xs text-slate-400">Replay the platform interactive guide.</span>
                                        </div>
                                        <div className="text-slate-400 group-hover:text-white transition"><Icons.ChevronRight /></div>
                                    </button>

                                    {/* WhatsApp Support */}
                                    <button
                                        onClick={() => window.open('https://chat.whatsapp.com/Dasf32dLxyQHny6eUADTHg', '_blank')}
                                        className="w-full bg-jtg-input/40 border border-jtg-blue/20 hover:border-jtg-blue/40 rounded-xl p-4 flex justify-between items-center transition group text-left"
                                    >
                                        <div>
                                            <span className="text-sm font-bold text-white block mb-0.5">Customer Support</span>
                                            <span className="text-xs text-slate-400">Join our WhatsApp support community for direct queries.</span>
                                        </div>
                                        <div className="text-slate-400 group-hover:text-white transition"><Icons.ChevronRight /></div>
                                    </button>

                                    {/* JTG Ecosystem website link */}
                                    <button
                                        onClick={() => window.open('https://jtg-ecosystem.vercel.app/', '_blank')}
                                        className="w-full bg-jtg-input/40 border border-jtg-blue/20 hover:border-jtg-blue/40 rounded-xl p-4 flex justify-between items-center transition group text-left"
                                    >
                                        <div>
                                            <span className="text-sm font-bold text-white block mb-0.5">Visit Ecosystem Website</span>
                                            <span className="text-xs text-slate-400">Head back to the main JTG Ecosystem landing page.</span>
                                        </div>
                                        <div className="text-slate-400 group-hover:text-white transition"><Icons.ChevronRight /></div>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-8 pt-4 border-t border-jtg-blue/10 flex justify-between items-center">
                        <button
                            onClick={logout}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 rounded-xl px-4 py-2.5 text-xs font-bold transition active:scale-95 flex items-center gap-2"
                        >
                            <span>LOGOUT SESSION</span>
                        </button>
                        <button
                            onClick={close}
                            className="bg-slate-800 hover:bg-slate-700 text-white rounded-xl px-6 py-2.5 text-xs font-bold transition active:scale-95"
                        >
                            CLOSE
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
