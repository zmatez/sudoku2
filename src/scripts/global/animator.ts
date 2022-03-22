import SimplexNoise from "simplex-noise";

export namespace Animator {
    export abstract class BackgroundAnimation {
        protected readonly parent: HTMLDivElement;
        protected readonly element: HTMLCanvasElement;
        protected readonly width: number;
        protected readonly height: number;
        protected x: number;
        protected y: number;

        protected readonly upscale: number = 1;

        protected running: boolean = true;

        protected ticks = 0;

        protected lastTimestamp = 0;
        protected maxFPS = 30;
        protected timeStep = 1000 / this.maxFPS;

        constructor(parent: HTMLDivElement) {
            this.parent = parent;
            this.parent.classList.add("background-animation-parent");
            let box = this.parent.getBoundingClientRect();
            this.width = this.parent.offsetWidth;
            this.height = this.parent.offsetHeight;
            this.x = box.left;
            this.y = box.top;
            this.element = document.createElement('canvas');
            this.element.classList.add("background-animation")
            this.element.width = this.width * this.upscale;
            this.element.height = this.height * this.upscale;
            this.element.style.width = this.width + "px";
            this.element.style.height = this.height + "px";
            this.element.style.left = this.x + "px";
            this.element.style.top = this.y + "px";
        }

        protected abstract recreate(): BackgroundAnimation;

        start() {
            document.body.appendChild(this.element);
            window.requestAnimationFrame((t) => this.animate(t));
        }

        stop() {
            this.running = false;
            this.element.remove();
        }

        restart(): BackgroundAnimation {
            this.stop();
            let anim = this.recreate();
            anim.start();
            return anim;
        }

        animate(timestamp: number) {
            if (!this.running) {
                return
            }

            window.requestAnimationFrame((t) => {
                this.animate(t);
            })

            if (timestamp - this.lastTimestamp < this.timeStep) return;

            this.lastTimestamp = timestamp;

            this.tick();
            this.render(this.element.getContext('2d'));

            //--------
            this.ticks++;
        }

        protected abstract render(ctx: CanvasRenderingContext2D);

        protected abstract tick();
    }

    export class GameAnimation extends BackgroundAnimation {
        private readonly wonCallback: () => boolean;

        private readonly NUM_CONFETTI;
        private readonly COLORS = [[85, 71, 106], [174, 61, 99], [219, 56, 83], [244, 92, 68], [248, 182, 70]];
        private readonly PI_2 = 2 * Math.PI;
        private xpos: number = 0.5;
        private readonly confettis: Confetti[] = [];

        constructor(won: () => boolean, parent: HTMLDivElement) {
            super(parent);
            this.wonCallback = won;
            this.maxFPS = 60;
            this.NUM_CONFETTI = this.width / 2;

            document.onmousemove = (e) => {
                return this.xpos = e.pageX / this.width;
            };

            for (let i = 0; i < this.NUM_CONFETTI; i++) {
                this.confettis.push(new Confetti(this, this.COLORS));
            }
        }

        protected recreate(): Animator.BackgroundAnimation {
            return new GameAnimation(this.wonCallback, this.parent);
        }

        protected render(ctx: CanvasRenderingContext2D) {
            ctx.clearRect(0, 0, this.width, this.height);

            if (this.wonCallback()) {
                const drawCircle = (x, y, r, style) => {
                    ctx.beginPath();
                    ctx.globalAlpha = 1;
                    ctx.arc(x, y, r, 0, this.PI_2, false);
                    ctx.fillStyle = style;
                    return ctx.fill();
                };

                for (let result of this.confettis) {
                    result.draw(drawCircle);
                }
            }
        }

        protected tick() {
        }

        public get w() {
            return this.width;
        }

        public get h() {
            return this.height;
        }

        public get xp() {
            return this.xpos;
        }
    }

    class Confetti {
        public opacity;
        public dop;
        public x;
        public y;
        public xmax;
        public ymax;
        public vx;
        public vy;
        public style;
        public rgb;
        public r;
        public r2;

