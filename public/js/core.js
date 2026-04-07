// Common UI and Logic
const UI = {
    renderStats(containerId, stats) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = `
            <div class="stats-grid">
                ${stats.map(s => `
                    <div class="stat-card">
                        <h4>${escapeHtml(s.label)}</h4>
                        <div class="value">${escapeHtml(s.value)}</div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    isEmbeddable(url) {
        if (!url) return true;
        const restricted = ['meet.google.com', 'zoom.us', 'teams.microsoft.com', 'webex.com'];
        return !restricted.some(domain => url.toLowerCase().includes(domain));
    },

    showMeetingChoice(url = '') {
        return new Promise((resolve) => {
            const embeddable = this.isEmbeddable(url);
            const backdrop = document.createElement('div');
            backdrop.className = 'modal-backdrop';
            backdrop.style.display = 'flex';
            backdrop.innerHTML = `
                <div class="modal" style="max-width:400px; text-align:center">
                    <h3>Join Meeting</h3>
                    <p class="small">${embeddable ? 'How would you like to open this meeting?' : 'This meeting provider does not allow embedding. Please open in a new tab.'}</p>
                    <div class="flex-column gap-10 mt-20">
                        ${embeddable ? '<button class="button" id="choiceApp">Open in App (Embed)</button>' : ''}
                        <button class="button ${embeddable ? 'secondary' : ''}" id="choiceTab">Open in New Tab</button>
                        <button class="button danger small" id="choiceCancel">Cancel</button>
                    </div>
                </div>
            `;
            document.body.appendChild(backdrop);

            const cleanup = (val) => {
                backdrop.remove();
                resolve(val);
            };

            if (embeddable) document.getElementById('choiceApp').onclick = () => cleanup('app');
            document.getElementById('choiceTab').onclick = () => cleanup('tab');
            document.getElementById('choiceCancel').onclick = () => cleanup(null);
        });
    },

    showNotification(message, type = 'info') {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.animation = 'toastOut 0.3s ease forwards';
                setTimeout(() => toast.remove(), 3000);
            }
        }, 3000);
    },

    alert(message, title = 'Notification') {
        return new Promise((resolve) => {
            const backdrop = document.createElement('div');
            backdrop.className = 'modal-backdrop';
            backdrop.style.display = 'flex';
            backdrop.innerHTML = `
                <div class="modal" style="max-width:400px; text-align:center">
                    <h3>${escapeHtml(title)}</h3>
                    <p style="margin: 20px 0; line-height: 1.5">${escapeHtml(message).replace(/\n/g, '<br>')}</p>
                    <button class="button" id="alertOk">OK</button>
                </div>
            `;
            document.body.appendChild(backdrop);
            document.getElementById('alertOk').onclick = () => {
                backdrop.remove();
                resolve();
            };
        });
    },

    confirm(message, title = 'Confirm Action') {
        return new Promise((resolve) => {
            const backdrop = document.createElement('div');
            backdrop.className = 'modal-backdrop';
            backdrop.style.display = 'flex';
            backdrop.innerHTML = `
                <div class="modal" style="max-width:400px; text-align:center">
                    <h3>${escapeHtml(title)}</h3>
                    <p style="margin: 20px 0; line-height: 1.5">${escapeHtml(message).replace(/\n/g, '<br>')}</p>
                    <div class="flex gap-10">
                        <button class="button danger" id="confirmYes">Yes</button>
                        <button class="button secondary" id="confirmNo">Cancel</button>
                    </div>
                </div>
            `;
            document.body.appendChild(backdrop);
            document.getElementById('confirmYes').onclick = () => {
                backdrop.remove();
                resolve(true);
            };
            document.getElementById('confirmNo').onclick = () => {
                backdrop.remove();
                resolve(false);
            };
        });
    },

    prompt(message, title = 'Input Required') {
        return new Promise((resolve) => {
            const backdrop = document.createElement('div');
            backdrop.className = 'modal-backdrop';
            backdrop.style.display = 'flex';
            backdrop.innerHTML = `
                <div class="modal" style="max-width:400px; text-align:center">
                    <h3>${escapeHtml(title)}</h3>
                    <p style="margin: 10px 0">${escapeHtml(message)}</p>
                    <input type="text" id="promptInput" class="input" style="margin-bottom:20px">
                    <div class="flex gap-10">
                        <button class="button" id="promptOk">OK</button>
                        <button class="button secondary" id="promptCancel">Cancel</button>
                    </div>
                </div>
            `;
            document.body.appendChild(backdrop);
            const input = document.getElementById('promptInput');
            input.focus();
            document.getElementById('promptOk').onclick = () => {
                const val = input.value;
                backdrop.remove();
                resolve(val);
            };
            document.getElementById('promptCancel').onclick = () => {
                backdrop.remove();
                resolve(null);
            };
            input.onkeypress = (e) => {
                if (e.key === 'Enter') document.getElementById('promptOk').click();
            };
        });
    },

    viewFile(url, title) {
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop';
        backdrop.style.display = 'flex';
        backdrop.innerHTML = `
            <div class="modal" style="width:90%; max-width:1000px; height:90vh; display:flex; flex-direction:column">
                <div class="flex-between mb-10">
                    <h3 class="m-0">${escapeHtml(title)}</h3>
                    <button class="button secondary w-auto small" onclick="this.closest('.modal-backdrop').remove()">Close</button>
                </div>
                <div style="flex:1; background:#f0f0f0; border-radius:8px; overflow:hidden">
                    <iframe src="${escapeAttr(url)}" style="width:100%; height:100%; border:none"></iframe>
                </div>
            </div>
        `;
        document.body.appendChild(backdrop);
    }
};

