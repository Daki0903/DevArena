function getRooms() {
  return JSON.parse(localStorage.getItem("rooms") || "[]");
}

function saveRooms(rooms) {
  localStorage.setItem("rooms", JSON.stringify(rooms));
}

function createRoomObj(name, desc, owner) {
  return {
    id: Date.now().toString(),
    name,
    description: desc,
    owner,
    content: "",
    members: [owner],
  };
}

function addRoom(room) {
  const rooms = getRooms();
  rooms.push(room);
  saveRooms(rooms);
}

function updateRoomContent(roomId, content) {
  const rooms = getRooms();
  const room = rooms.find(r => r.id === roomId);
  if (room) {
    room.content = content;
    saveRooms(rooms);
  }
}

function joinRoom(roomId, username) {
  const rooms = getRooms();
  const room = rooms.find(r => r.id === roomId);
  if (room && !room.members.includes(username)) {
    room.members.push(username);
    saveRooms(rooms);
  }
}
