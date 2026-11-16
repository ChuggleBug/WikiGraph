export type TransformOptions = {
    count?: number;
};

export type TitleTransformOptions = {
    trim: boolean;
} & TransformOptions;

export function textTrim(text: string, opt: TransformOptions): string {
    const count = opt.count ?? 10;
    if (text.length > count) {
        text = text.substring(0, count - 3);
        text += "...";
    }
    return text;
}

export default function titleTransform(
    title: string,
    opt: TitleTransformOptions = {
        trim: false,
    },
): string {
    // Remove underscore from text
    const transformedTitle = title.replace(/_/g, " ");
    if (!opt.trim) {
        return transformedTitle;
    }

    return textTrim(transformedTitle, opt);
}