// Security and Maintenance Manager
const SecurityManager = {
    _channels: [],
    _initialized: false,

    init() {
        if (this._initialized) return;
        this._initialized = true;

        const user = SessionManager.getCurrentUserSync();
        if (!user) return;

        // 1. Monitor system maintenance status
        const maintChannel = SupabaseDB.subscribe('maintenance', () => updateMaintBanner());
        this._channels.push(maintChannel);

        // 2. Monitor current user's account status (active, flagged, locked, etc.)
        const userChannel = SupabaseDB.subscribe('users', (payload) => {
            const fresh = payload.new;
            if (!fresh) return;

            const isRestricted = !fresh.active || fresh.flagged || isAccountLocked(fresh);
            if (isRestricted) {
                this.forceLogout('Your account status has changed.');
            }
        }, `email=eq.${user.email}`);
        this._channels.push(userChannel);
    },

    async forceLogout(msg) {
        await SessionManager.clearCurrentUser();
        if (!window.location.href.includes('index.html')) {
            await UI.alert(msg + ' Logging out.', 'Security Alert');
            window.location.href = 'index.html';
        }
    },

    stop() {
        this._channels.forEach(c => SupabaseDB.unsubscribe(c));
        this._channels = [];
        this._initialized = false;
    }
};

// Global init for all dashboards
async function initDashboard(role) {
    // 1. Initialize UI interactions immediately
    const toggle = document.getElementById('sidebarToggle');
    if (toggle) {
        // Use a persistent listener to avoid issues with cloning if called multiple times
        if (!toggle.hasAttribute('data-listener')) {
            toggle.setAttribute('data-listener', 'true');
            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                if (window.innerWidth <= 1024) {
                    document.body.classList.toggle('sidebar-open');
                } else {
                    document.body.classList.toggle('sidebar-collapsed');
                }
            });
        }
    }

    if (!document.documentElement.hasAttribute('data-global-click')) {
        document.documentElement.setAttribute('data-global-click', 'true');
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 1024 && document.body.classList.contains('sidebar-open')) {
                const sidebar = document.querySelector('.sidebar, aside');
                if (sidebar && !sidebar.contains(e.target)) {
                    document.body.classList.remove('sidebar-open');
                }
            }
        });
    }

    const navButtons = document.querySelectorAll('nav button');
    navButtons.forEach(btn => {
        if (!btn.hasAttribute('data-listener')) {
            btn.setAttribute('data-listener', 'true');
            btn.addEventListener('click', () => {
                if (window.innerWidth <= 1024) {
                    document.body.classList.remove('sidebar-open');
                }
            });
        }
    });

    // 2. Auth checks
    const user = await SessionManager.getCurrentUser();

    // Start managers if user is logged in
    if (user) {
        IdleManager.init();
        NotificationManager.initPolling();
        SecurityManager.init();
    }

    if (!user || user.role !== role) {
        if (!window.location.href.includes('index.html')) {
            await UI.alert(`Please login as a ${role}`, 'Auth Error');
            window.location.href = 'index.html';
        }
        return null;
    }

    // Enforce account restrictions
    try {
        const freshUser = await SupabaseDB.getUser(user.email);
        if (!freshUser || !freshUser.active || freshUser.flagged || isAccountLocked(freshUser)) {
            let msg = 'Access denied.';
            if (!freshUser) msg = 'Account not found.';
            else if (!freshUser.active) msg = 'Your account has been deactivated.';
            else if (freshUser.flagged) msg = 'Your account is flagged for suspicious activities.';
            else if (isAccountLocked(freshUser)) msg = 'Your account is temporarily locked.';

            await UI.alert(msg + ' Logging out.', 'Security Alert');
            await SessionManager.clearCurrentUser();
            window.location.href = 'index.html';
            return null;
        }

        // Force password change if reset is approved but not yet completed
        if (freshUser.reset_request && freshUser.reset_request.status === 'approved') {
            await UI.alert('You must change your password before continuing.', 'Action Required');
            window.location.href = 'index.html';
            return null;
        }
    } catch (e) {
        console.warn('Initial restriction check failed, will retry in background polling.', e);
    }

    return user;
}

