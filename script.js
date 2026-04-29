window.requestAnimFrame = (function () {
  return (
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    function (callback) {
      window.setTimeout(callback, 1000 / 60);
    }
  );
})();

var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
var cw = window.innerWidth;
var ch = window.innerHeight;
var fireworks = [];
var particles = [];
var hue = 120;
var limiterTotal = 5;
var limiterTick = 0;
var timerTotal = 80;
var timerTick = 0;
var mousedown = false;
var mx;
var my;
var animationStarted = false;
var jumpscareStarted = false;
var screamPlayCount = 0;
var birthdayStageStarted = false;
var greetingPositionTimer = null;

// Countdown gate toggle guide:
// 1. Set this to false to skip the timer and show the gift immediately.
// 2. For quick testing, set COUNTDOWN_TEST_SECONDS to a number.
// 3. For the real unlock time, keep COUNTDOWN_TEST_SECONDS as null.
//    The +08:00 timezone makes this exactly Philippine Time.
var COUNTDOWN_ENABLED = false;
var COUNTDOWN_TEST_SECONDS = null;
var COUNTDOWN_TARGET_DATE = "2026-04-30T00:00:00+08:00";

function resetBirthdayStage() {
  var birthdayStage = document.getElementById("birthdayStage");
  var merrywrap = document.getElementById("merrywrap");
  var surpriseButton = document.getElementById("surpriseButton");
  var videoFrame = document.querySelector("#video iframe");
  var jumpscare = document.getElementById("jumpscare");
  var audio = document.getElementById("screamAudio");

  if (!merrywrap) {
    return;
  }

  var icons = merrywrap.querySelector(".icons");

  if (greetingPositionTimer) {
    clearTimeout(greetingPositionTimer);
    greetingPositionTimer = null;
  }

  merrywrap.className = "merrywrap";
  merrywrap.style.backgroundColor = "";
  birthdayStage.classList.remove("is-greeting");
  if (icons) {
    icons.classList.add("is-centered");
  }
  jumpscareStarted = false;
  screamPlayCount = 0;

  if (videoFrame) {
    videoFrame.remove();
  }

  if (surpriseButton) {
    surpriseButton.classList.remove("is-ready");
  }

  if (jumpscare) {
    jumpscare.classList.remove("is-active");
    jumpscare.setAttribute("aria-hidden", "true");
  }

  if (audio) {
    audio.pause();
    audio.currentTime = 0;
  }
}

