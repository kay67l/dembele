// Check if the admin is logged in
if (localStorage.getItem("adminLoggedIn") !== "true") {
    window.location.href = "login.html";
}

// Logout
document.getElementById("logout").addEventListener("click", function () {

    if (confirm("Are you sure you want to logout?")) {

        localStorage.removeItem("adminLoggedIn");

        window.location.href = "login.html";
    }

});