// Register Service Worker (only on supported protocols like https or http://localhost)
if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
    });
}

// Request notification permission
async function requestNotificationPermission() {
    if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
        }
    }
}

// PWA Install Logic
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later.
    deferredPrompt = e;

    // Show a custom install button or banner after 10 seconds of active interaction
    // We check if it's the first time in the current session
    if (!sessionStorage.getItem('installPromptShown')) {
        setTimeout(() => {
            if (deferredPrompt) {
                const toastId = 'pwa-install-toast';
                if (document.getElementById(toastId)) return;

                let container = document.getElementById('toast-container');
                if (!container) {
                    container = document.createElement('div');
                    container.id = 'toast-container';
                    container.className = 'toast-container';
                    document.body.appendChild(container);
                }

                const toast = document.createElement('div');
                toast.id = toastId;
                toast.className = 'toast info';
                toast.style.cursor = 'pointer';
                toast.textContent = 'Install SmartLMS App for offline access and a better experience! Tap here to install.';
                container.appendChild(toast);

                sessionStorage.setItem('installPromptShown', 'true');

                toast.onclick = async () => {
                    // Show the install prompt
                    deferredPrompt.prompt();
                    // Wait for the user to respond to the prompt
                    const { outcome } = await deferredPrompt.userChoice;
                    // We've used the prompt, and can't use it again, throw it away
                    deferredPrompt = null;
                    toast.remove();
                };

                // Auto-remove toast after 10s if not clicked
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.style.animation = 'toastOut 0.3s ease forwards';
                        setTimeout(() => toast.remove(), 3000);
                    }
                }, 10000);
            }
        }, 10000);
    }
});

window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
});

