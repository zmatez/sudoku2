export namespace Animator {
    export class BackgroundAnimation {
        private readonly parent: HTMLDivElement;
        private readonly element: HTMLCanvasElement;
        private readonly width: number;
        private readonly height: number;
        private readonly x: number;
        private readonly y: number;

        private readonly upscale: number = 1;

        private running: boolean = true;

        private worleyNoise;
        private ticks = 0;

        constructor(parent: HTMLDivElement) {
            this.parent = parent;
            this.parent.classList.add("background-animation-parent");
            let box = this.parent.getBoundingClientRect();
            this.width = box.width;
            this.height = box.height;
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

            const WorleyNoise = require("worley-noise");

            this.worleyNoise = new WorleyNoise({
                numPoints: 10,
                /*seed: 42,*/
                dim: 3,
            });
        }

        start() {
            document.body.appendChild(this.element);
            window.requestAnimationFrame(() => this.animate());
        }

        stop() {
            this.running = false;
            this.element.remove();
        }

        restart(): BackgroundAnimation {
            this.stop();
            let anim = new BackgroundAnimation(this.parent);
            anim.start();
            return anim;
        }

        animate() {
            if (!this.running) {
                return
            }

            window.requestAnimationFrame(() => {
                this.animate();
            })

            //----------------------------------------------------------------
            const ctx = this.element.getContext('2d');
            ctx.fillStyle = "white";
            let width = this.width * this.upscale;
            let height = this.height * this.upscale;
            let data = ctx.getImageData(0, 0, width, height);

            let img = this.worleyNoise.renderImage(width, {
                normalize: true,
                z: this.ticks,
                callback: function (e, m) { return e(2) - e(1); }
            });

            let x = 0;
            let y = 0;
            for (let i = 0; i < data.data.length; i += 4) {
                x++;
                if(x >= width) {
                    x = 0;
                    y++;
                }
                let val = img[(y * width + x)] * 255;

                data.data[i] = 255; // red
                data.data[i + 1] = 255; // green
                data.data[i + 2] = 255; // blue
                data.data[i + 3] = val; //alpha
            }

            ctx.putImageData(data, 0, 0);

            //--------
            this.ticks++;
        }
    }
}