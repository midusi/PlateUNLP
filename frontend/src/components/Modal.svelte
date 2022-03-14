<script>
  export let bottonText = "Example",
    titleModal = "Title",
    key = (Math.random() + 1).toString(36).substring(5);
</script>

<!-- Button trigger modal  on:click|stopPropagation={()=>{}}-->
<slot name="modalButton">
  <button
    type="button"
    class="btn btn-primary"
    data-toggle="modal"
    data-target={`#${key}`}
  >
    {bottonText}
  </button>
</slot>

<div
  class="modal fade"
  id={`${key}`}
  tabindex="-1"
  role="dialog"
  aria-labelledby="exampleModalCenterTitle"
  aria-hidden="true"
>
  <div class="modal-dialog modal-dialog-centered modal-lg" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="exampleModalLongTitle">
          {titleModal}
        </h5>
        <button
          type="button"
          class="close"
          data-dismiss="modal"
          aria-label="Close"
        />
      </div>
      <div class="modal-body">
        <slot name="modalBody" />
      </div>
      <div class="modal-footer">
        <slot name="footerBody" />
      </div>
    </div>
  </div>
</div>
