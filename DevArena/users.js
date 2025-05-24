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
