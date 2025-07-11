import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Auth callback error:', error)
        return NextResponse.redirect(`${requestUrl.origin}/auth/signup?error=auth_failed`)
      }

      if (data.session) {
        // Create success page with extension sync script
        const successHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Vibe UI Assistant - Welcome!</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      background: white;
      border-radius: 16px;
      padding: 48px;
      text-align: center;
      box-shadow: 0 20px 40px rgba(0,0,0,0.1);
      max-width: 400px;
      width: 90%;
    }
    .icon {
      width: 64px;
      height: 64px;
      background: linear-gradient(45deg, #4CAF50, #45a049);
      border-radius: 50%;
      margin: 0 auto 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
    }
    h1 {
      color: #1a1a1a;
      margin: 0 0 16px;
      font-size: 24px;
      font-weight: 600;
    }
    p {
      color: #666;
      margin: 0 0 24px;
      line-height: 1.5;
    }
    .status {
      padding: 12px;
      border-radius: 8px;
      font-size: 14px;
      margin: 16px 0;
    }
    .success { background: #f0f9ff; color: #0369a1; border: 1px solid #bae6fd; }
    .info { background: #fef3c7; color: #92400e; border: 1px solid #fcd34d; }
    .error { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
    button {
      background: #3B82F6;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
      margin: 8px;
    }
    button:hover { background: #2563EB; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">✅</div>
    <h1>Welcome to Vibe UI Assistant!</h1>
    <p>Your account has been successfully created. We're now syncing your extension...</p>
    
    <div id="status" class="status info">
      🔄 Syncing with browser extension...
    </div>
    
    <div id="actions" style="display: none;">
      <button onclick="window.close()">Close & Continue</button>
      <button onclick="location.href='${next}'">Go to Dashboard</button>
    </div>
  </div>

  <script>
    // Try to sync auth status with extension
    async function syncWithExtension() {
      const statusEl = document.getElementById('status');
      const actionsEl = document.getElementById('actions');
      
      try {
        statusEl.textContent = '📱 Attempting to sync with extension...';
        
        // For local development, try multiple sync methods
        const authData = {
          authenticated: true,
          user: {
            id: '${data.session.user.id}',
            email: '${data.session.user.email}',
            name: '${data.session.user.user_metadata?.name || ''}',
            avatar: '${data.session.user.user_metadata?.avatar_url || ''}'
          },
          session: {
            access_token: '${data.session.access_token}',
            refresh_token: '${data.session.refresh_token}'
          }
        };
        
        // Method 1: Try direct chrome extension API (works for published extensions)
        if (typeof chrome !== 'undefined' && chrome.runtime) {
          try {
            await chrome.storage.local.set({
              userAuthenticated: true,
              userProfile: authData.user,
              userSession: authData.session
            });
            
            statusEl.className = 'status success';
            statusEl.textContent = '✅ Extension synced successfully! You can now use all features.';
            actionsEl.style.display = 'block';
            return;
          } catch (chromeError) {
            console.log('Chrome API method failed (expected for local extensions):', chromeError);
          }
        }
        
        // Method 2: Try postMessage to extension content scripts
        try {
          window.postMessage({
            type: 'VIBE_UI_AUTH_SYNC',
            data: authData
          }, '*');
          
          // Listen for confirmation
          let syncConfirmed = false;
          const handleMessage = (event) => {
            if (event.data.type === 'VIBE_UI_AUTH_SYNC_CONFIRMED') {
              syncConfirmed = true;
              statusEl.className = 'status success';
              statusEl.textContent = '✅ Extension synced via postMessage! You can now use all features.';
              actionsEl.style.display = 'block';
              window.removeEventListener('message', handleMessage);
            }
          };
          window.addEventListener('message', handleMessage);
          
          // Wait 2 seconds for confirmation
          setTimeout(() => {
            if (!syncConfirmed) {
              window.removeEventListener('message', handleMessage);
              throw new Error('No response from extension');
            }
          }, 2000);
          
        } catch (postMessageError) {
          console.log('PostMessage method failed:', postMessageError);
          
          // Method 3: Manual sync instructions
          statusEl.className = 'status info';
          statusEl.innerHTML = \`
            <strong>🔧 Local Extension Detected</strong><br>
            For local development, manual sync required:<br>
            <small style="margin-top: 8px; display: block;">
              1. Open extension popup<br>
              2. Click "Sign In" again<br>
              3. Or reload extension in chrome://extensions/
            </small>
          \`;
          actionsEl.style.display = 'block';
        }
        
      } catch (error) {
        console.error('Sync error:', error);
        statusEl.className = 'status error';
        statusEl.innerHTML = \`
          <strong>⚠️ Sync Failed</strong><br>
          Please manually sign in through the extension popup
        \`;
        actionsEl.style.display = 'block';
      }
    }
    
    // Auto-redirect after 8 seconds regardless of sync status
    setTimeout(() => {
      location.href = '${next}';
    }, 8000);
    
    // Start sync process
    setTimeout(syncWithExtension, 1000);
  </script>
</body>
</html>`;

        return new NextResponse(successHtml, {
          headers: { 'Content-Type': 'text/html' }
        });
      }
    } catch (error) {
      console.error('Session exchange error:', error)
      return NextResponse.redirect(`${requestUrl.origin}/auth/signup?error=session_failed`)
    }
  }

  // No code provided, redirect to sign up
  return NextResponse.redirect(`${requestUrl.origin}/auth/signup`)
}