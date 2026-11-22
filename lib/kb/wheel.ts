export const WHEEL: number[] = [0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
export const REDS: number[] = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
export const isRed = (n: number): boolean => REDS.indexOf(n) >= 0;
export const toneOf = (n: number): string => n === 0 ? "green" : REDS.indexOf(n) >= 0 ? "red" : "black";
