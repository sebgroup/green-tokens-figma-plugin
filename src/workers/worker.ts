const blob = new Blob([`
    function flattenTokens(obj, target) {
        for (const entry of Object.entries(obj)) {
            if (entry[1].hasOwnProperty('value')) {
                target.push(entry[1])
            } else {
                if (typeof entry[1] === 'object') {
                    flattenTokens(entry[1], target)
                }
            }
        }
    }

    onmessage = function(e) {
        const {tokens, localVariables} = e.data;
        
        const flatTokensMap = []

        flattenTokens(tokens, flatTokensMap)

        flatTokensMap.forEach((token, index) => {
            const matchedVariable = localVariables.find(variable => {
                if (variable.name === token.name) return true
                return false
            })
            flatTokensMap[index].attributes.figma.matchedVariable = matchedVariable
        })
        
        postMessage(flatTokensMap)
    }
                `])
const url = URL.createObjectURL(blob)

export const worker = new Worker(url)