// Global notification system
const NotificationManager = {
    _subscribed: false,
    _channels: [],

    async fetchNotifications() {
        try {
            const user = await SessionManager.getCurrentUser();
            if (!user) return [];

            // 1. Fetch personal notifications and active broadcasts
            const [personal, broadcasts, enrollments] = await Promise.all([
                SupabaseDB.getNotifications(user.email),
                SupabaseDB.getBroadcasts(),
                user.role === 'student' ? SupabaseDB.getEnrollments(user.email) : Promise.resolve([])
            ]);

            const enrolledCourseIds = enrollments.map(e => e.course_id);

            // 2. Filter broadcasts based on relevance and recency (e.g. last 14 days)
            const recentDate = new Date();
            recentDate.setDate(recentDate.getDate() - 14);

            const relevantBroadcasts = broadcasts.filter(b => {
                // Check recency
                if (new Date(b.created_at) < recentDate) return false;
                // If course-specific, must be enrolled
                if (b.course_id && !enrolledCourseIds.includes(b.course_id)) return false;
                // If role-specific, must match role
                if (b.target_role && b.target_role !== user.role) return false;
                return true;
            });

            // 3. Filter out cleared broadcasts
            const clearedBroadcasts = JSON.parse(localStorage.getItem(`cleared_broadcasts_${user.email}`) || '[]');
            const filteredBroadcasts = relevantBroadcasts.filter(b => !clearedBroadcasts.includes(b.id));

            // 4. Mark broadcasts as "read" locally using localStorage
            const readBroadcasts = JSON.parse(localStorage.getItem(`read_broadcasts_${user.email}`) || '[]');
            const mappedBroadcasts = filteredBroadcasts.map(b => ({
                ...b,
                is_read: readBroadcasts.includes(b.id),
                is_broadcast: true
            }));

            // 5. Combine and sort
            return [...personal, ...mappedBroadcasts].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        } catch (e) {
            console.warn('Failed to fetch notifications:', e);
            return [];
        }
    },

    async getPreferences() {
        const user = await SessionManager.getCurrentUser();
        if (!user) return { email: true, push: true, inApp: true };
        const fresh = await SupabaseDB.getUser(user.email);
        return fresh?.notification_preferences || { email: true, push: true, inApp: true };
    },

    async updatePreferences(prefs) {
        const user = await SessionManager.getCurrentUser();
        if (!user) return;
        const fresh = await SupabaseDB.getUser(user.email);
        await SupabaseDB.saveUser({ ...fresh, notification_preferences: prefs });
        UI.showNotification('Notification preferences updated.');
    },

    async markAllAsRead() {
        const user = await SessionManager.getCurrentUser();
        if (!user) return;

        const notifications = await this.fetchNotifications();

        // Mark personal notifications in DB
        await SupabaseDB.markNotificationsAsRead(user.email);

        // Mark broadcasts in localStorage
        const broadcastIds = notifications.filter(n => n.is_broadcast).map(n => n.id);
        const readBroadcasts = JSON.parse(localStorage.getItem(`read_broadcasts_${user.email}`) || '[]');
        const updatedRead = [...new Set([...readBroadcasts, ...broadcastIds])];
        localStorage.setItem(`read_broadcasts_${user.email}`, JSON.stringify(updatedRead));

        this.updateUI();
    },

    async clearAll() {
        const user = await SessionManager.getCurrentUser();
        if (!user) return;
        if (!await UI.confirm('Are you sure you want to clear all notifications?', 'Clear Notifications')) return;

        try {
            // 1. Physically delete personal notifications from DB
            await SupabaseDB.deleteNotifications(user.email);

            // 2. Clear visible broadcasts by tracking them in cleared list
            const notifications = await this.fetchNotifications();
            const broadcastIds = notifications.filter(n => n.is_broadcast).map(n => n.id);
            const clearedBroadcasts = JSON.parse(localStorage.getItem(`cleared_broadcasts_${user.email}`) || '[]');
            const updatedCleared = [...new Set([...clearedBroadcasts, ...broadcastIds])];
            localStorage.setItem(`cleared_broadcasts_${user.email}`, JSON.stringify(updatedCleared));

            // 3. Mark all existing broadcasts as read locally for this user
            const readBroadcasts = JSON.parse(localStorage.getItem(`read_broadcasts_${user.email}`) || '[]');
            const updatedRead = [...new Set([...readBroadcasts, ...broadcastIds])];
            localStorage.setItem(`read_broadcasts_${user.email}`, JSON.stringify(updatedRead));

            UI.showNotification('All notifications cleared.', 'success');
            this.updateUI();
        } catch (e) {
            console.error('Failed to clear notifications:', e);
            UI.showNotification('Failed to clear notifications.', 'error');
        }
    },

    async updateUI() {
        const notifications = await this.fetchNotifications();
        const unreadCount = notifications.filter(n => !n.is_read).length;
        
        const bell = document.getElementById('unreadCount');
        if (bell) {
            bell.textContent = unreadCount;
            bell.style.display = unreadCount > 0 ? 'flex' : 'none';
        }

        const list = document.getElementById('notifList');
        if (list) {
            try {
            list.innerHTML = `
                <div style="padding:10px; border-bottom:1px solid #eee; display:flex; flex-direction:column; gap:8px">
                    <div style="display:flex; justify-content:space-between; align-items:center">
                        <strong>Notifications</strong>
                        <button class="button tiny secondary" style="width:auto" onclick="NotificationManager.clearAll()">Clear all</button>
                    </div>
                    <button class="button tiny" style="width:100%" onclick="NotificationManager.markAllAsRead()">Mark all as read</button>
                </div>
                ${notifications.length === 0 ? '<div style="padding:20px; text-align:center; color:#666">No notifications</div>' : ''}
                ${notifications.map(n => `
                    <div style="padding:10px; border-bottom:1px solid #f9f9f9; background:${n.is_read ? '#fff' : '#f0f4ff'}; cursor:pointer"
                         onclick="NotificationManager.handleNotificationClick('${n.id}', ${n.is_broadcast}, '${escapeAttr(n.link || '')}')">
                        <div style="font-weight:600; font-size:13px">${n.is_broadcast ? '📢 ' : ''}${escapeHtml(n.title)}</div>
                        <div style="font-size:12px; color:#444">${escapeHtml(n.message)}</div>
                        <div style="font-size:10px; color:#999; margin-top:4px">${new Date(n.created_at).toLocaleString()}</div>
                    </div>
                `).join('')}
            `;
            } catch (e) {
                console.warn('Error updating notif list:', e);
                list.innerHTML = '<div style="padding:10px">Could not load notifications.</div>';
            }
        }
        
        // Browser notification for new unread ones
        const lastCount = parseInt(sessionStorage.getItem('lastNotifCount') || '0');
        if (unreadCount > lastCount) {
            const unread = notifications.filter(n => !n.is_read);
            const latest = unread[0]; // notifications is sorted newest first
            if (latest) this.sendBrowserNotification(latest.title, latest.message);
        }
        sessionStorage.setItem('lastNotifCount', unreadCount);
    },

    async handleNotificationClick(id, isBroadcast, link) {
        if (isBroadcast) {
            await this.markBroadcastRead(id);
        } else {
            await SupabaseDB.markNotificationAsRead(id);
        }

        if (link) {
            try {
                const url = new URL(link, window.location.origin);
                const currentUrl = new URL(window.location.href);

                // If the link points to the same page (dashboard), use in-app navigation
                const targetPage = url.pathname.split('/').pop();
                const currentPage = currentUrl.pathname.split('/').pop();

                if (targetPage === currentPage) {
                    const pageParam = url.searchParams.get('page');
                    if (pageParam && typeof window.navigateToPage === 'function') {
                        window.navigateToPage(pageParam);
                        const list = document.getElementById('notifList');
                        if (list) list.classList.remove('active');
                        return;
                    }
                }
            } catch (e) {
                console.warn('Deep link parsing failed:', e);
            }
            window.location.href = link;
        } else {
            this.updateUI();
        }
    },

    async markBroadcastRead(id) {
        const user = await SessionManager.getCurrentUser();
        if (!user) return;
        const readBroadcasts = JSON.parse(localStorage.getItem(`read_broadcasts_${user.email}`) || '[]');
        if (!readBroadcasts.includes(id)) {
            readBroadcasts.push(id);
            localStorage.setItem(`read_broadcasts_${user.email}`, JSON.stringify(readBroadcasts));
            this.updateUI();
        }
    },

    async sendBrowserNotification(title, body) {
        if (!('Notification' in window)) return;
        if (Notification.permission === 'granted') {
            new Notification(title, { body, icon: './favicon.ico' });
        }
    },

    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    },

    async subscribeToPush() {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            UI.showNotification('Push notifications are not supported by your browser.', 'error');
            return;
        }

        try {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                UI.showNotification('Notification permission denied.', 'warn');
                return;
            }

            const registration = await navigator.serviceWorker.ready;
            // Note: Placeholder VAPID key. Real production requires a valid generated key.
            const vapidPublicKey = 'BCV_W_k-Placeholder-VAPID-Key-For-Production-Must-Be-Replaced-With-Real-Key';
            const convertedVapidKey = this.urlBase64ToUint8Array(vapidPublicKey);

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: convertedVapidKey
            });

            if (subscription) {
                const user = await SessionManager.getCurrentUser();
                if (user) {
                    const fresh = await SupabaseDB.getUser(user.email);
                    await SupabaseDB.saveUser({
                        ...fresh,
                        metadata: { ...fresh.metadata, push_subscription: subscription }
                    });
                }
                UI.showNotification('Notifications enabled!', 'success');
            }
        } catch (e) {
            console.warn('Failed to subscribe to push:', e);
            // Fallback for browsers that don't support full Push API even if PushManager exists
            UI.showNotification('Notifications enabled (In-App only). Full push may not be supported on this browser.', 'info');
        }
    },

    initPolling() {
        if (this._subscribed) return;
        this._subscribed = true;

        const user = SessionManager.getCurrentUserSync();
        if (!user) return;

        // 1. Initial fetch
        this.updateUI();

        // 2. Realtime subscription to personal notifications
        const notifChannel = SupabaseDB.subscribe('notifications', () => this.updateUI(), `user_email=eq.${user.email}`);
        this._channels.push(notifChannel);

        // 3. Realtime subscription to broadcasts
        const broadcastChannel = SupabaseDB.subscribe('broadcasts', () => this.updateUI());
        this._channels.push(broadcastChannel);

        // 4. Smart Refetch: Redundancy safety net (every 5 mins)
        setInterval(() => this.updateUI(), 5 * 60 * 1000);

        // 5. Smart Refetch: On visibility change (e.g. coming back to tab)
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.updateUI();
            }
        });
        
        // Request browser permission if not set
        if (Notification.permission === 'default') {
            requestNotificationPermission();
        }

        const bell = document.getElementById('notifBell');
        const list = document.getElementById('notifList');
        if (bell && list) {
            bell.addEventListener('click', (e) => {
                e.stopPropagation();
                list.classList.toggle('active');
            });
            document.addEventListener('click', () => list.classList.remove('active'));
            list.addEventListener('click', (e) => e.stopPropagation());
        }
    },

    stop() {
        this._channels.forEach(c => SupabaseDB.unsubscribe(c));
        this._channels = [];
        this._subscribed = false;
        // Also remove event listeners or use AbortController for true cleanup if needed
    }
};

