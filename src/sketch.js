// ---------------------------- ENUMS
const CONNECTIONSTATE = {
  CONNECTING: 0,
  CONNECTED: 1,
  ERROR: 2
}
const GAMESTATE = {
  LOADING: 0,
  FAILED: 1,
  STARTSCREEN: 2,
  GAME: 3,
  KICKED: 4
}
const CONNECTIONPROTOCOLS = {
  OPEN: 0,
  CLOSE: 1,
  LOGIN: 2,
  MSG: 3,
  ANNOUNCEMENT: 4,
  KICK: 5
}
const ACTIONPROTOCOLS = {
  MOVELEFT: 6,
  MOVERIGHT: 7,
  JUMP: 8,
  SHOOT: 9,
  SLIDE: 10,
  DIE: 11,
  GETHIT: 12,
  SPAWN: 13,
  NEWPLAYER: 14,
  PLAYERLEFT: 15,
  POSITIONUPDATE: 16
}
const GAMEPROTOCOLS = {
  GAMESTATE: 17,
  GAMEEND: 18,
  GAMESTART: 19,
  GAMEFIRSTTIMEENTER: 20
}
const DEATHPROTOCOLS = {
  FELLDOWN: -1
}


// -----------------  SERVER STUFF
var myip = "192.168.1.100";
var port = 14785;
var ws = new WebSocket("ws:" + myip + ":" + port);
var connectionState = CONNECTIONPROTOCOLS.CONNECTING;

ws.onopen = function() {
  connectionState = CONNECTIONSTATE.CONNECTED;
  sendMessage(CONNECTIONPROTOCOLS.OPEN);
};
ws.onmessage = function(msg) {
  parseMessage(msg);
};
ws.onclose = function() {
  connectionState = CONNECTIONSTATE.ERROR;
};
ws.onerror = function(msg) {
  connectionState = CONNECTIONSTATE.ERROR;
};

function sendMessage(msg) {
  ws.send(msg);
}

