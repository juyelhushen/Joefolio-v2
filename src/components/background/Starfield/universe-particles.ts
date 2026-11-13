import type { CameraState, RenderingProfile } from '../VirtualCamera';

export type Star = {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  phase: number;
  twinkleSpeed: number;
  depth: number;
  velocityX: number;
  velocityY: number;
};

type SpaceStar = Star & { color: number; approach: number };
type Meteor = {
  active: boolean;
  born: number;
  duration: number;
  x: number;
  y: number;
  angle: number;
  speed: number;
  length: number;
  brightness: number;
};
type Dust = { x: number; y: number; age: number; life: number; speed: number; direction: number };
const COLORS = ['#f0f4ff', '#62ddf5', '#a995ff'];

const smooth = (from: number, to: number, value: number) => {
  const t = Math.max(0, Math.min(1, (value - from) / (to - from)));
  return t * t * (3 - 2 * t);
};

type ProjectedPoint = { x: number; y: number };

export function projectFoldPoint(
  x: number,
  y: number,
  depth: number,
  width: number,
  height: number,
  elapsed: number,
  out: ProjectedPoint,
) {
  if (elapsed >= 3200) {
    out.x = x;
    out.y = y;
    return;
  }
  const centerX = width * 0.5 + height * (width / height < 0.9 ? -0.015 : 0.12);
  const centerY = height * 0.46;
  const dx = (x - centerX) / height;
  const dy = (y - centerY) / height;
  const radiusSquared = dx * dx + dy * dy;
  const gravity = smooth(0, 700, elapsed) * (1 - smooth(2200, 3200, elapsed));
  const perspective = 1 - (1 - smooth(700, 2400, elapsed)) * depth * 0.58;
  const bend = gravity * (0.08 + depth * 0.9) * Math.exp(-radiusSquared * 3);
  const lens = 1 + (gravity * 0.018) / (radiusSquared + 0.035);
  const cos = Math.cos(bend);
  const sin = Math.sin(bend);
  out.x = centerX + (dx * cos - dy * sin) * height * perspective * lens;
  out.y = centerY + (dx * sin + dy * cos) * height * perspective * lens;
}

export function advanceStars(stars: Star[], seconds: number, width: number, height: number) {
  if (seconds <= 0 || width <= 0 || height <= 0) return;
  for (const star of stars) {
    star.x =
      ((((star.x + star.velocityX * seconds + 2) % (width + 4)) + width + 4) % (width + 4)) - 2;
    star.y =
      ((((star.y + star.velocityY * seconds + 2) % (height + 4)) + height + 4) % (height + 4)) - 2;
  }
}

export class ParticleUniverse {
  readonly stars: SpaceStar[] = [];
  readonly meteors: Meteor[];
  readonly dust: Dust[] = [];
  elapsed = 0;
  meteorEvents = 0;
  nextMeteorAt: number;
  private companionAt = Infinity;
  private cameraX = 0;
  private cameraY = 0;
  private scroll = 0;
  private density = 1;
  private targetDensity = 1;
  private readonly projected = { x: 0, y: 0 };
  private readonly previous = { x: 0, y: 0 };
  private readonly midpoint = { x: 0, y: 0 };

