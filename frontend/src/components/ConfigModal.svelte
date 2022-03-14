<script>
    import Modal from "./Modal.svelte";
    import Field from "./Field.svelte";
    import { metadataStore } from "../store";
    let data = [];
    $: {
        const keys = Object.keys($metadataStore.fields);
        keys.forEach((key) => {
            if ($metadataStore.fields[key].options != undefined)
                data.push($metadataStore.fields[key]);
        });
    }
</script>

<Modal bottonText="Configurar" titleModal="Configurar opciones" key="options">
    <div slot="modalBody">
        {#each data as field}
            {field.label} <br />
        {/each}
    </div>

    <div slot="footerBody">
        <button type="button" class="btn btn-secondary" data-dismiss="modal">
            Cerrar
        </button>
    </div>
</Modal>
