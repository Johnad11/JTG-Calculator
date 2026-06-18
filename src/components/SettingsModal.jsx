import React, { useState, useEffect, useRef } from 'react';
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

    const [chatMessages, setChatMessages] = useState([
        {
            role: 'assistant',
            content: "Hello! I am your JTG AI Support Assistant. How can I help you today? You can ask me questions about MT5 Auto-Sync, platform calculations, user settings, or subscriptions. For complex account or billing issues, please join our Discord support community: https://discord.gg/TkP8dR74"
        }
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const chatEndRef = useRef(null);

    useEffect(() => {
        if (activeTab === 'chat') {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatMessages, isSending, activeTab]);

    const handleSendMessage = async (e, textToSend = null) => {
        if (e) e.preventDefault();
        const query = (textToSend || inputMessage).trim();
        if (!query || isSending) return;

        setInputMessage('');
        const newUserMsg = { role: 'user', content: query };
        const updatedMessages = [...chatMessages, newUserMsg];
        setChatMessages(updatedMessages);
        setIsSending(true);

        const lowercaseQuery = query.toLowerCase();
        let localReply = null;

        if (lowercaseQuery.includes('sync') || lowercaseQuery.includes('connect') || lowercaseQuery.includes('link') || lowercaseQuery.includes('ea') || lowercaseQuery.includes('expert advisor') || lowercaseQuery.includes('ex5')) {
            localReply = "To sync MT5 with your JTG Journal:\n1. Copy your private Sync Key under **Settings -> MT5 Auto-Sync** (requires active Premium PRO).\n2. Inside your PC MT5 terminal, go to **Tools -> Options -> Expert Advisors**, check 'Allow WebRequest' and add `https://jtg-journals.vercel.app`.\n3. Drag the `JTG_Journal_EA.ex5` binary onto any active chart and enter your Sync Key in the input settings.\n\nNeed detailed help? Join our Discord server: https://discord.gg/TkP8dR74";
        } else if (lowercaseQuery.includes('download') || lowercaseQuery.includes('manual') || lowercaseQuery.includes('readme')) {
            localReply = "You can download the Expert Advisor (`JTG_Journal_EA.ex5`) and setup manual directly from the **MT5 Auto-Sync** integration modal once you upgrade to Premium. For downloads, click the MT5 Auto-Sync button on the dashboard. You can also get it on our Discord: https://discord.gg/TkP8dR74";
        } else if (lowercaseQuery.includes('premium') || lowercaseQuery.includes('price') || lowercaseQuery.includes('cost') || lowercaseQuery.includes('paystack') || lowercaseQuery.includes('subscription') || lowercaseQuery.includes('pro')) {
            localReply = "JTG Premium PRO is priced at **₦800/month**, **₦2,100/quarter**, or **₦8,000/year** (new accounts get a 14-day free trial). Premium unlocks real-time MT5 auto-sync, growth charts, advanced statistics, and performance calendar ledgers. You can upgrade inside the app dashboard.";
        } else if (lowercaseQuery.includes('username') || lowercaseQuery.includes('profile') || lowercaseQuery.includes('name')) {
            localReply = "You can change your trader username under the **Profile** tab in this Settings menu. Enter your desired name, ensure availability checks pass, and click 'Update Username'.";
        } else if (lowercaseQuery.includes('reminder') || lowercaseQuery.includes('notification') || lowercaseQuery.includes('alert') || lowercaseQuery.includes('push')) {
            localReply = "To configure daily reminders, go to the **Reminders** tab in this Settings menu, toggle 'Push Notifications' on, allow browser permissions, and set your desired daily notification time.";
        } else if (lowercaseQuery.includes('discord') || lowercaseQuery.includes('support') || lowercaseQuery.includes('contact') || lowercaseQuery.includes('whatsapp')) {
            localReply = "For complex queries, billing requests, bug reports, or custom MQ5 EA modifications, please join our official Discord community: https://discord.gg/TkP8dR74. Our developer and support team are active there!";
        }

        if (localReply) {
            setTimeout(() => {
                setChatMessages(prev => [...prev, { role: 'assistant', content: localReply }]);
                setIsSending(false);
            }, 800);
            return;
        }

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ messages: updatedMessages })
            });

            if (response.ok) {
                const data = await response.json();
                setChatMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
            } else {
                setChatMessages(prev => [...prev, { 
                    role: 'assistant', 
                    content: "I'm having trouble connecting to the JTG server right now. For technical support, billing enquiries, or setting up MT5 auto-sync, please join our official Discord server: https://discord.gg/TkP8dR74" 
                }]);
            }
        } catch (err) {
            console.error("AI chat error:", err);
            setChatMessages(prev => [...prev, { 
                role: 'assistant', 
                content: "Network issue detected. Please make sure you are connected to the internet. For immediate assistance, feel free to join our Discord server: https://discord.gg/TkP8dR74" 
            }]);
        } finally {
            setIsSending(false);
        }
    };

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
                    <button
                        onClick={() => setActiveTab('chat')}
                        className={`flex-1 md:flex-initial py-3 px-4 rounded-xl text-left text-xs font-bold uppercase tracking-wider flex items-center justify-center md:justify-start gap-3 transition-all ${activeTab === 'chat' ? 'bg-jtg-green text-black shadow-lg shadow-jtg-green/10' : 'text-slate-400 hover:text-white hover:bg-jtg-blue/10'}`}
                    >
                        <Icons.Support className="w-4 h-4" />
                        <span>Chat Support</span>
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

                        {/* Chat Support Tab */}
                        {activeTab === 'chat' && (
                            <div className="flex flex-col h-full justify-between animate-fade-in">
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-1">AI Support Assistant</h3>
                                    <p className="text-xs text-slate-400">Ask questions about MT5 Sync, Calculations, or Settings.</p>
                                </div>

                                <div className="flex-1 overflow-y-auto space-y-4 pr-1 mt-4 scroll-smooth custom-scroll" style={{ maxHeight: '250px', minHeight: '200px' }}>
                                    {chatMessages.map((msg, index) => (
                                        <div key={index}>
                                            {msg.role === 'user' ? (
                                                <div className="flex justify-end animate-slide-in mb-3">
                                                    <div className="max-w-[85%] bg-gradient-to-r from-jtg-blue/40 to-jtg-blue/20 border border-jtg-blue/30 rounded-2xl rounded-tr-none px-4 py-2.5 text-slate-100 text-xs font-semibold shadow-md whitespace-pre-line leading-relaxed">
                                                        {msg.content}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col gap-2 items-start animate-slide-in mb-3">
                                                    <div className="max-w-[85%] bg-slate-900/60 border border-slate-800 rounded-2xl rounded-tl-none px-4 py-2.5 text-slate-300 text-xs font-medium shadow-md whitespace-pre-line leading-relaxed">
                                                        {msg.content}
                                                    </div>
                                                    {(msg.content.toLowerCase().includes('discord') || msg.content.includes('discord.gg')) && (
                                                        <a
                                                            href="https://discord.gg/TkP8dR74"
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="mt-1 flex items-center gap-1.5 px-3.5 py-1.5 bg-[#5865F2] hover:bg-[#4752C4] text-white text-[10px] font-bold rounded-lg transition-all w-max shadow-md shadow-[#5865F2]/10 uppercase tracking-wider animate-fade-in"
                                                        >
                                                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                                                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.873-.894.077.077 0 0 1-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 0 1 .077-.011c3.92 1.793 8.18 1.793 12.061 0a.073.073 0 0 1 .078.009c.12.099.246.195.373.289a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.078.078 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
                                                            </svg>
                                                            Join Discord Server
                                                        </a>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {isSending && (
                                        <div className="flex justify-start animate-pulse mb-3">
                                            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl rounded-tl-none px-4 py-2.5 flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={chatEndRef} />
                                </div>

                                <div className="mt-2">
                                    {/* Suggestion Chips */}
                                    <div className="flex flex-wrap gap-1.5 mb-3">
                                        <button 
                                            type="button"
                                            onClick={() => handleSendMessage(null, "How do I sync MT5?")} 
                                            className="bg-jtg-blue/10 hover:bg-jtg-blue/20 border border-jtg-blue/20 hover:border-jtg-blue/40 text-slate-300 text-[10px] px-2.5 py-1.5 rounded-full font-bold transition cursor-pointer"
                                        >
                                            How to Sync MT5?
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => handleSendMessage(null, "JTG Premium Pricing")} 
                                            className="bg-jtg-blue/10 hover:bg-jtg-blue/20 border border-jtg-blue/20 hover:border-jtg-blue/40 text-slate-300 text-[10px] px-2.5 py-1.5 rounded-full font-bold transition cursor-pointer"
                                        >
                                            Premium Price?
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => handleSendMessage(null, "How do I change my username?")} 
                                            className="bg-jtg-blue/10 hover:bg-jtg-blue/20 border border-jtg-blue/20 hover:border-jtg-blue/40 text-slate-300 text-[10px] px-2.5 py-1.5 rounded-full font-bold transition cursor-pointer"
                                        >
                                            Update Username
                                        </button>
                                    </div>

                                    {/* Input Form */}
                                    <form onSubmit={handleSendMessage} className="flex gap-2">
                                        <input
                                            type="text"
                                            value={inputMessage}
                                            onChange={e => setInputMessage(e.target.value)}
                                            placeholder="Ask a support question..."
                                            className="flex-1 bg-jtg-dark border border-jtg-blue/30 rounded-xl px-4 py-2.5 text-white text-xs font-bold outline-none focus:border-jtg-green transition-all"
                                            disabled={isSending}
                                        />
                                        <button
                                            type="submit"
                                            disabled={!inputMessage.trim() || isSending}
                                            className="bg-jtg-green hover:bg-emerald-600 disabled:bg-slate-800 disabled:opacity-50 text-black rounded-xl px-4 py-2.5 font-bold text-xs transition active:scale-95 flex items-center justify-center shrink-0"
                                        >
                                            <Icons.ArrowRight />
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    {activeTab !== 'chat' && (
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
                    )}
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