  constructor(
    public width: number,
    public height: number,
    readonly profile: RenderingProfile,
    private random: () => number = Math.random,
  ) {
    for (let index = 0; index < profile.starCount; index++) {
      const tier = index % 20;
      const depth = tier < 10 ? 0.06 : tier < 16 ? 0.3 : tier < 19 ? 0.65 : 1;
      const cluster = index % 3 === 0;
      const centerX = index % 2 ? 0.22 : 0.8;
      const centerY = index % 2 ? 0.3 : 0.7;
      this.stars.push({
        x: (cluster ? centerX + (this.random() + this.random() - 1) * 0.3 : this.random()) * width,
        y:
          (cluster ? centerY + (this.random() + this.random() - 1) * 0.24 : this.random()) * height,
        radius: 0.4 + depth * 1.15 + this.random() * 0.4,
        alpha: 0.28 + depth * 0.35 + this.random() * 0.18,
        phase: this.random() * Math.PI * 2,
        twinkleSpeed: 0.4 + this.random() * 1.3,
        depth,
        velocityX: (this.random() < 0.25 ? 1 : -1) * (0.6 + depth * depth * 34),
        velocityY: (this.random() - 0.5) * (1 + depth * 16),
        approach: index % 4 === 0 ? depth * 0.085 : 0,
        color: index % 7 === 0 ? 1 : index % 5 === 0 ? 2 : 0,
      });
    }
    this.meteors = Array.from({ length: profile.maxMeteors }, () => ({
      active: false,
      born: 0,
      duration: 0,
      x: 0,
      y: 0,
      angle: 0,
      speed: 0,
      length: 0,
      brightness: 0,
    }));
    for (let index = 0; index < profile.nearParticleCount; index++) {
      this.dust.push({
        x: this.random() * width,
        y: this.random() * height,
        age: this.random() * 6,
        life: 6 + this.random() * 5,
        speed: 20 + this.random() * 38,
        direction: this.random() < 0.5 ? -1 : 1,
      });
    }
    this.nextMeteorAt = profile.frameRateTarget === 60 ? 1 + this.random() : 1.8 + this.random();
  }

  resize(width: number, height: number) {
    for (const star of this.stars) {
      star.x *= width / this.width;
      star.y *= height / this.height;
    }
    for (const dust of this.dust) {
      dust.x *= width / this.width;
      dust.y *= height / this.height;
    }
    for (const meteor of this.meteors) meteor.active = false;
    this.width = width;
    this.height = height;
  }

  reduceDensity() {
    this.targetDensity = Math.max(0.55, this.targetDensity - 0.15);
  }

  private spawnMeteor() {
    const meteor = this.meteors.find((item) => !item.active);
    if (!meteor) return;
    const direction = this.random() < 0.35 ? -1 : 1;
    meteor.active = true;
    meteor.born = this.elapsed;
    meteor.duration = 1.3 + this.random() * 1.15;
    meteor.x = this.width * (direction > 0 ? this.random() * 0.7 : 0.3 + this.random() * 0.7);
    meteor.y = this.height * (-0.08 + this.random() * 0.55);
    const angle = 0.28 + this.random() * 0.55;
    meteor.angle = direction > 0 ? angle : Math.PI - angle;
    meteor.speed = Math.min(this.width, this.height) * (0.5 + this.random() * 0.45);
    meteor.length = Math.min(this.width, this.height) * (0.16 + this.random() * 0.2);
    meteor.brightness = 0.55 + this.random() * 0.35;
    this.meteorEvents++;
  }

  advance(seconds: number, camera: CameraState) {
    if (camera.reducedMotion || seconds <= 0) return;
    this.elapsed += seconds;
    const blend = 1 - Math.exp(-seconds * 3);
    const oldScroll = this.scroll;
    this.scroll += (camera.scrollProgress - this.scroll) * blend;
    this.cameraX += (camera.parallaxOffsetX * this.width - this.cameraX) * blend;
    this.cameraY += (camera.parallaxOffsetY * this.height - this.cameraY) * blend;
    this.density += (this.targetDensity - this.density) * blend;
    const travel = (this.scroll - oldScroll) * 0.6;
    for (const star of this.stars) {
      const approach = star.approach * seconds + travel * star.depth;
      star.x += (star.x - this.width * 0.54) * approach;
      star.y += (star.y - this.height * 0.46) * approach;
      star.radius = Math.min(2.4, star.radius * (1 + Math.max(0, approach) * 0.12));
      if (star.x < -2 || star.x > this.width + 2 || star.y < -2 || star.y > this.height + 2)
        star.radius = 0.5 + star.depth * 1.25;
    }
    advanceStars(this.stars, seconds, this.width, this.height);
    for (const dust of this.dust) {
      dust.age += seconds;
      dust.x += dust.direction * dust.speed * seconds;
      dust.y += dust.speed * seconds * 0.3;
      if (dust.age > dust.life) {
        dust.age = 0;
        dust.x = this.random() * this.width;
        dust.y = this.random() * this.height;
      }
    }
    for (const meteor of this.meteors)
      if (meteor.active && this.elapsed - meteor.born >= meteor.duration) meteor.active = false;
    if (this.elapsed >= this.nextMeteorAt) {
      this.spawnMeteor();
      const [min, max] = this.profile.meteorInterval;
      this.nextMeteorAt = this.elapsed + min + this.random() * (max - min);
      if (this.random() < (this.profile.maxMeteors === 3 ? 0.28 : 0.16))
        this.companionAt = this.elapsed + 0.4 + this.random() * 0.5;
    }
    if (this.elapsed >= this.companionAt) {
      this.spawnMeteor();
      this.companionAt = Infinity;
    }
  }

