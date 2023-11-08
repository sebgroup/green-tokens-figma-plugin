import {Token} from "../types";
import chroma from "chroma-js";

export class InterimVariable {
    id: string | undefined
    name: string
    description: string | undefined
    newValuesByMode: {
        [modeId: string]: VariableValue
    } = {}
    resolvedDataType: VariableResolvedDataType
    alias: boolean
    originalId?: string
    originalName?: string
    originalLightName?: string
    originalDarkName?: string
    existingFigmaVariable: Variable | undefined | null
    variableCollectionId: string | undefined | null
    variableCollection: VariableCollection | null | undefined

    constructor(token: Token) {
        this.id = token.attributes.figma.id
        this.name = token.path.slice(1, token.path.length).join('/')
        this.description = token.description
        this.resolvedDataType = token.attributes.figma.resolvedType
        this.originalId = token.attributes.figma.id
        this.originalLightName = token.attributes.figma.originalLightName
        this.originalDarkName = token.attributes.figma.originalDarkName
        this.alias = !!token.attributes.figma.originalLightId || !!token.attributes.figma.originalDarkId

        if (this.resolvedDataType === 'FLOAT') this.originalDarkName = this.originalLightName

        this.setUpExistingVariable(token)
        this.setUpVariableCollection()
        this.setUpValuesByMode(token)
    }

    private setUpExistingVariable(token: Token) {
        if (token.attributes.figma.matchedVariable) {
            this.existingFigmaVariable = figma.variables.getLocalVariables().find(variable => variable.name === token.attributes.figma.matchedVariable?.name)
        } else {
            this.existingFigmaVariable = undefined
        }
    }

    private setUpVariableCollection() {
        if (this.existingFigmaVariable) {
            this.variableCollectionId = this.existingFigmaVariable.variableCollectionId
            this.variableCollection = figma.variables.getVariableCollectionById(this.existingFigmaVariable.variableCollectionId)
        }

        try {
            if (this.id) {
                this.variableCollectionId = figma.variables.getLocalVariables().find(variable => variable.id === this.id)?.variableCollectionId

                if (this.variableCollectionId) {
                    this.variableCollection = figma.variables.getLocalVariableCollections().find(collection => collection.id === this.variableCollectionId)
                }
            }

            if (!this.variableCollection) {
                if (this.alias) {
                    this.variableCollection = figma.variables.getLocalVariableCollections().find(collection => collection.name.toLowerCase() === 'sys')
                    this.variableCollectionId = this.variableCollection?.id
                } else {
                    this.variableCollection = figma.variables.getLocalVariableCollections().find(collection => collection.name.toLowerCase() === 'ref')
                    this.variableCollectionId = this.variableCollection?.id
                }
            }

        } catch (err) {
            console.error(err)
            const localCollections = figma.variables.getLocalVariableCollections()

            if (this.originalId) {
                this.variableCollection = localCollections.find(collection => collection.name?.toLowerCase() === 'sys')
            } else if (this.variableCollectionId) {
                this.variableCollection = figma.variables.getVariableCollectionById(this.variableCollectionId)
            } else {
                this.variableCollection = localCollections.find(collection => collection.name?.toLowerCase() === 'ref')
            }

            this.variableCollectionId = this.variableCollection?.id
        }
    }

    private setUpValuesByMode(token: Token) {
        let exsistingLightVariable: Variable | undefined;
        let exsistingDarkVariable: Variable | undefined;

        if (this.alias) {
            exsistingLightVariable = figma.variables.getLocalVariables().find(variable => {
                return variable.name === token.attributes.figma.originalLightName
            })

            exsistingDarkVariable = figma.variables.getLocalVariables().find(variable => {
                return variable.name === token.attributes.figma.originalDarkName
            })
        }

        if (this.variableCollection) {
            this.variableCollection.modes.forEach(mode => {
                let value

                if (mode.name.toLowerCase() === 'dark') {
                    if (token.attributes.figma.resolvedType === 'FLOAT') {
                        exsistingDarkVariable = exsistingLightVariable
                    }

                    if (token.darkValue) {
                        value = token.darkValue
                    } else {
                        value = token.value;
                    }
                } else {
                    value = token.value;
                }

                if (this.alias && value) {
                    if (mode.name.toLowerCase() === 'dark') {
                        if (exsistingDarkVariable) {
                            this.newValuesByMode[mode.modeId] = {type: 'VARIABLE_ALIAS', id: exsistingDarkVariable.id}
                        } else {
                            this.newValuesByMode[mode.modeId] = {type: 'VARIABLE_ALIAS', id: 'getLocal'}
                        }
                    }
                    if (mode.name.toLowerCase() === 'light') {
                        if (exsistingLightVariable) {
                            this.newValuesByMode[mode.modeId] = {type: 'VARIABLE_ALIAS', id: exsistingLightVariable.id}
                        } else {
                            this.newValuesByMode[mode.modeId] = {type: 'VARIABLE_ALIAS', id: 'getLocal'}
                        }
                    }
                    return
                }

                if (!value) {
                    if (token.attributes.figma.resolvedType === "COLOR") {
                        console.error(`No dark mode value set on token: ${token.name}`)
                    } else if (token.attributes.figma.resolvedType === "FLOAT" && typeof token.value === 'string') {
                        this.newValuesByMode[mode.modeId] = parseFloat(token.value);
                    } else {
                        this.newValuesByMode[mode.modeId] = token.value;
                    }
                } else {
                    if (token.attributes.figma.resolvedType === "COLOR" && chroma.valid(value)) {
                        const rgbaColor = chroma(value as string).rgba();
                        this.newValuesByMode[mode.modeId] = {
                            r: rgbaColor[0] / 255,
                            g: rgbaColor[1] / 255,
                            b: rgbaColor[2] / 255,
                            a: rgbaColor[3]
                        };
                    } else if (token.attributes.figma.resolvedType === "FLOAT" && typeof value === 'string') {
                        this.newValuesByMode[mode.modeId] = parseFloat(value);
                    } else {
                        this.newValuesByMode[mode.modeId] = value;
                    }
                }
            })
        } else {
            this.newValuesByMode['default'] = token.value;
            if (token.darkValue) {
                this.newValuesByMode['dark'] = token.darkValue;
            }

        }
    }

