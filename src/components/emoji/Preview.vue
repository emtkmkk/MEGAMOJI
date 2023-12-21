<script lang="ts">
import { defineComponent } from "vue";
import Reaction from "./Reaction.vue";

export default defineComponent({
  components: {
    Reaction,
  },
  props: {
    images: { type: Array, required: true },
    darkMode: { type: Boolean, required: true },
  },
});
</script>

<template>
  <div :class="`preview ${darkMode ? 'dark' : 'light'}`">
    <div>
      <b>もこもこさん</b> <small>たった今</small>
    </div>
    <div v-for="(row, i) in images" :key="i" class="row">
      <img
          v-for="(col, j) in row"
          :key="j"
          class="img large"
          :src="col">
    </div>
    <div>
      <span v-for="(row, i) in images" :key="i">
        <img
            v-for="(col, j) in row"
            :key="j"
            class="img medium"
            :src="col">
        <img
            v-for="(col, j) in row"
            :key="j"
            class="img medium"
            :src="col">
        <img
            v-for="(col, j) in row"
            :key="j"
            class="img medium"
            :src="col">
        <img
            v-for="(col, j) in row"
            :key="j"
            class="img medium"
            :src="col">
        <img
            v-for="(col, j) in row"
            :key="j"
            class="img medium"
            :src="col">
      </span>
    </div>
    <div>
      文章中で使うとこんな
      <span v-for="(row, i) in images" :key="i">
        <img
            v-for="(col, j) in row"
            :key="j"
            class="img in_text"
            :src="col">
      </span>
      感じ。
    </div>
    <div>
      <span v-for="(row, i) in images" :key="i">
        <Reaction v-for="(col, j) in row" :key="j" :src="col" />
      </span>
    </div>
  </div>
</template>

<style scoped>
.preview {
  padding: 12px;
  font-size: 16px;
  line-height: 1.4;
  border: 1px solid #ccc;
}

.preview.light {
  color: #222;
  background-color: #fff;
}

.preview.dark {
  color: #eee;
  background-color: #222;
}

.row {
  line-height: 0;
}

.img {
  display: inline-block;
  background-repeat: no-repeat;
  background-position: center;
  background-size: contain;
}

.large {
  height: 4.2em;
  min-height: 4.2em;
  vertical-align: top;
}

.medium {
  height: 2.8em;
  min-height: 2.8em;
  vertical-align: top;
}

.in_text {
  height: 1.4em;
  min-height: 1.4em;
  vertical-align: top;
}
</style>
