<script>
	export let click;
  export let validated;

  let prefix
    $: prefix = validated ? "✔ " : ""
</script>


<button 
  type="button"  
  style={`background-color: white !important; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; border-color: black; width:100px; height:40px; border-radius:1px`} 
  on:click={click}
>
  {prefix+"Placa"}
</button>
