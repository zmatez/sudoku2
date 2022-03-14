export namespace Utils {
    export const rint = (min: number, max: number) => {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    export const rfloat = (min: number, max: number) => {
        return (Math.random() * (max - min + 1) + min);
    }
}