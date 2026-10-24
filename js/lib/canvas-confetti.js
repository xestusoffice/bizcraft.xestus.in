/**
 * Standalone lightweight Canvas Confetti
 * Produces crisp, beautiful celebratory physics particle bursts with zero external dependencies.
 */
(function(window) {
  'use strict';

  var activeCanvases = [];

  function ConfettiParticle(x, y, options) {
    this.x = x;
    this.y = y;
    this.colors = options.colors || ['#6366F1', '#EC4899', '#10B981', '#F59E0B', '#06B6D4', '#8B5CF6'];
    this.color = this.colors[Math.floor(Math.random() * this.colors.length)];
    this.radius = Math.random() * 4 + 3;
    this.size = Math.random() * 8 + 6;
    this.speed = Math.random() * 6 + 3;
    var angle = (Math.random() * 360) * (Math.PI / 180);
    this.vx = Math.cos(angle) * this.speed * (options.spread || 1);
    this.vy = (Math.sin(angle) * this.speed - (options.lift || 4)) * (options.spread || 1);
    this.gravity = 0.22;
    this.friction = 0.96;
    this.rotation = Math.random() * 360;
    this.rotationSpeed = (Math.random() - 0.5) * 12;
    this.opacity = 1;
    this.decay = Math.random() * 0.015 + 0.012;
    this.shape = Math.random() > 0.4 ? 'rect' : 'circle';
  }

  ConfettiParticle.prototype.update = function() {
    this.vx *= this.friction;
    this.vy *= this.friction;
    this.vy += this.gravity;
    this.x += this.vx;
    this.y += this.vy;
    this.rotation += this.rotationSpeed;
    this.opacity -= this.decay;
  };

  ConfettiParticle.prototype.draw = function(ctx) {
    if (this.opacity <= 0) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate((this.rotation * Math.PI) / 180);
    ctx.globalAlpha = Math.max(0, this.opacity);
    ctx.fillStyle = this.color;

    if (this.shape === 'circle') {
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(-this.size / 2, -this.size / 3, this.size, this.size * 0.6);
    }
    ctx.restore();
  };

  function clearConfetti() {
    while (activeCanvases.length > 0) {
      var item = activeCanvases.pop();
      if (item.animId) cancelAnimationFrame(item.animId);
      if (item.canvas && item.canvas.parentNode) {
        item.canvas.parentNode.removeChild(item.canvas);
      }
    }
  }

  function fireConfetti(options) {
    if (window.matchMedia && window.matchMedia('print').matches) return;
    options = options || {};
    var count = options.particleCount || 65;
    var canvas = document.createElement('canvas');
    canvas.className = 'confetti-canvas no-print';
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '999999';
    document.body.appendChild(canvas);

    var width = canvas.width = window.innerWidth;
    var height = canvas.height = window.innerHeight;
    var ctx = canvas.getContext('2d');

    var originX = options.origin && options.origin.x !== undefined ? options.origin.x * width : width / 2;
    var originY = options.origin && options.origin.y !== undefined ? options.origin.y * height : height * 0.45;

    var particles = [];
    for (var i = 0; i < count; i++) {
      particles.push(new ConfettiParticle(originX, originY, options));
    }

    var canvasItem = { canvas: canvas, animId: null };
    activeCanvases.push(canvasItem);

    function animate() {
      ctx.clearRect(0, 0, width, height);
      var alive = false;
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.update();
        if (p.opacity > 0) {
          alive = true;
          p.draw(ctx);
        }
      }

      if (alive) {
        canvasItem.animId = requestAnimationFrame(animate);
      } else {
        cancelAnimationFrame(canvasItem.animId);
        var idx = activeCanvases.indexOf(canvasItem);
        if (idx !== -1) activeCanvases.splice(idx, 1);
        if (canvas.parentNode) {
          canvas.parentNode.removeChild(canvas);
        }
      }
    }
    animate();
  }

  window.addEventListener('beforeprint', clearConfetti);
  window.clearConfetti = clearConfetti;
  window.confetti = fireConfetti;
})(typeof window !== 'undefined' ? window : this);
