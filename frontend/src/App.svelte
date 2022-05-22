<script>
  import { Tabs, TabList, TabPanel, Tab } from "./components/Tab/tabs";
  import SpectrogramCanvas from "./models/SpectrogramCanvas";
  import { spectrogramStore, workspaceStore, metadataStore } from "./store";
  import { onMount } from "svelte";
  import { slide,fly } from 'svelte/transition';
  import {
    MetadataModal,
    NButton,
    Field,
    ImageInfoCard,
    ConfigModal,
    SetParams
  } from "./components";
  import { confirmAlert } from "./helpers/Alert";
  import {setContext} from "svelte";



  let imageSaved = false

  let spectrogramCanvas;
  let uploadedImage = false;
  let pathDir = "";
  let imageName = "";
  let scale = 0.5;
  let canvas = undefined;
  let bboxSelected = 1;
  let invalidForm = true;
  let selectedImage = "";
  let changeFlag = false;

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
      validateForm();
      changeFlag = true;
      imageSaved = false;
  }

  setContext("setChangeFlag",setChangeFlag);

  async function getImg() {
    if (selectedImage != "") {
      imageName = selectedImage;
      initializeCanvas();
      let data;
      try{
        data = await workspaceStore.getImg(spectrogramCanvas, pathDir, selectedImage);
      }
      catch(err){
      }
      
      if(data){
        imageSaved = true
        data = data.map((val,i) => {
          val["id"] = $metadataStore.spectraData[i]["id"]
          val["color"] = $metadataStore.spectraData[i]["color"]
          return val;
        });
        metadataStore.setSpectraData(data);
        validateForm();
      }
      else{
        setChangeFlag();
      }

      uploadedImage = true;
    }
  }

  // function searchSpectro() {
  //   initializeCanvas();
  //   spectrogramCanvas.deleteAllBbox();
  //   spectrogramStore.getPredictions(spectrogramCanvas, pathDir, imageName);
  // }

  function setRemoteMetadata() {
    const data = {
      OBJECT: $metadataStore.spectraData[bboxSelected - 1]["OBJECT"],
      OBSERVAT: $metadataStore.spectraData[bboxSelected - 1]["OBSERVAT"],
      "DATE-OBS": $metadataStore.spectraData[bboxSelected - 1]["DATE-OBS"],
      UT: $metadataStore.spectraData[bboxSelected - 1]["UT"],
    };
    metadataStore.setRemoteMetadata(data, bboxSelected - 1);

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
    console.log(spectrogramCanvas.getBboxes());
    console.log($metadataStore.spectraData);
    spectrogramStore.autoSaveValues(
        spectrogramCanvas.getBboxes(),
        $metadataStore.spectraData,
        pathDir,
        imageName
    );
  }

  function generateFits() {
    confirmAlert({
      succesFunc: () => {
        spectrogramStore.generateFits(
          spectrogramCanvas.getBbox(
            $metadataStore.spectraData[bboxSelected - 1].id
          ),
          $metadataStore.spectraData[bboxSelected - 1]
          ,
          pathDir,
          imageName,
          $metadataStore.fields
        );
      },
    });
  }

  function getPaths() {
    workspaceStore.getPaths(pathDir);
  }
  function updateLists(){
    metadataStore.initFields();
  }

  function getMetadata(fields) {
    return Object.keys(fields)
  }

  function getRequiredMetadata(fields) {
    return Object.keys(fields)
    .map((label) => {
        if (fields[label].required) return label;
    })
  }

  function validateForm() {
    invalidForm = false;
    if ($metadataStore.spectraData.length > 0) {
      getRequiredMetadata($metadataStore.fields).forEach((metadata) => {
        if ($metadataStore.spectraData[bboxSelected - 1][metadata] === "") {
          invalidForm = true;
        }
      });
    }
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
    const fields = {};
    Object.keys($metadataStore.fields).map((field) => {
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
  }

  function handlerRemoved(obj) {
    console.log("se ejecuto handlerRemoved")
    if (canvas.getObjects().length > 0) {
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
  }

  function setBbox(event) {
    if (event.detail.index !== bboxSelected - 1) {
      const item = canvas.item(event.detail.index);
      if (item != undefined) {
        canvas.setActiveObject(item);
        validateForm();
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
            <select
              bind:value={selectedImage}
              on:change={getImg}
              class="form-select"
              size="10"
              aria-label=""
              style="width:100%"
              in:slide="{{duration:1000}}"
            >
              {#each $workspaceStore.paths as path}
                <option value={path.fileName}>{path.fileName}</option>>
                
              {/each}
            </select>
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
                <canvas
                  id="canvas-container"
                  width="300"
                  height="300"
                  style="border-width: 1px;
                        border-style: solid;
                        border-color: black;"
                />  
              </div>
          {#if $metadataStore.spectraData.length != 0}
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
                    <NButton click={addBox}>+</NButton>
                  </div> 
                
                <div class="col-2 py-2">
                  <NButton click={setRemoteMetadata} disabled={invalidForm}>
                    Buscar metadatos
                  </NButton>
                </div>  
              </div>
              </TabList>
              {#each $metadataStore.spectraData as item}
                <TabPanel>
                  <div class="controls">
                    <MetadataModal
                      spectraData={item}
                      metadata={getMetadata($metadataStore.fields)}
                    />
                  </div>
                  <div class="row mt-4 ml-1 mb-4">
                    <div class="controls mr-2">
                      
                    </div>
                    <div class="controls  mr-2"> 
                      <SetParams updateParent={updateLists}/>
                    </div>
                    <div class="controls mr-2">
                      <NButton click={generateFits} disabled={invalidForm}>
                        &#11123; Exportar Fits
                      </NButton>
                    </div>
                  </div>
                </TabPanel>
              {/each}
            </Tabs>
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
