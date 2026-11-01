// regal-farms-fix/public/regal-patch.js
// Replace the loginForm submit event listener in regal.js with this snippet:

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const username = String(loginEmail.value || "").trim();
  const password = loginPassword.value;

  if (!username || !password) {
    setMessage("Please enter both username/email and password.", true);
    return;
  }

  const submitBtn = loginForm.querySelector("button[type='submit']");
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "AUTHENTICATING...";
  }

  try {
    const response = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        username, 
        email: username,
        password, 
        role: "regal" 
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (response.ok && data.success) {
      sessionStorage.setItem(SESSION_KEY, "true");
      if (data.token) {
        sessionStorage.setItem(TOKEN_KEY, data.token);
      }
      setMessage("");
      await openAdminPanel();
    } else {
      setMessage(data.error || "Invalid username or password.", true);
    }
  } catch (err) {
    console.error("Authentication error:", err);
    setMessage("Connection error. Please try again.", true);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "ENTER DASHBOARD";
    }
  }
});

// Also ensure getAdminAuthHeaders() returns consistent headers:
function getAdminAuthHeaders() {
  const token = sessionStorage.getItem(TOKEN_KEY);
  return {
    "Content-Type": "application/json",
    "x-admin-auth": "authorized",
    "x-admin-role": "regal",
    ...(token ? { "x-admin-token": token } : {})
  };
}

