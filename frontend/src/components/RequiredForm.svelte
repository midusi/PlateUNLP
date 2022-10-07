<script>
    import Field from "./Field.svelte";
    import NButton from "./NButton.svelte";
    export let metadata, spectraData, invalidSpectrum, confirmSearchMetadata;

    let arr = [];
    for (let i = 0; i < metadata.length; i = i + 3) {
        arr.push([metadata[i], metadata[i + 1], metadata[i + 2]]);
    }

</script>

    <div class="px-4 mb-2" style="border: 1px solid;">
        {#each arr as fields}
            <div class="form-row">
                {#each fields as field}
                    <div class="form-group col-md-4">
                        <Field
                            name={field}
                            bind:value={spectraData[field]}
                        />
                    </div>
                {/each}
            </div>
        {/each}
        <div class="mb-4">
            <NButton click={confirmSearchMetadata} disabled={invalidSpectrum}>
                    Buscar metadatos
            </NButton>
        </div>
    </div>
