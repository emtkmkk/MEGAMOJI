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
import Emoji from "../icons/Emoji.vue";
import Save from "../icons/Save.vue";

/** もこきーの送り先。申請ページを開き、ここにだけ postMessage する */
const MKKEY_ORIGIN = "https://mkkey.net";

type RequestFields = {
  name?: string;
  alternateName?: string;
  ruby?: string;
};

export default defineComponent({
  components: {
    RawResult, Preview, Checkbox, Card, Space, Button, Effect, Back, Save, Emoji,
  },
  props: {
    images: { type: Array as PropType<Blob[][]>, required: true },
    name: { type: String, default: null },
    /** 絵文字にした元の文字（テキストモードのときだけ） */
    content: { type: String, default: null },
    /** 推測した読み（ひらがな）。分からないときは null */
    ruby: { type: String, default: null },
    showTarget: { type: Boolean, required: false },
  },
  emits: [
    "toggleShowTarget",
  ],
  data() {
    return {
      previewMode: false,
    };
  },
  computed: {
    resultImageUrls(): string[][] {
      return this.images.map((row) => row.map((cell) => URL.createObjectURL(cell)));
    },
    isSingleImage(): boolean {
      return this.images.length === 1 && this.images[0].length === 1;
    },
  },
  methods: {
    onDownload(): void {
      const download = prepareDownloadFile(this.images);
      const filename = filenamify(this.name ?? "", { replacement: "" }).normalize() || "megamoji";
      download.then((res) => saveAs(res, `${filename}.${extension(res)}`));
      Analytics.download();
    },
    buildFields(): RequestFields {
      const fields: RequestFields = {};
      const name = filenamify(this.name ?? "", { replacement: "" }).normalize().replace(/\.[^/.]+$/, "");
      if (name) fields.name = name;
      if (this.content) {
        const alternateName = this.content.replace(/\n/g, "").trim();
        if (alternateName) fields.alternateName = alternateName;
        if (this.ruby) fields.ruby = this.ruby;
      }
      return fields;
    },
    openRequestPage(): void {
      if (!this.isSingleImage) return;
      const image = this.images[0][0];
      const fields = this.buildFields();

      const query = new URLSearchParams({ from: "megamoji" });
      Object.entries(fields).forEach(([k, v]) => {
        if (v) query.set(k, v);
      });
      // noopener を付けると window.opener が無くなり、準備の合図が届かない
      const win = window.open(`${MKKEY_ORIGIN}/emoji-requests/new?${query}`, "_blank");
      if (win == null) {
        // eslint-disable-next-line no-alert
        alert("ポップアップを許可してから、もう一度押してください");
        return;
      }

      const onMessage = (ev: MessageEvent): void => {
        if (ev.origin !== MKKEY_ORIGIN || ev.source !== win) return;
        if (ev.data?.type !== "mkkey:emoji-request:ready") return;
        // 合図が来るたびに送る（ログイン後に開き直されたときのため）
        win.postMessage({ type: "mkkey:emoji-request:image", image, fields }, MKKEY_ORIGIN);
      };
      window.addEventListener("message", onMessage);
      const timer = window.setInterval(() => {
        if (win.closed) {
          window.removeEventListener("message", onMessage);
          window.clearInterval(timer);
        }
      }, 1000);
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
      <Button type="primary"
              name="もこきーに申請"
              :disabled="!isSingleImage"
              @click="openRequestPage">
        <template #icon>
          <Emoji />
        </template>
        もこきーに申請
      </Button>
    </Space>
    <p v-if="!isSingleImage" class="notice">
      分割した絵文字はまとめて申請できません。1 枚ずつ保存して申請してください
    </p>
  </Space>
</template>

<style scoped>
.notice {
  margin: 0;
  font-size: 0.9em;
}

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
