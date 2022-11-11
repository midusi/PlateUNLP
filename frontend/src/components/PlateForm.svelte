<script>
    import Field from "./Field.svelte";
    import {getDigitaliDef, getScannerDef, getScanresDef, getScancolDef, getSoftwareDef} from "../helpers/metadataUtilities" 
    export let metadata, plateData;
    
    let arr = [];
    for (let i = 0; i <= metadata.length; i = i + 3) {
        arr.push([metadata[i], metadata[i + 1], metadata[i + 2]]);
    }
    
    plateData["DIGITALI"] = getDigitaliDef();
    plateData["SCANNER"] = getScannerDef();
    plateData["SCAN-RES"] = getScanresDef();
    plateData["SCAN-COL"] = getScancolDef();
    plateData["SOFTWARE"] = getSoftwareDef();
</script>

<div class="px-4" style=" border: 1px solid  ;">
    {#each arr as fields}
        <div class="form-row">
            {#each fields as field}
                <div class="form-group col-md-4">
                    {#if field !== undefined}
                        <Field
                            name={field}
                            bind:value={plateData[field]}
                        />
                    {/if}
                </div>
            {/each}
        </div>
    {/each}
</div>