async function updateMaintBanner() {
    let m;
    try {
        m = await SupabaseDB.getMaintenance(true);
    } catch (e) {
        console.warn('Maintenance check failed:', e);
        return;
    }

    // Force check maintenance for active sessions (Realtime handles user status)
    try {
        const user = await SessionManager.getCurrentUser();
        if (user) {
            const isMaint = isActiveMaintenance(m);
            if (isMaint && user.role !== 'admin') {
                await SessionManager.clearCurrentUser();
                if (!window.location.href.includes('index.html')) {
                    await UI.alert('System entered maintenance mode. Logging out.', 'System Update');
                    window.location.href = 'index.html';
                }
            }
        }
    } catch (e) {
        console.warn('Maintenance check failed during update:', e);
    }

    const ids = ['maintBanner', 'maintBannerSignup', 'maintBannerLogin', 'maintBannerReset'];
    
    let content = '';

    if (isActiveMaintenance(m)) {
        const until = getActiveMaintenanceEnd(m);
        const remain = Math.max(0, (until || Date.now()) - Date.now());
        const h = Math.floor(remain / 3600000), mm = Math.floor((remain % 3600000) / 60000), ss = Math.floor((remain % 60000) / 1000);
        content = `System maintenance ACTIVE — restores in ${h}h ${mm}m ${ss}s (until ${new Date(until || Date.now()).toLocaleString()})`;
    } else {
        const up = getUpcomingMaintenance(m);
        if (up) {
            const remain = Math.max(0, new Date(up.startAt).getTime() - Date.now());
            const h = Math.floor(remain / 3600000), mm = Math.floor((remain % 3600000) / 60000), ss = Math.floor((remain % 60000) / 1000);
            content = `Upcoming system maintenance — starts in ${h}h ${mm}m ${ss}s (at ${new Date(up.startAt).toLocaleString()})`;
        }
    }

    ids.forEach(id => {
        const b = document.getElementById(id);
        if (b) {
            if (content) {
                b.style.display = 'block';
                b.textContent = content;
            } else {
                b.style.display = 'none';
            }
        }
    });
}

