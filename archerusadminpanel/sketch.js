const CONNECTIONPROTOCOLS = {
  OPEN: 0,
  CLOSE: 1,
  LOGIN: 2
}
const PANELSTATE = {
  PRECONNECT: 40,
  LOGIN: 41,
  ADMIN: 42,
  ERROR: 43
}
const ADMINPROTOCOLS = {
  SENDANNOUNCEMENT: 1100,
  KICKPLAYER: 1101,
  CHANGEPLAYER: 1102,
  CHANGEBULLETDAMAGE: 1103,
  DELETEALLWALLS: 1104,
  DELETEWALL: 1105,
  ADDWALL: 1106,
  GETALLPLAYERS: 1107
}

// -----------------  SERVER STUFF
var myip = "192.168.1.100";
var port = 14785;
var ws = new WebSocket("ws:" + myip + ":" + port);
var panelState = PANELSTATE.PRECONNECT;

ws.onopen = function() {
  panelState = PANELSTATE.LOGIN;
};
ws.onmessage = function(msg) {
  parseMessage(msg);
};

ws.onclose = LoseConnection;
ws.onerror = LoseConnection;

function sendMessage(msg) {
  ws.send(msg);
}

function parseMessage(msg) {
  var msgSplit = msg.data.split(":");

  if (msgSplit[0] == ADMINPROTOCOLS.GETALLPLAYERS) {
    if (msgSplit.length == 1) {
      console.log("No player found in Server!");
      return;
    }

    console.log("----------" + new Date().toLocaleTimeString() + "---------- Güncel Player Bilgileri...");
    var playersSplit = msg.data.split("!");
    playersSplit[0] = playersSplit[0].substring(playersSplit[0].indexOf(":") + 1);
  
    for (let i = 0; i < playersSplit.length; i++) {
      //         return this.ip + ":" + this.id + ":" + this.name + ":" + this.posx + ":" + this.posy + ":" + 
      //  this.spd + ":" + this.health + ":" + this.maxHealth + ":" + this.kills + ":" + this.deaths + ":" + this.isDead;
      let playerSpecs = playersSplit[i].split(":");
      let player = {id: parseInt(playerSpecs[0]), ip: playerSpecs[1], name: playerSpecs[2], posX: parseFloat(playerSpecs[3]), posY: parseFloat(playerSpecs[4]),
                    spd: parseFloat(playerSpecs[5]), health: parseInt(playerSpecs[6]), maxHealth: parseInt(playerSpecs[7]), kills: parseInt(playerSpecs[8]),
                    deaths: parseInt(playerSpecs[9]), isDead: playerSpecs[10], arrows: parseInt(playerSpecs[11])};

      console.log(player);
    }
  }

  else if (msgSplit[0] == CONNECTIONPROTOCOLS.LOGIN) {
    if (ls_button) ls_button.remove();
    if (ls_pw) ls_pw.remove();
    as_announcementMsgInput = createInput().value("This is a Test Announcement!");
    as_announcementIntervalInput = createInput().size(30, 30).value("3000");
    as_announcementSizeInput = createInput().size(30, 30).value("32");
    as_announcementColor1Input = createInput().size(30, 30).value("255");
    as_announcementColor2Input = createInput().size(30, 30).value("0");
    as_announcementColor3Input = createInput().size(30, 30).value("0");
    as_announcementButton = createButton("Send");
    as_kickIDInput = createInput().size(30, 30).value("0");
    as_kickBanOrNotInput = createInput().size(20, 20).value("0");
    as_kickReasonInput = createInput("Yasaklama nedeni.");
    as_kickButton = createButton("Kick/Ban");
    as_getPlayerButton = createButton("Get All Players Info");
    panelState = PANELSTATE.ADMIN;
  }
    
  else if (msgSplit[0] == CONNECTIONPROTOCOLS.CLOSE) LoseConnection();
}

function LoseConnection() {
  if (ls_button) ls_button.remove();
  if (ls_pw) ls_pw.remove();
  if (as_announcementMsgInput) as_announcementMsgInput.remove();
  if (as_announcementIntervalInput) as_announcementIntervalInput.remove();
  if (as_announcementSizeInput) as_announcementSizeInput.remove();
  if (as_announcementColor1Input) as_announcementColor1Input.remove();
  if (as_announcementColor2Input) as_announcementColor2Input.remove();
  if (as_announcementColor3Input) as_announcementColor3Input.remove();
  if (as_announcementButton) as_announcementButton.remove();
  if (as_kickIDInput) as_kickIDInput.remove();
  if (as_kickBanOrNotInput) as_kickBanOrNotInput.remove();
  if (as_kickReasonInput) as_kickReasonInput.remove();
  if (as_kickButton) as_kickButton.remove();
  if (as_getPlayerButton) as_getPlayerButton.remove();

  panelState = PANELSTATE.ERROR;
}


