// Token extraction - try multiple sources
// Make variables global so they're accessible everywhere
window.token = null;
window.pendingToken = null;
window.error = null;

// First, try to extract from URL (most reliable)
var token = null;
var pendingToken = null;
var error = null;

console.log('🔍 Starting token extraction...');
console.log('📍 Current URL:', window.location.href);
console.log('🔍 Search params:', window.location.search);

try {
    var search = window.location.search;
    if (search) {
        var params = new URLSearchParams(search);
        token = params.get('token');
        pendingToken = params.get('pendingToken');
        error = params.get('error');
        console.log('📋 Extracted from URL:', {
            token: token ? 'EXISTS' : 'MISSING',
            pendingToken: pendingToken ? 'EXISTS' : 'MISSING',
            error: error ? 'EXISTS' : 'MISSING'
        });
    }
} catch (e) {
    console.error('❌ Error extracting from URL:', e);
}

// Fallback to server-injected values if URL extraction failed
if (!token && !pendingToken && !error) {
    token = window.serverToken || null;
    pendingToken = window.serverPendingToken || null;
    error = window.serverError || null;
}

// Store in global scope
window.token = token;
window.pendingToken = pendingToken;
window.error = error;

function displayToken() {
    var tokenDisplay = document.getElementById('tokenDisplay');
    var status = document.getElementById('status');

    if (!tokenDisplay || !status) {
        setTimeout(displayToken, 50);
        return;
    }

    // Use global variables or re-extract from URL
    var tokenToUse = window.token || token;
    var pendingTokenToUse = window.pendingToken || pendingToken;
    var errorToUse = window.error || error;

    // Re-extract token from URL if not already set (fallback)
    if (!tokenToUse && !pendingTokenToUse && !errorToUse) {
        try {
            var params = new URLSearchParams(window.location.search);
            tokenToUse = params.get('token');
            pendingTokenToUse = params.get('pendingToken');
            errorToUse = params.get('error');
            // Update global variables
            window.token = tokenToUse;
            window.pendingToken = pendingTokenToUse;
            window.error = errorToUse;
        } catch (e) {
            // Silent fail
        }
    }

    if (tokenToUse) {
        tokenDisplay.value = tokenToUse;
        status.textContent = '✅ Token loaded! Opening app...';
        status.className = 'status success';
        window.currentToken = tokenToUse;

        // Auto-open app after 500ms
        setTimeout(function() {
            var deepLink = 'mafqoudat://auth/callback?token=' + encodeURIComponent(tokenToUse);
            console.log('🚀 Attempting to open app with deep link:', deepLink);

            // Try multiple methods to trigger deep link
            var methods = [
                function() { window.location.href = deepLink; },
                function() { window.location.replace(deepLink); },
                function() {
                    var link = document.createElement('a');
                    link.href = deepLink;
                    link.style.display = 'none';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                },
                function() {
                    // Try iframe method
                    var iframe = document.createElement('iframe');
                    iframe.style.display = 'none';
                    iframe.src = deepLink;
                    document.body.appendChild(iframe);
                    setTimeout(function() { document.body.removeChild(iframe); }, 1000);
                }
            ];

            // Try each method with delays
            methods.forEach(function(method, index) {
                setTimeout(method, index * 300);
            });

            // Update status
            var status = document.getElementById('status');
            if (status) {
                status.textContent = '✅ Token loaded! Attempting to open app...';
            }
        }, 500);
    } else if (pendingTokenToUse) {
        tokenDisplay.value = pendingTokenToUse;
        status.textContent = '✅ Pending token loaded!';
        status.className = 'status success';
        window.currentToken = pendingTokenToUse;

        setTimeout(function() {
            var deepLink = 'mafqoudat://auth/callback?pendingToken=' + encodeURIComponent(pendingTokenToUse);
            try {
                window.location.href = deepLink;
            } catch (e) {
                setTimeout(function() {
                    try {
                        window.location.replace(deepLink);
                    } catch (e2) {
                        try {
                            var link = document.createElement('a');
                            link.href = deepLink;
                            link.style.display = 'none';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        } catch (e3) {
                            // All methods failed
                        }
                    }
                }, 200);
            }
        }, 500);
    } else if (errorToUse) {
        tokenDisplay.value = 'ERROR: ' + errorToUse;
        status.textContent = '❌ Error: ' + errorToUse;
        status.className = 'status error';
    } else {
        var errorMsg = 'ERROR: No token found!\n\n';
        errorMsg += 'URL: ' + window.location.href + '\n\n';
        errorMsg += 'Search params: ' + window.location.search + '\n\n';
        errorMsg += 'Server token: ' + (window.serverToken ? 'EXISTS' : 'NOT FOUND') + '\n';
        errorMsg += 'URL token: ' + (new URLSearchParams(window.location.search).get('token') ? 'EXISTS' : 'NOT FOUND');
        tokenDisplay.value = errorMsg;
        status.textContent = '❌ No token found';
        status.className = 'status error';
    }
}

