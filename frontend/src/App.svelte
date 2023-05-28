<script>
  import { Tabs, TabList, TabButton, TabPanel, Tab, PlateTab } from "./components/Tab/tabs";
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
    ExportButton,
    PlateForm,
    FilterZone,
    MetadataForm
  } from "./components";
  import { confirmAlert,showAlert,deleteAlert,errorAlert, loadingAlert } from "./helpers/Alert";
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
  let bboxSelected = 1;
  let invalidForm = true;
  let changeFlag = false;
  let metadataSearched = []
  let names = []
  let validatedSpectrums = []
  let plateValid = false;
  let dataLoaded = false
  let reset_filters_flag = false

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
      "object:added": handlerAdded,
      "object:removed": handlerRemoved,
      "object:modified": handlerModified
    };
    loadConfig();
    metadataStore.initFields();
    let witdh_ruler =  document.getElementById("witdh_ruler").clientWidth
    spectrogramCanvas = new SpectrogramCanvas(events, witdh_ruler);
    canvas = spectrogramCanvas.getCanvas();
    checkChangeFlag();
  });

  function loadNames(){
    for (let i = 0; i < cantSpectra; i++) 
        names[i] = $metadataStore.spectraData[i]["OBJECT"]
  }

  function updateName(){
    if(bboxSelected > 1 && cantSpectra > 0 && names[bboxSelected-2] !== $metadataStore.spectraData[bboxSelected-2]["OBJECT"]){
      names[bboxSelected-2] = $metadataStore.spectraData[bboxSelected-2]["OBJECT"]
      spectrogramCanvas.updateLabel(bboxSelected-2,names[bboxSelected-2])
    }
  }

  export function setChangeFlag(){
      validateSelectedSpectrum();
      validateForm();
      updateName();
      changeFlag = true;
      imageSaved = false;
  }

  setContext("setChangeFlag",setChangeFlag);

  async function getImg(selectedImage) {
    if (selectedImage != "" && selectedImage != imageName) {
      uploadedImage = false
      imageChanged = true
      spectrogramCanvas.deleteAllBbox();
      validatedSpectrums = []
      dataLoaded = false
      changeFlag = false
      imageName = selectedImage;
      initializeCanvas();
      let data;
      try{
        data = await workspaceStore.getImg(spectrogramCanvas, pathDir, selectedImage);
      }
      catch(err){
      }
      reset_filters_flag = true

      if(data.metadata){
        imageSaved = true
        let spectraData = data.metadata.map((val,i) => {
          val["id"] = $metadataStore.spectraData[i]["id"]
          val["color"] = $metadataStore.spectraData[i]["color"]
          return val;
        });
        metadataStore.setSpectraData(spectraData);
        metadataStore.setPlateData(data.plateData);
        for(let i = 0; i < spectraData.length ; i++){
          if(spectraData[i]["OBJECT"] === ""){
            $metadataStore.spectraData[i]["OBJECT"] = `Nuevo#${i+1}`
          }
        }
        checkMetadataSearched();
        validateForm();
        validateAllSpectrum();
        loadNames();
        changeFlag = false;
        
      } else {
        setChangeFlag();
        bboxSelected = 1
      }
      imageChanged = false;
      uploadedImage = true;
    }
  }

  async function confirmSearchMetadata(){
    if(metadataSearched[bboxSelected-2]){
      deleteAlert({
      title :'¿Seguro que quieres buscar metadatos?',
      text :  'Se perderan los datos anteriores',
      confirmButtonText : 'Buscar',
      denyButtonText : 'Cancelar',
      succesFunc: async () => {
        await setRemoteMetadata();
      }})             
    }
    else{
      await setRemoteMetadata();
      metadataSearched[bboxSelected-2] = true;
    }
  }
  
  async function setRemoteMetadata() {
    const data = {
      OBJECT: $metadataStore.spectraData[bboxSelected - 2]["OBJECT"],
      OBSERVAT: $metadataStore.plateData["OBSERVAT"],
      "DATE-OBS": $metadataStore.spectraData[bboxSelected - 2]["DATE-OBS"],
      UT: $metadataStore.spectraData[bboxSelected - 2]["UT"],
    };
    const setted = await metadataStore.setRemoteMetadata(data, bboxSelected - 2);
    if(setted){
      setChangeFlag();
    }
    return setted;
    
  }

  function initializeCanvas() {
    bboxSelected = 1;
    metadataStore.setSpectraData([]);
    //spectrogramCanvas.setScale(scale);
  }

  function addBox() {
    spectrogramCanvas.addBbox(cantSpectra+1);
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
        const response = await spectrogramStore.generateFits(
          spectrogramCanvas.getBboxes(),
          $metadataStore.spectraData,
          $metadataStore.plateData,
          pathDir,
          imageName,
          $metadataStore.fields
        );
        if(response["status"]){ 
          imageName = ""
          metadataStore.initFields();
          uploadedImage = false;
          initializeCanvas();
          await workspaceStore.getPaths(pathDir);
          showAlert()
        }
        else if(response["message"]){
          errorAlert({
            message: response["message"]
          });
          errorAlert(message=response["message"])
        } else {
          errorAlert()
        }
      },
    });
    
  }

  async function getPaths() {
    if(pathDir){
      await workspaceStore.getPaths(pathDir);
    }
  }

  function updateDefaults(){

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
        if (fields[label].pre_fetch && !fields[label].global) 
          return label;
      })
    }
  }

  function getSearchedMetadata(fields,global){
      return Object.keys(fields).filter((label) => {
        if (!fields[label].required && !fields[label].global && fields[label].default === undefined)
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
        if (!fields[label].required && !fields[label].global && !fields[label].pre_fetch) 
          return label;
      })
    }
  }

  function validateForm() {
    invalidForm = false;
    plateValid = true;
    if (cantSpectra > 0) {
      $metadataStore.spectraData.forEach((spectro) => {
        getRequiredMetadata($metadataStore.fields,false).forEach((metadata) => {
          if (spectro[metadata] === "") {
            invalidForm = true;
          }
        });
      });

      getRequiredMetadata($metadataStore.fields,true).forEach((metadata) => {
        if (!$metadataStore.plateData[metadata]) {
          invalidForm = true;
          plateValid = false;
        }
      });
    }
    else{
      invalidForm = true
    }
  }

  function validateAllSpectrum(){
    if(cantSpectra > 0){
      for (let i = 0; i < cantSpectra; i++) 
        validateSpectrum(i)
    }
      
  }

  function validateSelectedSpectrum(){
    if (cantSpectra > 0 && bboxSelected > 1 ){
      validateSpectrum(bboxSelected-2)
    }
  }

  function validateSpectrum(spectrumIndex){  
      let invalidSpectrum = false;
      getRequiredMetadata($metadataStore.fields, false).forEach((metadata) => {
        if ($metadataStore.spectraData[spectrumIndex][metadata] === "") {
          invalidSpectrum = true;
        }
      });

      if(/^Nuevo#/.test($metadataStore.spectraData[spectrumIndex]["OBJECT"]))
        invalidSpectrum = true

      validatedSpectrums[spectrumIndex] = !invalidSpectrum
    
  }

  function handlerModified(){
    setChangeFlag();
  }

  function handleCreatedUpdate(obj) {
    if (obj != undefined) {
      bboxSelected =
        $metadataStore.spectraData.findIndex(
          (item) => item.id === obj.selected[0].id
        ) + 2;
    }
  }

  function handlerAdded(obj) {
    validatedSpectrums.push(false)
    cantSpectra++;
    const fields = {};

    if(cantSpectra === 1 && !dataLoaded){
      const globalFields = {};
      Object.keys($metadataStore.fields).map((field) => {
      if($metadataStore.fields[field].global){
        if ($metadataStore.fields[field].options === undefined)
          globalFields[field] = "";
        else globalFields[field] = $metadataStore.fields[field].options[0];}
    });
      metadataStore.setPlateData(globalFields);
      dataLoaded = true;
    }
    
    Object.keys($metadataStore.fields).map((field) => {
      if(!$metadataStore.fields[field].global)
        if ($metadataStore.fields[field].options === undefined)
          fields[field] = "";
        else fields[field] = $metadataStore.fields[field].options[0];
    });

    if(!fields["OBJECT"]){ 
      fields["OBJECT"] = `Nuevo#${cantSpectra}`
    }

    metadataStore.setSpectraData([
      ...$metadataStore.spectraData,
      {
        loaded: [],
        id: obj.target.id,
        color: obj.target.stroke,
        ...fields,
      },
    ]);
    metadataSearched.push(false);
    names.push(fields["OBJECT"])
  }


  function handlerRemoved(obj) {
    let index = bboxSelected - 2
    validatedSpectrums.splice(index,1)
    let namesAux = names;
    namesAux.splice(index,1);
    names = namesAux
    metadataSearched.splice(index,1)
    cantSpectra--;
    if (cantSpectra > 0) {
      metadataStore.setSpectraData(
        $metadataStore.spectraData.filter(
          (element) => element.id !== obj.target.id
        )
      );
      spectrogramCanvas.updateAllLabels(names);
      canvas.setActiveObject(canvas.item(0));
      canvas.renderAll();
    } else {
      metadataStore.setSpectraData([]);
      bboxSelected = 1
    }
    changeFlag = true;
    imageSaved = false;
    if(!imageChanged){
      validateForm();
      validateSelectedSpectrum();
    }
  }

  function setBbox(event) {
    let index = event.detail.index
    if(index === 0){
      canvas.discardActiveObject()
      bboxSelected = 1
      canvas.renderAll();
    }
    else{
      if (index !== bboxSelected - 1){
        const item = canvas.item(index - 1);
        if (item != undefined) {
          canvas.setActiveObject(item);
          bboxSelected = index + 1
          validateSelectedSpectrum();
          canvas.renderAll();
        }
      }
    }
  }

  // function handlePlateSelected(){
  //   bboxSelected = -1;
  // }

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
      getPaths();
    }
  }