window.normalizeEmail = function(email) {
    return (email || '').trim().toLowerCase();
};

window.isValidEmail = function(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

window.isStrongPassword = function(pass) {
    if (!pass || pass.length < 8) return false;
    const hasUpper = /[A-Z]/.test(pass);
    const hasLower = /[a-z]/.test(pass);
    const hasNumber = /\d/.test(pass);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pass);
    return hasUpper && hasLower && hasNumber && hasSpecial;
};

window.isAccountLocked = function(user) {
    return !!(user && user.locked_until && Date.now() < new Date(user.locked_until).getTime());
};

window.isActiveMaintenance = function(m) {
    if (!m) return false;
    const now = new Date().getTime();
    if (m.enabled) {
        if (!m.manual_until) return true;
        if (now < new Date(m.manual_until).getTime()) return true;
    }
    const schedules = Array.isArray(m.schedules) ? m.schedules : [];
    return schedules.some(s => now >= new Date(s.startAt).getTime() && now <= new Date(s.endAt).getTime());
};

window.getUpcomingMaintenance = function(m) {
    const now = new Date().getTime();
    const schedules = (Array.isArray(m.schedules) ? m.schedules : []).filter(s => new Date(s.startAt).getTime() > now).sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
    return schedules[0] || null;
};

window.getActiveMaintenanceEnd = function(m) {
    const now = new Date().getTime();
    if (m && m.manual_until && now < new Date(m.manual_until).getTime()) return new Date(m.manual_until).getTime();
    const s = (Array.isArray(m.schedules) ? m.schedules : []).find(s => now >= new Date(s.startAt).getTime() && now <= new Date(s.endAt).getTime());
    return s ? new Date(s.endAt).getTime() : null;
};

