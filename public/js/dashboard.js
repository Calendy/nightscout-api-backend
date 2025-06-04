// Global state
let currentUser = null;
let authToken = null;
let refreshInterval = null;
let lastEntryTimestamp = null;

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard script loaded');

    // Check if user is already logged in
    const token = localStorage.getItem('authToken');
    if (token) {
        authToken = token;
        loadUserProfile();
    }

    // Test if functions are available
    console.log('showRegister function:', typeof showRegister);
    console.log('showLogin function:', typeof showLogin);

    // Handle page visibility changes to optimize auto-refresh
    setupPageVisibilityHandling();
});

// Handle page visibility to pause/resume auto-refresh
function setupPageVisibilityHandling() {
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            // Page is hidden, pause auto-refresh to save resources
            console.log('Page hidden, pausing auto-refresh');
        } else {
            // Page is visible again, resume auto-refresh and do immediate refresh
            console.log('Page visible, resuming auto-refresh');
            if (authToken && currentUser && refreshInterval) {
                loadRecentEntries(true);
                loadStatistics();
            }
        }
    });
}

// Authentication functions
function showLogin() {
    document.getElementById('login-tab').classList.add('active');
    document.getElementById('register-tab').classList.remove('active');
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('register-form').style.display = 'none';
}

function showRegister() {
    console.log('showRegister function called');

    try {
        document.getElementById('register-tab').classList.add('active');
        document.getElementById('login-tab').classList.remove('active');
        document.getElementById('register-form').style.display = 'block';
        document.getElementById('login-form').style.display = 'none';
        console.log('Register tab switched successfully');
    } catch (error) {
        console.error('Error in showRegister:', error);
    }
}

async function login(event) {
    event.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const response = await fetch('/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            authToken = data.token;
            localStorage.setItem('authToken', authToken);
            currentUser = data.user;
            showDashboard();
            showMessage('Autentificare reușită!', 'success');
        } else {
            showMessage(data.message || 'Autentificare eșuată', 'error');
        }
    } catch (error) {
        showMessage('Eroare de rețea. Te rog încearcă din nou.', 'error');
    }
}

async function register(event) {
    event.preventDefault();
    
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    
    try {
        const response = await fetch('/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            authToken = data.token;
            localStorage.setItem('authToken', authToken);
            currentUser = data.user;
            showDashboard();
            showMessage('Înregistrare reușită!', 'success');
        } else {
            showMessage(data.message || 'Înregistrare eșuată', 'error');
        }
    } catch (error) {
        showMessage('Eroare de rețea. Te rog încearcă din nou.', 'error');
    }
}

async function loadUserProfile() {
    console.log('Loading user profile...');

    try {
        const response = await fetch('/auth/me', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log('User profile loaded:', data);
            currentUser = data.user;
            showDashboard();
        } else {
            console.error('Failed to load user profile:', response.status, response.statusText);
            logout();
        }
    } catch (error) {
        console.error('Error loading user profile:', error);
        logout();
    }
}

function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');

    // Stop auto-refresh when logging out
    stopAutoRefresh();

    document.getElementById('auth-section').style.display = 'block';
    document.getElementById('dashboard-section').style.display = 'none';

    // Clear forms
    document.getElementById('login-email').value = '';
    document.getElementById('login-password').value = '';
    document.getElementById('register-email').value = '';
    document.getElementById('register-password').value = '';

    showMessage('Deconectare reușită', 'info');
}

// Dashboard functions
async function showDashboard() {
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('dashboard-section').style.display = 'block';

    // Populate user information
    document.getElementById('user-email').textContent = currentUser.email;
    document.getElementById('nightscout-url').value = currentUser.nightscout_url || getBaseUrl() + '/api/v1';
    document.getElementById('api-secret').value = currentUser.api_secret || '••••••••••••••••';

    // Calculate and display SHA-1 hash
    if (currentUser.api_secret) {
        const sha1Hash = await calculateSHA1(currentUser.api_secret);
        document.getElementById('api-secret-sha1').value = sha1Hash;
    }

    document.getElementById('base-url-display').textContent = getBaseUrlWithApiKey();

    // Load statistics
    loadStatistics();

    // Load recent entries
    loadRecentEntries();

    // Start auto-refresh for real-time updates
    startAutoRefresh();
}

