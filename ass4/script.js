
let form = document.getElementById("loginForm");
let username = document.getElementById("username");
let password = document.getElementById("password");
let message = document.getElementById("message");
let showPassword = document.getElementById("showPassword");

// Show or hide password
showPassword.addEventListener("change", function () {
    if (showPassword.checked) {
        password.type = "text";
    } else {
        password.type = "password";
    }
});

// Validate login form
form.addEventListener("submit", function (event) {
    event.preventDefault();

    let user = username.value.trim();
    let pass = password.value;

    if (user === "" || pass === "") {
        message.textContent = "Please fill in all fields!";
        message.style.color = "red";
    } else if (user === "student" && pass === "12345") {
        message.textContent = "Login successful!";
        message.style.color = "green";
    } else {
        message.textContent = "Invalid username or password!";
        message.style.color = "red";
    }
});