function parseMessage(msg) {
  var msgSplit = msg.data.split(":");
  
  if (msgSplit[0] == GAMEPROTOCOLS.GAMESTATE) {
    // 16:tests:test!hi:xd -> tests:test!hi:xd -> [tests,test] [hi,xd]
    var _typesSplit = msg.data.split("&");
    var _playersSplit = _typesSplit[0].substr(_typesSplit[0].indexOf(":") + 1).split("!");
    var _wallsSplit = _typesSplit[1].split("!");

    // Players
    for (let i = 0; i < _playersSplit.length; i++) {
      let _playerSpecs = _playersSplit[i].split(":");

      for (let j = 0; j < players.length; j++) {
        if (players[j].id == parseInt(_playerSpecs[0])) {
          players[j].nick = _playerSpecs[1];
          players[j].health = parseInt(_playerSpecs[4]);
          players[j].maxHealth = parseInt(_playerSpecs[5]);
          players[j].kills = parseInt(_playerSpecs[6]);
          players[j].deaths = parseInt(_playerSpecs[7]);
          players[j].spd = parseFloat(_playerSpecs[8]);
          players[j].arrows = parseInt(_playerSpecs[9]);
          
          if (!players[j].canControl) 
            players[j].pos.x = parseFloat(_playerSpecs[2]),
            players[j].pos.y = parseFloat(_playerSpecs[3]);
            players[j].angle = parseFloat(_playerSpecs[10]);
        }
      }
    }

    // Walls
    for (let i = 0; i < _wallsSplit.length; i++) {
      let _wallsSpecs = _wallsSplit[i].split(":");
      for (let j = 0; j < walls.length; j++) {
        if (walls[j].id == parseInt(_wallsSpecs[0]))
          walls[j].vspd = parseFloat(_wallsSpecs[3]),
          walls[j].hspd = parseFloat(_wallsSpecs[4]),
          walls[j].pos.x = parseFloat(_wallsSpecs[1]),
          walls[j].pos.y = parseFloat(_wallsSpecs[2]);
      }
    }
  }
  else if (msgSplit[0] == CONNECTIONPROTOCOLS.MSG) {
    chatBoxMessages.unshift(new ChatMessage(msgSplit[1], msgSplit[2], Date.now() + 16000));
  }
  else if (msgSplit[0] == CONNECTIONPROTOCOLS.KICK) {
    let banned = parseInt(msgSplit[1]);
    let reason = msgSplit[2];

    kickReason = "You have been " + (banned == 0 ? "Kicked": "Banned") + "!\nReason: " + reason;
    gameState = GAMESTATE.KICKED;
    
    if (myCharacter)
      clearInterval(myCharacter.positionSendInterval);
    ws.close();
  }
  else if (msgSplit[0] == CONNECTIONPROTOCOLS.ANNOUNCEMENT) {
    announcement = new Announcement(msgSplit[1], Date.now() + parseInt(msgSplit[2]), parseInt(msgSplit[3]),
                                    parseInt(msgSplit[4]), parseInt(msgSplit[5]), parseInt(msgSplit[6]));
  }
  else if (msgSplit[0] == GAMEPROTOCOLS.GAMEFIRSTTIMEENTER) {
    // 16:tests:test!hi:xd -> tests:test!hi:xd -> [tests,test] [hi,xd]
    var _typesSplit = msg.data.split("&");
    var _playersSplit = _typesSplit[0].substr(_typesSplit[0].indexOf(":") + 1).split("!");
    var _wallsSplit = _typesSplit[1].split("!");

    // Players
    for (let i = 0; i < _playersSplit.length; i++) {
      let _playerSpecs = _playersSplit[i].split(":");
      new Archer(parseInt(_playerSpecs[0]), _playerSpecs[1], parseFloat(_playerSpecs[2]), 
      parseFloat(_playerSpecs[3]), parseInt(_playerSpecs[4]), parseInt(_playerSpecs[5]), parseInt(_playerSpecs[6]), parseInt(_playerSpecs[7]), parseFloat(_playerSpecs[8]), parseInt(_playerSpecs[9]));
    }

    // Walls
    for (let i = 0; i < _wallsSplit.length; i++) {
      let _wallsSpecs = _wallsSplit[i].split(":");
      if (_wallsSpecs.length == 5) // Static Wall
        new Wall(parseInt(_wallsSpecs[0]), parseFloat(_wallsSpecs[1]), parseFloat(_wallsSpecs[2]), parseInt(_wallsSpecs[3]), parseInt(_wallsSpecs[4]), false);
      else
        new Wall(parseInt(_wallsSpecs[0]), parseFloat(_wallsSpecs[1]), parseFloat(_wallsSpecs[2]), parseInt(_wallsSpecs[3]), parseInt(_wallsSpecs[4]), true, parseFloat(_wallsSpecs[5]), parseFloat(_wallsSpecs[6]));
    }
  }
  else if (msgSplit[0] == CONNECTIONPROTOCOLS.LOGIN) {
    document.documentElement.style.cursor = "NONE";
    
    ss_errorMsg = null;
    ss_loginMsg = null;
    ss_input.remove();
    ss_button.remove();
    ss_input = null;
    ss_button = null;
    myID = parseInt(msgSplit[1]);
    gameWidth = parseInt(msgSplit[2]);
    gameHeight = parseInt(msgSplit[3]);
    gameState = GAMESTATE.GAME;
  }
  else {
    if (msgSplit[0] == CONNECTIONPROTOCOLS.OPEN) return;

    else if (msgSplit[0] == ACTIONPROTOCOLS.NEWPLAYER)
      new Archer(parseInt(msgSplit[1]), msgSplit[2], parseFloat(msgSplit[3]), parseFloat(msgSplit[4]), parseInt(msgSplit[5]), parseInt(msgSplit[6]), parseInt(msgSplit[7]), parseInt(msgSplit[8]), parseFloat(msgSplit[9]), parseInt(msgSplit[10]));
    
    let actor;
    let actorID = msgSplit[1];
    for (let i = 0; i < players.length; i++)
      if (actorID == players[i].id)
        actor = players[i];


    if (!actor) {
      console.log("NO ACTOR FOUND WHAT?!");
      return;
    }

    if (msgSplit[0] == ACTIONPROTOCOLS.MOVELEFT)
      actor.moveLeft();
    else if (msgSplit[0] == ACTIONPROTOCOLS.MOVERIGHT)
      actor.moveRight();
    else if (msgSplit[0] == ACTIONPROTOCOLS.JUMP)
      actor.jump();
    else if (msgSplit[0] == ACTIONPROTOCOLS.SHOOT) {
      if (actor.arrows > 0) actor.arrows--;
      new Projectile(new Point(parseFloat(msgSplit[2]), parseFloat(msgSplit[3])), parseFloat(msgSplit[4]), 50, parseInt(msgSplit[1]));
    }
    else if (msgSplit[0] == ACTIONPROTOCOLS.SLIDE)
      actor.tryToLand();
    else if (msgSplit[0] == ACTIONPROTOCOLS.DIE)
      actor.die(parseInt(msgSplit[2]));
    else if (msgSplit[0] == ACTIONPROTOCOLS.GETHIT)
      actor.takeDamage(parseInt(msgSplit[2]));
    else if (msgSplit[0] == ACTIONPROTOCOLS.SPAWN)
      actor.respawn(parseFloat(msgSplit[2]), parseFloat(msgSplit[3]));
    else if (msgSplit[0] == ACTIONPROTOCOLS.PLAYERLEFT) {
      if (msgSplit.length == 4) {
        if (parseInt(msgSplit[2]) == 0) // kick
          new EventMessage(actor.nick + " was KICKED! (" + msgSplit[3] + ")", 8000);
        else if (parseInt(msgSplit[2]) == 1) // ban
          new EventMessage(actor.nick + " was BANNED! (" + msgSplit[3] + ")", 8000);
      }

      actor.toBeRemoved = true;
    }
  }
}

//---------------------------------------------------------------------------------------------------------------------------------------------------------
//---------------------------------------------------------------------------------------------------------------------------------------------------------
//---------------------------------------------------------------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------  CLIENT STUFF -----------------------------------------------------------------

// Start Screen
var ss_input;
var ss_button;
var ss_errorMsg;
var ss_errorEndTimer;
var ss_errorInterval = 3000;
var ss_loginMsg;
var ss_loginEndTimer;
var ss_loginInterval = 20000;
var ss_i = 0;

// Preload Variables
var gameState = GAMESTATE.LOADING;
var cursorIndex = 0;
var bgIndex = 0;
var img_archerHead;
var img_archerBody;
var img_archerWeapon;
var img_archerHeadReversed;
var img_archerWeaponReversed;
var img_bg;
var img_bgImages = [];
var img_cursor;
var img_cursorImages = [];
var img_cursor1, img_cursor2, img_cursor3, img_cursor4, img_cursor5, img_cursor6, img_cursor7, img_cursor8;
var img_announcebg;
var img_quiver;
var sfx_hit1, sfx_hit2;
var sfx_release1, sfx_release2;

var myCharacter = null;
var entityList = [];
var players = [];
var walls = [];
var myID = -1;

// Statistics
var lb_first;
var lb_second;
var lb_third;

