import { h, Fragment } from "preact";
import {
  Button,
  VerticalSpace,
  Text,
  Stack,
  Textbox,
} from "@create-figma-plugin/ui";
import { emit } from "@create-figma-plugin/utilities";

export function IMGSync() {
  return (
    <Fragment>
      <Stack space="medium">
        <VerticalSpace space="medium" />
        <Text>Sync Images to seb.io</Text>
        <a href="https://seb.io/update" target="_blank">
          Update Now
        </a>
      </Stack>
    </Fragment>
  );
}
