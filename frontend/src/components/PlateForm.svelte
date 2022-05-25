<script>
    import Field from "./Field.svelte";
    import Modal from "./Modal.svelte";
    import {getDigitaliDef,getImageTypDef,getObserverDef} from "../helpers/metadataUtilities" 
    export let metadata, plateData;
    console.log(metadata);
    let arr = [];
    for (let i = 0; i <= metadata.length; i = i + 3) {
        arr.push([metadata[i], metadata[i + 1], metadata[i + 2]]);
    }
    
    plateData["OBSERVER"] = getObserverDef();
    plateData["DIGITALI"] = getDigitaliDef();
    plateData["IMAGETYP"] = getImageTypDef();

</script>

    <div class="px-4" style="overflow-y: scroll; overflow-x:hidden ; border: 1px solid  ; height: 400px;">
        {#each arr as field}
            <div class="form-row">
                <div class="form-group col-md-4">
                    {#if field[0] !== undefined}
                        <Field
                            name={field[0]}
                            bind:value={plateData[field[0]]}
                        />
                    {/if}
                </div>
                <div class="form-group col-md-4">
                    {#if field[1] !== undefined}
                        <Field
                            name={field[1]}
                            bind:value={plateData[field[1]]}
                        />
                    {/if}
                </div>
                <div class="form-group col-md-4">
                    {#if field[2] !== undefined}
                        <Field
                            name={field[2]}
                            bind:value={plateData[field[2]]}
                        />
                    {/if}
                </div>
            </div>
        {/each}
    </div>
