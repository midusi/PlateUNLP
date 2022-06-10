<script>
  import { Tabs, TabList, TabPanel, Tab } from "./components/Tab/tabs";
  import SpectrogramCanvas from "./models/SpectrogramCanvas";
  import { spectrogramStore, workspaceStore, metadataStore } from "./store";
  import { onMount } from "svelte";
  import { slide,fly } from 'svelte/transition';
  import {
    RequiredForm,
    NButton,
    Field,
    ImageInfoCard,
    ConfigModal,
    SetParams,
    FileList,
    PlateForm,
    FilterZone,
    MetadataForm
  } from "./components";
  import { confirmAlert,showAlert } from "./helpers/Alert";
  import {setContext} from "svelte";

  let imageChanged = true;
  let imageSaved = false
  let cantSpectra = 0;
  let spectrogramCanvas;
  let uploadedImage = false;
  let pathDir = "";
  let imageName = "";
  let scale = 0.5;
  let canvas = undefined;
  let bboxSelected = -1;
  let invalidForm = true;
  let invalidSpectrum = true;
  let changeFlag = false;
  let metadataSearched = []

  $: bboxSelected &&
    $metadataStore.formActions != undefined &&
    $metadataStore.formActions.selectForIndex(bboxSelected - 1);

  async function checkChangeFlag(){
    if(changeFlag){
      AutoSaveData();
      imageSaved = true;
      changeFlag = false;
    }
  }

  const checkChangeFlagInterval = setInterval(checkChangeFlag,5000); 

  onMount(async () => {
    const events = {
      "selection:created": handleCreatedUpdate,
      "selection:updated": handleCreatedUpdate,
      "before:selection:cleared": handleSelectionCleared,
      "object:added": handlerAdded,
      "object:removed": handlerRemoved,
      "object:modified": handlerModified
    };
    metadataStore.initFields();
    spectrogramCanvas = new SpectrogramCanvas(events);
    canvas = spectrogramCanvas.getCanvas();
    loadConfig();
    checkChangeFlag();
  });

  export function setChangeFlag(){
      validateSpectrum();
      validateForm();
      changeFlag = true;
      imageSaved = false;
  }

  setContext("setChangeFlag",setChangeFlag);

  async function getImg(selectedImage) {
    if (selectedImage != "" && selectedImage != imageName) {
      imageChanged = true
      spectrogramCanvas.deleteAllBbox();
      changeFlag = false
      imageName = selectedImage;
      initializeCanvas();
      let data;
      try{
        data = await workspaceStore.getImg(spectrogramCanvas, pathDir, selectedImage);

      }
      catch(err){
      }

      if(data.metadata){
        imageSaved = true
        let spectraData = data.metadata.map((val,i) => {
          val["id"] = $metadataStore.spectraData[i]["id"]
          val["color"] = $metadataStore.spectraData[i]["color"]
          return val;
        });
        
        metadataStore.setSpectraData(spectraData);
        metadataStore.setPlateData(data.plateData);
        checkMetadataSearched();
        validateForm();
        validateSpectrum();
        changeFlag = false;
        
      }
      else{
        setChangeFlag();
      }
      imageChanged = false;
      uploadedImage = true;
    }
  }

  // function searchSpectro() {
  //   initializeCanvas();
  //   spectrogramCanvas.deleteAllBbox();
  //   spectrogramStore.getPredictions(spectrogramCanvas, pathDir, imageName);
  // }

  async function setRemoteMetadata() {
    const data = {
      OBJECT: $metadataStore.spectraData[bboxSelected - 1]["OBJECT"],
      OBSERVAT: $metadataStore.plateData["OBSERVAT"],
      "DATE-OBS": $metadataStore.spectraData[bboxSelected - 1]["DATE-OBS"],
      UT: $metadataStore.spectraData[bboxSelected - 1]["UT"],
    };

    let value  = await metadataStore.setRemoteMetadata(data, bboxSelected - 1);
    metadataSearched[bboxSelected-1] = value;
  }

  function initializeCanvas() {
    bboxSelected = 1;
    metadataStore.setSpectraData([]);
    spectrogramCanvas.setScale(scale);
  }

  function updatescale() {
    spectrogramCanvas.setScale(scale);
  }

  function addBox() {
    spectrogramCanvas.addBbox();
    setChangeFlag();
  }

 function AutoSaveData(){
    spectrogramStore.autoSaveValues(
        spectrogramCanvas.getBboxes(),
        $metadataStore.spectraData,
        $metadataStore.plateData,
        pathDir,
        imageName
    );
    workspaceStore.setPath(imageName,cantSpectra)
  }

  function checkMetadataSearched(){
    $metadataStore.spectraData.forEach((spectro,i) => {
        getSearchedMetadata($metadataStore.fields,false).every((metadata) => {
          if (spectro[metadata] !== "") {
            metadataSearched[i] = true;
            return false;
          }
          return true;
        });
      });

  }

  async function generateFits() {
    changeFlag = false;
    imageSaved = true;
    AutoSaveData();

    confirmAlert({
      succesFunc: async () => {
        const status = await spectrogramStore.generateFits(
          spectrogramCanvas.getBboxes(),
          $metadataStore.spectraData,
          $metadataStore.plateData,
          pathDir,
          imageName,
          $metadataStore.fields
        );
        if(status){ 
          imageName = ""
          metadataStore.initFields();
          uploadedImage = false;
          initializeCanvas();
          loadConfig();
          await workspaceStore.getPaths(pathDir);
          showAlert({ title: 'Guardado', message: 'Se guardo con éxito.' })
        }
        else{
          errorAlert()
        }
      },
    });
    
  }

  function getPaths() {
    workspaceStore.getPaths(pathDir);
  }
  function updateLists(){
    metadataStore.initFields();
  }

  function getMetadata(fields,global) {
    let data;
    if(global){
      data = Object.keys(fields)
      .filter((label) => {
          if (fields[label].global) return label;
      })
      return data;
    }
    else{
    data = Object.keys(fields)
      .filter((label) => {
          if (!fields[label].global) return label;
      })
      return data;
    }
  }

  function getRequiredMetadata(fields,global) {
    if(global){
      return Object.keys(fields).filter((label) => {
        if (fields[label].required && fields[label].global) 
          return label;
      })
    }
    else{
      return Object.keys(fields).filter((label) => {
        if (fields[label].required && !fields[label].global) 
          return label;
      })
    }
  }

  function getSearchedMetadata(fields,global){
      return Object.keys(fields).filter((label) => {
        if (!fields[label].required && !fields[label].global && !fields[label].default) 
          return label;
      })
  }


  function getOptionalMetadata(fields,global){
    if(global){
      return Object.keys(fields).filter((label) => {
        if (!fields[label].required && fields[label].global) 
          return label;
      })
    }
    else{
      return Object.keys(fields).filter((label) => {
        if (!fields[label].required && !fields[label].global) 
          return label;
      })
    }
  }

  function validateForm() {
    invalidForm = false;
    if (cantSpectra > 0) {
      $metadataStore.spectraData.forEach((spectro) => {
        getRequiredMetadata($metadataStore.fields,false).forEach((metadata) => {
          if (spectro[metadata] === "") {
            invalidForm = true;
          }
        });
      });

      getRequiredMetadata($metadataStore.fields,true).forEach((metadata) => {
        if ($metadataStore.plateData[metadata] === "") {
          invalidForm = true;
        }
      });
    }
  }

  function validateSpectrum(){
    invalidSpectrum = false;
    getRequiredMetadata($metadataStore.fields, false).forEach((metadata) => {
      console.log(metadata)
      if ($metadataStore.spectraData[bboxSelected - 1][metadata] === "") {
        invalidSpectrum = true;
      }
    });
    console.log("invalid:",invalidSpectrum)

  }

  function handlerModified(){
    setChangeFlag();
  }

  function handleCreatedUpdate(obj) {
    if (obj != undefined) {
      bboxSelected =
        $metadataStore.spectraData.findIndex(
          (item) => item.id === obj.selected[0].id
        ) + 1;
    }
  }

  function handleSelectionCleared(obj) {
    bboxSelected = 1;
  }

  function handlerAdded(obj) {
    cantSpectra++;
    const fields = {};

    if(cantSpectra === 1){
      const globalFields = {};
      Object.keys($metadataStore.fields).map((field) => {
      if($metadataStore.fields[field].global)
        if ($metadataStore.fields[field].options === undefined)
          globalFields[field] = "";
        else globalFields[field] = $metadataStore.fields[field].options[0];
    });
    metadataStore.setPlateData(globalFields);
    }
    
    Object.keys($metadataStore.fields).map((field) => {
      if(!$metadataStore.fields[field].global)
        if ($metadataStore.fields[field].options === undefined)
          fields[field] = "";
        else fields[field] = $metadataStore.fields[field].options[0];
    });

    metadataStore.setSpectraData([
      ...$metadataStore.spectraData,
      {
        id: obj.target.id,
        color: obj.target.stroke,
        ...fields,
      },
    ]);
    metadataSearched.push(false);
  }

  function handlerRemoved(obj) {
    cantSpectra--;
    console.log(obj.target.id)
    if (cantSpectra > 0) {
      metadataStore.setSpectraData(
        $metadataStore.spectraData.filter(
          (element) => element.id !== obj.target.id
        )
      );
      canvas.setActiveObject(canvas.item(0));
      canvas.renderAll();
    } else {
      metadataStore.setSpectraData([]);
    }
    changeFlag = true;
    imageSaved = false;
    if(!imageChanged)
      validateForm();
  }

  function setBbox(event) {
    if (event.detail.index !== bboxSelected - 1) {
      const item = canvas.item(event.detail.index);
      if (item != undefined) {
        canvas.setActiveObject(item);
        validateSpectrum();
        canvas.renderAll();
      }
    }
  }

  /*function saveConfig() {
    const config = {
      global: {
        workspace_path: pathDir,
      },
      fields: {
        OBSERVAT: {
          options: $metadataStore.fields["OBSERVAT"].options,
        },
      },
    };
    workspaceStore.saveConfig(config);
  }*/

  async function loadConfig() {
    const config = await workspaceStore.loadConfig();
    if (Object.keys(config).length !== 0) {
      pathDir = config.global.workspace_path;
      metadataStore.setOption("OBSERVAT", config.fields["OBSERVAT"].options);
    }
  }