        public readonly anim: GameAnimation;

        constructor(anim: GameAnimation, colors: any[]) {
            this.anim = anim;
            this.style = colors[~~this.range(0, 5)];
            this.rgb = "rgba(" + this.style[0] + "," + this.style[1] + "," + this.style[2];
            this.r = ~~this.range(2, 6);
            this.r2 = 2 * this.r;
            this.replace();
        }

        replace() {
            this.opacity = 0;
            this.dop = 0.03 * this.range(1, 4);
            this.x = this.range(-this.r2, this.anim.w - this.r2);
            this.y = this.range(-20, this.anim.h - this.r2);
            this.xmax = this.anim.w - this.r;
            this.ymax = this.anim.h - this.r;
            this.vx = this.range(0, 2) + 8 * this.anim.xp - 5;
            return this.vy = 0.7 * this.r + this.range(-1, 1);
        };

        draw(drawCircle) {
            let _ref;
            this.x += this.vx;
            this.y += this.vy;
            this.opacity += this.dop;
            if (this.opacity > 1) {
                this.opacity = 1;
                this.dop *= -1;
            }
            if (this.opacity < 0 || this.y > this.ymax) {
                this.replace();
            }
            if (!((0 < (_ref = this.x) && _ref < this.xmax))) {
                this.x = (this.x + this.xmax) % this.xmax;
            }
            return drawCircle(~~this.x, ~~this.y, this.r, this.rgb + "," + this.opacity + ")");
        };

        range(a, b) {
            return (b - a) * Math.random() + a;
        };
    }


    //!-----------------------------------------------------

    export class MainAnimation extends BackgroundAnimation {
        public background: { r: number, g: number, b: number };
        private particleCount = 2000;
        private particleSize = 0.9 * 5;
        public fieldSize = 70;
        private fieldForce = 0.15;
        private noiseSpeed = 0.003;
        private trailLength = 0.15;
        private hueBase = 250;
        private hueRange = 25;
        public maxSpeed = .5;

        public columns = 0;
        public rows = 0;
        public noiseZ = 0;

        private field;
        private particles;

        private noise: SimplexNoise;

        constructor(parent: HTMLDivElement, background: { r: number; g: number; b: number }) {
            super(parent);
            this.background = background;
            this.x = 0;
            this.element.style.left = this.x + "px";

            this.noise = new SimplexNoise(Math.random());

            this.maxFPS = 60;
            this.reset();
        }

        protected recreate(): Animator.BackgroundAnimation {
            return new MainAnimation(this.parent, this.background);
        }

        protected render(ctx: CanvasRenderingContext2D) {
            this.calcField();
            this.noiseZ += this.noiseSpeed;
            this.drawBackground(ctx);
            this.drawParticles(ctx);
        }

        protected tick() {
        }

        public get w() {
            return this.width;
        }

        public get h() {
            return this.height;
        }

        private initParticles() {
            this.particles = [];
            let numberOfParticles = this.particleCount;
            for (let i = 0; i < numberOfParticles; i++) {
                let particle = new MainParticle(this, Math.random() * this.w, Math.random() * this.h);
                this.particles.push(particle);
            }
        }

        private initField() {
            this.field = new Array(this.columns);
            for (let x = 0; x < this.columns; x++) {
                this.field[x] = new Array(this.rows);
                for (let y = 0; y < this.rows; y++) {
                    this.field[x][y] = new Vector(0, 0);
                }
            }
        }

        private calcField() {
            for (let x = 0; x < this.columns; x++) {
                for (let y = 0; y < this.rows; y++) {
                    let angle = this.noise.noise3D(x / 20, y / 20, this.noiseZ) * Math.PI * 2;
                    let length = this.noise.noise3D(x / 40 + 40000, y / 40 + 40000, this.noiseZ) * this.fieldForce;
                    this.field[x][y].setLength(length);
                    this.field[x][y].setAngle(angle);
                }
            }
        }

