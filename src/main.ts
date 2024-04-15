import { emit, EventHandler, on, showUI } from "@create-figma-plugin/utilities";
const { getLocalVariableCollections, getLocalVariables } = figma.variables;
import chroma from "chroma-js";

/**
 *
 * We need to get the local variables and collections and call the getters on each property.
 * If we don't do this the values will be undefined when passed to the UI.
 * @returns { Promise<{localVariables: {id: string, name: string, collectionId: string}[], localCollections: {id: string, name: string, modes: {modeId: string, name: string}[], defaultModeId: string}[]}>}
 */
async function getLocalData() {
  return {
    localVariables: await figma.variables
      .getLocalVariablesAsync()
      .then((variables) =>
        variables.map((variable) => ({
          id: variable.id,
          name: variable.name,
          collectionId: variable.variableCollectionId,
        }))
      ),
    localCollections: figma.variables
      .getLocalVariableCollections()
      .map((collection) => ({
        id: collection.id,
        name: collection.name,
        modes: collection.modes,
        defaultModeId: collection.defaultModeId,
      })),
  };
}

function hexToFigmaColor(color: string) {
  return {
    r: chroma(color).rgba()[0] / 255,
    g: chroma(color).rgba()[1] / 255,
    b: chroma(color).rgba()[2] / 255,
    a: chroma(color).rgba()[3],
  };
}