</script>

<main>
  <div class="card">
    <div class="card-body">
      <div class="row">
        <div class="col-lg-2 col-xl-2">
          <FileList paths={$workspaceStore.paths} getImg={getImg} getPaths={getPaths} pathDir={pathDir
          }/>
          {#if uploadedImage}
            <div style="display:inline">
              <div in:slide="{{duration:1000}}">
                <ImageInfoCard state={imageSaved} />
              </div>
            </div>
          {/if}
        </div>
        <div id="witdh_ruler" class="col-lg-10 col-xl-10">
          <div style="display:{uploadedImage === true ? 'inline' : 'none'}">
            <FilterZone spectrogramCanvas={spectrogramCanvas} bind:reset_filters_flag={reset_filters_flag}/>
            <canvas
              id="canvas-container"
              style="border-width: 1px;
                    border-style: solid;
                    border-color: black;"
            />  
          </div>
          {#if uploadedImage}
            <div in:slide="{{duration:1000}}" out:slide="{{duration:700}}">
            <Tabs on:selectTab={setBbox}>
              <TabList>
                <div class="row">
                  <div class="col-10 my-2">
                    <Tab>
                      <PlateTab bind:validated={plateValid}/>
                    </Tab>
                    {#if $metadataStore.spectraData.length > 0}
                      <span style="background-color: darkgray;font-size: 20px; color: darkgray"> .</span>
                      <span style="font-size: 16px; color: black">  Espectros : </span>

                      {#each $metadataStore.spectraData as item, index}
                        <Tab>
                          <TabButton
                            color ={item.color}
                            index={index}
                            bind:names ={names}
                            bind:validated={validatedSpectrums[index]}
                          />
                        </Tab>
                      {/each}
                    {/if}
                    <NButton style={"margin-left:5px;margin-bottom:2px;"} click={addBox}>+</NButton>
                  </div> 
                  <div class="col-2 py-3">
                    <ExportButton plateValid = {plateValid} spectrums={$metadataStore.spectraData} validatedSpectrums={validatedSpectrums} title={"faltanDatos"} click={generateFits} disabled={invalidForm}/>
                  </div>  
                </div>
              </TabList>
              
              <TabPanel>
                <div class="controls">
                  <PlateForm
                    plateData={$metadataStore.plateData}
                    metadata={getMetadata($metadataStore.fields,true)}
                  />
                </div>
              </TabPanel>
              {#each $metadataStore.spectraData as item,index}
                <TabPanel>
                  <div class="controls">
                    <RequiredForm
                      spectraData={item}
                      metadata={getRequiredMetadata($metadataStore.fields,false)}
                      invalidSpectrum ={!validatedSpectrums[bboxSelected-2]}
                      confirmSearchMetadata = {confirmSearchMetadata}
                    />
                  </div>
                  {#if metadataSearched[bboxSelected-2]}
                    <div>
                      <MetadataForm
                        spectraData={item}
                        metadata={getOptionalMetadata($metadataStore.fields,false)}
                        index={index}
                      />
                    </div>
                  {/if}
                </TabPanel>
              {/each}
        
            </Tabs>
            <div class="row mt-4 ml-1 mb-4">
              <div class="controls  mr-2"> 
                <SetParams/>
              </div>
            </div>
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
