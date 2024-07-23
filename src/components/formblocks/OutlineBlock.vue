<script lang="ts">
import { defineComponent, PropType } from "vue";
import Button from "../inputs/Button.vue";
import ToggleButton from "../inputs/ToggleButton.vue";
import Fieldset from "../inputs/Fieldset.vue";
import ColorSample from "../global/ColorSample.vue";
import Space from "../global/Space.vue";
import OutlineItemBlock from "./OutlineItemBlock.vue";
import { absColor } from "../../utils/color";

type OutlineOption = { value: string, absColor: string };

export default defineComponent({
  components: {
    ToggleButton, ColorSample, OutlineItemBlock, Fieldset, Button, Space,
  },
  props: {
    modelValue: { type: Array as PropType<string[]>, required: true },
    baseColor: { type: String, required: true },
    showDetails: { type: Boolean, required: true },
  },
  emits: [
    "update:modelValue",
  ],
  data() {
    return {
      firstRowSelection: [] as string[], // 1段目の選択
      secondRowSelection: [] as string[], // 2段目の選択
    };
  },
  computed: {
    options(): OutlineOption[] {
      return [
        { value: "recommend", absColor: absColor("recommend", this.baseColor) },
        { value: "recommend2", absColor: absColor("recommend2", this.baseColor) },
        { value: "darker", absColor: absColor("darker", this.baseColor) },
        { value: "identical", absColor: absColor("identical", this.baseColor) },
        { value: "lighter", absColor: absColor("lighter", this.baseColor) },
        { value: "lighterer", absColor: absColor("lighterer", this.baseColor) },
        { value: "recommendR", absColor: absColor("recommendR", this.baseColor) },
      ];
    },
    absColors(): string[] {
      return this.modelValue.map((color) => absColor(color, this.baseColor));
    },
    mergedSelection(): string[] {
      return [...this.firstRowSelection, ...this.secondRowSelection];
    },
  },
  watch: {
    mergedSelection: {
      handler(newSelection: string[]) {
        this.modelValue = newSelection;
        this.$emit("update:modelValue", newSelection.map((origVal, i) => (
          ix === i ? value : origVal
        )));
      },
      deep: true,
    },
  },
  methods: {
    updateFirstRowSelection(value: string): void {
      this.firstRowSelection.push(value);
    },
    updateSecondRowSelection(value: string): void {
      this.secondRowSelection.push(value);
    },
    update(ix: number, value: string): void {
      this.$emit("update:modelValue", this.modelValue.map((origVal, i) => (
        ix === i ? value : origVal
      )));
    },
    add(): void {
      this.$emit("update:modelValue", [...this.modelValue, this.modelValue?.[0] ?? "identical"]);
    },
    remove(ix: number): void {
      this.$emit("update:modelValue", this.modelValue.filter((_, i) => i !== ix));
    },
  },
});
</script>

<template>
  <Fieldset v-if="!showDetails" label="アウトライン">
    <Space vertical small>
      <Space small>
        <ToggleButton
            v-for="option in options"
            :key="option.value + '-1'"
            name="アウトライン"
            :model-value="firstRowSelection"
            size="smallIcon"
            :value="option.value"
            @update:model-value="updateFirstRowSelection($event)">
          <ColorSample :color="option.absColor" />
        </ToggleButton>
      </Space>
      <Space small>
        <ToggleButton
            v-for="option in options"
            :key="option.value + '-2'"
            name="アウトライン"
            :model-value="secondRowSelection"
            size="smallIcon"
            :value="option.value"
            @update:model-value="updateSecondRowSelection($event)">
          <ColorSample :color="option.absColor" />
        </ToggleButton>
      </Space>
    </Space>
  </Fieldset>
  <Fieldset v-else label="アウトライン">
    <Space vertical full>
      <OutlineItemBlock
          v-for="(color, ix) in modelValue"
          :key="ix"
          :model-value="absColors[ix]"
          @update:model-value="update(ix, $event)"
          @remove="remove(ix)" />
      <Button type="dashed" name="アウトライン (追加)" block @click="add">
        + アウトラインを追加
      </Button>
    </Space>
  </Fieldset>
</template>
