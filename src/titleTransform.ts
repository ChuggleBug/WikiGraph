
export default function titleTransform(title: string): string {
    // Remove underscore from text
    const transformedTitle = title.replace(/_/g, ' ')

    return transformedTitle;
}