export default () => {
  on("IMPORT_TOKENS", async (data: any) => {
    console.log(data);
  });

  on(
    "EXECUTE_IMPORT",
    async ({ variablesToCreate, variablesToUpdate, collectionId }) => {
      const variableCollection =
        await figma.variables.getVariableCollectionByIdAsync(collectionId);
      let lightModeId,
        darkModeId,
        spaciousModeId,
        compactModeId,
        standardModeId;

      if (variableCollection) {
        variableCollection.modes.forEach((mode) => {
          switch (mode.name.toUpperCase()) {
            case "LIGHT":
              lightModeId = mode.modeId;
              break;
            case "DARK":
              darkModeId = mode.modeId;
              break;
            case "COMPACT":
              compactModeId = mode.modeId;
              break;
            case "STANDARD":
              standardModeId = mode.modeId;
              break;
            case "SPACIOUS":
              spaciousModeId = mode.modeId;
              break;
            default:
              break;
          }
        });

        for (let index = 0; index < variablesToCreate.length; index++) {
          const token = variablesToCreate[index];
          const createdVariable = figma.variables.createVariable(
            token.name,
            variableCollection,
            token.type.toUpperCase()
          );

          if (createdVariable.resolvedType === "COLOR") {
            if (!lightModeId) {
              lightModeId = variableCollection.defaultModeId;
              variableCollection.renameMode(lightModeId, "Light");
            }

            if (!darkModeId) {
              darkModeId = variableCollection.addMode("Dark");
            }

            if (lightModeId && token.value) {
              createdVariable.setValueForMode(
                lightModeId,
                hexToFigmaColor(token.value)
              );
            }
            if (darkModeId) {
              if (token.darkValue) {
                createdVariable.setValueForMode(
                  darkModeId,
                  hexToFigmaColor(token.darkValue)
                );
              } else {
                createdVariable.setValueForMode(
                  darkModeId,
                  hexToFigmaColor(token.value)
                );
              }
            }
          }

          if (createdVariable.resolvedType === "FLOAT") {
            if (!standardModeId) {
              standardModeId = variableCollection.defaultModeId;
            }

            if (standardModeId && token.value) {
              createdVariable.setValueForMode(
                standardModeId,
                parseFloat(token.value)
              );
            }

            if (token.compactValue) {
              if (!compactModeId) {
                compactModeId = variableCollection.addMode("Compact");
              }
              createdVariable.setValueForMode(
                compactModeId,
                parseFloat(token.compactValue)
              );
            }

            if (spaciousModeId && token.spaciousValue) {
              if (!spaciousModeId) {
                spaciousModeId = variableCollection.addMode("Spacious");
              }
              createdVariable.setValueForMode(
                spaciousModeId,
                parseFloat(token.spaciousValue)
              );
            }
          }
        }

        for (let index = 0; index < variablesToUpdate.length; index++) {
          const variable = variablesToUpdate[index];
          const existingVariable = figma.variables.getVariableById(variable.id);

          if (existingVariable) {
            if (existingVariable.resolvedType === "COLOR") {
              if (lightModeId && variable.value) {
                figma.variables
                  .getVariableById(variable.id)
                  ?.setValueForMode(
                    lightModeId,
                    hexToFigmaColor(variable.value)
                  );
              }
              if (darkModeId && variable.darkValue) {
                figma.variables
                  .getVariableById(variable.id)
                  ?.setValueForMode(
                    darkModeId,
                    hexToFigmaColor(variable.darkValue)
                  );
              }
            }

            if (existingVariable.resolvedType === "FLOAT") {
              if (standardModeId && variable.value) {
                figma.variables
                  .getVariableById(variable.id)
                  ?.setValueForMode(standardModeId, parseFloat(variable.value));
              }
              if (compactModeId && variable.compactValue) {
                figma.variables
                  .getVariableById(variable.id)
                  ?.setValueForMode(
                    compactModeId,
                    parseFloat(variable.compactValue)
                  );
              }
              if (spaciousModeId && variable.spaciousValue) {
                figma.variables
                  .getVariableById(variable.id)
                  ?.setValueForMode(
                    spaciousModeId,
                    parseFloat(variable.spaciousValue)
                  );
              }

              if (!standardModeId && !compactModeId && !spaciousModeId) {
                const currentVariable = figma.variables.getVariableById(
                  variable.id
                );
                currentVariable?.setValueForMode(
                  variableCollection.defaultModeId,
                  parseFloat(variable.value)
                );
              }
            }
          }
        }
      } else {
        throw new Error("Variable collection not found");
      }

      emit("IMPORT_FINISHED");
    }
  );

  on("EXPORT_VARIABLES", () => {
    const collections = getLocalVariableCollections().map((item) => ({
      id: item.id,
      name: item.name,
      modes: item.modes,
      defaultModeId: item.defaultModeId,
    }));

    const variables = getLocalVariables().map((item) => ({
      name: item.name,
      id: item.id,
      variableCollection: collections.find(
        (collection) => collection.id === item.variableCollectionId
      ),
      description: item.description,
      valuesByMode: item.valuesByMode,
      resolvedType: item.resolvedType,
    }));

    emit("SAVE_VARIABLES_TO_FILE", variables as any);
  });

  on("CREATE_REF_AND_SYS_COLLECTIONS", () => {
    figma.variables.createVariableCollection("ref");
    const sysCollection = figma.variables.createVariableCollection("sys");
    sysCollection.renameMode(sysCollection.defaultModeId, "Light");
    sysCollection.addMode("Dark");
    getLocalData().then((data) => emit("SET_LOCAL_DATA", data));
  });

  figma.on("selectionchange", () => {
    const selectedNodes = figma.currentPage.selection;
    if (selectedNodes.length > 0) {
      const nodeId = selectedNodes[0].id.replace(":", "-");
      emit("NODE_SELECTED", nodeId);
    } else {
      emit("NODE_SELECTED", null);
    }
  });

  on("COPIED_TO_CLIPBOARD", (message) => {
    figma.notify(`${message} copied to clipboard!`);
  });

  on("TRIGGER_BUILD", async (token) => {
    const response = await fetch(
      "https://api.github.com/repos/sebgroup/seb.io/actions/workflows/staging/dispatches",
      {
        method: "POST",
        headers: {
          Authorization: `token ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
        body: JSON.stringify({
          ref: "main",
        }),
      }
    );

    if (!response.ok) {
      console.error("Failed to trigger build:", response.statusText);
    }
  });

  on("SYNC_IMAGES", (message) => {
    figma.notify(`Image Sync started!`);
  });

  on("AUTHENTICATE", (message) => {
    figma.notify(`${message}`);
  });

  showUI({ height: 400, width: 320 });

  getLocalData().then((data) => emit("SET_LOCAL_DATA", data));
};