        private reset() {
            this.noise = new SimplexNoise(Math.random());
            this.columns = Math.round(this.w / this.fieldSize) + 1;
            this.rows = Math.round(this.h / this.fieldSize) + 1;
            this.initParticles();
            this.initField();
        }

        private drawBackground(ctx: CanvasRenderingContext2D) {
            ctx.fillStyle = "rgba(" + this.background.r + "," + this.background.g + "," + this.background.b + "," + this.trailLength + ")";
            ctx.fillRect(0, 0, this.w, this.h);
        }

        private drawParticles(ctx: CanvasRenderingContext2D) {
            this.particles.forEach((p: MainParticle) => {
                let ps = Math.abs(p.vel.x + p.vel.y) * this.particleSize + 0.3;
                ctx.fillStyle = "hsl(" + (this.hueBase + p.hue + ((p.vel.x + p.vel.y) * this.hueRange)) + ", 100%, 50%)";
                ctx.fillRect(p.pos.x, p.pos.y, ps, ps);
                let pos = p.pos.div(this.fieldSize);
                let v;
                if (pos.x >= 0 && pos.x < this.columns && pos.y >= 0 && pos.y < this.rows) {
                    v = this.field[Math.floor(pos.x)][Math.floor(pos.y)];
                }
                p.move(v);
                p.wrap();
            });
        }
    }

    class MainParticle {
        public pos;
        public readonly vel;
        public readonly acc;
        public hue;
        private readonly animation: MainAnimation;

        constructor(animation: MainAnimation, x: number, y: number) {
            this.animation = animation;
            this.pos = new Vector(x, y);
            this.vel = new Vector(Math.random() - 0.5, Math.random() - 0.5);
            this.acc = new Vector(0, 0);
            this.hue = Math.random() * 30 - 15;
        }

        move(acc) {
            if (acc) {
                this.acc.addTo(acc);
            }
            this.vel.addTo(this.acc);
            this.pos.addTo(this.vel);
            if (this.vel.getLength() > this.animation.maxSpeed) {
                this.vel.setLength(this.animation.maxSpeed);
            }
            this.acc.setLength(0);
        }

        wrap() {
            if (this.pos.x > this.animation.w) {
                this.pos.x = 0;
            } else if (this.pos.x < -this.animation.fieldSize) {
                this.pos.x = this.animation.w - 1;
            }
            if (this.pos.y > this.animation.h) {
                this.pos.y = 0;
            } else if (this.pos.y < -this.animation.fieldSize) {
                this.pos.y = this.animation.h - 1;
            }
        }
    }

    class Vector {
        public x: number;
        public y: number;

        constructor(x, y) {
            this.x = x;
            this.y = y;
        }

        add(v) {
            return new Vector(
                this.x + v.x,
                this.y + v.y);
        }

        addTo(v) {
            this.x += v.x;
            this.y += v.y;
        }

        sub(v) {
            return new Vector(
                this.x - v.x,
                this.y - v.y);
        }

        subFrom(v) {
            this.x -= v.x;
            this.y -= v.y;
        }

        mult(n) {
            return new Vector(this.x * n, this.y * n);
        }

        multTo(n) {
            this.x *= n;
            this.y *= n;
        }

        div(n) {
            return new Vector(this.x / n, this.y / n);
        }

        setAngle(angle) {
            var length = this.getLength();
            this.x = Math.cos(angle) * length;
            this.y = Math.sin(angle) * length;
        }

        setLength(length) {
            var angle = this.getAngle();
            this.x = Math.cos(angle) * length;
            this.y = Math.sin(angle) * length;
        }

        getAngle() {
            return Math.atan2(this.y, this.x);
        }

        getLength() {
            return Math.sqrt(this.x * this.x + this.y * this.y);
        }

        getLengthSq() {
            return this.x * this.x + this.y * this.y;
        }

        distanceTo(v) {
            return this.sub(v).getLength();
        }

        copy() {
            return new Vector(this.x, this.y);
        }
    }
}