/**
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { BskyAgent } from '@atproto/api'

const app = new Hono()

// Add CORS middleware with strict configuration
app.use('/api/*', cors({
  origin: ['http://localhost:8787', 'https://your-production-domain.com'], // Add your domains here
  allowMethods: ['POST'],
  allowHeaders: ['Content-Type'],
  exposeHeaders: ['Content-Length'],
  maxAge: 600,
  credentials: true,
}))

// Add additional security middleware for API routes
app.use('/api/*', async (c, next) => {
  const referer = c.req.header('Referer')
  const origin = c.req.header('Origin')

  // Only allow requests from your domains
  const allowedDomains = [
    'http://localhost:8787',
    'https://your-production-domain.com'
  ]

  if (!referer && !origin) {
    // Allow requests with no referer (direct API calls)
    await next()
    return
  }

  const isAllowedDomain = allowedDomains.some(domain => 
    referer?.startsWith(domain) || origin === domain
  )

  if (!isAllowedDomain) {
    return c.json({
      error: 'Unauthorized: Access not allowed from this origin'
    }, 403)
  }

  await next()
})

const mainPage = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Easily clean up your Bluesky posts. Delete old posts automatically with this simple tool.">
    <meta name="keywords" content="Bluesky, post cleaner, social media, delete posts, automation">
    <meta name="author" content="Supprimer | The Bluesky Post Cleaner">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:title" content="Supprimer | The Bluesky Post Cleaner - Manage Your Timeline">
    <meta property="og:description" content="Clean up your Bluesky timeline by removing old posts automatically.">
    <meta property="og:url" content="https://your-domain.com">

    <!-- Twitter -->
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="Supprimer | The Bluesky Post Cleaner">
    <meta name="twitter:description" content="Clean up your Bluesky timeline by removing old posts automatically.">

    <title>Supprimer | The Bluesky Post Cleaner</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary-color: #0085FF;
            --error-color: #dc3545;
            --success-color: #198754;
            --bg-color: #f8f9fa;
            --card-bg: #ffffff;
        }

        body {
            font-family: 'Inter', sans-serif;
            margin: 0;
            padding: 0;
            background-color: var(--bg-color);
            color: #333;
            line-height: 1.6;
        }

        .container {
            max-width: 600px;
            margin: 2rem auto;
            padding: 0 20px;
        }

        .card {
            background: var(--card-bg);
            border-radius: 12px;
            padding: 2rem;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        h1 {
            color: var(--primary-color);
            text-align: center;
            font-size: 2rem;
            margin-bottom: 1rem;
        }

        .description {
            text-align: center;
            color: #666;
            margin-bottom: 2rem;
            font-size: 0.95rem;
        }

        .app-password-info {
            background-color: #e7f5ff;
            border: 1px solid #b8e2ff;
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 1.5rem;
            font-size: 0.9rem;
        }

        .app-password-info a {
            color: var(--primary-color);
            text-decoration: none;
            font-weight: 600;
        }

        .app-password-info a:hover {
            text-decoration: underline;
        }

        form {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
        }

        .form-group {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }

        label {
            font-weight: 600;
            color: #444;
            font-size: 0.9rem;
        }

        input, select {
            padding: 0.75rem;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 1rem;
            transition: border-color 0.3s ease;
        }

        input:focus, select:focus {
            outline: none;
            border-color: var(--primary-color);
        }

        button {
            background-color: var(--primary-color);
            color: white;
            padding: 1rem;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1rem;
            font-weight: 600;
            transition: all 0.3s ease;
        }

        button:hover {
            background-color: #0066cc;
            transform: translateY(-1px);
        }

        button:disabled {
            background-color: #ccc;
            cursor: not-allowed;
            transform: none;
        }

        #result {
            margin-top: 1.5rem;
            padding: 1rem;
            border-radius: 8px;
            display: none;
            font-size: 0.9rem;
            text-align: center;
        }

        .success {
            background-color: #d1e7dd;
            color: var(--success-color);
            border: 1px solid #badbcc;
        }

        .error {
            background-color: #f8d7da;
            color: var(--error-color);
            border: 1px solid #f5c2c7;
        }

        .footer {
            text-align: center;
            margin-top: 2rem;
            color: #666;
            font-size: 0.8rem;
        }

        .input-wrapper {
            position: relative;
            display: flex;
            align-items: center;
        }

        .at-symbol {
            position: absolute;
            left: 10px;
            color: #666;
            font-weight: 500;
            z-index: 1;
        }

        .username-input {
            padding-left: 30px !important;
            width: 100%;
        }

        select {
            background-color: white;
            cursor: pointer;
        }

        select:hover {
            border-color: var(--primary-color);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <h1>Supprimer | The Bluesky Post Cleaner</h1>
            <p class="description">
                Clean up your Bluesky timeline by removing old posts automatically.
            </p>

            <div class="app-password-info">
                ℹ️ For security, please use an App Password instead of your main password.
                <br>
                <a href="https://bsky.app/settings/app-passwords" target="_blank" rel="noopener noreferrer">
                    Create an App Password →
                </a>
            </div>

            <form id="deleteForm">
                <div class="form-group">
                    <label for="username">Bluesky Handle:</label>
                    <div class="input-wrapper">
                        <span class="at-symbol">@</span>
                        <input type="text" id="username" name="username" required 
                            placeholder="username.bsky.social"
                            class="username-input">
                    </div>
                </div>
                <div class="form-group">
                    <label for="password">App Password:</label>
                    <input type="password" id="password" name="password" required
                        placeholder="Enter your app password">
                </div>
                <div class="form-group">
                    <label for="days">Keep posts from last:</label>
                    <select id="days" name="days" required>
                        <option value="7">7 days</option>
                        <option value="14" selected>14 days</option>
                        <option value="30">30 days</option>
                        <option value="60">60 days</option>
                        <option value="90">90 days</option>
                        <option value="180">180 days</option>
                        <option value="365">1 year</option>
                        <option value="0">All posts</option>
                    </select>
                </div>
                <button type="submit">Clean Old Posts</button>
            </form>
            <div id="result"></div>
        </div>
        <div class="footer">
            Made with ♥️ for the Bluesky community • 
            <a href="https://github.com/yourusername/project" target="_blank" rel="noopener noreferrer" style="color: inherit;">
                Open Source
            </a>
			•
			<a href="/privacy" target="_blank" rel="noopener noreferrer" style="color: inherit;">
                Privacy Policy 
            </a>
        </div>
    </div>

    <script>
        document.getElementById('deleteForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const resultDiv = document.getElementById('result');
            const submitButton = e.target.querySelector('button');
            const daysValue = parseInt(document.getElementById('days').value);
            
            if (daysValue === 0) {
                if (!confirm('Are you sure you want to delete ALL your posts? This action cannot be undone.')) {
                    return;
                }
            }
            
            submitButton.disabled = true;
            submitButton.textContent = 'Processing...';
            resultDiv.style.display = 'none';
            
            try {
                const response = await fetch('/api', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        username: document.getElementById('username').value.replace('@', ''),
                        password: document.getElementById('password').value,
                        days: daysValue
                    })
                });
                
                const data = await response.json();
                
                resultDiv.style.display = 'block';
                if (response.ok) {
                    resultDiv.className = 'success';
                    resultDiv.textContent = data.message;
                } else {
                    resultDiv.className = 'error';
                    resultDiv.textContent = data.error || 'An error occurred';
                }
            } catch (error) {
                resultDiv.style.display = 'block';
                resultDiv.className = 'error';
                resultDiv.textContent = 'Failed to connect to the server';
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = 'Clean Old Posts';
            }
        });
    </script>
</body>
</html>
`

// Update the root route to serve the HTML page
app.get('/', (c) => c.html(mainPage))

// Your existing API route
app.post('/api', async (c) => {
  try {
    const { username, password, days = 14 } = await c.req.json()
    
    if (!username || !password) {
      return c.json({ 
        error: 'Username and password are required' 
      }, 400)
    }

    // Add rate limiting check (optional but recommended)
    const clientIP = c.req.header('CF-Connecting-IP') || 'unknown'
    const rateLimitKey = `ratelimit:${clientIP}`

    const agent = new BskyAgent({
      service: 'https://bsky.social'
    })
    
    await agent.login({
      identifier: username,
      password: password
    })

    const now = new Date()
    const cutoffDate = days === 0 ? new Date(0) : new Date(now.getTime() - (days * 24 * 60 * 60 * 1000))

    const response = await agent.getAuthorFeed({
      actor: username,
      limit: 100
    })

    let deletedCount = 0
    
    for (const post of response.data.feed) {
      const postDate = new Date(post.post.indexedAt)
      
      if (postDate < cutoffDate) {
        try {
          await agent.deletePost(post.post.uri)
          deletedCount++
        } catch (error) {
          console.error(`Failed to delete post: ${error}`)
        }
      }
    }

    const timeframeMessage = days === 0 ? 'all time' : `${days} days`
    
    return c.json({
      success: true,
      message: `Successfully deleted ${deletedCount} posts older than ${timeframeMessage}`,
      status: 'OK'
    })

  } catch (error) {
    console.error('Error:', error)
    return c.json({ 
      error: 'Failed to process request',
      details: error.message 
    }, 500)
  }
})

// Add this new route after your existing routes
app.get('/privacy', (c) => {
  const privacyPolicy = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Privacy Policy - Supprimer | The Bluesky Post Cleaner</title>
    <style>
        body {
            font-family: 'Inter', sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
            color: #333;
        }
        .container {
            background: white;
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        h1 {
            color: #0085FF;
            margin-bottom: 1.5rem;
        }
        h2 {
            color: #444;
            margin-top: 2rem;
        }
        .section {
            margin-bottom: 2rem;
        }
        .highlight {
            background-color: #e7f5ff;
            padding: 1rem;
            border-radius: 8px;
            margin: 1rem 0;
        }
        .footer {
            text-align: center;
            margin-top: 2rem;
            color: #666;
            font-size: 0.9rem;
        }
        a {
            color: #0085FF;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Privacy Policy</h1>
        
        <div class="section">
            <h2>Our Commitment to Privacy</h2>
            <p>
                Supprimer | The Bluesky Post Cleaner was created as a free alternative to Redacted's subscription model. 
                I believe in providing essential tools to the Bluesky community while respecting your privacy.
            </p>
        </div>

        <div class="section">
            <h2>Data Collection Policy</h2>
            <div class="highlight">
                <strong>I do not store any data.</strong> Period.
            </div>
            <p>
                When you use our service:
            </p>
            <ul>
                <li>Your credentials are used only to authenticate with Bluesky's API</li>
                <li>I never store your username or password</li>
                <li>I don't track your usage or maintain any logs</li>
                <li>All operations are performed in real-time and immediately discarded</li>
            </ul>
        </div>

        <div class="section">
            <h2>How It Works</h2>
            <p>
                The service:
            </p>
            <ul>
                <li>Connects directly to Bluesky's API using your provided credentials</li>
                <li>Performs the requested post deletion</li>
                <li>Immediately forgets all information once the operation is complete</li>
            </ul>
        </div>

        <div class="section">
            <h2>Security</h2>
            <p>
                To ensure your security:
            </p>
            <ul>
                <li>I recommend using an App Password instead of your main password</li>
                <li>All requests are processed over HTTPS</li>
                <li>The service runs on Cloudflare Workers, ensuring high security standards</li>
            </ul>
        </div>

        <div class="section">
            <h2>Open Source</h2>
            <p>
                This tool is open source. You can verify the privacy by reviewing the code on 
                <a href="https://github.com/yourusername/project" target="_blank" rel="noopener noreferrer">GitHub</a>.
            </p>
        </div>

        <div class="section">
            <h2>Contact</h2>
            <p>
                If you have any questions about this privacy policy or on the service, you can:
            </p>
            <ul>
                <li>Open an issue on our GitHub repository</li>
                <li>Contact me on Bluesky: <a href="https://bsky.app/profile/your.handle.bsky.social" target="_blank">@your.handle</a></li>
            </ul>
        </div>

        <div class="footer">
            <p>Last updated: ${new Date().toLocaleDateString()}</p>
            <p><a href="/">← Back to Post Cleaner</a></p>
        </div>
    </div>
</body>
</html>
  `
  return c.html(privacyPolicy)
})

export default app