  draw(
    ctx: CanvasRenderingContext2D,
    glow: HTMLCanvasElement,
    tail: HTMLCanvasElement,
    structures: HTMLCanvasElement,
    staticFrame: boolean,
    foldElapsed = 3200,
  ) {
    ctx.clearRect(0, 0, this.width, this.height);
    const unfolding = smooth(2400, 3200, foldElapsed);
    ctx.globalAlpha = unfolding;
    ctx.drawImage(structures, -this.cameraX * 0.08, -this.cameraY * 0.08, this.width, this.height);
    const autoX = staticFrame ? 0 : Math.sin(this.elapsed * 0.075) * 3;
    for (let index = 0; index < this.stars.length; index++) {
      const star = this.stars[index];
      // Interleave tiers so adaptive thinning retains every depth and colour.
      const density = Math.max(0, Math.min(1, (this.density - (index % 17) / 17) * 17));
      if (!density) continue;
      const baseX = star.x - this.cameraX * star.depth + autoX * star.depth;
      const baseY = star.y - this.cameraY * star.depth - this.scroll * 28 * star.depth;
      projectFoldPoint(
        baseX,
        baseY,
        star.depth,
        this.width,
        this.height,
        foldElapsed,
        this.projected,
      );
      const { x, y } = this.projected;
      const twinkle = staticFrame
        ? 0.88
        : 0.82 + Math.sin(this.elapsed * star.twinkleSpeed + star.phase) * 0.18;
      const edgeFade = Math.max(
        0,
        Math.min(1, x / 16, y / 16, (this.width - x) / 16, (this.height - y) / 16),
      );
      const emergence = 0.18 + smooth(0, 1500, foldElapsed) * 0.82;
      const alpha = star.alpha * twinkle * density * edgeFade * emergence;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = COLORS[star.color];
      if (foldElapsed < 3200 && star.depth >= 0.3) {
        ctx.globalAlpha = alpha * (1 - unfolding);
        projectFoldPoint(
          baseX,
          baseY,
          star.depth,
          this.width,
          this.height,
          Math.max(0, foldElapsed - 100),
          this.previous,
        );
        projectFoldPoint(
          baseX,
          baseY,
          star.depth,
          this.width,
          this.height,
          Math.max(0, foldElapsed - 50),
          this.midpoint,
        );
        ctx.strokeStyle = COLORS[star.color];
        ctx.lineWidth = 0.45 + star.depth * 0.4;
        ctx.beginPath();
        ctx.moveTo(this.previous.x, this.previous.y);
        ctx.quadraticCurveTo(this.midpoint.x, this.midpoint.y, x, y);
        ctx.stroke();
        ctx.globalAlpha = alpha;
      }
      if (star.depth > 0.6) {
        const radius = star.radius * 4;
        ctx.drawImage(glow, x - radius, y - radius, radius * 2, radius * 2);
      }
      ctx.beginPath();
      ctx.arc(x, y, star.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const dust of this.dust) {
      const fade = staticFrame
        ? 0.08
        : Math.sin(Math.min(1, dust.age / dust.life) * Math.PI) * 0.26;
      ctx.globalAlpha = Math.max(0, fade) * unfolding;
      const x = dust.x - this.cameraX;
      const y = dust.y - this.cameraY;
      ctx.drawImage(glow, x - 10, y - 10, 20, 20);
      if (!staticFrame) {
        ctx.strokeStyle = '#62ddf5';
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - dust.direction * 10, y - 3);
        ctx.stroke();
      }
    }
    if (!staticFrame)
      for (const meteor of this.meteors) {
        if (!meteor.active) continue;
        const age = this.elapsed - meteor.born;
        const fraction = age / meteor.duration;
        const fade = Math.min(1, fraction / 0.12, (1 - fraction) / 0.28);
        const distance = age * meteor.speed;
        ctx.save();
        ctx.translate(
          meteor.x + Math.cos(meteor.angle) * distance,
          meteor.y + Math.sin(meteor.angle) * distance,
        );
        ctx.rotate(meteor.angle);
        ctx.globalAlpha = Math.max(0, fade) * meteor.brightness;
        ctx.drawImage(tail, -meteor.length, -2, meteor.length, 4);
        ctx.drawImage(glow, -7, -7, 14, 14);
        ctx.fillStyle = '#f0f4ff';
        ctx.fillRect(-1.3, -0.8, 2.6, 1.6);
        ctx.restore();
      }
    ctx.globalAlpha = 1;
  }
}

