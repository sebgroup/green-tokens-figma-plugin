import { JSX, h } from "preact";
import { emit } from "@create-figma-plugin/utilities";
import {
  Text,
  Button,
  Stack,
  Textbox,
  VerticalSpace,
  Layer,
  IconLayerComponent16,
  IconLayerFrame16,
} from "@create-figma-plugin/ui";
import { useState } from "preact/hooks";

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

  const [value, setValue] = useState<boolean>(true);
  function handleChange(event: JSX.TargetedEvent<HTMLInputElement>) {
    const newValue = event.currentTarget.checked;
    console.log(newValue);
    setValue(newValue);
  }

  return (
    <Stack space="small">
      <VerticalSpace space="medium" />
      <Text>Node Finder:</Text>
      {/* <Textbox
        spellcheck={false}
        placeholder={node ? "" : `<Figma node="[NODE_ID]" />`}
        value={node ? `<Figma node="${node}" caption=" " />` : ""}
        variant="border"
      /> */}
      <Layer
        onChange={handleChange}
        value={value}
        // description={`<Figma node="${node}" caption=" " />`}
        icon={<IconLayerFrame16 />}
      >
        {`<Figma node="${node}" caption=" " />`}
        {/* Node: */}
      </Layer>
      <Button onClick={getNode} fullWidth>
        Copy Node
      </Button>
    </Stack>
  );
}
