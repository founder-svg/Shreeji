// regal-farms-fix/public/admin-patch.js
// Replace the loginForm submit event listener in admin.js with this snippet:

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const email = normalizeEmail(loginEmail.value);
  const password = loginPassword.value;

  if (!email || !password) {
    setMessage("Please enter both email and password.", true);
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
        email, 
        username: email,
        password, 
        role: "shreeji" 
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (response.ok && data.success) {
      setLoggedIn(true);
      if (data.token) {
        sessionStorage.setItem("shreejiAdminToken", data.token);
      }
      setMessage("");
      await openAdminPanel();
    } else {
      setMessage(data.error || "Invalid email or password.", true);
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
  const token = sessionStorage.getItem("shreejiAdminToken");
  return {
    "Content-Type": "application/json",
    "x-admin-auth": "authorized",
    "x-admin-role": "shreeji",
    ...(token ? { "x-admin-token": token } : {})
  };
}