// Game Variables
var mainCam;
var gameWidth = 0;
var gameHeight = 0;
var deathMessage;
var deathMessageSize = 4;
var eventHistory = [];
var announcement;
var kickReason;

// Chatbox
var chatBoxMaxMessageCount = 6;
var chatBoxOpen = false;
var chatBoxBG;
var chatBoxInput;
var chatBoxButton;
var chatBoxMessages = [];


// To load images
function preload() {
  img_archerHead = loadImage("sprites/character/archerHead.png");
  img_archerBody = loadImage("sprites/character/archerBody.png");
  img_archerWeapon = loadImage("sprites/character/archerWeapon.png");
  img_archerHeadReversed = loadImage("sprites/character/archerHeadReversed.png");
  img_archerWeaponReversed = loadImage("sprites/character/archerWeaponReversed.png");
  img_bgImages.push(loadImage("sprites/bg/bg1.png"));
  img_bgImages.push(loadImage("sprites/bg/bg2.png"));
  img_bgImages.push(loadImage("sprites/bg/bg3.png"));
  img_bgImages.push(loadImage("sprites/bg/bg4.png"));
  img_bgImages.push(loadImage("sprites/bg/bg5.png"));
  img_bgImages.push(loadImage("sprites/bg/bg6.png"));
  img_bgImages.push(loadImage("sprites/bg/bg7.png"));
  img_bgImages.push(loadImage("sprites/bg/bg8.png"));
  img_bgImages.push(loadImage("sprites/bg/bg9.png"));
  img_cursor1 = loadImage("sprites/cursors/cursor1.png");
  img_cursor2 = loadImage("sprites/cursors/cursor2.png");
  img_cursor3 = loadImage("sprites/cursors/cursor3.png");
  img_cursor4 = loadImage("sprites/cursors/cursor4.png");
  img_cursor5 = loadImage("sprites/cursors/cursor5.png");
  img_cursor6 = loadImage("sprites/cursors/cursor6.png");
  img_cursor7 = loadImage("sprites/cursors/cursor7.png");
  img_cursor8 = loadImage("sprites/cursors/cursor8.png");
  img_announcebg = loadImage("sprites/ui/announcebg.png");
  img_quiver = loadImage("sprites/ui/quiver.png");
  img_bg = img_bgImages[bgIndex];
  sfx_hit1 = loadSound("sounds/hit1.mp3");
  sfx_hit2 = loadSound("sounds/hit2.mp3");
  sfx_release1 = loadSound("sounds/release1.mp3");
  sfx_release2 = loadSound("sounds/release2.mp3");
}

function setup() {
  createCanvas(windowWidth - 10, windowHeight - 10);
  rectMode(CENTER);
  imageMode(CENTER);
  strokeWeight(8);
  textAlign(CENTER);

  img_cursorImages.push(img_cursor1);
  img_cursorImages.push(img_cursor2);
  img_cursorImages.push(img_cursor3);
  img_cursorImages.push(img_cursor4);
  img_cursorImages.push(img_cursor5);
  img_cursorImages.push(img_cursor6);
  img_cursorImages.push(img_cursor7);
  img_cursorImages.push(img_cursor8);
  img_cursor = img_cursorImages[0];
}

