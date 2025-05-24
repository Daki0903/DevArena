let currentUser = null;
let currentRoom = null;

// --- Login and Register ---

function login() {
  const username = document.getElementById("username").value.trim();
  const users = getUsers();

  if (!username) {
    alert("Please enter a username.");
    document.getElementById("username").focus();
    return;
  }

  if (users[username]) {
    currentUser = username;
    startApp();
  } else {
    alert("User not found!");
    document.getElementById("username").focus();
  }
}

function register() {
  const username = document.getElementById("username").value.trim();
  if (!username) {
    alert("Please enter a username.");
    document.getElementById("username").focus();
    return;
  }

  const users = getUsers();

  if (users[username]) {
    alert("Username taken!");
    document.getElementById("username").focus();
    return;
  }

  // Create new user with initial values
  users[username] = { level: 1, xp: 0 };
  localStorage.setItem("users", JSON.stringify(users));

  currentUser = username;
  startApp();
}

// --- Logout function ---

function logout() {
  currentUser = null;
  currentRoom = null;

  document.getElementById("auth-section").style.display = "block";
  document.getElementById("app").style.display = "none";

  document.getElementById("username").value = "";
  showSection("dashboard"); // reset view
  document.getElementById("username").focus();
}

// --- Start the main app interface ---

function startApp() {
  document.getElementById("auth-section").style.display = "none";
  document.getElementById("app").style.display = "block";

  document.getElementById("user").textContent = currentUser;

  updateUI();
  loadChallenge();
  updateLeaderboard();
  loadRooms();

  showSection("dashboard");
}

// --- User Data Helpers ---

function getUsers() {
  return JSON.parse(localStorage.getItem("users") || "{}");
}

function getUserData(username) {
  const users = getUsers();
  return users[username] || { level: 1, xp: 0 };
}

function saveUser(username, data) {
  const users = getUsers();
  users[username] = data;
  localStorage.setItem("users", JSON.stringify(users));
}

// --- Profile and XP Management ---

function updateUI() {
  const data = getUserData(currentUser);

  document.getElementById("level").textContent = data.level;
  document.getElementById("xp").textContent = data.xp;
  document.getElementById("xp-bar").value = data.xp;

  const badge =
    data.level >= 10 ? "🏆 Elite" :
    data.level >= 5 ? "🥈 Pro" :
    "🏅 Rookie";

  document.getElementById("badge").textContent = badge;

  // Update aria-valuenow for accessibility
  const xpBar = document.getElementById("xp-bar");
  xpBar.setAttribute("aria-valuenow", data.xp);
}

function gainXP(amount) {
  const data = getUserData(currentUser);
  data.xp += amount;

  if (data.xp >= 100) {
    data.xp -= 100;
    data.level++;
    alert("🎉 LEVEL UP!");
  }

  saveUser(currentUser, data);
  updateUI();
  updateLeaderboard();
}

// --- Code Battle ---

function submitCode() {
  const input = document.getElementById("code-editor").value.trim();

  if (!input.includes("return")) {
    alert("🔁 Your function must use 'return'");
    return;
  }

  try {
    // Create a function from input code, then call global test() from challenges.js
    const fn = new Function(input + "; return test();");
    const output = fn();

    if (output !== undefined && output === true) {
      alert("✅ Code passed!");
      gainXP(20);
      loadChallenge(); // load new challenge after success
    } else {
      alert("❌ Code failed.");
    }
  } catch (e) {
    alert("💥 Error in code!\n" + e.message);
  }
}

function loadChallenge() {
  if (!window.challenges || !Array.isArray(challenges) || challenges.length === 0) {
    document.getElementById("challenge-title").textContent = "No challenges available";
    document.getElementById("challenge-desc").textContent = "";
    document.getElementById("code-editor").value = "";
    return;
  }

  const c = challenges[Math.floor(Math.random() * challenges.length)];

  document.getElementById("challenge-title").textContent = c.title;
  document.getElementById("challenge-desc").textContent = c.description;
  document.getElementById("code-editor").value = c.template || "";
}

// --- Navigation ---

function showSection(id) {
  ["dashboard", "battle", "leaderboard", "rooms", "learn"].forEach((section) => {
    const el = document.getElementById(section);
    if (el) el.style.display = "none";
  });

  const toShow = document.getElementById(id);
  if (toShow) toShow.style.display = "block";

  if (id !== "rooms") {
    leaveRoom(); // Leave room if not in rooms section
  }

  if (id === "learn") {
    loadLearnContent();
  }
}

// --- Leaderboard ---

function updateLeaderboard() {
  const users = getUsers();

  const sortedUsers = Object.entries(users).sort(([, a], [, b]) => {
    if (b.level !== a.level) return b.level - a.level;
    return b.xp - a.xp;
  });

  const listHtml = sortedUsers
    .map(([user, data], index) => {
      return `<li><strong>#${index + 1}</strong> ${escapeHtml(user)} - Lv ${data.level} (${data.xp} XP)</li>`;
    })
    .join("");

  document.getElementById("leaderboard-list").innerHTML = listHtml;
}

// --- Rooms Feature ---

function getRooms() {
  return JSON.parse(localStorage.getItem("rooms") || "{}");
}

function saveRooms(rooms) {
  localStorage.setItem("rooms", JSON.stringify(rooms));
}

