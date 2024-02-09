<script>
    import Field from "./Field.svelte";
    import {getImageTypDef, getObserverDef} from "../helpers/metadataUtilities" 
    export let metadata, spectraData, index;
    
    let arr = [];
    for (let i = 0; i <= metadata.length; i = i + 3) {
        arr.push([metadata[i], metadata[i + 1], metadata[i + 2]]);
    }

    spectraData["OBSERVER"] = getObserverDef();
    spectraData["IMAGETYP"] = getImageTypDef();

</script>
    <div class="px-4" style="overflow-y: scroll; overflow-x:hidden ; border: 1px solid  ; height: 400px;">
        {#each arr as field}
            <div class="form-row">
                <div class="form-group col-md-4">
                    {#if field[0] !== undefined}
                        <Field
                            name={field[0]}
                            bind:value={spectraData[field[0]]}
                            index={index}
                        />
                    {/if}
                </div>
                <div class="form-group col-md-4">
                    {#if field[1] !== undefined}
                        <Field
                            name={field[1]}
                            bind:value={spectraData[field[1]]}
                            index={index}
                        />
                    {/if}
                </div>
                <div class="form-group col-md-4">
                    {#if field[2] !== undefined}
                        <Field
                            name={field[2]}
                            bind:value={spectraData[field[2]]}
                            index={index}
                        />
                    {/if}
                </div>
            </div>
        {/each}
    </div>