function draw() {
  // Connection/Game States
  if (gameState != GAMESTATE.KICKED && connectionState == CONNECTIONSTATE.ERROR) 
    gameState = GAMESTATE.FAILED;

  if (gameState == GAMESTATE.LOADING) {
    background(255);
    textSize(32);
    textAlign(CENTER);
    text("Trying to Connect to the Server", windowWidth/2, windowHeight/2);

    if (connectionState == CONNECTIONSTATE.CONNECTED)
      gameState = GAMESTATE.STARTSCREEN;
  }
  else if (gameState == GAMESTATE.STARTSCREEN) {
    background(127);
    textSize(36);
    
    push();
    strokeWeight(20);
    stroke(ss_i%256, 255, 12);
    fill(12, 255, ss_i%256);
    ellipse(windowWidth/2 + ss_i % 400, windowHeight/2 - ss_i % 200, ss_i++ % 12);
    ellipse(windowWidth/2 - ss_i % 400, windowHeight/2 + ss_i % 200, ss_i % 16);
    ellipse(windowWidth/2 + ss_i % 400, windowHeight/2 + ss_i % 200, ss_i++ % 8);
    ellipse(windowWidth/2 - ss_i % 400, windowHeight/2 - ss_i % 200, ss_i % 18);

    ellipse(windowWidth/2 + ss_i % 800, windowHeight/2 - ss_i % 400, ss_i % 24);
    ellipse(windowWidth/2 - ss_i % 800, windowHeight/2 + ss_i % 400, ss_i++ % 32);
    ellipse(windowWidth/2 + ss_i % 800, windowHeight/2 + ss_i % 400, ss_i % 16);
    ellipse(windowWidth/2 - ss_i % 800, windowHeight/2 - ss_i % 400, ss_i++ % 36);

    ellipse(windowWidth/2 + ss_i % 100, windowHeight/2 - ss_i % 800, ss_i % 24);
    ellipse(windowWidth/2 - ss_i % 100, windowHeight/2 + ss_i % 800, ss_i++ % 32);
    ellipse(windowWidth/2 + ss_i % 100, windowHeight/2 + ss_i % 800, ss_i % 16);
    ellipse(windowWidth/2 - ss_i % 100, windowHeight/2 - ss_i % 800, ss_i++ % 36);

    stroke(ss_i%192 + 64, ss_i % 16, ss_i % 32);
    line(windowWidth/2 - ss_i++ % windowWidth/2, windowHeight/2, windowWidth/2 -ss_i + 5, windowHeight/2);
    line(windowWidth/2 + ss_i++ % windowWidth/2, windowHeight/2, windowWidth/2 + ss_i + 5, windowHeight/2);
    pop();
    textAlign(LEFT);

    textAlign(CENTER);
    text("Choose a Nick", windowWidth/2, windowHeight/2 - 40);
    if (!ss_input) ss_input = createInput();
    ss_input.position(windowWidth/2 - ss_input.width/2, windowHeight/2 - ss_input.height);
    
    if (!ss_button) ss_button = createButton("play");
    ss_button.position(windowWidth/2 - ss_button.width + ss_input.width/2 + 50, windowHeight/2 - ss_button.height);

    if (ss_errorMsg) {
      if (Date.now() > ss_errorEndTimer)
        ss_errorMsg = null;
      else {
        push();
        textSize(16);
        fill(255, 0, 0);
        stroke(0);
        text(ss_errorMsg, windowWidth/2, 80);
        pop();
      }
    }

    if (ss_loginMsg) {
      if (Date.now() > ss_loginEndTimer) {
        ss_loginMsg = null;
        ss_button.show();
        ss_errorMsg = "Couldn't Log-in to the server. Request Timed out!";
        ss_errorEndTimer = Date.now() + ss_errorInterval + 2000;
      }
      else {
        push();
        textSize(32);
        fill(255, 0, 0);
        stroke(0);
        text(ss_loginMsg, windowWidth/2, 80);
        pop();
      }
    }

    var tryToLogIn = function() {
      if (ss_input.value().length > 24 || ss_input.value().length < 2 || ss_input.value().substr(0, 2) == "  ") {
        ss_errorMsg = "ERROR: Your nick should contain at least 2 and max of 24 characters!";
        ss_errorEndTimer = Date.now() + ss_errorInterval;
        return;
      }
      if (ss_input.value().indexOf("&") != -1 || ss_input.value().indexOf("!") != -1 || ss_input.value().indexOf(":") != -1 || ss_input.value().substr(0, 1) == " ") {
        if (ss_input.value().substr(0, 1) == " ") ss_input.value("");
        ss_errorMsg = "ERROR: Your nick has illegal characters!";
        ss_errorEndTimer = Date.now() + ss_errorInterval;
        return;
      }

      sendMessage(CONNECTIONPROTOCOLS.LOGIN + ":" + ss_input.value());
      ss_errorMsg = null;
      ss_button.hide();
      ss_loginMsg = "Trying to Log-in!";
      ss_loginEndTimer = Date.now() + ss_loginInterval;
    };
    
    ss_button.mousePressed(tryToLogIn);
    if (keyIsDown(13)) tryToLogIn();
  }
  else if (gameState == GAMESTATE.GAME) {
    background(192);
    image(img_bg, windowWidth/2, windowHeight/2, windowWidth, windowHeight);

    if (!mainCam && myCharacter)
      mainCam = new Camera(0, 0, myCharacter);
    if (mainCam) mainCam.move();
    
    // Draw all Entities
    for(let i = 0; i < entityList.length; i++) {
      if (entityList[i].toBeRemoved || entityList[i].draw()) { 
        if (entityList[i].isAnArcher) {
          for (let j = 0; j < players.length; j++)
            if (players[j].id == entityList[i].id)
              players.splice(j, 1);
        }
        else if (entityList[i].isAWall) {
          for (let j = 0; j < walls.length; j++)
            if (walls[j].id == entityList[i].id)
              walls.splice(j, 1);
        }

        entityList[i].die();
        entityList.splice(i, 1);
      }
    }

    // Stats
    if (myCharacter) {
      push();
      textAlign(LEFT);
      text("Q ile İmleç, E ile Arkaplan Değişir", 30, 30);
      text("Mousela tıkladığınız yere Ok Atar.", 30, 50);
      pop();
    }

    // Event History
    let timeNow = Date.now();

    push();
    textAlign(RIGHT);
    textSize(32);
    
    for (let i = 0; i < eventHistory.length; i++)
      if (timeNow > eventHistory[i].deathTime)
        eventHistory.splice(i, 1);
      else
        text(eventHistory[i].msg, windowWidth - 40, windowHeight - (i + 1) * 30);
    pop();

    // Death Screen
    if (deathMessage && myCharacter && myCharacter.dead) {
      push();
      stroke(0);
      fill(255, 0, 0);
      textSize(deathMessageSize);

      if (deathMessage.length > 25 && deathMessageSize++ > 48)
        deathMessageSize = 49;
      else if (deathMessage.length > 16 && deathMessageSize++ > 64)
        deathMessageSize = 65;
      else if (deathMessage.length < 17 && deathMessageSize++ > 96)
        deathMessageSize = 97;

      text(deathMessage, windowWidth/2, windowHeight/2);
      pop();
    }

    // Leaderboard
    push();
    textAlign(RIGHT);
    textSize(32);
    if (lb_first)
      text("1. " + lb_first.nick + " (" + lb_first.kills + "/" + lb_first.deaths + ")", windowWidth - 40, 20);
    if (lb_second)
      text("2. " + lb_second.nick + " (" + lb_second.kills + "/" + lb_second.deaths + ")", windowWidth - 40, 50);
    if (lb_third)
      text("3. " + lb_third.nick + " (" + lb_third.kills + "/" + lb_third.deaths + ")", windowWidth - 40, 80);
    pop();

    // Chatbox
    push();
    if (chatBoxOpen) { // Background
      fill('rgba(75, 211, 21, 0.3)');
      noStroke();
      rect(10 + windowWidth/4, windowHeight - 120, windowWidth/2, 300);
      chatBoxInput.size(windowWidth/2 - 10, 30);
      chatBoxInput.position(10, windowHeight - 40);
      chatBoxButton.position(windowWidth/2 - chatBoxButton.width/2 - 10, windowHeight - 40);
    }
    
    textAlign(LEFT);
    textSize(24);
    fill(0);
    for (let i = 0; i < chatBoxMessages.length; i++) {
      if (Date.now() > chatBoxMessages[i].deathTimer) {
        chatBoxMessages.splice(i, 1);
        continue;
      }
      
      if (i > chatBoxMaxMessageCount) break;
      if (Date.now() + 5000 > chatBoxMessages[i].deathTimer) fill('rgba(0, 0, 0, 0.6)');
      text(chatBoxMessages[i].name + ": " + chatBoxMessages[i].msg, 10, windowHeight - 50 - i*30);
    }
    pop();

    // Quiver
    image(img_quiver, windowWidth/2 - 36, windowHeight - 64, 48, 64);
    if (myCharacter && myCharacter.arrows)
      text(myCharacter.arrows, windowWidth/2, windowHeight - 64);
    
    // Cursor
    if (cursorIndex == 4 || cursorIndex == 5)
      image(img_cursor, mouseX, mouseY, 64, 64);
    else
      image(img_cursor, mouseX, mouseY, 48, 48);
  }
  else if (gameState == GAMESTATE.FAILED) {
    if (ss_input) ss_input.remove(), ss_input = null;
    if (ss_button) ss_button.remove(), ss_button = null;

    background(0);
    fill(255);
    text("Couldn't Connect to the Server or Lost Connection!", windowWidth/2, windowHeight/2);
    text("Press F5 to reload the page!", windowWidth/2, windowHeight/2 + 40);

    // Cursor
    image(img_cursor, mouseX, mouseY, 64, 64);
  }
  else if (gameState == GAMESTATE.KICKED) {
    background(255);
    textSize(64);
    fill(0);
    text(kickReason, windowWidth/2, windowHeight/2);

    image(img_cursor, mouseX, mouseY, 64, 64);
  }

  // Announcement Handler
  if (announcement)
    announcement.draw();
}

