<script>
  import { Tabs, TabList, TabPanel, Tab } from "./components/Tab/tabs";
  import SpectrogramCanvas from "./models/SpectrogramCanvas";
  import { spectrogramStore, workspaceStore, metadataStore } from "./store";
  import { onMount } from "svelte";
  import {
    MetadataModal,
    NButton,
    Field,
    ImageInfoCard,
    ConfigModal,
  } from "./components";
  import { confirmAlert } from "./helpers/Alert";

  let spectrogramCanvas;
  let uploadedImage = false;
  let pathDir = "";
  let imageName = "";
  let scale = 0.5;
  let canvas = undefined;
  let bboxSelected = 1;
  let invalidForm = true;
  let selectedImage = "";

  $: bboxSelected &&
    $metadataStore.formActions != undefined &&
    $metadataStore.formActions.selectForIndex(bboxSelected - 1);

  onMount(async () => {
    const events = {
      "selection:created": handleCreatedUpdate,
      "selection:updated": handleCreatedUpdate,
      "before:selection:cleared": handleSelectionCleared,
      "object:added": handlerAdded,
      "object:removed": handlerRemoved,
    };
    metadataStore.initFields();
    spectrogramCanvas = new SpectrogramCanvas(events);
    canvas = spectrogramCanvas.getCanvas();
    loadConfig();
  });

  function getImg() {
    if (selectedImage != "") {
      imageName = selectedImage;
      initializeCanvas();
      workspaceStore.getImg(spectrogramCanvas, pathDir, selectedImage);
      uploadedImage = true;
    }
  }

  function searchSpectro() {
    initializeCanvas();
    spectrogramCanvas.deleteAllBbox();
    spectrogramStore.getPredictions(spectrogramCanvas, pathDir, imageName);
  }

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
  }

  function generateFits() {
    confirmAlert({
      succesFunc: () => {
        spectrogramStore.generateFits(
          spectrogramCanvas.getSpectroData(
            $metadataStore.spectraData[bboxSelected - 1]
          ),
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

  function getMetadata(fields, required) {
    return Object.keys(fields)
      .map((label) => {
        if (required === undefined) return label;
        else if (fields[label].required === required) return label;
      })
      .filter((x) => x !== undefined);
  }

  function validateForm() {
    invalidForm = false;
    getMetadata($metadataStore.fields, true).forEach((metadata) => {
      if ($metadataStore.spectraData[bboxSelected - 1][metadata] === "") {
        invalidForm = true;
      }
    });
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

  function saveConfig() {
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
  }

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
    <h5 class="card-header">Localizador de espectros</h5>
    <div class="card-body">
      <div class="row">
        <div class="col-lg-7 col-xl-5">
          <div class="row">
            <div class="d-flex flex-column col-9">
              <span>Directorio de trabajo</span>
              <input bind:value={pathDir} />
            </div>
            <div class="d-flex flex-column col-3 mt-4">
              <NButton click={getPaths}>Listar archivos</NButton>
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
            >
              {#each $workspaceStore.paths as path}
                <option value={path}>{path}</option>
              {/each}
            </select>
          {/if}
          <div style="display:{uploadedImage === true ? 'inline' : 'none'}">
            <div class="row mt-2 mb-2 ml-1">
              <div class="controls mr-2">
                <NButton click={searchSpectro}>Buscar espectros</NButton>
              </div>
              <div class="controls mr-2">
                <NButton click={addBox}>Agregar espectro</NButton>
              </div>
            </div>
            <ImageInfoCard />
          </div>
          <hr />
          {#if $metadataStore.spectraData.length != 0}
            <Tabs on:selectTab={setBbox}>
              <TabList>
                {#each $metadataStore.spectraData as item, index}
                  <Tab>
                    <NButton
                      style={`background-color:${item.color} !important; border-color:${item.color}; width:40px; height:40px; border-radius:5px`}
                      classStyle={""}
                    >
                      {index + 1}
                    </NButton>
                  </Tab>
                {/each}
              </TabList>
              {#each $metadataStore.spectraData as item}
                <TabPanel>
                  {#each getMetadata($metadataStore.fields, true) as field}
                    <Field
                      name={field}
                      bind:value={item[field]}
                      onchange={validateForm}
                    />
                  {/each}
                  <div class="row mt-4 ml-1 mb-4">
                    <div class="controls  mr-2">
                      <NButton click={setRemoteMetadata} disabled={invalidForm}>
                        Buscar metadatos
                      </NButton>
                    </div>
                    <div class="controls mr-2">
                      <MetadataModal
                        spectraData={item}
                        metadata={getMetadata($metadataStore.fields, false)}
                      />
                    </div>
                    <div class="controls mr-2">
                      <NButton click={generateFits} disabled={invalidForm}>
                        Guardar Fits
                      </NButton>
                    </div>
                    <div class="controls mr-2">
                      <NButton click={saveConfig}>
                        Guardar configuración
                      </NButton>
                    </div>
                  </div>
                </TabPanel>
              {/each}
            </Tabs>
          {/if}
        </div>
        <div class="col-lg-5 col-xl-4">
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
