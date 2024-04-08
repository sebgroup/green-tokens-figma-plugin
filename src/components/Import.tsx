import { createElement, h } from "preact";
import {
  Bold,
  FileUploadButton,
  FileUploadDropzone,
  Muted,
  Text,
  VerticalSpace,
  LoadingIndicator,
  IconCheckCircle32,
  IconWarning32,
  Button,
  Stack,
  Checkbox,
  Columns,
  Banner,
  Dropdown,
  DropdownOption,
} from "@create-figma-plugin/ui";
import { useContext, useState } from "preact/compat";
import { PluginContext, PluginDispatchContext } from "../ui";
import { ImportStateComponentEnum, IVariable, ReducerAction, Tokens } from "../types";
import JSX = createElement.JSX;
import { emit, EventHandler } from "@create-figma-plugin/utilities";
import { worker } from "../workers/worker";

function handleSelectedFiles(files: File[], localVariables: Pick<IVariable, "id" | "name">[], dispatch: (action: ReducerAction) => void, importToCollection: string | null) {
  const reader = new FileReader();
  reader.readAsText(files[0]);

  reader.onloadend = () => {
    if (typeof reader.result === "string") {
      const tokens: Tokens = JSON.parse(reader.result);

      worker.postMessage({ tokens, localVariables, importToCollection });

      worker.onmessage = (event) => {
        dispatch({ type: "SET_TOKENS_TO_IMPORT", tokens: event.data });
        dispatch({ type: "SET_IMPORT_STATE", importState: "approve" });
      };
    }
  };
}

function ConfirmImport(): JSX.Element {
  const dispatch = useContext(PluginDispatchContext);
  const state = useContext(PluginContext);

  return (
    <Stack space="small">
      <Text>Variables that will be created ({state.variablesToCreate?.length})</Text>
      <Text>Variables that will be updated ({state.variablesToUpdate?.length})</Text>
      <VerticalSpace space="small" />
      <Stack space="small">
        <div>
          <Button
            danger
            fullWidth
            onClick={() => {
              dispatch({ type: "SET_IMPORT_STATE", importState: "loading" });
              emit("EXECUTE_IMPORT", { variablesToCreate: state.variablesToCreate, variablesToUpdate: state.variablesToUpdate, collectionId: state.importToCollection });
            }}
          >
            Approve import
          </Button>
        </div>
        <div>
          <Button
            secondary
            fullWidth
            onClick={() => {
              dispatch({ type: "SET_IMPORT_STATE", importState: "ready" });
              dispatch({ type: "SET_ERROR_MESSAGE", errorMsg: null });
            }}
          >
            Cancel import
          </Button>
        </div>
      </Stack>
    </Stack>
  );
}

function FinishedImport(): JSX.Element {
  const dispatch = useContext(PluginDispatchContext);
  return (
    <Columns space="small">
      <div></div>
      <div
        style={{
          height: 240,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
        }}
      >
        <IconCheckCircle32 />
        <Text>Import done</Text>
        <VerticalSpace space="large" />
        <Button
          secondary
          fullWidth
          onClick={() => {
            dispatch({ type: "SET_IMPORT_STATE", importState: "ready" });
          }}
        >
          Import again
        </Button>
      </div>
      <div></div>
    </Columns>
  );
}

const ImportEnum: ImportStateComponentEnum = {
  ready: <ReadToImport />,
  approve: <ConfirmImport />,
  loading: <LoadingIndicator />,
  finished: <FinishedImport />,
};

function ReadToImport(): JSX.Element {
  const state = useContext(PluginContext);
  const dispatch = useContext(PluginDispatchContext);
  const options = state.localCollections.map((item) => ({ text: item.name, value: item.id }));
  const onSelectedFiles = async (files: File[]) => {
    dispatch({ type: "SET_IMPORT_STATE", importState: "loading" });

    handleSelectedFiles(files, state.localVariables, dispatch, state.importToCollection);
  };

  return (
    <Stack space="extraSmall">
      <Text>Import into collection:</Text>
      <Dropdown
        label={"Select collection to import to"}
        placeholder="Choose collection"
        options={options}
        value={state.importToCollection}
        variant="border"
        onChange={(event) => {
          dispatch({ type: "SET_IMPORT_TO_COLLECTION", importToCollection: event.currentTarget?.value });
        }}
      />
      {state.importToCollection && (
        <FileUploadDropzone disabled={state.importToCollection === null} acceptedFileTypes={["application/json"]} onSelectedFiles={onSelectedFiles}>
          <Text align="center">
            <Bold>Drop token file here to import</Bold>
          </Text>
          <VerticalSpace space="small" />
          <Text align="center">
            <Muted>or</Muted>
          </Text>
          <VerticalSpace space="small" />
          <FileUploadButton disabled={state.importToCollection === null} acceptedFileTypes={["application/json"]} onSelectedFiles={onSelectedFiles}>
            Select token file to import
          </FileUploadButton>
        </FileUploadDropzone>
      )}
    </Stack>
  );
}

function CreateCollections() {
  return (
    <Stack space={"medium"}>
      <Banner variant={"warning"} icon={<IconWarning32 />}>
        In order for this plugin to work you need to have two collections called REF and SYS
      </Banner>
      <Button
        fullWidth
        onClick={() => {
          emit("CREATE_REF_AND_SYS_COLLECTIONS");
        }}
      >
        Create collections
      </Button>
    </Stack>
  );
}

export const Import = (): JSX.Element => {
  const { importState, localCollections } = useContext(PluginContext);

  const localCollectionNames = localCollections.map((collection) => {
    return collection.name.toLowerCase();
  });

  if (importState === "loading") return ImportEnum[importState];

  //if (!localCollectionNames.includes("ref") && !localCollectionNames.includes("sys")) return <CreateCollections />;

  if (importState) return ImportEnum[importState];

  return ImportEnum.ready;
};