function windowResized() {
  resizeCanvas(windowWidth - 10, windowHeight - 10);

  if (mainCam)
    mainCam.xMaxOffset = gameWidth - windowWidth,
    mainCam.yMaxOffset = gameHeight - windowHeight;
}

function mouseClicked() {
  if (gameState != GAMESTATE.GAME || myCharacter.dead || !mainCam || myCharacter.arrows < 1) return;

  let angle = GetAngle(new Point(myCharacter.pos.x - mainCam.xOffset, myCharacter.pos.y - mainCam.yOffset - 30), new Point(mouseX, mouseY));
  sendMessage(ACTIONPROTOCOLS.SHOOT + ":" + myCharacter.pos.x + ":" + (myCharacter.pos.y - 30) + ":" + angle);
}

function keyPressed() {
  // Cursor Swap
  if (keyCode == 81 && gameState == GAMESTATE.GAME && !chatBoxOpen) { // Q
    if (++cursorIndex >= img_cursorImages.length)
      cursorIndex = 0;
    img_cursor = img_cursorImages[cursorIndex];
  }

  // Background Swap
  if (keyCode == 69 && gameState == GAMESTATE.GAME && !chatBoxOpen) { // E
    if (++bgIndex >= img_bgImages.length)
      bgIndex = 0;
    img_bg = img_bgImages[bgIndex];
  }

  // ChatBox
  if ((keyCode == 9 || keyCode == 13) && gameState == GAMESTATE.GAME) { // Enter
    if (!chatBoxInput) { 
      chatBoxInput = createInput();
      chatBoxInput.elt.onblur = CloseChatBox;
    }
    if (!chatBoxButton) chatBoxButton = createButton("Send").size(60, 40).mousePressed(SendChatMessage);
    
    if (!chatBoxOpen)
      chatBoxOpen = true,
      chatBoxInput.show(),
      chatBoxInput.elt.focus(),
      chatBoxButton.show();
    else
      SendChatMessage();

    return false; // Prevent Normal Behaviour
  }
}

function CloseChatBox() {
  chatBoxOpen = false;
  chatBoxInput.hide();
  chatBoxButton.hide();
  chatBoxInput.value("");
}

function SendChatMessage() {
  let inputValue = chatBoxInput.value();

  CloseChatBox();
  if (inputValue.length < 1) return;
  if (inputValue.length > 64) inputValue = inputValue.substring(0, 63);

  let msg = inputValue.replace(":", ";");
  if (myCharacter) sendMessage(CONNECTIONPROTOCOLS.MSG + ":" + myCharacter.nick + ":" + msg);
}

function GetAngle(a, b) {
  return Math.atan2(b.y - a.y, b.x - a.x);
}

function CollisionPointRect(p, bcd) {
  if (p.x > bcd.pos.x - bcd.w/2 && p.x < bcd.pos.x + bcd.w/2 &&
      p.y > bcd.pos.y - bcd.h/2 && p.y < bcd.pos.y + bcd.h/2) return true;
}

function CollisionLineRect(lcd, bcd) {
  if (CollisionPointRect(lcd.pos, bcd)) return 1;
  if (CollisionPointRect(lcd.midPoint, bcd)) return 2;
  if (CollisionPointRect(lcd.endPoint, bcd)) return 3;

  return 0;
}

class Entity {
  constructor(id) {
    this.id = id;
    this.pos = new Point();
    this.rot = 0;
    this.vspd = 0;
    this.hspd = 0;
    this.isAnArcher = false;
    
    this.toBeRemoved = false;
    entityList.push(this);
  }

  draw() {}
  die() {}
}

