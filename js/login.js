document.getElementById("loginForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const message = document.getElementById("message");

    // Temporary admin credentials
    const adminUser = "admin";
    const adminPass = "arsrc123";

    if (username === adminUser && password === adminPass) {
        message.style.color = "green";
        message.textContent = "Login successful!";

        // Save login session
        localStorage.setItem("adminLoggedIn", "true");

        // Open the dashboard
        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 1000);

    } else {
        message.style.color = "red";
        message.textContent = "Invalid username or password!";
    }
});