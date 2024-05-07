export const englishNameRegExp = new RegExp(
    "^[a-zA-Z ]*('[a-zA-Z0-9 ._-]+')?[a-zA-Z ]*$",
);

export const generateCred = (
    english_name: string | undefined,
    char: string,
) => {
    if (!english_name) return "";
    return english_name
        .trim()
        .replaceAll(/'(.*?)'/g, "")
        .replaceAll(/[^a-zA-Z\s]/g, "")
        .replaceAll(/\s+/g, char)
        .toLowerCase();
};
