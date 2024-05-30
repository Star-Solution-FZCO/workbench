import {
    IntlFormatDistanceUnit,
    differenceInHours,
    differenceInMinutes,
    differenceInSeconds,
    format,
    intlFormatDistance,
    parseISO,
} from "date-fns";
import { format as formatWithTZ, toZonedTime } from "date-fns-tz";
import DOMPurify from "dompurify";
import parse from "html-react-parser";
import { lowerCase, snakeCase } from "lodash";

export function dataURItoBlob(dataURI: string) {
    const byteString = window.atob(dataURI.split(",")[1]);

    const mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];

    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);

    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ab], { type: mimeString });
}

export const formatDateYYYYMMDD = (date: Date | string) => {
    if (typeof date === "string") {
        date = new Date(date);
    }
    return format(date, "yyyy-MM-dd");
};

export const formatDateHumanReadable = (date: Date | string) => {
    if (typeof date === "string") {
        date = parseISO(date);
    }
    return format(date, "dd MMM yyyy");
};

export const formatDateTimeHumanReadable = (date: Date | string) => {
    if (typeof date === "string") {
        date = parseISO(date);
    }
    return format(date, "dd MMM yyyy HH:mm:ss");
};

export const parseHTML = (htmlString: string) => {
    const cleanHtmlString = DOMPurify.sanitize(htmlString, {
        USE_PROFILES: { html: true },
    });
    const html = parse(cleanHtmlString);
    return html;
};

export const stringToColor = (string: string) => {
    let hash = 0;
    let i;

    for (i = 0; i < string.length; i += 1) {
        hash = string.charCodeAt(i) + ((hash << 5) - hash);
    }

    let color = "#";

    for (i = 0; i < 3; i += 1) {
        const value = (hash >> (i * 8)) & 0xff;
        color += `00${value.toString(16)}`.slice(-2);
    }

    return color;
};

export const HHmmUTCtoTZ = (timeString: string, timezone: string) => {
    const currentDate = new Date();

    const [hours, minutes] = timeString.split(":");

    const utcDate = new Date(
        Date.UTC(
            currentDate.getUTCFullYear(),
            currentDate.getUTCMonth(),
            currentDate.getUTCDate(),
            parseInt(hours, 10),
            parseInt(minutes, 10),
        ),
    );

    const zonedDate = toZonedTime(utcDate, timezone);
    const zonedTimeString = formatWithTZ(zonedDate, "HH:mm", {
        timeZone: timezone,
    });

    return zonedTimeString;
};

export const parseConfluenceHighlight = (text: string) => {
    return parse(
        text
            .replaceAll("@@@hl@@@", "<strong>")
            .replaceAll("@@@endhl@@@", "</strong>"),
    );
};

export const formatDateDiffHumanReadable = (start: Date, end: Date) => {
    let unit: IntlFormatDistanceUnit = "second";

    const diffInSeconds = differenceInSeconds(start, end);
    const diffInMinutes = differenceInMinutes(start, end);
    const diffInHours = differenceInHours(start, end);

    if (-diffInSeconds >= 60) {
        unit = "minute";
    }
    if (-diffInMinutes >= 60) {
        unit = "hour";
    }
    if (-diffInHours >= 24) {
        unit = "day";
    }

    return intlFormatDistance(start, end, { locale: "en", unit });
};

export const toISOUTC = (date: Date, tz: string) => {
    const dateStrWithTZ = formatWithTZ(date, "yyyy-MM-dd'T'HH:mm:ssxxx", {
        timeZone: tz,
    });

    const result = formatWithTZ(
        toZonedTime(dateStrWithTZ, "UTC"),
        "yyyy-MM-dd'T'HH:mm:ssxxx",
        { timeZone: "UTC" },
    );

    return result;
};

function hexToRgb(hex: string) {
    hex = hex.replace(/^#/, "");

    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return [r, g, b];
}

export function getContrastColorHex(bgHex: string) {
    const rgb = hexToRgb(bgHex);
    const brightness = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
    return brightness > 125 ? "black" : "white";
}

export const convertSourceName = (sourceName: string): string => {
    return snakeCase(lowerCase(sourceName));
};