</script>

<main>
  <div class="card">
    <div class="card-header">
    <h5>Localizador de espectros</h5>
    </div>
    <div class="card-body">
      <div class="row">
        <div class="col-lg-2 col-xl-2">
          <div class="row">
            <div class="d-flex flex-column col-9">
              <span>Directorio de trabajo</span>
              <input bind:value={pathDir} />
            </div>
            <div class="d-flex flex-column col-3 mt-4">
              <NButton click={getPaths}>&#x1F50D;</NButton>
            </div>
          </div>
          <div class="d-xl-flex flex-column justify-content-xl-start">
            <span>Zoom</span>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.01"
              bind:value={scale}
              on:change={updatescale}
            />
          </div>
          {#if $workspaceStore.paths.length > 0}
            <FileList paths={$workspaceStore.paths} getImg={getImg}/>
          {/if}
          {#if uploadedImage}
            <div style="display:inline">
              <div in:slide="{{duration:1000}}">
                <ImageInfoCard state={imageSaved} />
              </div>
            </div>
          {/if}
        </div>
          <div class="col-lg-10 col-xl-10">
              <div style="display:{uploadedImage === true ? 'inline' : 'none'}">
                <FilterZone spectrogramCanvas={spectrogramCanvas} />
                <canvas
                  id="canvas-container"
                  width="300"
                  height="300"
                  style="border-width: 1px;
                        border-style: solid;
                        border-color: black;"
                />  
              </div>
          {#if $metadataStore.spectraData.length > 0}
            <div in:slide="{{duration:1000}}" out:slide="{{duration:700}}">
            <Tabs on:selectTab={setBbox}>
              <TabList>
                <div class="row">
                  <div class="col-10">
                    {#each $metadataStore.spectraData as item, index}
                      <Tab>
                        <NButton
                          style={`background-color:${item.color} !important; border-color: black; width:40px; height:40px; border-radius:1px`}
                          classStyle={""}
                        >
                          {index + 1}
                        </NButton>
                      </Tab>
                    {/each}
                    <NButton classStyle={""} style={`background-color:white !important; border-color: black; width:40px; height:40px; border-radius:1px`} click={()=>bboxSelected=-1}>P</NButton>
                    <NButton style={"margin-left:5px;margin-bottom:2px;"} click={addBox}>+</NButton>
                  </div> 
                <div class="col-2 py-2">
                  <NButton click={generateFits} disabled={invalidForm}>
                    &#11123; Exportar Fits
                  </NButton>
                </div>  
              </div>
              </TabList>
              {#if bboxSelected === -1 }
                <TabPanel>
                 <div class="controls">
                    <PlateForm
                      plateData={$metadataStore.plateData}
                      metadata={getMetadata($metadataStore.fields,true)}
                    />
                  </div>
                </TabPanel>
              {/if}
              {#each $metadataStore.spectraData as item}
                <TabPanel>
                  <div class="controls">
                    <RequiredForm
                      spectraData={item}
                      metadata={getRequiredMetadata($metadataStore.fields,false)}
                      invalidSpectrum = {invalidSpectrum}
                      setRemoteMetadata = {setRemoteMetadata}
                    />
                  </div>
                  {#if metadataSearched[bboxSelected-1]}
                    <div>
                      <MetadataForm
                        spectraData={item}
                        metadata={getOptionalMetadata($metadataStore.fields,false)}
                      />
                    </div>
                  {/if}
                </TabPanel>
              {/each}
            </Tabs>
            <div class="row mt-4 ml-1 mb-4">
              <div class="controls  mr-2"> 
                <SetParams updateParent={updateLists}/>
              </div>
            </div>
          </div>
          {:else}
            <div class="controls mt-6">
              <NButton style="display:{uploadedImage === true ? 'inline' : 'none'} ; margin-top:0.5em" click={addBox}>+</NButton>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
</main>

<style>
  main {
    padding: 1em;
    margin: 0 auto;
  }
</style>