window.NotificationManager = NotificationManager;

window.hashPassword = async function(password, salt = '') {
    const encoder = new TextEncoder();
    // Use a fixed system salt + provided salt (e.g. email)
    const systemSalt = 'smart-lms-v1-';
    const data = encoder.encode(systemSalt + salt + password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

window.legacyHashPassword = async function(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

window.escapeHtml = function(s) {
    if (s === null || s === undefined) return '';
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
};

window.escapeAttr = function(s) {
    if (s === null || s === undefined) return '';
    return String(s).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
};

const CertificateGenerator = {
    async generatePDF(studentName, courseTitle, issueDate, verificationId) {
        if (!window.jspdf) {
            console.error('jsPDF not loaded');
            return null;
        }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });

        const width = doc.internal.pageSize.getWidth();
        const height = doc.internal.pageSize.getHeight();

        // Background
        doc.setFillColor(248, 246, 255);
        doc.rect(0, 0, width, height, 'F');

        // Border
        doc.setDrawColor(91, 46, 166);
        doc.setLineWidth(2);
        doc.rect(10, 10, width - 20, height - 20);
        doc.setLineWidth(0.5);
        doc.rect(12, 12, width - 24, height - 24);

        // Header
        doc.setTextColor(91, 46, 166);
        doc.setFontSize(40);
        doc.setFont('helvetica', 'bold');
        doc.text('CERTIFICATE OF COMPLETION', width / 2, 40, { align: 'center' });

        // Body
        doc.setTextColor(34, 34, 34);
        doc.setFontSize(20);
        doc.setFont('helvetica', 'normal');
        doc.text('This is to certify that', width / 2, 65, { align: 'center' });

        doc.setFontSize(32);
        doc.setFont('helvetica', 'bold');
        doc.text(studentName, width / 2, 85, { align: 'center' });

        doc.setFontSize(20);
        doc.setFont('helvetica', 'normal');
        doc.text('has successfully completed the course', width / 2, 105, { align: 'center' });

        doc.setFontSize(26);
        doc.setFont('helvetica', 'bold');
        doc.text(courseTitle, width / 2, 125, { align: 'center' });

        // Footer
        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        doc.text(`Issued on: ${new Date(issueDate).toLocaleDateString()}`, width / 2, 155, { align: 'center' });
        doc.text(`Verification ID: ${verificationId}`, width / 2, 165, { align: 'center' });

        // Logo / Stamp Placeholder
        doc.setDrawColor(91, 46, 166);
        doc.setLineWidth(1);
        doc.circle(width / 2, 185, 10);
        doc.setFontSize(10);
        doc.text('SmartLMS', width / 2, 186, { align: 'center' });

        return doc;
    }
};

window.CertificateGenerator = CertificateGenerator;

UI.createFileUploader = function(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const {
        bucket = 'materials',
        pathPrefix = 'uploads',
        maxSize = 5 * 1024 * 1024, // 5MB
        allowedTypes = [], // e.g. ['.pdf', '.docx']
        onUploadSuccess = (url) => {}
    } = options;

    container.innerHTML = `
        <div class="uploader-wrapper" onclick="this.querySelector('input').click()">
            <input type="file" style="display:none" ${allowedTypes.length ? `accept="${allowedTypes.join(',')}"` : ''}>
            <div class="uploader-icon">📁</div>
            <div class="uploader-text">Click to upload or drag and drop</div>
            <div class="uploader-info">Max size: ${maxSize / 1024 / 1024}MB ${allowedTypes.length ? `• Types: ${allowedTypes.join(', ')}` : ''}</div>
            <div class="uploader-progress">
                <div class="bar"></div>
            </div>
        </div>
    `;

    const input = container.querySelector('input');
    const text = container.querySelector('.uploader-text');
    const info = container.querySelector('.uploader-info');
    const progress = container.querySelector('.uploader-progress');
    const bar = progress.querySelector('.bar');

    input.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validation
        if (file.size > maxSize) {
            UI.alert(`File is too large. Max size is ${maxSize / 1024 / 1024}MB.`, 'Upload Error');
            return;
        }

        if (allowedTypes.length) {
            const ext = '.' + file.name.split('.').pop().toLowerCase();
            if (!allowedTypes.includes(ext)) {
                UI.alert(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
                return;
            }
        }

        // Start Upload
        text.textContent = `Uploading ${file.name}...`;
        progress.style.display = 'block';
        bar.style.width = '20%';

        try {
            const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
            const path = `${pathPrefix}/${fileName}`;

            await SupabaseDB.uploadFile(bucket, path, file);
            bar.style.width = '80%';

            const url = await SupabaseDB.getPublicUrl(bucket, path);
            bar.style.width = '100%';

            text.textContent = 'Upload complete!';
            text.style.color = 'var(--ok)';
            info.textContent = file.name;

            onUploadSuccess(url, file.name);
        } catch (err) {
            console.error('Upload error:', err);
            text.textContent = 'Upload failed. Try again.';
            text.style.color = 'var(--danger)';
            bar.style.width = '0';
        }
    });

    // Drag and Drop
    const wrapper = container.querySelector('.uploader-wrapper');
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        wrapper.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, false);
    });

    wrapper.addEventListener('dragover', () => wrapper.style.borderColor = 'var(--purple)');
    wrapper.addEventListener('dragleave', () => wrapper.style.borderColor = '#d9e0ea');
    wrapper.addEventListener('drop', (e) => {
        wrapper.style.borderColor = '#d9e0ea';
        input.files = e.dataTransfer.files;
        input.dispatchEvent(new Event('change'));
    });
};