function loadRooms() {
  const rooms = getRooms();

  const roomsListHtml = Object.entries(rooms)
    .map(([roomName, roomData]) => {
      const messageCount = roomData.messages ? roomData.messages.length : 0;
      return `<li><button class="room-btn" onclick="joinRoom('${escapeJs(roomName)}')">${escapeHtml(roomName)} (${messageCount} messages)</button></li>`;
    })
    .join("");

  document.getElementById("rooms-list").innerHTML = roomsListHtml;

  document.getElementById("room-chat").style.display = "none";
  currentRoom = null;
}

function createRoom() {
  const name = document.getElementById("new-room-name").value.trim();
  const content = document.getElementById("new-room-content").value.trim();

  if (!name) {
    alert("Room name cannot be empty");
    return;
  }
  if (name.length > 30) {
    alert("Room name is too long (max 30 characters).");
    return;
  }
  if (!content) {
    alert("Room content cannot be empty");
    return;
  }
  if (content.length > 200) {
    alert("Room content is too long (max 200 characters).");
    return;
  }

  const rooms = getRooms();

  if (rooms[name]) {
    alert("Room name already taken!");
    return;
  }

  rooms[name] = {
    content,
    messages: [
      { user: "System", text: `Room "${name}" created. ${content}`, timestamp: Date.now() },
    ],
  };

  saveRooms(rooms);
  loadRooms();

  document.getElementById("new-room-name").value = "";
  document.getElementById("new-room-content").value = "";

  alert(`Room "${name}" created!`);
}

function joinRoom(name) {
  const rooms = getRooms();

  if (!rooms[name]) {
    alert("Room does not exist");
    return;
  }

  currentRoom = name;

  document.getElementById("room-title").textContent = name;
  renderRoomMessages();

  document.getElementById("room-chat").style.display = "block";
  const inputMsg = document.getElementById("room-message");
  inputMsg.value = "";
  inputMsg.focus();
}

function renderRoomMessages() {
  const rooms = getRooms();
  if (!currentRoom) return;

  const messages = rooms[currentRoom].messages || [];
  const container = document.getElementById("room-content");

  container.innerHTML = messages
    .map(m => {
      const time = new Date(m.timestamp || Date.now());
      const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `<p><strong>${escapeHtml(m.user)}</strong> <span class="timestamp">[${timeStr}]</span>: ${escapeHtml(m.text)}</p>`;
    }).join("");

  container.scrollTop = container.scrollHeight;
}

function sendRoomMessage() {
  if (!currentRoom) return alert("Join a room first!");

  const input = document.getElementById("room-message");
  const text = input.value.trim();

  if (!text) return;

  const rooms = getRooms();

  rooms[currentRoom].messages.push({
    user: currentUser,
    text,
    timestamp: Date.now(),
  });

  saveRooms(rooms);
  renderRoomMessages();

  input.value = "";
  input.focus();
}

function leaveRoom() {
  currentRoom = null;
  document.getElementById("room-chat").style.display = "none";
}

// --- Learn Section Content ---

function loadLearnContent() {
  const container = document.getElementById("learn-content");
  container.innerHTML = "";

  // Here you can add as many lessons as you want
  const lessons = [
    {
      title: "Python Basics",
      description: "Learn about variables, loops, and functions in Python.",
      example: `
# Python example:
def greet(name):
    return "Hello " + name

print(greet("World"))  # Output: Hello World
      `,
      questions: [
        "How do you define a function in Python?",
        "What does 'print' do?"
      ]
    },
    {
      title: "Lua Basics",
      description: "Learn basic Lua syntax, variables and functions.",
      example: `
-- Lua example:
function greet(name)
    return "Hello " .. name
end

print(greet("World"))  -- Output: Hello World
      `,
      questions: [
        "How do you concatenate strings in Lua?",
        "How do you define a function in Lua?"
      ]
    },
    {
      title: "JavaScript Basics",
      description: "Learn variables, functions and basic syntax in JavaScript.",
      example: `
/* JavaScript example */
function greet(name) {
  return "Hello " + name;
}

console.log(greet("World")); // Output: Hello World
      `,
      questions: [
        "How do you declare a function in JavaScript?",
        "What does 'console.log' do?"
      ]
    }
  ];

  lessons.forEach(lesson => {
    const lessonDiv = document.createElement("div");
    lessonDiv.className = "lesson";

    lessonDiv.innerHTML = `
      <h3>${lesson.title}</h3>
      <p>${lesson.description}</p>
      <pre>${lesson.example}</pre>
      <h4>Questions:</h4>
      <ul>${lesson.questions.map(q => `<li>${q}</li>`).join("")}</ul>
      <hr>
    `;

    container.appendChild(lessonDiv);
  });
}

// --- Utility: escape HTML for safety ---

function escapeHtml(text) {
  if (!text) return "";
  return text.replace(/[&<>"']/g, function (m) {
    return ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[m];
  });
}

function escapeJs(text) {
  if (!text) return "";
  return text.replace(/(['"\\])/g, "\\$1");
}

// --- Event Listeners ---

document.getElementById("login-btn").addEventListener("click", login);
document.getElementById("register-btn").addEventListener("click", register);
document.getElementById("logout-btn").addEventListener("click", logout);

document.getElementById("submit-code-btn").addEventListener("click", submitCode);

document.getElementById("create-room-btn").addEventListener("click", createRoom);
document.getElementById("send-room-message-btn").addEventListener("click", sendRoomMessage);

document.querySelectorAll(".nav-button").forEach(btn => {
  btn.addEventListener("click", (e) => {
    showSection(e.target.dataset.section);
  });
});

// Start on login screen
showSection("dashboard");
document.getElementById("username").focus();
