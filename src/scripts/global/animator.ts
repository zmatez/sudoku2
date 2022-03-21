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
        }

        start(){
            document.body.appendChild(this.element);
            window.requestAnimationFrame(() => this.animate());
        }

        stop(){
            this.running = false;
            this.element.remove();
        }

        restart(): BackgroundAnimation{
            this.stop();
            let anim = new BackgroundAnimation(this.parent);
            anim.start();
            return anim;
        }

        animate(){
            if(!this.running){
                return
            }

            window.requestAnimationFrame(() => this.animate());

            //----------------------------------------------------------------
            const ctx = this.element.getContext('2d');
            ctx.fillStyle = "white";
            ctx.clearRect(0,0,this.width,this.height);


        }
    }
}