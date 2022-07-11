<script>
  import { metadataStore } from "../store/metadata";
  export let click,
    spectrums,
    validatedSpectrums,
    plateValid,
    disabled = false,
    style = {},
    classStyle = "btn btn-outline-dark";

  let title = ""

  $: title = getHover(spectrums,validatedSpectrums,plateValid);

  export function getHover(){
    let title = "Faltan datos obligatorios ";
    let invalids = "";
    if(!plateValid)
      title += "de la placa "
    console.log(spectrums)
    let invalidSpectrums = []
    
    validatedSpectrums.forEach((isValid,index) => {
      if(!isValid){
          invalids += `${spectrums[index]["OBJECT"]} `
          invalidSpectrums.push(spectrums[index])
      }
    })

    if(invalids !== ""){
      if(!plateValid)
        title += `y `
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
