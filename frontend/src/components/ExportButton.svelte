<script>
  import { metadataStore } from "../store/metadata";
  export let click,
    validatedSpectrums,
    plateValid,
    disabled = false,
    style,
    classStyle = "btn btn-outline-dark";

  let title = ""

  $: title = getHover(validatedSpectrums,plateValid);

  export function getHover(){
    let title = "Faltan datos obligatorios ";
    let invalids = "";
    if(!plateValid)
      title += "de la placa "
    validatedSpectrums.forEach((isValid,index) => {
      if(!isValid){
          invalids += `${index+1} `
      }
    })
    if(invalids !== ""){
      if(!plateValid)
        title += `y de los espectros: ${invalids}`
      else
        title += `de los espectros: ${invalids}`
    }
    else if(plateValid){
      title = ""
    }

    return title;
  }


</script>

<button type="button" title={title} class={classStyle} {style} {disabled} on:click={click}>
  &#11123; Exportar Fits
</button>
