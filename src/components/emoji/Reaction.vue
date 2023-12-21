<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  props: {
    src: { type: String, required: true },
  },
});
</script>

<template>
  <div class="reaction">
    <img class="reaction_icon" :src="src"> 5
  </div>
</template>

<style scoped>
.reaction {
  display: inline-block;
  max-width: 90%;
  padding: 4px;
  margin: 6px 0 0;
  cursor: pointer;
  background-color: rgba(128, 128, 128, 0.2);
  border: 1px solid transparent;
  border-radius: 4px;
}

.reaction:hover {
  background-color: rgba(128, 128, 128, 0.1);
  border-color: currentColor;
}

.reaction_icon {
  display: inline-block;
  max-width: 90%;
  height: 1.8em;
  padding: 4px;
  background-repeat: no-repeat;
  background-position: center;
  background-size: contain;
}
</style>