export function createSkyTextures() {
  const glow = document.createElement('canvas');
  glow.width = glow.height = 64;
  const ctx = glow.getContext('2d');
  if (!ctx) throw new Error('Cosmic particle texture context is unavailable.');
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(240,244,255,1)');
  gradient.addColorStop(0.08, 'rgba(98,221,245,0.65)');
  gradient.addColorStop(0.3, 'rgba(102,139,255,0.12)');
  gradient.addColorStop(1, 'rgba(169,149,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  const tail = document.createElement('canvas');
  tail.width = 256;
  tail.height = 8;
  const tailContext = tail.getContext('2d');
  if (!tailContext) throw new Error('Cosmic trail texture context is unavailable.');
  const trail = tailContext.createLinearGradient(0, 0, 256, 0);
  trail.addColorStop(0, 'rgba(102,139,255,0)');
  trail.addColorStop(0.4, 'rgba(169,149,255,0.08)');
  trail.addColorStop(0.85, 'rgba(98,221,245,0.5)');
  trail.addColorStop(1, '#f0f4ff');
  tailContext.fillStyle = trail;
  tailContext.beginPath();
  tailContext.moveTo(0, 4);
  tailContext.lineTo(256, 2);
  tailContext.lineTo(256, 6);
  tailContext.closePath();
  tailContext.fill();

  const structures = document.createElement('canvas');
  structures.width = 1024;
  structures.height = 768;
  const sky = structures.getContext('2d');
  if (!sky) throw new Error('Distant sky texture context is unavailable.');
  sky.save();
  sky.translate(830, 170);
  sky.rotate(-0.45);
  sky.scale(1, 0.28);
  const galaxy = sky.createRadialGradient(0, 0, 0, 0, 0, 220);
  galaxy.addColorStop(0, 'rgba(169,149,255,0.15)');
  galaxy.addColorStop(0.18, 'rgba(102,139,255,0.08)');
  galaxy.addColorStop(1, 'rgba(102,139,255,0)');
  sky.fillStyle = galaxy;
  sky.fillRect(-220, -220, 440, 440);
  sky.strokeStyle = 'rgba(169,149,255,0.045)';
  for (let index = 1; index < 7; index++) {
    sky.beginPath();
    sky.ellipse(0, 0, 22 + index * 24, 10 + index * 18, index * 0.11, 0.3, Math.PI * 1.7);
    sky.stroke();
  }
  sky.restore();
  sky.strokeStyle = 'rgba(98,221,245,0.065)';
  sky.lineWidth = 0.7;
  sky.beginPath();
  sky.moveTo(30, 510);
  sky.lineTo(110, 475);
  sky.lineTo(156, 540);
  sky.lineTo(240, 512);
  sky.lineTo(290, 575);
  sky.stroke();
  return { glow, tail, structures };
}