function getBaseUrl() {
    return window.location.origin;
}

function getCurrentUser() {
    return currentUser;
}

function getBaseUrlWithApiKey() {
    const user = getCurrentUser();
    if (user && user.api_secret) {
        return `https://${user.api_secret}@${window.location.host}`;
    }
    return `https://YOUR_API_KEY@${window.location.host}`;
}

async function loadStatistics() {
    console.log('Loading statistics...');

    // Initialize with loading state
    document.getElementById('entries-count').textContent = 'Se încarcă...';
    document.getElementById('treatments-count').textContent = 'Se încarcă...';
    document.getElementById('last-entry').textContent = 'Se încarcă...';

    try {
        // Load entries count
        console.log('Fetching entries...');
        const entriesResponse = await fetch('/api/v1/entries?count=1', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (entriesResponse.ok) {
            const entries = await entriesResponse.json();
            console.log('Entries response:', entries);
            document.getElementById('entries-count').textContent = entries.length > 0 ? 'Disponibile' : '0';

            if (entries.length > 0) {
                const lastEntry = new Date(entries[0].dateString || entries[0].date);
                if (!isNaN(lastEntry.getTime())) {
                    document.getElementById('last-entry').textContent = lastEntry.toLocaleString('ro-RO');
                } else {
                    document.getElementById('last-entry').textContent = 'Dată invalidă';
                }
            } else {
                document.getElementById('last-entry').textContent = 'Fără date';
            }
        } else {
            console.error('Entries API error:', entriesResponse.status, entriesResponse.statusText);
            document.getElementById('entries-count').textContent = 'Eroare';
            document.getElementById('last-entry').textContent = 'Eroare';
        }

        // Load treatments count
        console.log('Fetching treatments...');
        const treatmentsResponse = await fetch('/api/v1/treatments?count=1', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (treatmentsResponse.ok) {
            const treatments = await treatmentsResponse.json();
            console.log('Treatments response:', treatments);
            document.getElementById('treatments-count').textContent = treatments.length > 0 ? 'Disponibile' : '0';
        } else {
            console.error('Treatments API error:', treatmentsResponse.status, treatmentsResponse.statusText);
            document.getElementById('treatments-count').textContent = 'Eroare';
        }

    } catch (error) {
        console.error('Error loading statistics:', error);
        // Set error state for all elements
        document.getElementById('entries-count').textContent = 'Eroare de rețea';
        document.getElementById('treatments-count').textContent = 'Eroare de rețea';
        document.getElementById('last-entry').textContent = 'Eroare de rețea';
    }
}

async function loadRecentEntries(showUpdateNotification = false) {
    console.log('Loading recent entries...');

    try {
        const response = await fetch('/api/v1/entries?count=10', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const entries = await response.json();
            console.log('Recent entries response:', entries);

            // Check if there are new entries
            if (showUpdateNotification && entries.length > 0) {
                const latestTimestamp = new Date(entries[0].dateString || entries[0].date).getTime();
                if (lastEntryTimestamp && latestTimestamp > lastEntryTimestamp) {
                    showNewDataNotification();
                }
                lastEntryTimestamp = latestTimestamp;
            } else if (entries.length > 0) {
                // Set initial timestamp
                lastEntryTimestamp = new Date(entries[0].dateString || entries[0].date).getTime();
            }

            displayRecentEntries(entries);
            updateLastRefreshTime();
        } else {
            console.error('Recent entries API error:', response.status, response.statusText);
            showEntriesError(`Eroare la încărcarea înregistrărilor (${response.status})`);
        }

    } catch (error) {
        console.error('Error loading recent entries:', error);
        showEntriesError('Eroare de rețea la încărcarea înregistrărilor');
    }
}

function displayRecentEntries(entries) {
    const container = document.getElementById('recent-entries-container');

    if (!entries || entries.length === 0) {
        container.innerHTML = '<div class="no-entries-message">Nu există înregistrări CGM disponibile</div>';
        return;
    }

    const table = document.createElement('table');
    table.className = 'entries-table';

    // Create table header
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th>Glucoză</th>
            <th>Direcție</th>
            <th>Data și Ora</th>
            <th>Dispozitiv</th>
        </tr>
    `;
    table.appendChild(thead);

    // Create table body
    const tbody = document.createElement('tbody');

    entries.forEach(entry => {
        const row = document.createElement('tr');

        // Glucose value with color coding
        const glucoseClass = getGlucoseClass(entry.sgv);
        const direction = getDirectionArrow(entry.direction);
        const formattedDate = formatEntryDate(entry.dateString || entry.date);

        row.innerHTML = `
            <td>
                <span class="glucose-value ${glucoseClass}">${entry.sgv || 'N/A'}</span>
                <span class="glucose-unit">mg/dL</span>
            </td>
            <td>
                <span class="direction-arrow">${direction}</span>
            </td>
            <td>
                <div class="entry-time">${formattedDate}</div>
            </td>
            <td>${entry.device || 'N/A'}</td>
        `;

        tbody.appendChild(row);
    });

    table.appendChild(tbody);
    container.innerHTML = '';
    container.appendChild(table);
}

function getGlucoseClass(sgv) {
    if (!sgv) return '';

    if (sgv >= 180) return 'glucose-high';
    if (sgv <= 70) return 'glucose-low';
    return 'glucose-normal';
}

function getDirectionArrow(direction) {
    const arrows = {
        'DoubleUp': '⇈',
        'SingleUp': '↑',
        'FortyFiveUp': '↗',
        'Flat': '→',
        'FortyFiveDown': '↘',
        'SingleDown': '↓',
        'DoubleDown': '⇊',
        'NOT COMPUTABLE': '?',
        'RATE OUT OF RANGE': '⚠'
    };

    return arrows[direction] || '→';
}

function formatEntryDate(dateInput) {
    if (!dateInput) return 'N/A';

    let date;
    if (typeof dateInput === 'number') {
        date = new Date(dateInput);
    } else {
        date = new Date(dateInput);
    }

    if (isNaN(date.getTime())) return 'N/A';

    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) {
        return 'Acum';
    } else if (diffMins < 60) {
        return `${diffMins} min în urmă`;
    } else if (diffHours < 24) {
        return `${diffHours}h în urmă`;
    } else if (diffDays < 7) {
        return `${diffDays} zile în urmă`;
    } else {
        return date.toLocaleDateString('ro-RO', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

function showEntriesError(message) {
    const container = document.getElementById('recent-entries-container');
    container.innerHTML = `<div class="no-entries-message">${message}</div>`;
}

// Auto-refresh functionality
function startAutoRefresh() {
    // Clear any existing interval
    stopAutoRefresh();

    // Refresh every 30 seconds (30000 ms)
    // You can adjust this interval as needed
    refreshInterval = setInterval(() => {
        if (authToken && currentUser) {
            loadRecentEntries(true); // true = show notification for new data
            loadStatistics(); // Also refresh statistics
        }
    }, 30000); // 30 seconds

    console.log('Auto-refresh started (30 second interval)');
}

function stopAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
        console.log('Auto-refresh stopped');
    }
}

function showNewDataNotification() {
    // Create a subtle notification for new data
    const notification = document.createElement('div');
    notification.className = 'new-data-notification';
    notification.innerHTML = '🔄 Date noi CGM disponibile';

    // Insert at the top of the entries section
    const entriesSection = document.querySelector('.recent-entries-section');
    if (entriesSection) {
        entriesSection.insertBefore(notification, entriesSection.firstChild);

        // Remove notification after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
}

function updateLastRefreshTime() {
    // Update or create a last refresh indicator
    let refreshIndicator = document.getElementById('last-refresh-time');
    if (!refreshIndicator) {
        refreshIndicator = document.createElement('div');
        refreshIndicator.id = 'last-refresh-time';
        refreshIndicator.className = 'refresh-indicator';

        const entriesSection = document.querySelector('.recent-entries-section h4');
        if (entriesSection) {
            entriesSection.appendChild(refreshIndicator);
        }
    }

    const now = new Date();
    refreshIndicator.innerHTML = `<span class="refresh-time">Actualizat: ${now.toLocaleTimeString('ro-RO')}</span>`;
}

// Manual refresh and toggle functions
function manualRefresh() {
    console.log('Manual refresh triggered');
    loadRecentEntries(true);
    loadStatistics();
    showMessage('Date actualizate manual', 'success');
}

function toggleAutoRefresh() {
    const statusElement = document.getElementById('refresh-status');
    const toggleButton = document.getElementById('toggle-refresh-btn');

    if (refreshInterval) {
        // Stop auto-refresh
        stopAutoRefresh();
        statusElement.textContent = '⏸️ Actualizare automată oprită';
        statusElement.className = 'refresh-status inactive';
        toggleButton.textContent = 'Pornește Auto-refresh';
        showMessage('Actualizare automată oprită', 'info');
    } else {
        // Start auto-refresh
        startAutoRefresh();
        statusElement.textContent = '🔄 Actualizare automată activă (30s)';
        statusElement.className = 'refresh-status active';
        toggleButton.textContent = 'Oprește Auto-refresh';
        showMessage('Actualizare automată pornită', 'success');
    }
}

// SHA-1 calculation function
async function calculateSHA1(text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

// Utility functions
function copyUrl() {
    const urlInput = document.getElementById('nightscout-url');
    urlInput.select();
    document.execCommand('copy');
    showMessage('URL copiat în clipboard!', 'success');
}

function copySecret() {
    const secretInput = document.getElementById('api-secret');
    if (secretInput.type === 'password') {
        showMessage('Te rog afișează mai întâi cheia, apoi copiază-o.', 'info');
        return;
    }
    secretInput.select();
    document.execCommand('copy');
    showMessage('Cheia API copiată în clipboard!', 'success');
}

function toggleSecretVisibility() {
    const secretInput = document.getElementById('api-secret');
    const toggleButton = document.getElementById('toggle-secret');

    if (secretInput.type === 'password') {
        secretInput.type = 'text';
        toggleButton.textContent = 'Ascunde';
    } else {
        secretInput.type = 'password';
        toggleButton.textContent = 'Afișează';
    }
}

function copySha1() {
    const sha1Input = document.getElementById('api-secret-sha1');
    if (sha1Input.type === 'password') {
        showMessage('Te rog afișează mai întâi hash-ul SHA-1, apoi copiază-l.', 'info');
        return;
    }
    sha1Input.select();
    document.execCommand('copy');
    showMessage('Hash-ul SHA-1 copiat în clipboard!', 'success');
}

function toggleSha1Visibility() {
    const sha1Input = document.getElementById('api-secret-sha1');
    const toggleButton = document.getElementById('toggle-sha1');

    if (sha1Input.type === 'password') {
        sha1Input.type = 'text';
        toggleButton.textContent = 'Ascunde';
    } else {
        sha1Input.type = 'password';
        toggleButton.textContent = 'Afișează';
    }
}

async function regenerateSecret() {
    if (!confirm('Ești sigur că vrei să regenerezi cheia API? Va trebui să o actualizezi în toate aplicațiile tale.')) {
        return;
    }

    try {
        const response = await fetch('/auth/regenerate-secret', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            document.getElementById('api-secret').value = data.api_secret;
            currentUser.api_secret = data.api_secret;

            // Update SHA-1 hash
            const sha1Hash = await calculateSHA1(data.api_secret);
            document.getElementById('api-secret-sha1').value = sha1Hash;

            showMessage('Cheia API regenerată cu succes!', 'success');
        } else {
            showMessage(data.message || 'Eșec la regenerarea cheii API', 'error');
        }
    } catch (error) {
        showMessage('Eroare de rețea. Te rog încearcă din nou.', 'error');
    }
}

function showMessage(message, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';
    
    // Hide message after 5 seconds
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}
