<script lang="ts">
import { defineComponent, PropType } from "vue";
import { saveAs } from "file-saver";
import filenamify from "filenamify/browser";
import { extension, prepareDownloadFile } from "../../utils/file";
import Analytics from "../../utils/analytics";
import RawResult from "../emoji/RawResult.vue";
import Preview from "../emoji/Preview.vue";
import Button from "../inputs/Button.vue";
import Checkbox from "../inputs/Checkbox.vue";
import Space from "../global/Space.vue";
import Card from "../global/Card.vue";
import Effect from "../icons/Effect.vue";
import Back from "../icons/Back.vue";
import Save from "../icons/Save.vue";

export default defineComponent({
  components: {
    RawResult, Preview, Checkbox, Card, Space, Button, Effect, Back, Save,
  },
  props: {
    images: { type: Array as PropType<Blob[][]>, required: true },
    name: { type: String, default: null },
    showTarget: { type: Boolean, required: false },
  },
  emits: [
    "toggleShowTarget",
  ],
  data() {
    return {
      previewMode: false,
      token: localStorage.getItem("google_form_token") || "",
    };
  },
  computed: {
    resultImageUrls(): string[][] {
      return this.images.map((row) => row.map((cell) => URL.createObjectURL(cell)));
    },
  },
  methods: {
    onDownload(): void {
      const download = prepareDownloadFile(this.images);
      const filename = filenamify(this.name ?? "", { replacement: "" }).normalize() || "megamoji";
      download.then((res) => saveAs(res, `${filename}.${extension(res)}`));
      Analytics.download();
    },
    async openGoogleForm(): Promise<void> {
      if (!this.token) {
        // eslint-disable-next-line no-alert
        this.token = prompt("もこきーのトークンを入力（未入力可）:", "") || "";
        localStorage.setItem("google_form_token", this.token);
      }

      const filename = filenamify(this.name ?? "", { replacement: "" }).normalize().replace(/\.[^/.]+$/, "");
      const formUrl = `https://docs.google.com/forms/d/e/1FAIpQLSfsYBpT1C6Ko3u7mu27Mr-1HKlp_wTsQQcXI3AFQGKeZAl53Q/viewform?usp=pp_url${this.token ? `&entry.1795851707=${encodeURIComponent(this.token)}` : ""}&entry.2020474933=${encodeURIComponent(filename)}&entry.1422557821=%E6%96%87%E5%AD%97%E3%81%A0%E3%81%91%E3%81%AE%E7%B5%B5%E6%96%87%E5%AD%97%E3%81%AA%E3%81%AE%E3%81%A7%E4%B8%8D%E8%A6%81%EF%BC%88PD%EF%BC%89`;

      window.open(formUrl, "_blank");
    },
  },
});
</script>

<template>
  <Space vertical large>
    <Card class="result" title="プレビュー">
      <Space vertical large>
        <RawResult v-if="!previewMode" :images="resultImageUrls" />
        <Preview v-if="previewMode" :images="resultImageUrls" :dark-mode="false" />
        <Preview v-if="previewMode" :images="resultImageUrls" :dark-mode="true" />
        <Checkbox v-model="previewMode" name="サンプル表示">
          {{ "サンプル表示" }}
        </Checkbox>
      </Space>
    </Card>
    <Space class="buttons">
      <Button
          v-if="showTarget"
          name="効果をつける(戻る)"
          @click="$emit('toggleShowTarget', $event)">
        <template #icon>
          <Back />
        </template>
        もどる
      </Button>
      <Button
          v-else
          name="効果をつける"
          @click="$emit('toggleShowTarget', $event)">
        <template #icon>
          <Effect />
        </template>
        効果をつける
      </Button>
      <Button type="primary" name="保存" @click="onDownload">
        <template #icon>
          <Save />
        </template>
        絵文字を保存
      </Button>
      <Button type="primary" name="申請フォームを開く" @click="openGoogleForm">
        <template #icon>
          <Emoji />
        </template>
        申請フォームを開く
      </Button>
    </Space>
  </Space>
</template>

<style scoped>
.result {
  background-image:
    linear-gradient(
      45deg,
      var(--bg) 25%,
      transparent 25%,
      transparent 75%,
      var(--bg) 75%,
      var(--bg)
    ),
    linear-gradient(
      45deg,
      var(--bg) 25%,
      transparent 25%,
      transparent 75%,
      var(--bg) 75%,
      var(--bg)
    );
  background-position: 0 0, 10px 10px;
  background-size: 20px 20px;
}
</style>
