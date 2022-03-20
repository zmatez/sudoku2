export namespace Utils {
    export const rint = (min: number, max: number) => {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    export const rfloat = (min: number, max: number) => {
        return (Math.random() * (max - min + 1) + min);
    }

    export class ColorMixer{
        /**
         *
         * @param hex1
         * @param hex2
         * @param value 0 (hex1) -> 1 (hex2)
         * @return mixed hex
         */
        public static mix(hex1: string, hex2: string, value: number): string{
            let rgb1 = ColorMixer.hexToRGB(hex1);
            let rgb2 = ColorMixer.hexToRGB(hex2);

            let r = rgb1.r + (rgb2.r - rgb1.r) * value;
            let g = rgb1.g + (rgb2.g - rgb1.g) * value;
            let b = rgb1.b + (rgb2.b - rgb1.b) * value;

            return ColorMixer.rgbToHex(Math.round(r),Math.round(g),Math.round(b));
        }
        /**
         *
         * @param hex1
         * @param hex2
         * @param value 0 (hex1) -> 1 (hex2)
         * @return mixed hex
         */
        public static mixRgb(hex1: string, hex2: string, value: number): {r: number, g: number, b: number}{
            let rgb1 = ColorMixer.hexToRGB(hex1);
            let rgb2 = ColorMixer.hexToRGB(hex2);

            let r = rgb1.r + (rgb2.r - rgb1.r) * value;
            let g = rgb1.g + (rgb2.g - rgb1.g) * value;
            let b = rgb1.b + (rgb2.b - rgb1.b) * value;

            return {r: Math.round(r), g: Math.round(g), b: Math.round(b)}
        }

        public static hexToRGB(hex: string): {r: number, g: number, b: number} {
            let regex = hex.replace("#","").match(/.{1,2}/g);
            return {
                r: parseInt(regex[0], 16),
                g: parseInt(regex[1], 16),
                b: parseInt(regex[2], 16)
            };
        }

        public static rgbToHex(r: number, g: number, b: number): string {
            const componentToHex = (c: number) => {
                let hex = c.toString(16);
                return hex.length == 1 ? "0" + hex : hex;
            }

            return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
        }

        public static changeShade (hexColor, magnitude): string {
            hexColor = hexColor.replace(`#`, ``);
            if (hexColor.length === 6) {
                const decimalColor = parseInt(hexColor, 16);
                let r = (decimalColor >> 16) + magnitude;
                r > 255 && (r = 255);
                r < 0 && (r = 0);
                let g = (decimalColor & 0x0000ff) + magnitude;
                g > 255 && (g = 255);
                g < 0 && (g = 0);
                let b = ((decimalColor >> 8) & 0x00ff) + magnitude;
                b > 255 && (b = 255);
                b < 0 && (b = 0);


                return ColorMixer.rgbToHex(r,b,g);
            } else {
                return hexColor;
            }
        };
    }
}