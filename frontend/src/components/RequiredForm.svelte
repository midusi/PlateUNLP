<script>
    import Field from "./Field.svelte";
    import NButton from "./NButton.svelte";
    export let metadata, spectraData,invalidSpectrum,confirmSearchMetadata;

    let arr = [];
    for (let i = 0; i <= metadata.length; i = i + 3) {
        arr.push([metadata[i], metadata[i + 1], metadata[i + 2]]);
    }

</script>

    <div class="px-4 mb-2" style="border: 1px solid;">
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
        <div class="mb-4">
            <NButton click={confirmSearchMetadata} disabled={invalidSpectrum}>
                    Buscar metadatos
            </NButton>
        </div>
    </div>
