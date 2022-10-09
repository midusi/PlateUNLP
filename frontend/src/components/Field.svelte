<script>
  import { metadataStore } from "../store/metadata";
  import {getContext} from "svelte";
  export let name, value, index, is_void=false;

  const setChangeFlag = getContext("setChangeFlag");

  const setType = (node) => {
    node.type = $metadataStore.fields[name].type;
  };

  function remoteDataChange(name){

    let array = $metadataStore.spectraData[index]["loaded"]
    const arrayIndex = array.indexOf(name);
      if (arrayIndex !== -1) {
        array.splice(arrayIndex, 1);
      }
    $metadataStore.spectraData[index]["loaded"] = array
    setChangeFlag();
  }

  var voidButtonSelected = false
  var voidButtonStyle = "float: right;"
  var original_value = ""
  function clickVoidButton() {
    voidButtonSelected = !voidButtonSelected
    if(voidButtonSelected){
      voidButtonStyle = "float: right; background-color:blue; color:white"
      original_value = value
      value="∅"
      is_void=true
    } else{
      voidButtonStyle = "float: right;"
      value = original_value
      is_void=false
    }
  }

</script>

<div class="mt-2">
  <span>
    {$metadataStore.fields[name].label}
    {#if $metadataStore.fields[name].required}
      <span style="color:red;">
        *
      </span>    
      <input 
        class="void_button"
        type="button" value="∅" 
        style={voidButtonStyle} 
        on:click={clickVoidButton}>
    {/if}
  </span>
  {#if $metadataStore.fields[name].options === undefined}
    {#if $metadataStore.fields[name].remote && $metadataStore.spectraData[index] !== undefined}
      <input
        class="form-control"
        use:setType
        style={`background-color: ${$metadataStore.spectraData[index]["loaded"].includes($metadataStore.fields[name].label) ? "lavender" : "white"};`}
        bind:value
        on:change={() => remoteDataChange($metadataStore.fields[name].label)}
        placeholder={$metadataStore.fields[name].info}
        disabled = {is_void}
      />
    {:else}
      <input
        class="form-control"
        use:setType
        bind:value
        on:change={setChangeFlag}
        placeholder={$metadataStore.fields[name].info}
        disabled = {is_void}
      />
    {/if}
  {:else if $metadataStore.fields[name].label === "OBSERVAT"}
  <select
      bind:value
      class="browser-default custom-select"
      aria-label="Select Obsevat"
      on:change={setChangeFlag}
      disabled = {is_void}
    >
      {#each $metadataStore.fields[name].options as observat}
        <option value={observat}> {observat} </option>
      {/each}
    </select>
  {:else}
    <input
      list={`${name}Options`}
      class="form-control"
      use:setType
      bind:value
      on:change={setChangeFlag}
      placeholder={$metadataStore.fields[name].info}
      disabled = {is_void}
    />
    <datalist id={`${name}Options`}>
      {#each $metadataStore.fields[name].options as el}
        <option value={el}> {el} </option>
      {/each}
    </datalist>
  {/if}

</div>

<style>
.void_button {
    padding: 0px;
    border-radius: 5px;
  }
</style>