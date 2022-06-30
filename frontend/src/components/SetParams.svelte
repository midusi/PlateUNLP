<script>
    import Modal from "./Modal.svelte";
    import Param from "./Param.svelte";
    import { metadataStore } from "../store/metadata";

    let lists = {
        observers : [],
        imageTypes : [],
        digitalis : []
    }
    
    let defaults = {
        observerDefault : "",
        imageTypeDefault : "",
        digitaliDefault : "",
    }

    let listsKeys = {
        observers: "observers",
        imageTypes: "imageTypes",
        digitalis: "digitalis"
    }

    let defaultKeys = {
        observerDefault : "observerDefault",
        imageTypeDefault: "imageTypeDefault",
        digitaliDefault: "digitaliDefault"
    }
    
    let observerComponent;
    let imageTypeComponent;
    let digitaliComponent;

    Object.entries(listsKeys).forEach(([key]) => {
        if(localStorage.getItem(key)){
            lists[key] = JSON.parse(localStorage.getItem(key));
        }
    })

    Object.entries(defaultKeys).forEach(([key]) => {
        if(localStorage.getItem(key)){
            defaults[key] = JSON.parse(localStorage.getItem(key));
        }
    })

    export function updateLists(obs,img,digis){
        lists.observers = obs;
        lists.digitalis = digis;
        lists.imageTypes = img;
    }

    function setDefault(value,param){
        defaults[param] = value;
        if(defaults[param] !== ""){
            localStorage.setItem(param,JSON.stringify(defaults[param]));
        }
        else{
            localStorage.removeItem(param);
        }
    }
    
    function addElem(value,param){
        if(value){
            if(!lists[param].includes(value)){
                lists[param] = [... lists[param],value];
                localStorage.setItem(param,JSON.stringify(lists[param]));
            }
        }
    }

    function deleteElem(value,paramLists,paramDef){
        let index;
        if(value){
            value.forEach(el => {
                index = lists[paramLists].indexOf(el);
                lists[paramLists].splice(index,1);
                if(lists[paramLists] === JSON.parse(localStorage.getItem(paramDef))){
                    localStorage.removeItem(paramDef);
                    defaults[paramDef] = ""; 
                }
            })
            if(lists[paramLists].length === 0){
                localStorage.removeItem(paramLists);
                localStorage.removeItem(paramDef);
                lists[paramLists] = [];
            }
            else {
                localStorage.setItem(paramLists,JSON.stringify(lists[paramLists]));
                lists[paramLists] = JSON.parse(localStorage.getItem(paramLists));
            }  
        }
    }

    function clearSelection(){
        observerComponent.reset(defaults.observerDefault);
        imageTypeComponent.reset(defaults.imageTypeDefault);
        digitaliComponent.reset(defaults.digitaliDefault);
        metadataStore.updateDefaults();
    }

    
</script>

<Modal bottonText="⚙ Valores por defecto" titleModal="Editar valores por defecto" key="parameters">
    <div slot="modalBody">
        <h4 class="mt-2">OBSERVER</h4>
            <Param bind:this={observerComponent} paramNameLists="observers"  paramNameDef="observerDefault"
            defaultValue={defaults.observerDefault} list={lists.observers} 
            handleDefault={setDefault} handleDelete={deleteElem} handleAdd={addElem}/>
        <hr/>
        <h4 class="mt-2">IMAGETYPE</h4>
            <Param bind:this={imageTypeComponent}  paramNameLists="imageTypes"  paramNameDef="imageTypeDefault"
            defaultValue={defaults.imageTypeDefault} list={lists.imageTypes} 
            handleDefault={setDefault} handleDelete={deleteElem} handleAdd={addElem}/>
        <hr/>
        <h4 class="mt-2">DIGITALI</h4>
            <Param bind:this={digitaliComponent} paramNameLists="digitalis"  paramNameDef="digitaliDefault" 
            defaultValue={defaults.digitaliDefault} list={lists.digitalis} 
            handleDefault={setDefault} handleDelete={deleteElem} handleAdd={addElem}/>
       
    </div>

    <div slot="footerBody">
        <button type="button" class="btn btn-secondary" data-dismiss="modal" on:click={clearSelection}>
            Close
        </button>
    </div>
</Modal>