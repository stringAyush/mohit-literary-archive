/**
 * The full literary text. Every line break and space is kept exactly as written,
 * and React escapes the text, so nothing in it can run as code.
 *
 * Lineated forms (poems, quotes, aphorisms, short pieces) are set line by line with a
 * hanging indent: when a long line has to wrap on a narrow screen, the wrapped part is
 * indented, so readers can still see where the writer's own line ends.
 */
export function WorkText({
  body,
  language,
  size = "reading",
  lineated = true,
}: {
  body: string;
  language: string;
  size?: "reading" | "feature";
  lineated?: boolean;
}) {
  const lang = language === "other" ? undefined : language;
  const sizeClass =
    size === "feature"
      ? "text-[1.625rem] leading-[1.55] sm:text-[2rem] lg:text-[2.25rem]"
      : "text-[1.5rem] leading-[1.65] lg:text-[1.875rem]";

  if (!lineated) {
    return (
      <div lang={lang} className={`literary-text text-ink ${sizeClass}`}>
        {body}
      </div>
    );
  }

  const lines = body.replace(/\r\n?/g, "\n").split("\n");
  return (
    <div lang={lang} className={`literary-text text-ink ${sizeClass}`}>
      {lines.map((line, index) =>
        line.trim() === "" ? (
          <br key={index} />
        ) : (
          <span key={index} className="block pl-[1.25em] -indent-[1.25em]">
            {line}
          </span>
        ),
      )}
    </div>
  );
}
