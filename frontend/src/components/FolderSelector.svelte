<input id="directory" type="file" onchange="selectFolder(event);" webkitdirectory
    mozdirectory msdirectory odirectory directory multiple="multiple"/>

<script>
    function selectFolder(e) {
        var files = folder.files,
        len = files.length;
        for(i=0;i<len;i+=1)
        {
            console.log(files[i]);
        }
    }
</script>


<!-- 
<script>
    export let click,
      disabled = false,
      style,
      classStyle = "btn btn-outline-dark";
  </script>

  
  <button type="button" class={classStyle} {style} {disabled} on:click={click}>
    <slot />
  </button>
   -->