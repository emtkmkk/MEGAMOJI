<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  methods: {
    backstage() {
      window.open("https://scrapbox.io/MEGAMOJI/%F0%9F%93%8C_%E3%81%93%E3%82%8C%E3%81%AF%E3%81%AA%E3%81%AB%EF%BC%9F");
    },
    donation() {
      window.open("https://note.com/zk_phi/n/n3a199c99d6d6");
    },
  },
});
</script>

<template>
  <footer class="footer">
    <p class="p footnote">
      Peace, Love, Unity, Respect 🫶
    </p>
  </footer>
</template>

<style scoped>
.footer {
  font-size: var(--fontSizeMedium);
  line-height: var(--multilineTextLineHeight);
  color: var(--fg);
}

.footnote {
  font-style: italic;
  color: var(--border);
}

.p {
  margin: 0 0 var(--spacingMedium);
}
</style>