function resizeCanvas() {
  cw = window.innerWidth;
  ch = window.innerHeight;
  canvas.width = cw;
  canvas.height = ch;
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

function random(min, max) {
  return Math.random() * (max - min) + min;
}

function calculateDistance(p1x, p1y, p2x, p2y) {
  var xDistance = p1x - p2x;
  var yDistance = p1y - p2y;
  return Math.sqrt(Math.pow(xDistance, 2) + Math.pow(yDistance, 2));
}

function Firework(sx, sy, tx, ty) {
  this.x = sx;
  this.y = sy;
  this.sx = sx;
  this.sy = sy;
  this.tx = tx;
  this.ty = ty;
  this.distanceToTarget = calculateDistance(sx, sy, tx, ty);
  this.distanceTraveled = 0;
  this.coordinates = [];
  this.coordinateCount = 3;

  while (this.coordinateCount--) {
    this.coordinates.push([this.x, this.y]);
  }

  this.angle = Math.atan2(ty - sy, tx - sx);
  this.speed = 2;
  this.acceleration = 1.05;
  this.brightness = random(50, 70);
  this.targetRadius = 1;
}

Firework.prototype.update = function (index) {
  this.coordinates.pop();
  this.coordinates.unshift([this.x, this.y]);

  if (this.targetRadius < 8) {
    this.targetRadius += 0.3;
  } else {
    this.targetRadius = 1;
  }

  this.speed *= this.acceleration;

  var vx = Math.cos(this.angle) * this.speed;
  var vy = Math.sin(this.angle) * this.speed;

  this.distanceTraveled = calculateDistance(
    this.sx,
    this.sy,
    this.x + vx,
    this.y + vy
  );

  if (this.distanceTraveled >= this.distanceToTarget) {
    createParticles(this.tx, this.ty);
    fireworks.splice(index, 1);
  } else {
    this.x += vx;
    this.y += vy;
  }
};

Firework.prototype.draw = function () {
  ctx.beginPath();
  ctx.moveTo(
    this.coordinates[this.coordinates.length - 1][0],
    this.coordinates[this.coordinates.length - 1][1]
  );
  ctx.lineTo(this.x, this.y);
  ctx.strokeStyle = "hsl(" + hue + ", 100%, " + this.brightness + "%)";
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(this.tx, this.ty, this.targetRadius, 0, Math.PI * 2);
  ctx.stroke();
};

function Particle(x, y) {
  this.x = x;
  this.y = y;
  this.coordinates = [];
  this.coordinateCount = 5;

  while (this.coordinateCount--) {
    this.coordinates.push([this.x, this.y]);
  }

  this.angle = random(0, Math.PI * 2);
  this.speed = random(1, 10);
  this.friction = 0.95;
  this.gravity = 1;
  this.hue = random(hue - 20, hue + 20);
  this.brightness = random(50, 80);
  this.alpha = 1;
  this.decay = random(0.015, 0.03);
}

Particle.prototype.update = function (index) {
  this.coordinates.pop();
  this.coordinates.unshift([this.x, this.y]);
  this.speed *= this.friction;
  this.x += Math.cos(this.angle) * this.speed;
  this.y += Math.sin(this.angle) * this.speed + this.gravity;
  this.alpha -= this.decay;

  if (this.alpha <= this.decay) {
    particles.splice(index, 1);
  }
};

Particle.prototype.draw = function () {
  ctx.beginPath();
  ctx.moveTo(
    this.coordinates[this.coordinates.length - 1][0],
    this.coordinates[this.coordinates.length - 1][1]
  );
  ctx.lineTo(this.x, this.y);
  ctx.strokeStyle =
    "hsla(" +
    this.hue +
    ", 100%, " +
    this.brightness +
    "%, " +
    this.alpha +
    ")";
  ctx.stroke();
};

function createParticles(x, y) {
  var particleCount = 30;

  while (particleCount--) {
    particles.push(new Particle(x, y));
  }
}

function loop() {
  requestAnimFrame(loop);
  hue += 0.5;

  ctx.globalCompositeOperation = "destination-out";
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(0, 0, cw, ch);
  ctx.globalCompositeOperation = "lighter";

  var i = fireworks.length;
  while (i--) {
    fireworks[i].draw();
    fireworks[i].update(i);
  }

  i = particles.length;
  while (i--) {
    particles[i].draw();
    particles[i].update(i);
  }

  if (timerTick >= timerTotal) {
    if (!mousedown) {
      fireworks.push(new Firework(cw / 2, ch, random(0, cw), random(0, ch / 2)));
      timerTick = 0;
    }
  } else {
    timerTick++;
  }

  if (limiterTick >= limiterTotal) {
    if (mousedown) {
      fireworks.push(new Firework(cw / 2, ch, mx, my));
      limiterTick = 0;
    }
  } else {
    limiterTick++;
  }
}

function reveal() {
  var icons = document.querySelector(".icons");

  document.getElementById("birthdayStage").classList.add("is-greeting");
  document.querySelector(".merrywrap").classList.add("is-revealed");

  greetingPositionTimer = window.setTimeout(function () {
    icons.classList.remove("is-centered");
    greetingPositionTimer = null;
  }, 3500);

  if (!animationStarted) {
    animationStarted = true;
    loop();
  }

  if (!document.querySelector("#video iframe")) {
    var ifrm = document.createElement("iframe");
    ifrm.setAttribute(
      "src",
      "https://www.youtube.com/embed/SKmRXPpebCc?autoplay=1&loop=1&playlist=SKmRXPpebCc&controls=0"
    );
    ifrm.setAttribute("title", "Birthday song for Rose");
    ifrm.setAttribute(
      "allow",
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    );
    ifrm.setAttribute("allowfullscreen", "");
    document.querySelector("#video").appendChild(ifrm);
  }

  enableSurpriseButton();
}

function enableSurpriseButton() {
  var surpriseButton = document.getElementById("surpriseButton");

  if (!surpriseButton) {
    return;
  }

  surpriseButton.classList.add("is-ready");
  surpriseButton.addEventListener("click", showJumpscare, { once: true });
}

function showJumpscare() {
  if (jumpscareStarted) {
    return;
  }

  jumpscareStarted = true;

  var jumpscare = document.getElementById("jumpscare");
  var audio = document.getElementById("screamAudio");
  var videoFrame = document.querySelector("#video iframe");
  var surpriseButton = document.getElementById("surpriseButton");

  if (videoFrame) {
    videoFrame.remove();
  }

  if (surpriseButton) {
    surpriseButton.remove();
  }

  jumpscare.classList.add("is-active");
  jumpscare.setAttribute("aria-hidden", "false");
  screamPlayCount = 0;

  function playScream() {
    screamPlayCount++;
    audio.currentTime = 0;

    var playPromise = audio.play();
    if (playPromise) {
      playPromise.catch(function () {
        window.location.href = "apology.html";
      });
    }
  }

  audio.addEventListener("ended", function repeatScream() {
    if (screamPlayCount < 2) {
      playScream();
      return;
    }

    audio.removeEventListener("ended", repeatScream);
    window.location.href = "apology.html";
  });

  playScream();
}

function openBox() {
  var merrywrap = document.getElementById("merrywrap");
  var box = merrywrap.getElementsByClassName("giftbox")[0];
  var step = 1;
  var stepMinutes = [2000, 2000, 1000, 1000];

  function stepClass(currentStep) {
    merrywrap.className = "merrywrap step-" + currentStep;
  }

  function advance() {
    if (step === 1) {
      box.onclick = null;
    }

    stepClass(step);

    if (step === 4) {
      reveal();
      return;
    }

    setTimeout(advance, stepMinutes[step - 1]);
    step++;
  }

  box.onclick = advance;
}

function formatCountdown(totalSeconds) {
  var t = Math.max(0, totalSeconds);
  var days = Math.floor(t / 86400);
  t -= days * 86400;

  var hours = Math.floor(t / 3600) % 24;
  t -= hours * 3600;

  var minutes = Math.floor(t / 60) % 60;
  t -= minutes * 60;

  var seconds = t % 60;

  return days + "d " + hours + "h " + minutes + "m " + seconds + "s";
}

function startBirthdayStage() {
  if (birthdayStageStarted) {
    return;
  }

  birthdayStageStarted = true;
  document.getElementById("birthdayStage").classList.remove("is-hidden");
  resetBirthdayStage();
  openBox();
}

function skipCountdownGate(isDisabled) {
  var gate = document.getElementById("countdownGate");
  gate.classList.add(isDisabled ? "is-disabled" : "is-hidden");
  startBirthdayStage();
}

function startCountdownGate() {
  var gate = document.getElementById("countdownGate");
  var timer = document.getElementById("countdownTimer");
  var targetTime;

  if (!COUNTDOWN_ENABLED) {
    skipCountdownGate(true);
    return;
  }

  if (typeof COUNTDOWN_TEST_SECONDS === "number") {
    targetTime = Date.now() + COUNTDOWN_TEST_SECONDS * 1000;
  } else {
    targetTime = new Date(COUNTDOWN_TARGET_DATE).getTime();
  }

  function tick() {
    var diff = Math.floor((targetTime - Date.now()) / 1000);

    if (!Number.isFinite(diff) || diff <= 0) {
      clearInterval(intervalId);
      timer.textContent = "0d 0h 0m 0s";
      window.setTimeout(function () {
        skipCountdownGate(false);
      }, 450);
      return;
    }

    timer.textContent = formatCountdown(diff);
  }

  var intervalId = setInterval(tick, 1000);
  tick();
}

document.addEventListener("mousedown", function (event) {
  mousedown = true;
  mx = event.pageX;
  my = event.pageY;
});

document.addEventListener("mouseup", function () {
  mousedown = false;
});

document.addEventListener("mousemove", function (event) {
  mx = event.pageX;
  my = event.pageY;
});

document.addEventListener("touchstart", function (event) {
  if (event.touches.length) {
    mousedown = true;
    mx = event.touches[0].pageX;
    my = event.touches[0].pageY;
  }
});

document.addEventListener("touchend", function () {
  mousedown = false;
});

document.addEventListener("touchmove", function (event) {
  if (event.touches.length) {
    mx = event.touches[0].pageX;
    my = event.touches[0].pageY;
  }
});

window.addEventListener("load", startCountdownGate);
window.addEventListener("pageshow", function (event) {
  if (event.persisted) {
    birthdayStageStarted = false;
    startCountdownGate();
  }
});