    /* Checks if there is diff between token value being imported and variable value in Figma */
    hasDiff() {
        try {
            if (this.existingFigmaVariable?.valuesByMode) {
                const diffArray: boolean[] = []

                for (const [key, value] of Object.entries(this.newValuesByMode)) {
                    if (['string', 'boolean', 'number'].includes(typeof value)) {
                        diffArray.push((value !== this.existingFigmaVariable?.valuesByMode[key]))
                    }

                    if (typeof value === 'object') {
                        Object.entries(this.newValuesByMode[key]).forEach(([key2, value2]) => {
                            // @ts-ignore
                            diffArray.push((value2 !== this.existingFigmaVariable?.valuesByMode[key][key2]))
                        })

                    }
                }

                return diffArray.includes(true)
            }
        } catch (err) {
            return true
        }
    }

    createFigmaVariable() {
        if (this.name && this.variableCollectionId && this.resolvedDataType) {
            const figmaVariable: Variable | undefined = figma.variables.createVariable(this.name, this.variableCollectionId, this.resolvedDataType)

            if (this.alias) {
                const localVariables = figma.variables.getLocalVariables().map(({id, name}) => ({id, name}))

                for (const [modeId, value] of Object.entries(this.newValuesByMode)) {
                    if (typeof value === 'object' && 'id' in value) {
                        if (localVariables.map(({id}) => (id)).includes(value.id)) {
                            figmaVariable.setValueForMode(modeId, value)
                        } else if (value.id === 'getLocal') {

                            const currentMode = figma.variables.getVariableCollectionById(this.variableCollectionId)?.modes.find(({modeId: currentmodeId}) => (currentmodeId === modeId))
                            if (currentMode && currentMode.name.toLowerCase() === 'light') {
                                const ref = localVariables.find(variable => (variable.name === this.originalLightName))
                                if (ref) {
                                    value.id = ref.id
                                    figmaVariable.setValueForMode(modeId, value)
                                }
                            }

                            if (currentMode && currentMode.name.toLowerCase() === 'dark') {
                                const ref = localVariables.find(variable => (variable.name === this.originalDarkName))
                                if (ref) {
                                    value.id = ref.id
                                    figmaVariable.setValueForMode(modeId, value)
                                } else if (this.resolvedDataType === 'FLOAT') {}
                            }
                        } else {
                            console.error('Alias variable not found... ', value)
                        }
                    }
                }
            } else {
                for (const [modeId, value] of Object.entries(this.newValuesByMode)) {
                    figmaVariable.setValueForMode(modeId, value)
                }
            }

            return figmaVariable
        } else {
            console.error('To create a Figma variable we need the following properties: name, variableCollectionId, type')
        }

    }

    updateValueByMode() {
        if (!this.variableCollection) return

        if (this.alias && this.existingFigmaVariable) {
            this.variableCollection.modes.forEach(mode => {
                if (this.newValuesByMode[mode.modeId]) {
                    this.existingFigmaVariable?.setValueForMode(mode.modeId, this.newValuesByMode[mode.modeId])
                }
            })

        } else if (this.existingFigmaVariable) {
            this.existingFigmaVariable?.setValueForMode(this.variableCollection.defaultModeId, this.newValuesByMode[this.variableCollection.defaultModeId])
        }
    }
}