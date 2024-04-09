const blob = new Blob([
  `
    onmessage = function(e) {
        const {tokens, localVariables, importToCollection} = e.data;

        const variablesToBeCreated = [];
        const variablesToBeUpdated = [];

        const variablesInCollection = localVariables.filter((variable) => variable.collectionId === importToCollection);


        for ( let i = 0; i < tokens.length; i++ ) {
            const foundVariable = variablesInCollection.find((variable) => variable.name === tokens[i].name);
            if (foundVariable) {
                variablesToBeUpdated.push({
                    ...tokens[i],
                    id: foundVariable.id
                });
            } else {
                variablesToBeCreated.push(tokens[i]);
            }
        }
        
        postMessage({variablesToBeCreated, variablesToBeUpdated})
    }
`,
]);

const url = URL.createObjectURL(blob);

export const worker = new Worker(url);
