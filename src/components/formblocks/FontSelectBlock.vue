<script lang="ts">
import { defineComponent } from "vue";
import Checkbox from "../inputs/Checkbox.vue";
import Input from "../inputs/Input.vue";
import Fieldset from "../inputs/Fieldset.vue";
import Space from "../global/Space.vue";
import fonts from "../../constants/fonts";

const validateFont = (font: string): boolean => {
  const s = new Option().style;
  s.font = font;
  return s.font !== "";
};

export default defineComponent({
  components: {
    Checkbox, Input, Space, Fieldset,
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
    stringValue: props.modelValue,
    stringIsValid: true,
  }),
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
        .flatMap(category => category.fonts)
        .filter(font => this.modelValue.includes(font.value));

      await Promise.all(selectedFonts.map(font => this.loadFontAsync(font.value)));

      this.$emit("update:fontReady", true);
    },
    async loadFontAsync(font: string): Promise<void> {
      const s = new Option().style;
      s.font = font;

      return new Promise<void>((resolve) => {
        const checkFont = () => {
          if (s.font !== "") {
            resolve();
          } else {
            requestAnimationFrame(checkFont);
          }
        };

        checkFont();
      });
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
            :key="font.label"
            :name="font.label"
            :model-value="modelValue"
            :value="font.value"
            @update:model-value="$emit('update:modelValue', `normal 1em '${font.family}'`)">
          <span :style="{ font: `normal 1em '${font.family}'`, lineHeight: 1 }">{{ font.label }}</span>
        </Checkbox>
      </Space>
    </Fieldset>
    <Fieldset v-if="showDetails" label="その他のフォント">
      <Input v-model="stringValue" name="その他のフォント" block :error="!stringIsValid" />
    </Fieldset>
  </Space>
</template>
