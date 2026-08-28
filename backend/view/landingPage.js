// backend/view/landingPage.js

export function getLandingPageHtml(frontendUrl) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Backend is live</title>
  <style>
    body {
      margin: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #0f0f0f;
      color: #f0f0f0;
    }
    .container {
      text-align: center;
    }
    h1 {
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
    }
    p {
      color: #aaa;
      margin-bottom: 1.5rem;
    }
    button {
      padding: 0.75rem 1.5rem;
      font-size: 1rem;
      border: none;
      border-radius: 8px;
      background: #4f46e5;
      color: white;
      cursor: pointer;
    }
    button:hover {
      background: #4338ca;
    }
    #countdown {
      font-weight: bold;
      color: #4f46e5;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Backend is live</h1>
    <p>Redirecting you to the app in <span id="countdown">5</span> seconds...</p>
    <button onclick="redirectNow()">Go to app now</button>
  </div>

  <script>
    const FRONTEND_URL = ${JSON.stringify(frontendUrl)};
    let secondsLeft = 5;
    const countdownEl = document.getElementById('countdown');

    function redirectNow() {
      window.location.href = FRONTEND_URL;
    }

    const timer = setInterval(() => {
      secondsLeft -= 1;
      countdownEl.textContent = secondsLeft;
      if (secondsLeft <= 0) {
        clearInterval(timer);
        redirectNow();
      }
    }, 1000);
  </script>
</body>
</html>
  `;
}