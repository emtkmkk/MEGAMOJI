<script lang="ts">
import { defineComponent } from "vue";
import Checkbox from "../inputs/Checkbox.vue";
import Input from "../inputs/Input.vue";
import Fieldset from "../inputs/Fieldset.vue";
import Space from "../global/Space.vue";
import Button from "../inputs/Button.vue";
import Select from "../inputs/Select.vue";
import fonts from "../../constants/fonts";

const validateFont = (font: string): boolean => {
  const s = new Option().style;
  s.font = font;
  return s.font !== "";
};

export default defineComponent({
  components: {
    Checkbox, Input, Space, Fieldset, Button, Select,
  },
  props: {
    modelValue: { type: String, required: true },
    showDetails: { type: Boolean, required: true },
    fontReady: { type: Boolean, required: true },
  },
  emits: [
    "update:modelValue", "update:fontReady",
  ],
  data: (props) => ({
    fonts,
    localFonts: [],
    localFontsError: false,
    stringValue: props.modelValue,
    selectOption: {},
    stringIsValid: true,
  }),
  computed: {
    localFontOptions(): { label: string; value: string; }[] {
      const fontList = document.fonts;

      if (!fontList) return [];

      const localFontList: { label: string; value: string; }[] = [];
      // フォント一覧をコンソールに表示
      fontList.forEach((font) => localFontList.push({ label: font.family, value: `normal 1em ${font.family}` }));

      return localFontList;
    },
  },
  watch: {
    modelValue: {
      handler() {
        this.stringValue = this.modelValue;
        this.stringIsValid = true;
        this.$emit("update:fontReady", false);
        this.loadSelectedFontsAsync();
      },
      immediate: true,
    },
    stringValue: {
      handler() {
        this.stringIsValid = validateFont(this.stringValue);
        if (this.stringIsValid) {
          this.$emit("update:modelValue", this.stringValue);
          this.$emit("update:fontReady", true);
        }
      },
    },
  },
  methods: {
    async loadSelectedFontsAsync() {
      const selectedFonts = this.fonts
        .flatMap((category) => category.fonts)
        .filter((font) => this.modelValue.includes(`normal 1em ${font.family}`));

      const resolvedCount = await Promise.all(
        selectedFonts.map((font) => font.value)
          .map((p) => p.then(() => true).catch(() => false)),
      ).then((results) => results.filter(Boolean).length);

      if (resolvedCount === selectedFonts.length) {
        this.$emit("update:fontReady", true);
      }
    },
    async getLocalFont() {
      try {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const availableFonts = await window.queryLocalFonts();
        this.localFonts = availableFonts
          .map((font: { postscriptName: string; family: string; }) => (
            { label: font.postscriptName, value: `normal 1em '${font.family}'` }
          ));
      } catch (err) {
        this.localFontsError = true;
      }
    },
    selectLocalFont(font: { label: string; value: string; }): void {
      this.stringValue = font.value;
    },
  },
});
</script>

<template>
  <Space vertical xlarge full>
    <Fieldset v-for="category in fonts" :key="category.label" :label="category.label">
      <Space vertical>
        <Checkbox
            v-for="font in category.fonts"
            :key="font.label" :name="font.label"
            :model-value="modelValue"
            :value="`normal 1em '${font.family}'`"
            @update:model-value="$emit('update:modelValue', `normal 1em '${font.family}'`)">
          <span :style="{ font: `normal 1em '${font.family}'`, lineHeight: 1 }">
            {{ font.label }}
          </span>
        </Checkbox>
      </Space>
    </Fieldset>
    <Fieldset v-if="showDetails || !localFontsError" label="その他のフォント">
      <Button
          v-if="!showDetails && !localFonts.length"
          name="フォントを取得"
          @click="getLocalFont">
        フォントを取得
      </Button>
      <Select
          v-if="!showDetails && localFonts.length"
          v-model="selectOption"
          name="その他のフォント"
          :options="localFonts"
          @update:model-value="selectLocalFont($event)" />
      <Input
          v-if="showDetails"
          v-model="stringValue"
          name="その他のフォント"
          block
          :error="!stringIsValid" />
    </Fieldset>
  </Space>
</template>
