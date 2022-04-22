<script>
    import Field from "./Field.svelte";
    import Modal from "./Modal.svelte";
    import {getDigitaliDef,getImageTypDef,getObserverDef} from "../helpers/metadataUtilities" 
    export let metadata, spectraData;

    let arr = [];
    for (let i = 0; i <= metadata.length; i = i + 3) {
        arr.push([metadata[i], metadata[i + 1], metadata[i + 2]]);
    }
    
    spectraData["OBSERVER"] = getObserverDef();
    spectraData["DIGITALI"] = getDigitaliDef();
    spectraData["IMAGETYP"] = getImageTypDef();

</script>

<Modal bottonText="Más metadatos" titleModal="Metadatos" key="metadatos">
    <div slot="modalBody">
        {#each arr as field}
            <div class="form-row">
                <div class="form-group col-md-4">
                    {#if field[0] !== undefined}
                        <Field
                            name={field[0]}
                            bind:value={spectraData[field[0]]}
                        />
                    {/if}
                </div>
                <div class="form-group col-md-4">
                    {#if field[1] !== undefined}
                        <Field
                            name={field[1]}
                            bind:value={spectraData[field[1]]}
                        />
                    {/if}
                </div>
                <div class="form-group col-md-4">
                    {#if field[2] !== undefined}
                        <Field
                            name={field[2]}
                            bind:value={spectraData[field[2]]}
                        />
                    {/if}
                </div>
            </div>
        {/each}
    </div>

    <div slot="footerBody">
        <button type="button" class="btn btn-secondary" data-dismiss="modal"
            >Cerrar</button
        >
    </div>
</Modal>
