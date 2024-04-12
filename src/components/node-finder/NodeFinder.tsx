import { h } from "preact";
import { Button, Bold, Text } from "@create-figma-plugin/ui";
import { emit } from "@create-figma-plugin/utilities";
import "!./NodeFinder.css";

export function NodeFinder({ node }: { node: string }) {
  function getNode() {
    const textToCopy = node ? `<Figma node="${node}" caption=" " />` : ``;
    const textarea = document.createElement("textarea");
    textarea.value = textToCopy;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
    emit("COPIED_TO_CLIPBOARD", node);
  }

  return (
    <div class={"node-finder"}>
      <Text>
        <Bold>Node ID:</Bold>
      </Text>
      <div className="node-input">
        <input
          spellcheck={false}
          autocomplete={"off"}
          value={node ? `<Figma node="${node}" caption=" " />` : ""}
          placeholder={node ? "" : `<Figma node="[NODE_ID]" />`}
        />
        <Button onClick={getNode}>
          <svg viewBox="0 0 24 24">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
          </svg>
        </Button>
      </div>
    </div>
  );
}