function openApp() {
    // Get token from multiple sources
    var tokenToUse = window.currentToken ||
                   window.token ||
                   (document.getElementById('tokenDisplay') ? document.getElementById('tokenDisplay').value : null) ||
                   null;

    var pendingTokenToUse = window.pendingToken || null;

    // If still no token, try extracting from URL one more time
    if (!tokenToUse && !pendingTokenToUse) {
        try {
            var params = new URLSearchParams(window.location.search);
            tokenToUse = params.get('token');
            pendingTokenToUse = params.get('pendingToken');
        } catch (e) {
            // Silent fail
        }
    }

    if (!tokenToUse && !pendingTokenToUse) {
        alert('No token available. Please check the token display above.');
        return;
    }

    var deepLink = 'mafqoudat://auth/callback?';
    if (tokenToUse) {
        deepLink += 'token=' + encodeURIComponent(tokenToUse);
    } else if (pendingTokenToUse) {
        deepLink += 'pendingToken=' + encodeURIComponent(pendingTokenToUse);
    }

    // Try multiple methods
    var success = false;
    try {
        window.location.href = deepLink;
        success = true;
    } catch (e) {
        try {
            window.location.replace(deepLink);
            success = true;
        } catch (e2) {
            try {
                var link = document.createElement('a');
                link.href = deepLink;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                success = true;
            } catch (e3) {
                alert('Failed to open app. Please copy the token and return to the app manually.');
            }
        }
    }

    if (success) {
        // Show message
        var status = document.getElementById('status');
        if (status) {
            status.textContent = '✅ Opening app... If it doesn\'t open, please return to the app manually.';
        }
    }
}

function copyToken() {
    // Try multiple sources for token
    var tokenToCopy = window.currentToken ||
                    window.token ||
                    (document.getElementById('tokenDisplay') ? document.getElementById('tokenDisplay').value : null);

    // If still no token, try extracting from URL
    if (!tokenToCopy || tokenToCopy.includes('ERROR')) {
        try {
            var params = new URLSearchParams(window.location.search);
            tokenToCopy = params.get('token') || params.get('pendingToken');
        } catch (e) {
            // Silent fail
        }
    }

    if (!tokenToCopy || tokenToCopy.includes('ERROR')) {
        alert('No token available to copy. Please check the token display above.');
        return;
    }

    var tokenDisplay = document.getElementById('tokenDisplay');
    if (tokenDisplay) {
        tokenDisplay.value = tokenToCopy;
        tokenDisplay.select();
        tokenDisplay.setSelectionRange(0, tokenToCopy.length);
    }

    // Try modern clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(tokenToCopy).then(function() {
            alert('✅ Token copied to clipboard! Return to the app and paste it in the token input field.');
        }).catch(function(err) {
            // Fallback to execCommand
            try {
                if (document.execCommand('copy')) {
                    alert('✅ Token copied! Return to the app and paste it.');
                    return;
                }
            } catch(e) {
                // Silent fail
            }
            alert('Please manually select and copy the token from the text area above.');
        });
    } else {
        // Fallback to execCommand
        try {
            if (document.execCommand('copy')) {
                alert('✅ Token copied! Return to the app and paste it.');
                return;
            }
        } catch(e) {
            // Silent fail
        }
        alert('Please manually select and copy the token from the text area above.');
    }
}

// Run immediately and also when DOM is ready
function initDisplay() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', displayToken);
    } else {
        displayToken();
    }
}

// Start initialization
initDisplay();

// Also try after delays to ensure everything is ready
[100, 300, 500, 1000].forEach(function(delay) {
    setTimeout(displayToken, delay);
});

// Wire up buttons here instead of inline onclick= attributes - those are
// blocked by the same strict CSP (script-src 'self', no 'unsafe-inline')
// that required moving this whole file out of an inline <script> block.
function wireButtons() {
    var openAppBtn = document.getElementById('openAppBtn');
    var copyTokenBtn = document.getElementById('copyTokenBtn');
    if (openAppBtn) openAppBtn.addEventListener('click', openApp);
    if (copyTokenBtn) copyTokenBtn.addEventListener('click', copyToken);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireButtons);
} else {
    wireButtons();
}
