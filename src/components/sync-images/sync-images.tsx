import { h, Fragment } from "preact";
import {
  Button,
  VerticalSpace,
  Text,
  Stack,
  Textbox,
} from "@create-figma-plugin/ui";
import { emit } from "@create-figma-plugin/utilities";
import { useState } from "preact/hooks";

export function IMGSync() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  function authenticate() {
    emit("AUTHENTICATE", true);
    setIsAuthenticated(true);
  }

  function syncImages() {
    emit("SYNC_IMAGES", true);
    emit("TRIGGER_BUILD", true);
  }

  return (
    <Fragment>
      {isAuthenticated ? (
        <Stack space="medium">
          <VerticalSpace space="medium" />
          <Text>Sync Images to seb.io</Text>
          <Button onClick={syncImages} fullWidth>
            Sync Now
          </Button>
        </Stack>
      ) : (
        <Stack space="medium">
          <VerticalSpace space="medium" />
          <Text>Authenticate with GitHub to sync images</Text>
          <Textbox password value="Not authenticated" variant="border" />
          <Button onClick={authenticate} fullWidth>
            Authenticate with GitHub
          </Button>
        </Stack>
      )}
    </Fragment>
  );
}