class Archer extends Entity{
  constructor(id, nick, posx, posy, health, maxhealth, kills, deaths, spd = 6, arrows = 40) {
    super(id);
    this.isAnArcher = true;
    this.nick = nick;
    this.pos.x = posx;
    this.pos.y = posy;
    this.spd = spd;
    this.arrows = arrows;
    this.jspd = 0; //jump speed
    this.angle = 0;
    this.canControl = id == myID ? true : false;
    this.col = new BoxCollider(this.pos.x, this.pos.y, 64, 100, this.id);
    this.footCol = new LineCollider(this.pos.x - 20, this.pos.y + 38, 0, 40, this.id);

    this.gravity = 0;
    this.maxGravity = 9.6;
    this.isGrounded = false;

    this.maxHealth = maxhealth;
    this.health = health;
    this.dead = false;

    this.kills = kills;
    this.deaths = deaths;
    this.positionSendInterval = null;

    if (this.canControl) {
      myCharacter = this;
      this.positionSendInterval = setInterval(() => { this.sendPosition(); }, 30);
    }
    
    new EventMessage(this.nick + " joined server.", 5250);
    players.push(this);
  }

  sendPosition() {
    if (!this.canControl || this.dead || gameState == GAMESTATE.KICKED) return;

    sendMessage(ACTIONPROTOCOLS.POSITIONUPDATE + ":" + this.pos.x + ":" + this.pos.y + ":" + this.angle);
  }

  respawn(x, y) {
    if (this.canControl) deathMessage = "", deathMessageSize = 4;
    new EventMessage(this.nick + " respawned.", 3000);

    this.jspd = 0;
    this.gravity = 0;
    this.health = this.maxHealth;
    this.dead = false;
    this.pos.x = x;
    this.pos.y = y;
  }
  
  die(deathByID = -1) {
    var killer;
    if (deathByID != -1) // If not fell to magma...
      for (let i = 0; i < players.length; i++)
        if (players[i].id == deathByID)
          killer = players[i];
    
    let killerNick = killer ? killer.nick : "hayat";
    new EventMessage(killerNick + " killed " + this.nick + "!", 5750);

    if (this.canControl) {
      let deathMessages = [killerNick + ": kapılma rüzgarıma, sen de aldanırsın.", "sen batan bir güneş, ben yollarda çilekeş...", "TA TA TA, öldün çık", 
                          killerNick + ": dostum olmaz düşmanım yaşamaz.", "4 8 15 16 23 42", "WASTED", "You are dead...", "dont stop me nowwww",
                          "im on a streak OF DYING!", killerNick + ": ez"];

      deathMessage = deathMessages[Math.floor(Math.random() * deathMessages.length)];
    }

    this.deaths++;
    if (killer) { 
      killer.kills++;
    }
    
    this.dead = true;
    // play death animation?
    new Explosion(new Point(this.pos.x, this.pos.y), 1750, 16, [255, 0, 0]);
    this.pos.x = -3000;
    this.col.pos.x = -3000;
    this.footCol.pos.x = -3000;
  }

  takeDamage(dmg) {
    this.health -= dmg;
  }

  draw() {
    if (this.dead)
      return;

    if (this.canControl)
      this.angle = GetAngle(new Point(this.pos.x - mainCam.xOffset, this.pos.y - mainCam.yOffset), new Point(mouseX, mouseY));

    this.movement();
    
    // Health Bar
    push();
    stroke(0);
    strokeWeight(2);
    rect(this.pos.x - mainCam.xOffset - 6, this.pos.y - 75 - mainCam.yOffset, this.maxHealth, 15);
    fill(255, 0, 0);
    rect(this.pos.x - mainCam.xOffset - 6, this.pos.y - 75 - mainCam.yOffset, this.health - 1, 14);
    pop();
    // Nick
    textSize(24);
    text(this.nick + " (" + this.kills + "/" + this.deaths + ")", this.pos.x - mainCam.xOffset - 6, this.pos.y - 90 - mainCam.yOffset);

    // Drawing Colliders
    //this.col.draw();
    this.footCol.updatePosition(new Point(this.pos.x - 20, this.pos.y + 38));
    //this.footCol.draw();

    // Drawing the Character
    image(img_archerBody, this.pos.x - mainCam.xOffset, this.pos.y - mainCam.yOffset, 45, 80);
    push();
    translate(this.pos.x - mainCam.xOffset - 10, this.pos.y - mainCam.yOffset - 35);
    if (this.angle > -Math.PI/2 && this.angle < Math.PI/2) {
      rotate(this.angle);
      image(img_archerHead, -3, -13, 40, 40);
      image(img_archerWeapon, 0, 0, 64, 64);
    } else {
      rotate(this.angle - Math.PI);
      image(img_archerHeadReversed, -3, -13, 40, 40);
      image(img_archerWeaponReversed, 0, 0, 64, 64);
    }
    pop();
  }

  moveLeft() {
    if (this.canControl) {
      if (chatBoxOpen) return;

      sendMessage(ACTIONPROTOCOLS.MOVELEFT);
    }
    this.pos.x -= this.spd;
  }

  moveRight() {
    if (this.canControl) {
      if (chatBoxOpen) return;
      
      sendMessage(ACTIONPROTOCOLS.MOVERIGHT);
    }
    this.pos.x += this.spd;
  }

  jump() {
    if (this.canControl) {
      if (chatBoxOpen) return;
      
      if (this.isGrounded) {
        sendMessage(ACTIONPROTOCOLS.JUMP);
        this.pos.y -= 2;
        this.jspd = -10;
        this.isGrounded = false;
      }
      return;
    }

    this.pos.y -= 2;
    this.jspd = -10;
    this.isGrounded = false;
  }

