/* Headline text split into one inline-block span per character, for the letter-by-letter entrance.
   Spaces become non-breaking so the empty inline-blocks keep their width. */
export default function SplitChars({ text }: { text: string }) {
  return (
    <>
      {Array.from(text).map((c, i) => (
        <span key={i} className="ch">{c === " " ? " " : c}</span>
      ))}
    </>
  );
}
