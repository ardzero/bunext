import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}
export const isSSR = typeof window === "undefined";

export const getPlaceholder = (width: number, height: number) =>
    `https://v0.dev/placeholder.svg?height=${height}&width=${width}`
// returns a promise that resolves after a given number of milliseconds
export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export function removeDuplicates(arr1: string[], arr2: string[]): string[] {
    const combined = [...arr1, ...arr2];
    return [...new Set(combined)];
}
// qr code img generator, default size is 250x250px
export function getQrCode(link: string, size?: string): string {
    const qrValue = link;
    const qrSize = size || "250";
    return `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${qrValue}`;
}

// check if email is valid and returns true or false
export function isEmailValid(email: string): boolean {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email);
}

export function nullChecker(string: any, optinalPassedString?: string) {
    if (
        string === undefined ||
        string === null ||
        string === "" ||
        string === " " ||
        string === false
    ) {
        if (
            optinalPassedString === undefined ||
            optinalPassedString == null ||
            optinalPassedString == ""
        ) {
            return null;
        } else return optinalPassedString;
    } else return string;
}

// contaverts text to normal case
export function convertToNormalCase(inputString: string | undefined) {
    if (!inputString) return inputString;
    const splittedString = inputString.split(".").pop();
    const string = splittedString || inputString;
    const words = string.replace(/([a-z])([A-Z])/g, "$1 $2").split(/_|\s+/);
    const capitalizedWords = words.map(
        (word) => word.charAt(0).toUpperCase() + word.slice(1),
    );
    return capitalizedWords.join(" ");
}