window.UI = UI;

const IdleManager = {
    idleLimit: 15 * 60 * 1000, // 15 minutes
    warningTime: 60 * 1000, // 1 minute
    lastActivity: Date.now(),
    warningShown: false,
    _interval: null,

    init() {
        if (this._interval) return;
        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(name => {
            document.addEventListener(name, () => this.resetTimer(), true);
        });
        this.lastActivity = Date.now();
        this._interval = setInterval(() => this.checkIdle(), 10000);
    },

    resetTimer() {
        this.lastActivity = Date.now();
        if (this.warningShown) {
            this.warningShown = false;
            // Remove any existing warning toast if possible, or just let it expire
        }
    },

    async checkIdle() {
        const elapsed = Date.now() - this.lastActivity;
        const user = await SessionManager.getCurrentUser();
        if (!user) {
            if (this._interval) {
                clearInterval(this._interval);
                this._interval = null;
            }
            return;
        }

        if (elapsed >= this.idleLimit) {
            await SessionManager.clearCurrentUser();
            await UI.alert('Your session has expired due to inactivity.', 'Session Expired');
            window.location.href = 'index.html';
        } else if (elapsed >= (this.idleLimit - this.warningTime) && !this.warningShown) {
            this.warningShown = true;
            UI.showNotification('Your session will expire in 1 minute due to inactivity. Move your mouse or press a key to stay logged in.', 'info');
        }
    }
};

window.IdleManager = IdleManager;
