import { Link } from "react-router-dom";

/*
  Renders an assistant reply without ever using dangerouslySetInnerHTML.
  It understands only what the assistant is told to produce:
    - **bold**
    - [text](/internal-link)   (only links to this site's own pages)
    - lines starting with "- " as bullet lists
  Anything else is shown as plain text.
*/

// The only places a chat message may link to.
const ALLOWED_LINK =
  /^\/(courses(\/[a-f0-9]{24})?|pricing|faq|contact|about|instructors|careers|create-account|login|become-instructor|verify)$/;

const TOKEN = /(\[[^\]\n]+\]\(\/[^)\s]*\)|\*\*[^*\n]+\*\*)/g;
const LINK = /^\[([^\]]+)\]\((\/[^)\s]*)\)$/;
const BOLD = /^\*\*([^*]+)\*\*$/;

function Inline({ text, onNavigate }) {
  return text.split(TOKEN).map((part, index) => {
    const link = part.match(LINK);
    if (link) {
      const [, label, href] = link;
      if (!ALLOWED_LINK.test(href)) return label;
      return (
        <Link
          key={index}
          to={href}
          onClick={onNavigate}
          className="font-semibold text-primary underline underline-offset-2 hover:text-primary-hover"
        >
          {label}
        </Link>
      );
    }

    const bold = part.match(BOLD);
    if (bold) return <strong key={index}>{bold[1]}</strong>;

    return part;
  });
}

export const parseBlocks = (text) => {
  const blocks = [];
  let list = null;

  for (const raw of String(text).split("\n")) {
    const line = raw.trimEnd();
    const bullet = line.match(/^\s*[-*•]\s+(.*)$/);

    if (bullet) {
      if (!list) {
        list = { type: "ul", items: [] };
        blocks.push(list);
      }
      list.items.push(bullet[1]);
      continue;
    }

    list = null;
    if (line.trim()) blocks.push({ type: "p", text: line });
  }

  return blocks;
};

export default function ChatMessage({ message, onNavigate }) {
  if (message.role === "user") {
    return (
      <div className="ml-auto max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-primary px-3.5 py-2.5 text-sm leading-6 text-white">
        {message.content}
      </div>
    );
  }

  const bubble = message.error
    ? "border-red-200 bg-red-50 text-red-800"
    : "border-gray-200 bg-white text-gray-800";

  return (
    <div
      className={`mr-auto max-w-[92%] break-words rounded-2xl rounded-bl-md border px-3.5 py-2.5 text-sm leading-6 ${bubble}`}
    >
      {parseBlocks(message.content).map((block, index) =>
        block.type === "ul" ? (
          <ul key={index} className="my-1 list-disc space-y-1 pl-5">
            {block.items.map((item, itemIndex) => (
              <li key={itemIndex}>
                <Inline text={item} onNavigate={onNavigate} />
              </li>
            ))}
          </ul>
        ) : (
          <p key={index} className={index > 0 ? "mt-2" : ""}>
            <Inline text={block.text} onNavigate={onNavigate} />
          </p>
        ),
      )}
    </div>
  );
}