// capitalize the first letter of a string
export function capitalizeFirstLetter(
    string: string | undefined,
): string | undefined {
    if (!string) return string;
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Generate a random number in a range.
export const randomNum = (min: number, max: number): number =>
    Math.floor(Math.random() * (max - min)) + min;

// string shortner
export function truncateString(
    str: string | undefined,
    maxStrLength: number,
): string {
    if (!str) return "";
    if (str.length > maxStrLength) return `${str.slice(0, maxStrLength)}...`;
    return str;
}

// uniq code generator that takes in current time
export const generateUniqueCode = (): string | null => {
    const currentTime = new Date();
    const uniqueCode =
        Math.random().toString(36).substring(2, 14) +
        currentTime
            .toISOString()
            .replace(/[-:.TZ]/g, Math.random().toString(32).substring(2, 3)) +
        Math.random().toString(36).substring(2, 14) +
        Math.random().toString(32).substring(2, 8) +
        Math.random().toString(36).substring(2, 14);
    return uniqueCode?.toString();
};

// get screen size boolean
export function isScreenSizeLessThan(screenSize: number = 800) {
    if (typeof window === "undefined") return false;
    return window.innerWidth < screenSize;
}

interface NavigatorWithUserAgentData extends Navigator {
    userAgentData?: {
        platform: string;
    };
}
type OS = "MacOS" | "iOS" | "Windows" | "Android" | "Linux" | null;
// get the os
export function getOS(): OS {
    if (isSSR) return null;
    const userAgent = window.navigator.userAgent,
        platform =
            (window.navigator as NavigatorWithUserAgentData)?.userAgentData
                ?.platform || window.navigator.platform,
        macosPlatforms = ["Macintosh", "MacIntel", "MacPPC", "Mac68K"],
        windowsPlatforms = ["Win32", "Win64", "Windows", "WinCE"],
        iosPlatforms = ["iPhone", "iPad", "iPod"];

    let os: OS = null;

    if (macosPlatforms.indexOf(platform) !== -1) {
        os = "MacOS";
    } else if (iosPlatforms.indexOf(platform) !== -1) {
        os = "iOS";
    } else if (windowsPlatforms.indexOf(platform) !== -1) {
        os = "Windows";
    } else if (/Android/.test(userAgent)) {
        os = "Android";
    } else if (/Linux/.test(platform)) {
        os = "Linux";
    }
    return os;
}


// hasn't been tested yet
// export function getBrowser() {
// 	if (typeof window === "undefined") return null;
// 	const userAgent = window.navigator.userAgent;

// 	if (/edg/i.test(userAgent)) {
// 		return "Edge";
// 	} else if (/chrome|crios/i.test(userAgent) && !/edge|edg|opr|opera/i.test(userAgent)) {
// 		return "Chrome";
// 	} else if (/firefox|fxios/i.test(userAgent)) {
// 		return "Firefox";
// 	} else if (/safari/i.test(userAgent) && !/chrome|crios|opr|edg/i.test(userAgent)) {
// 		return "Safari";
// 	} else if (/opr|opera/i.test(userAgent)) {
// 		return "Opera";
// 	} else if (/msie|trident/i.test(userAgent)) {
// 		return "Internet Explorer";
// 	}
// 	return "Unknown";
// }


// simple hashing algorithm (not secure for password hashing)
export function murmurhash(key: string) {
    const remainder = key.length & 3;
    const bytes = key.length - remainder;
    const c1 = 0xcc9e2d51;
    const c2 = 0x1b873593;

    let h1 = 0;
    let i = 0;

    while (i < bytes) {
        let k1 =
            (key.charCodeAt(i) & 0xff) |
            ((key.charCodeAt(++i) & 0xff) << 8) |
            ((key.charCodeAt(++i) & 0xff) << 16) |
            ((key.charCodeAt(++i) & 0xff) << 24);
        ++i;

        k1 =
            ((k1 & 0xffff) * c1 + ((((k1 >>> 16) * c1) & 0xffff) << 16)) & 0xffffffff;
        k1 = (k1 << 15) | (k1 >>> 17);
        k1 =
            ((k1 & 0xffff) * c2 + ((((k1 >>> 16) * c2) & 0xffff) << 16)) & 0xffffffff;

        h1 ^= k1;
        h1 = (h1 << 13) | (h1 >>> 19);
        const h1b =
            ((h1 & 0xffff) * 5 + ((((h1 >>> 16) * 5) & 0xffff) << 16)) & 0xffffffff;
        h1 = (h1b & 0xffff) + 0x6b64 + ((((h1b >>> 16) + 0xe654) & 0xffff) << 16);
    }

    let k2 = 0;

    switch (remainder) {
        case 3:
            k2 ^= (key.charCodeAt(i + 2) & 0xff) << 16;
        // falls through
        case 2:
            k2 ^= (key.charCodeAt(i + 1) & 0xff) << 8;
        // falls through
        case 1:
            k2 ^= key.charCodeAt(i) & 0xff;

            k2 =
                ((k2 & 0xffff) * c1 + ((((k2 >>> 16) * c1) & 0xffff) << 16)) &
                0xffffffff;
            k2 = (k2 << 15) | (k2 >>> 17);
            k2 =
                ((k2 & 0xffff) * c2 + ((((k2 >>> 16) * c2) & 0xffff) << 16)) &
                0xffffffff;
            h1 ^= k2;
    }

    h1 ^= key.length;

    h1 ^= h1 >>> 16;
    h1 =
        ((h1 & 0xffff) * 0x85ebca6b +
            ((((h1 >>> 16) * 0x85ebca6b) & 0xffff) << 16)) &
        0xffffffff;
    h1 ^= h1 >>> 13;
    h1 =
        ((h1 & 0xffff) * 0xc2b2ae35 +
            ((((h1 >>> 16) * 0xc2b2ae35) & 0xffff) << 16)) &
        0xffffffff;
    h1 ^= h1 >>> 16;

    return h1 >>> 0;
}


// theo's prefered way of using try carch https://youtu.be/Y6jT-IkV0VM?si=vQ2EV2ZP4KZaW7Js
// Types for the result object with discriminated union
type Success<T> = {
    data: T;
    error: null;
};

type Failure<E> = {
    data: null;
    error: E;
};

type Result<T, E = Error> = Success<T> | Failure<E>;

// Main wrapper function
export async function tryCatch<T, E = Error>(
    promise: Promise<T>,
): Promise<Result<T, E>> {
    try {
        const data = await promise;
        return { data, error: null };
    } catch (error) {
        return { data: null, error: error as E };
    }
}

// extra
export function cleanSrc(src: string): string {
    if (src.includes('/public/')) return src.replace('/public/', '/')
    return src
}

export const encodeBase64 = (str: string): string => {
    return encodeURIComponent(Buffer.from(str).toString('base64'))
}

export const decodeBase64 = (encodedStr: string): string => {
    try {
        return Buffer.from(decodeURIComponent(encodedStr), 'base64').toString(
            'utf-8'
        )
    } catch (error) {
        console.error('Error decoding base64 string:', error)
        return ''
    }
}