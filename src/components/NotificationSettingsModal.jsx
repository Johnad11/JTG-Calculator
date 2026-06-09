import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';

const NotificationSettingsModal = ({
    close,
    remindersEnabled,
    setRemindersEnabled,
    reminderTime,
    setReminderTime,
    user
}) => {
    const [permissionStatus, setPermissionStatus] = useState(
        typeof window !== 'undefined' ? Notification.permission : 'default'
    );
    const [isRequesting, setIsRequesting] = useState(false);

    useEffect(() => {
        // Keep permission status up to date
        if ('Notification' in window) {
            setPermissionStatus(Notification.permission);
        }
    }, []);

    const requestPermission = async () => {
        if (!('Notification' in window)) {
            alert('This browser does not support desktop notifications.');
            return;
        }

        setIsRequesting(true);
        try {
            const permission = await Notification.requestPermission();
            setPermissionStatus(permission);
            if (permission === 'granted') {
                setRemindersEnabled(true);
            } else if (permission === 'denied') {
                setRemindersEnabled(false);
            }
        } catch (error) {
            console.error('Error requesting notification permission:', error);
        } finally {
            setIsRequesting(false);
        }
    };

    const handleToggleReminders = (e) => {
        const checked = e.target.checked;
        if (checked && permissionStatus !== 'granted') {
            requestPermission();
        } else {
            setRemindersEnabled(checked);
        }
    };

    const triggerTestNotification = () => {
        if (permissionStatus !== 'granted') {
            alert('Please grant notification permission first!');
            return;
        }

        // 1. Try via Service Worker if registered and active
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: 'TEST_NOTIFICATION'
            });
        } else {
            // 2. Fallback to direct client-side Notification
            new Notification('JTG FX Journal', {
                body: 'Notification system is working! Don\'t forget to log your trades daily.',
                icon: '/logo.png',
                badge: '/logo.png',
                tag: 'journal-reminder-test'
            });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-jtg-dark border border-jtg-green/30 w-full max-w-md rounded-xl shadow-2xl overflow-hidden flex flex-col relative animate-pop">
                
                {/* Header */}
                <div className="bg-jtg-green/10 p-4 border-b border-jtg-green/20 flex justify-between items-center">
                    <h2 className="text-white font-bold text-lg flex items-center gap-2">
                        <Icons.Clock className="text-jtg-green" /> Daily Reminders
                    </h2>
                    <button onClick={close} className="text-slate-400 hover:text-white transition">
                        <Icons.X />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col gap-5">
                    
                    {/* Status Alert Badge */}
                    <div className="bg-jtg-blue/10 rounded-xl p-4 border border-jtg-blue/20 flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Browser Permission:</span>
                            {permissionStatus === 'granted' ? (
                                <span className="bg-jtg-green/20 text-jtg-green border border-jtg-green/30 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                                    <Icons.Check className="w-2.5 h-2.5" /> Active
                                </span>
                            ) : permissionStatus === 'denied' ? (
                                <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest">
                                    Blocked
                                </span>
                            ) : (
                                <span className="bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest">
                                    Not Requested
                                </span>
                            )}
                        </div>

                        {permissionStatus === 'denied' && (
                            <p className="text-[11px] text-red-400/80 leading-relaxed mt-1">
                                ⚠️ Notifications are blocked in your browser settings. To receive daily reminders, please go to your browser site settings and change the permission for this site to "Allow".
                            </p>
                        )}
                        {permissionStatus === 'default' && (
                            <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                                We will ask for your browser's notification permission when you enable daily reminders.
                            </p>
                        )}
                        {permissionStatus === 'granted' && (
                            <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                                Notifications are authorized! You will receive daily reminder notifications even if the tab is inactive.
                            </p>
                        )}
                    </div>

                    {/* Reminders Toggle Switch */}
                    <div className="flex justify-between items-center p-3 rounded-lg bg-jtg-blue/5 border border-jtg-blue/10">
                        <div>
                            <span className="font-semibold text-white block text-sm">Enable Reminders</span>
                            <span className="text-[11px] text-slate-500">Remind me not to forget to log my trades.</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={remindersEnabled}
                                onChange={handleToggleReminders}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-jtg-green peer-checked:after:bg-white peer-checked:after:border-white"></div>
                        </label>
                    </div>

                    {/* Time Input Config */}
                    {remindersEnabled && (
                        <div className="animate-fade-in flex flex-col gap-2">
                            <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block">
                                Preferred Reminder Time:
                            </label>
                            <div className="relative">
                                <input
                                    type="time"
                                    value={reminderTime}
                                    onChange={(e) => setReminderTime(e.target.value)}
                                    className="w-full bg-jtg-input border border-jtg-blue/40 rounded-lg p-3 text-white text-sm outline-none focus:border-jtg-green transition-all"
                                />
                            </div>
                            <span className="text-[10px] text-slate-500">
                                Set your daily log time. Reminders will trigger at this time local to your device.
                            </span>
                        </div>
                    )}

                    {/* Test Button & Actions */}
                    <div className="flex gap-3 mt-4 pt-4 border-t border-jtg-blue/20">
                        {permissionStatus === 'granted' && (
                            <button
                                type="button"
                                onClick={triggerTestNotification}
                                className="flex-1 py-3 bg-jtg-blue/20 border border-jtg-blue/50 text-white rounded-lg hover:bg-jtg-blue/30 transition text-xs font-bold uppercase tracking-wider"
                            >
                                Send Test Push
                            </button>
                        )}
                        
                        {permissionStatus !== 'granted' && permissionStatus !== 'denied' && (
                            <button
                                type="button"
                                onClick={requestPermission}
                                disabled={isRequesting}
                                className="flex-1 py-3 bg-jtg-green text-black rounded-lg hover:bg-green-400 transition text-xs font-bold uppercase tracking-wider"
                            >
                                {isRequesting ? 'Authorizing...' : 'Grant Access'}
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={close}
                            className="flex-1 py-3 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition text-xs font-bold uppercase tracking-wider"
                        >
                            Done
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotificationSettingsModal;
