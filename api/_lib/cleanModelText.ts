// api/_lib/cleanModelText.ts

/**
 * Removes basic markdown formatting (bold, italics) from text.
 * @param text The raw text from the AI model.
 * @returns The cleaned text.
 */
export function cleanModelText(text: string): string {
  if (!text) return "";
  let result = text;

  // Remove bold (**)
  result = result.replace(/\*\*(.*?)\*\*/g, "$1");

  // Remove italics (* or _)
  result = result.replace(/(\*|_)(.*?)\1/g, "$2");
  
  return result.trim();
}