  tryToLand() {
    if (this.canControl && chatBoxOpen) return;

    if (this.canControl && !this.isGrounded) {
      sendMessage(ACTIONPROTOCOLS.SLIDE);

      if (this.gravity < this.maxGravity)
        this.gravity += 0.5;
      return;
    }

    if (this.isGrounded) return;

    if (this.gravity < this.maxGravity)
      this.gravity += 0.5;
  }
  
  affectGravity() {
    this.pos.y += this.jspd + this.gravity;

    if (this.canControl && this.pos.y > gameHeight + 32) {
      sendMessage(ACTIONPROTOCOLS.DIE + ":" + DEATHPROTOCOLS.FELLDOWN);
      this.dead = true;
      return;
    }

    if (this.gravity < this.maxGravity)
      this.gravity += 0.2;  

    // Dampening
    this.jspd *= 0.97;
    if (Math.abs(this.jspd) < 0.1)
      this.jspd = 0;
  }

  checkIfLanded() { // geri dön
    for(let i = 0; i < entityList.length; i++) {
      if (entityList[i].col && this.footCol.ownerID != entityList[i].col.ownerID) {
        if (CollisionLineRect(this.footCol, entityList[i].col)) {
          if (this.footCol.pos.y > entityList[i].col.pos.y - entityList[i].col.h)
            this.pos.y--;
          this.gravity = 0;
          this.jspd = 0;
          this.isGrounded = true;
          return;
        }
      }
    }

    this.isGrounded = false;
  }

  movement() {
    this.affectGravity();
    this.checkIfLanded();

    if (this.canControl) {
      if (keyIsDown(LEFT_ARROW) || keyIsDown(65))
        this.moveLeft();
      else if (keyIsDown(RIGHT_ARROW) || keyIsDown(68))
        this.moveRight();
      if (keyIsDown(UP_ARROW) || keyIsDown(87))
        this.jump();
      else if (keyIsDown(DOWN_ARROW) || keyIsDown(83))
        this.tryToLand();
    }

    this.col.pos.x = this.pos.x - 5;
    this.col.pos.y = this.pos.y - 10;
  }

  gainAccess(state) {
    this.canControl = state;
  }
}

class Projectile extends Entity{
  constructor(startPoint, rot, force, ownerID, expireInterval = 1100) {
    super();
    this.ownerID = ownerID;
    this.pos.x = startPoint.x;
    this.pos.y = startPoint.y;
    this.rot = rot;
    this.vspd = force * Math.cos(rot);
    this.hspd = force * Math.sin(rot);
    this.l = 150;
    this.deathTimer = Date.now() + expireInterval;
    
    this.col = new LineCollider(this.pos.x, this.pos.y, rot, this.l, ownerID);
    this.collisionFlag = 0; // 0 for no collision, 1 for pos, 2 for midpoint, 3 for endpoint
    
    if (Math.random() > 0.8) sfx_release1.play();
    else sfx_release2.play();
  }

  draw() {
    if (Date.now() > this.deathTimer) return true;

    for (let i = 0; i < entityList.length; i++) {
      if (entityList[i].col && entityList[i].id != this.ownerID) {
        this.collisionFlag = CollisionLineRect(this.col, entityList[i].col);
        if (this.collisionFlag != 0) {
          if (entityList[i].isAnArcher && entityList[i].canControl) {
            sendMessage(ACTIONPROTOCOLS.GETHIT + ":" + this.ownerID);
          }

          return true;
        }
      }
    }

    this.col.updatePosition(new Point(this.pos.x, this.pos.y));
    line(this.pos.x - mainCam.xOffset, this.pos.y - mainCam.yOffset, 
         this.pos.x + (Math.cos(this.rot) * this.l) - mainCam.xOffset, this.pos.y + (Math.sin(this.rot) * this.l) - mainCam.yOffset);

    push();
    stroke(0, 255, 0);
    point(this.col.pos.x - mainCam.xOffset, this.col.pos.y - mainCam.yOffset);
    stroke(255, 0, 0);
    point(this.col.endPoint.x - mainCam.xOffset, this.col.endPoint.y - mainCam.yOffset);
    stroke(0, 0, 255);
    point(this.col.midPoint.x - mainCam.xOffset, this.col.midPoint.y - mainCam.yOffset);
    pop();

    this.pos.x += this.vspd;
    this.pos.y += this.hspd;

    this.vspd *= 0.96;
    this.hspd *= 0.96;
  }

  die() {
    if (Math.random() > 0.8) sfx_hit1.play();
    else sfx_hit2.play();

    let deathPoint = this.collisionFlag == 1 ? new Point(this.col.pos.x, this.col.pos.y): 
                     this.collisionFlag == 3 ? new Point(this.col.endPoint.x, this.col.endPoint.y):
                     new Point(this.col.midPoint.x, this.col.midPoint.y);
    new Explosion(deathPoint, 1000, 12);
  }
}

class Explosion extends Entity{
  constructor(pos, expireTimer, shatterAmount = 24, color) {
    super();
    this.pos = pos;
    this.spawnTime = Date.now();
    this.expireTimer = this.spawnTime + expireTimer;
    this.color = color ? color : [Math.floor(Math.random() * 255), Math.floor(Math.random() * 255), Math.floor(Math.random() * 255)];
    this.shatterAmount = shatterAmount;

    this.shatters = [];
    for (let i = 0; i < this.shatterAmount; i++)
      this.shatters.push(new Shatter(this.pos, 360/(i + 1), 3));
  }

