<script>
    let group = 1;
    let valuesCheck = [];
    let newValue = "";
    export let paramNameLists,paramNameDef, defaultValue, list, handleAdd, handleDelete, handleDefault;

    function AddValue(){
        handleAdd(newValue,paramNameLists);
        newValue = "";
    }
    export function reset(def){
        newValue = "";
        valuesCheck = [];
        defaultValue = def;
    }

    function deleteValues(){
        handleDelete(valuesCheck,paramNameLists,paramNameDef);
        valuesCheck = [];
    }

</script>
       
       
    <div class="px-4">
        {#if list.length>0}
            <div><span>Seleccione para eliminar</span></div>
            {#each list as el}
                <label><input class="mx-2" type="checkbox" bind:group={valuesCheck} value={el}/> {el}</label>
            {/each}
            {#if valuesCheck.length > 0}
                <button type="button" class="btn-sm btn btn-outline-danger" on:click={deleteValues}>
                    &#10060;
                </button>
            {/if}
        {/if}
        <div class="row">
            <div class="col">
                <span>Seleccionar valor por defecto</span>
                <form on:submit|preventDefault={() => handleDefault(defaultValue,paramNameDef)}>
                    <select
                    bind:value={defaultValue}
                    class="browser-default custom-select"
                    >
                        {#each list as el}
                        <option value={el}> {el} </option>
                        {/each}
                        <option value="">Ninguno</option>
                    </select>
                    <button type="submit" class="btn btn-outline-secondary mt-3">
                        Seleccionar
                    </button>
                </form>
            </div>
            <div class="col">
                <span>Agregar valor</span>
                <form on:submit|preventDefault={AddValue}>
                    <input
                    class="form-control"
                    bind:value={newValue}
                />
                    <button type="submit" class="btn btn-outline-secondary mt-3">
                        Agregar
                    </button>
                </form>
            </div>
        </div>
    </div>