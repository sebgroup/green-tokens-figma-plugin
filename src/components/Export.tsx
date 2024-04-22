import { Button, Stack, VerticalSpace, Text } from "@create-figma-plugin/ui";
import { emit } from "@create-figma-plugin/utilities";
import { h } from "preact";

export function Export() {
  return (
    <Stack space="medium">
      <VerticalSpace space="medium" />
      <Text>Export all variables as JSON</Text>
      <Button
        fullWidth
        onClick={() => {
          emit("EXPORT_VARIABLES");
        }}
      >
        Export JSON file
      </Button>
    </Stack>
  );
}