  draw() {
    if (Date.now() > this.expireTimer) {
      this.shatters = [];
      return true;
    }

    push();
    stroke(this.color[0], this.color[1], this.color[2]);
    for (let i = 0; i < this.shatters.length; i++)
      this.shatters[i].draw();
    pop();
  }
}

class Shatter {
  constructor(pos, angle, spd, length = 2) {
    this.pos = new Point(pos.x, pos.y);
    this.vspd = Math.cos(angle) * spd;
    this.hspd = Math.sin(angle) * spd;
    this.length = length;

    this.vlength = this.vspd * length;
    this.hlength = this.hspd * length;
  }

  draw() {
    line(this.pos.x - mainCam.xOffset, this.pos.y - mainCam.yOffset, this.pos.x + this.vlength - mainCam.xOffset, this.pos.y + this.hlength - mainCam.yOffset);
    this.pos.x += this.vspd;
    this.pos.y += this.hspd;

    this.hspd += 0.05;
  }
}

class Wall extends Entity{
  constructor(id, x, y, w, h, moveable, vspd = 0, hspd = 0) {
    super(id);
    this.isAWall = true;
    this.pos = new Point(x, y);
    this.w = w;
    this.h = h;
    this.vspd = vspd;
    this.hspd = hspd;
    this.col = new BoxCollider(this.pos.x, this.pos.y, w, h, this.id);
    this.moveable = moveable;

    walls.push(this);

    if (this.moveable)
      setInterval(() => { this.movement(); }, 16);
  }

  movement() {
    this.pos.x += this.hspd;
    this.pos.y += this.vspd;

    if (this.pos.x + this.w/2 < 0) this.hspd = -this.hspd;
    else if (this.pos.x - this.w/2 > gameWidth) this.hspd = -this.hspd;
    if (this.pos.y + this.h/2 < 0) this.vspd = -this.vspd;
    else if (this.pos.y - this.h/2 > gameHeight) this.vspd = -this.vspd;
  }

  draw() {
    this.col.pos.x = this.pos.x;
    this.col.pos.y = this.pos.y;

    push();
    fill(0);
    stroke(34,177,11);
    rect(this.pos.x - mainCam.xOffset, this.pos.y - mainCam.yOffset, this.w, this.h);
    pop();
  }
}

class BoxCollider {
  constructor(x, y, w, h, ownerID) {
    this.pos = new Point(x, y);
    this.w = w;
    this.h = h;
    this.hidden = false;
    this.ownerID = ownerID;
  }

  draw() {
    if (this.hidden) return;
      rect(this.pos.x - mainCam.xOffset, this.pos.y - mainCam.yOffset, this.w, this.h);
  }
}

class LineCollider {
  constructor(x, y, angle, length, ownerID) {
    this.pos = new Point(x, y);
    this.angle = angle;
    this.length = length;
    this.hidden = false;
    this.ownerID = ownerID;

    this.vlength = Math.cos(angle) * this.length;
    this.hlength = Math.sin(angle) * this.length;
    this.midPoint = new Point(this.pos.x + this.vlength/2, this.pos.y + this.hlength/2);
    this.endPoint = new Point(this.pos.x + this.vlength, this.pos.y + this.hlength);
  }

  updatePosition(pos) {
    this.pos.x = pos.x;
    this.pos.y = pos.y;
    this.midPoint.x = this.pos.x + this.vlength/2;
    this.midPoint.y = this.pos.y + this.hlength/2;
    this.endPoint.x = this.pos.x + this.vlength;
    this.endPoint.y = this.pos.y + this.hlength;
  }

  draw() {
    if (this.hidden) return;

    line(this.pos.x - mainCam.xOffset, this.pos.y - mainCam.yOffset, this.endPoint.x - mainCam.xOffset, this.endPoint.y - mainCam.yOffset);
  }
}

class Point {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
}

class Camera {
  constructor(xOffset = 0, yOffset = 0, followObject = null) {
    this.xOffset = xOffset;
    this.yOffset = yOffset;
    this.xMinOffset = 0;
    this.xMaxOffset = gameWidth - windowWidth;
    this.yMinOffset = 0;
    this.yMaxOffset = gameHeight - windowHeight;
    this.followObject = followObject;
  }

  move() {
    if (!this.followObject || this.followObject.dead) return;

    this.xOffset = this.followObject.pos.x - windowWidth/2;
    this.yOffset = this.followObject.pos.y - windowHeight/2;

    if (this.xOffset > this.xMaxOffset) this.xOffset = this.xMaxOffset;
    if (this.xOffset < this.xMinOffset) this.xOffset = this.xMinOffset;
    if (this.yOffset > this.yMaxOffset) this.yOffset = this.yMaxOffset;
    if (this.yOffset < this.yMinOffset) this.yOffset = this.yMinOffset;
  }
}

class EventMessage {
  constructor(msg, deathInterval) {
    this.msg = msg;
    this.deathTime = Date.now() + deathInterval;
    eventHistory.push(this);
  }
}

class Announcement {
  constructor(msg, deathTimer, size, color1, color2, color3) {
    this.msg = msg;
    this.deathTimer = deathTimer;
    this.size = size;
    this.color1 = color1;
    this.color2 = color2;
    this.color3 = color3;
  }

  draw() {
    if (Date.now() > this.deathTimer) {
      announcement = null;
      return;
    }

    push();
    textAlign(CENTER);
    textSize(this.size);
    image(img_announcebg, windowWidth/2, 40, windowWidth/2, 50);
    fill(this.color1, this.color2, this.color3);
    text(this.msg, windowWidth/2, 50);
    pop();
  }
}

class ChatMessage {
  constructor(name, msg, deathTimer) {
    this.name = name;
    this.msg = msg;
    this.deathTimer = deathTimer;
  }
}