// CLIENT STUFF
var ls_pw;
var ls_button;
var as_announcementMsgInput;
var as_announcementIntervalInput;
var as_announcementSizeInput;
var as_announcementColor1Input;
var as_announcementColor2Input;
var as_announcementColor3Input;
var as_announcementButton;

var as_kickIDInput;
var as_kickBanOrNotInput;
var as_kickReasonInput;
var as_kickButton;

var as_getPlayerButton;

function setup() {
  createCanvas(windowWidth, windowHeight);
  textAlign(CENTER);
  textSize(32);
}

function draw() {
  if (panelState == PANELSTATE.PRECONNECT) {
    background(255);
    text("Connecting to Server...", windowWidth/2, windowHeight/2);
  }
  else if (panelState == PANELSTATE.LOGIN) {
    background(127);
    text("Archerus Admin Panel", windowWidth/2, windowHeight/2 - 60);
    if (!ls_pw) ls_pw = createInput("themostsecurepasswordever");
    if (!ls_button) ls_button = createButton("login");

    ls_pw.position(windowWidth/2 - ls_pw.width/2, windowHeight/2 - ls_pw.height);
    ls_button.position(windowWidth/2 - ls_button.width + ls_pw.width/2 + 50, windowHeight/2 - ls_button.height);

    ls_button.mousePressed(function() {
      sendMessage(CONNECTIONPROTOCOLS.LOGIN + ":adminpanel:" + ls_pw.value());
      ls_button.hide();
    });
  }
  else if (panelState == PANELSTATE.ADMIN) {
    background(126, 45, 77);

    // Announcement
    text("Send Announcement", windowWidth/2, windowHeight/2 - 40);
    as_announcementMsgInput.position(windowWidth/2 - as_announcementMsgInput.width/2, windowHeight/2 - as_announcementMsgInput.height);
    as_announcementIntervalInput.position(windowWidth/2 - as_announcementSizeInput.width/2 + 40, windowHeight/2 - as_announcementSizeInput.height + 40);
    as_announcementSizeInput.position(windowWidth/2 - as_announcementSizeInput.width/2, windowHeight/2 - as_announcementSizeInput.height + 40);
    as_announcementColor1Input.position(windowWidth/2 - as_announcementColor1Input.width/2, windowHeight/2 - as_announcementColor1Input.height + 65);
    as_announcementColor2Input.position(windowWidth/2 - as_announcementColor2Input.width/2 + 30, windowHeight/2 - as_announcementColor2Input.height + 65);
    as_announcementColor3Input.position(windowWidth/2 - as_announcementColor3Input.width/2 + 60, windowHeight/2 - as_announcementColor3Input.height + 65);
    as_announcementButton.position(windowWidth/2 - as_announcementButton.width/2 + as_announcementMsgInput.width/2, windowHeight/2 - as_announcementButton.height + 30);

    as_announcementButton.mousePressed(function() {
      sendMessage(ADMINPROTOCOLS.SENDANNOUNCEMENT + ":" + as_announcementMsgInput.value() + ":" + as_announcementIntervalInput.value() + ":" + as_announcementSizeInput.value() + ":" + as_announcementColor1Input.value() + ":" +
                  as_announcementColor2Input.value() + ":" + as_announcementColor3Input.value());
      alert("Announcement Sent!");
    });

    // Get Players
    as_getPlayerButton.position(50, 50);
    as_getPlayerButton.mousePressed(function() {
      sendMessage(ADMINPROTOCOLS.GETALLPLAYERS);
    });

    // Kick Player
    as_kickIDInput.position(40, 110);
    as_kickBanOrNotInput.position(10, 150);
    as_kickReasonInput.position(40, 150);
    as_kickButton.position(40, 180);
    as_kickButton.mousePressed(function() {
      sendMessage(ADMINPROTOCOLS.KICKPLAYER + ":" + as_kickIDInput.value() + ":" + as_kickBanOrNotInput.value() + ":" + as_kickReasonInput.value());
      alert("Player Kicked!");
    });
  }
  else if (panelState == PANELSTATE.ERROR) {
    background(0);
    fill(255);
    text("Failed to Connect to the Server!", windowWidth/2, windowHeight/2 - 45);
    text("Press F5 to Refresh the Page!", windowWidth/2, windowHeight/2);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}